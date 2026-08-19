import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
];

interface GmailCredentials {
  installed?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };

  web?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

interface GmailHeader {
  name?: string | null;
  value?: string | null;
}

export interface ParsedGmailMessage {
  gmail_message_id: string;
  gmail_thread_id: string | null;

  sender_name: string;
  sender_email: string;

  recipient_email: string | null;

  cc: string | null;
  bcc: string | null;

  subject: string | null;
  body: string;

  message_id: string | null;
  in_reply_to: string | null;
  references: string | null;

  date: string | null;
}

/*
 * ---------------------------------------------------------
 * GMAIL FILE LOCATIONS
 * ---------------------------------------------------------
 *
 * Keep these paths explicit.
 *
 * This allows Turbopack to understand exactly which files
 * are required instead of tracing the entire project.
 */

const credentialsPath = path.join(
  process.cwd(),
  "credentials.json"
);

const tokenPath = path.join(
  process.cwd(),
  "token.json"
);

/*
 * ---------------------------------------------------------
 * READ JSON
 * ---------------------------------------------------------
 */

async function readJsonFile<T>(
  filePath: string
): Promise<T> {
  try {
    const contents =
      await fs.readFile(
        filePath,
        "utf8"
      );

    return JSON.parse(
      contents
    ) as T;
  } catch (error) {
    console.error(
      `Unable to read Gmail configuration file: ${filePath}`,
      error
    );

    throw new Error(
      `Unable to read Gmail configuration file: ${path.basename(
        filePath
      )}.`
    );
  }
}

/*
 * ---------------------------------------------------------
 * GMAIL CLIENT
 * ---------------------------------------------------------
 */

async function getGmailClient() {
  const credentials =
    await readJsonFile<GmailCredentials>(
      credentialsPath
    );

  const token =
    await readJsonFile<Record<string, unknown>>(
      tokenPath
    );

  const config =
    credentials.installed ??
    credentials.web;

  if (!config) {
    throw new Error(
      "Google OAuth credentials are missing an installed/web configuration."
    );
  }

  const redirectUri =
    config.redirect_uris?.[0];

  if (!redirectUri) {
    throw new Error(
      "Google OAuth credentials do not contain a redirect URI."
    );
  }

  const auth =
    new google.auth.OAuth2(
      config.client_id,
      config.client_secret,
      redirectUri
    );

  auth.setCredentials(
    token
  );

  return google.gmail({
    version: "v1",
    auth,
  });
}

/*
 * ---------------------------------------------------------
 * HEADER HELPERS
 * ---------------------------------------------------------
 */

function getHeader(
  headers: GmailHeader[],
  name: string
): string | null {
  return (
    headers.find(
      (header) =>
        header.name?.toLowerCase() ===
        name.toLowerCase()
    )?.value ?? null
  );
}

/*
 * ---------------------------------------------------------
 * BASE64 URL DECODER
 * ---------------------------------------------------------
 */

function decodeBase64Url(
  value: string
): string {
  const normalized =
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const padding =
    normalized.length % 4;

  const padded =
    padding
      ? normalized +
        "=".repeat(
          4 - padding
        )
      : normalized;

  return Buffer.from(
    padded,
    "base64"
  ).toString("utf8");
}

/*
 * ---------------------------------------------------------
 * MESSAGE BODY EXTRACTION
 * ---------------------------------------------------------
 */

function extractBody(
  payload: gmail_v1.Schema$MessagePart | undefined
): string {
  if (!payload) {
    return "";
  }

  /*
   * Direct body.
   */
  if (
    payload.body?.data
  ) {
    return decodeBase64Url(
      payload.body.data
    );
  }

  /*
   * Multipart message.
   */
  if (
    payload.parts &&
    payload.parts.length > 0
  ) {
    /*
     * Prefer text/plain.
     */
    const plainPart =
      payload.parts.find(
        (part) =>
          part.mimeType ===
          "text/plain"
      );

    if (
      plainPart
    ) {
      const plainBody =
        extractBody(
          plainPart
        );

      if (
        plainBody
      ) {
        return plainBody;
      }
    }

    /*
     * Fall back to HTML or the first
     * available child part.
     */
    for (const part of payload.parts) {
      const body =
        extractBody(part);

      if (body) {
        return body;
      }
    }
  }

  return "";
}

/*
 * ---------------------------------------------------------
 * GMAIL MESSAGE PARSER
 * ---------------------------------------------------------
 */

function parseGmailMessage(
  message: gmail_v1.Schema$Message
): ParsedGmailMessage {
  const headers =
    (message.payload
      ?.headers ??
      []) as GmailHeader[];

  const from =
    getHeader(
      headers,
      "From"
    );

  const to =
    getHeader(
      headers,
      "To"
    );

  const cc =
    getHeader(
      headers,
      "Cc"
    );

  const bcc =
    getHeader(
      headers,
      "Bcc"
    );

  const subject =
    getHeader(
      headers,
      "Subject"
    );

  const messageId =
    getHeader(
      headers,
      "Message-ID"
    );

  const inReplyTo =
    getHeader(
      headers,
      "In-Reply-To"
    );

  const references =
    getHeader(
      headers,
      "References"
    );

  const date =
    getHeader(
      headers,
      "Date"
    );

  /*
   * Parse sender name and address.
   *
   * Example:
   *
   * John Doe <john@example.com>
   */
  let senderName =
    from ?? "";

  let senderEmail =
    from ?? "";

  const emailMatch =
    from?.match(
      /^(.*?)\s*<([^>]+)>$/
    );

  if (
    emailMatch
  ) {
    senderName =
      emailMatch[1]
        .trim()
        .replace(
          /^["']|["']$/g,
          ""
        );

    senderEmail =
      emailMatch[2]
        .trim();
  } else {
    senderEmail =
      from?.trim() ??
      "";
  }

  return {
    gmail_message_id:
      message.id ?? "",

    gmail_thread_id:
      message.threadId ??
      null,

    sender_name:
      senderName ||
      senderEmail,

    sender_email:
      senderEmail,

    recipient_email:
      to,

    cc,

    bcc,

    subject,

    body:
      extractBody(
        message.payload
      ),

    message_id:
      messageId,

    in_reply_to:
      inReplyTo,

    references,

    date,
  };
}

/*
 * ---------------------------------------------------------
 * GET INBOX MESSAGES
 * ---------------------------------------------------------
 */

export async function getInboxMessages(
  maxResults = 50
): Promise<ParsedGmailMessage[]> {
  const gmail =
    await getGmailClient();

  const response =
    await gmail.users.messages.list(
      {
        userId: "me",

        labelIds: [
          "INBOX",
        ],

        maxResults,
      }
    );

  const messageList =
    response.data.messages ??
    [];

  if (
    messageList.length ===
    0
  ) {
    return [];
  }

  const messages =
    await Promise.all(
      messageList.map(
        async (message) => {
          if (
            !message.id
          ) {
            return null;
          }

          const result =
            await gmail.users.messages.get(
              {
                userId: "me",

                id: message.id,

                format: "full",
              }
            );

          return parseGmailMessage(
            result.data
          );
        }
      )
    );

  return messages.filter(
    (
      message
    ): message is ParsedGmailMessage =>
      Boolean(message)
  );
}