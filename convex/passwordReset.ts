import ResendProvider from "@auth/core/providers/resend";

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
      if (!sender || !provider.apiKey) {
        console.error("Account email configuration unavailable", {
          senderConfigured: Boolean(sender),
          keyConfigured: Boolean(provider.apiKey),
        });
        throw new Error("Account email is not configured.");
      }
      // Account providers run in Convex's default runtime. Use its native fetch
      // instead of the Node SDK, which can hide transport failures as generic errors.
      let response: Response;
      try {
        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: sender,
            to: [email],
            subject,
            text: `Your Savage Master code is ${token}. If you did not request this, ignore this message.`,
          }),
        });
      } catch {
        console.error("Account email transport failed");
        throw new Error("Could not send account email.");
      }
      if (!response.ok) {
        // Do not log the provider body: it may include private recipient data.
        console.error("Account email provider rejected request", {
          status: response.status,
        });
        throw new Error("Could not send account email.");
      }
    },
  });
}

export const passwordReset = emailCode("resend-password-reset", "Savage Master password reset");
export const emailVerification = emailCode("resend-email-verification", "Verify your Savage Master email");
