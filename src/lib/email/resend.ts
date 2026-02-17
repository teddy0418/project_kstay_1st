import { Resend } from "resend";
import type React from "react";

type SendEmailInput = {
  to: string;
  subject: string;
  react: React.ReactElement;
};

export async function sendEmailWithResend(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing");
  }
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "KSTAY <noreply@example.com>";
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    react: input.react,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email");
  }

  return data;
}
