import "server-only";

import nodemailer from "nodemailer";

const gmailUser =
  process.env.GMAIL_USER;

const gmailAppPassword =
  process.env.GMAIL_APP_PASSWORD;

if (!gmailUser) {
  throw new Error(
    "GMAIL_USER is not configured."
  );
}

if (!gmailAppPassword) {
  throw new Error(
    "GMAIL_APP_PASSWORD is not configured."
  );
}

export const emailAddress =
  process.env.EMAIL_FROM ||
  `Alessandro Enterprises <${gmailUser}>`;

const transporter =
  nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

export interface SendServerEmailPayload {
  to: string | string[];

  cc?: string | string[];

  bcc?: string | string[];

  subject: string;

  text: string;
}

export async function sendServerEmail(
  payload: SendServerEmailPayload
) {
  const result =
    await transporter.sendMail({
      from: emailAddress,

      to: payload.to,

      cc: payload.cc,

      bcc: payload.bcc,

      subject:
        payload.subject,

      text:
        payload.text,
    });

  return {
    messageId:
      result.messageId,
  };
}