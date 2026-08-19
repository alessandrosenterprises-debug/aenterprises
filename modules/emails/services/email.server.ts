import "server-only";

import nodemailer from "nodemailer";

/*
 * ---------------------------------------------------------
 * EMAIL CONFIGURATION
 * ---------------------------------------------------------
 *
 * Do NOT validate environment variables at module load time.
 *
 * Next.js/Vercel may evaluate this module during the build.
 * Throwing here causes the entire build to fail when the
 * environment variables are not available during build time.
 *
 * We validate them inside sendServerEmail() instead.
 * ---------------------------------------------------------
 */

export const emailAddress =
  process.env.EMAIL_FROM ||
  (process.env.GMAIL_USER
    ? `Alessandro Enterprises <${process.env.GMAIL_USER}>`
    : "Alessandro Enterprises");

/*
 * ---------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------
 */

export interface SendServerEmailPayload {
  to: string | string[];

  cc?: string | string[];

  bcc?: string | string[];

  subject: string;

  text: string;
}

/*
 * ---------------------------------------------------------
 * SEND EMAIL
 * ---------------------------------------------------------
 */

export async function sendServerEmail(
  payload: SendServerEmailPayload
) {
  /*
   * Read environment variables when the function is actually
   * called instead of when this module is imported.
   */

  const gmailUser =
    process.env.GMAIL_USER;

  const gmailAppPassword =
    process.env.GMAIL_APP_PASSWORD;

  /*
   * -------------------------------------------------------
   * RUNTIME CONFIGURATION VALIDATION
   * -------------------------------------------------------
   */

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

  /*
   * -------------------------------------------------------
   * CREATE TRANSPORTER
   * -------------------------------------------------------
   *
   * The transporter is created only when an email is being
   * sent. This prevents Gmail configuration from affecting
   * Next.js build-time module evaluation.
   */

  const transporter =
    nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

  /*
   * -------------------------------------------------------
   * SEND
   * -------------------------------------------------------
   */

  const result =
    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        `Alessandro Enterprises <${gmailUser}>`,

      to: payload.to,

      ...(payload.cc
        ? {
            cc: payload.cc,
          }
        : {}),

      ...(payload.bcc
        ? {
            bcc: payload.bcc,
          }
        : {}),

      subject:
        payload.subject,

      text:
        payload.text,
    });

  /*
   * -------------------------------------------------------
   * RESPONSE
   * -------------------------------------------------------
   */

  return {
    messageId:
      result.messageId,
  };
}