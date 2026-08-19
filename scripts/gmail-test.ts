import fs from "node:fs/promises";
import path from "node:path";

import { google } from "googleapis";

const ROOT = process.cwd();

const TOKEN_PATH = path.join(
  ROOT,
  "token.json"
);

const CREDENTIALS_PATH = path.join(
  ROOT,
  "credentials.json"
);

async function main() {
  const credentials = JSON.parse(
    await fs.readFile(
      CREDENTIALS_PATH,
      "utf8"
    )
  );

  const token = JSON.parse(
    await fs.readFile(
      TOKEN_PATH,
      "utf8"
    )
  );

  const {
    client_id,
    client_secret,
    redirect_uris,
  } = credentials.installed;

  const oauth2Client =
    new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

  oauth2Client.setCredentials(
    token
  );

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  const response =
    await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      labelIds: ["INBOX"],
    });

  const messages =
    response.data.messages ?? [];

  console.log(
    `Found ${messages.length} inbox messages.`
  );

  for (const message of messages) {
    if (!message.id) {
      continue;
    }

    const full =
      await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: [
          "From",
          "To",
          "Subject",
          "Date",
          "Message-ID",
          "In-Reply-To",
          "References",
        ],
      });

    const headers =
      full.data.payload?.headers ?? [];

    function getHeader(
      name: string
    ) {
      return (
        headers.find(
          (header) =>
            header.name?.toLowerCase() ===
            name.toLowerCase()
        )?.value ?? ""
      );
    }

    console.log("");
    console.log(
      "--------------------------------"
    );

    console.log(
      "ID:",
      message.id
    );

    console.log(
      "From:",
      getHeader("From")
    );

    console.log(
      "To:",
      getHeader("To")
    );

    console.log(
      "Subject:",
      getHeader("Subject")
    );

    console.log(
      "Date:",
      getHeader("Date")
    );

    console.log(
      "Message-ID:",
      getHeader("Message-ID")
    );

    console.log(
      "In-Reply-To:",
      getHeader("In-Reply-To")
    );

    console.log(
      "References:",
      getHeader("References")
    );
  }
}

main().catch((error) => {
  console.error(
    "Gmail test failed:"
  );

  console.error(error);

  process.exit(1);
});