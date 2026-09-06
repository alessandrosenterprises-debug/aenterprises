import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

const CREDENTIALS_PATH = path.join(
  process.cwd(),
  "credentials.json"
);

const TOKEN_PATH = path.join(
  process.cwd(),
  "token.json"
);

type GoogleCredentials = {
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
};

async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

async function main() {
  console.log("");
  console.log("========================================");
  console.log(" AEOS GMAIL OAUTH AUTHORIZATION");
  console.log("========================================");
  console.log("");

  const credentials =
    await readJson<GoogleCredentials>(
      CREDENTIALS_PATH
    );

  const config =
    credentials.installed ??
    credentials.web;

  if (!config) {
    throw new Error(
      "No installed or web OAuth configuration found."
    );
  }

  /*
   * We use Google's localhost redirect.
   * The actual port is assigned dynamically below.
   */
  const server = http.createServer();

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve();
    });
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error(
      "Unable to determine localhost callback port."
    );
  }

  const port = address.port;

  const redirectUri =
    `http://localhost:${port}`;

  const oauth2Client =
    new google.auth.OAuth2(
      config.client_id,
      config.client_secret,
      redirectUri
    );

  const authUrl =
    oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });

  console.log(
    "Open this URL in your browser:"
  );
  console.log("");
  console.log(authUrl);
  console.log("");
  console.log(
    "Sign in with the AEOS Gmail account:"
  );
  console.log(
    "alessandrosenterprises@gmail.com"
  );
  console.log("");
  console.log(
    "Waiting for Google to redirect back..."
  );
  console.log("");

  const code = await new Promise<string>(
    (resolve, reject) => {
      const timeout = setTimeout(() => {
        server.close();

        reject(
          new Error(
            "OAuth authorization timed out."
          )
        );
      }, 5 * 60 * 1000);

      server.on(
        "request",
        (req, res) => {
          try {
            const requestUrl =
              new URL(
                req.url ?? "/",
                redirectUri
              );

            const error =
              requestUrl.searchParams.get(
                "error"
              );

            const authorizationCode =
              requestUrl.searchParams.get(
                "code"
              );

            if (error) {
              clearTimeout(timeout);

              res.writeHead(400, {
                "Content-Type":
                  "text/html",
              });

              res.end(`
                <html>
                  <body>
                    <h2>Google OAuth failed</h2>
                    <p>${error}</p>
                    <p>You can close this window.</p>
                  </body>
                </html>
              `);

              server.close();

              reject(
                new Error(
                  `Google OAuth failed: ${error}`
                )
              );

              return;
            }

            if (!authorizationCode) {
              res.writeHead(400, {
                "Content-Type":
                  "text/html",
              });

              res.end(`
                <html>
                  <body>
                    <h2>Authorization code missing</h2>
                  </body>
                </html>
              `);

              return;
            }

            clearTimeout(timeout);

            res.writeHead(200, {
              "Content-Type":
                "text/html",
            });

            res.end(`
              <html>
                <body>
                  <h2>AEOS Gmail connected successfully.</h2>
                  <p>You can close this browser window.</p>
                </body>
              </html>
            `);

            server.close();

            resolve(
              authorizationCode
            );
          } catch (error) {
            clearTimeout(timeout);
            server.close();
            reject(error);
          }
        }
      );
    }
  );

  console.log(
    "Authorization received."
  );

  console.log(
    "Exchanging authorization code for tokens..."
  );

  const { tokens } =
    await oauth2Client.getToken(code);

  oauth2Client.setCredentials(
    tokens
  );

  await fs.writeFile(
    TOKEN_PATH,
    JSON.stringify(
      tokens,
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    " GMAIL AUTHORIZATION SUCCESSFUL"
  );
  console.log(
    "========================================"
  );
  console.log("");
  console.log(
    "New token saved to:"
  );
  console.log(TOKEN_PATH);
  console.log("");

  const gmail =
    google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

  const profile =
    await gmail.users.getProfile({
      userId: "me",
    });

  console.log(
    "Connected Gmail account:"
  );

  console.log(
    profile.data.emailAddress
  );

  console.log("");

  console.log(
    "Gmail READ + SEND access is ready."
  );

  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error(
    "Gmail OAuth failed:"
  );
  console.error(error);
  process.exit(1);
});