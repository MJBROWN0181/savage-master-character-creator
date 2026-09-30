import ResendProvider from "@auth/core/providers/resend";
import { Resend } from "resend";

function emailCode(id: string, subject: string) {
  return ResendProvider({
    id,
    apiKey: process.env.AUTH_RESEND_KEY,
    async generateVerificationToken() {
      const bytes = crypto.getRandomValues(new Uint8Array(8));
      return Array.from(bytes, byte => (byte % 10).toString()).join("");
    },
    async sendVerificationRequest({ identifier: email, provider, token }) {
      const sender = process.env.AUTH_EMAIL_FROM;
      if (!sender || !provider.apiKey) throw new Error("Account email is not configured.");
      const { error } = await new Resend(provider.apiKey).emails.send({
        from: sender,
        to: [email],
        subject,
        text: `Your Savage Master code is ${token}. If you did not request this, ignore this message.`,
      });
      if (error) throw new Error("Could not send account email.");
    },
  });
}

export const passwordReset = emailCode("resend-password-reset", "Savage Master password reset");
export const emailVerification = emailCode("resend-email-verification", "Verify your Savage Master email");
