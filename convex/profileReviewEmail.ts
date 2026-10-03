"use node";
import { Resend } from "resend";
import { v } from "convex/values";
import { makeFunctionReference as ref } from "convex/server";
import { internalAction } from "./_generated/server";

export const notify = internalAction({
  args: { profileId: v.id("profiles"), requestedAt: v.number(), attempt: v.number() },
  handler: async (ctx, { profileId, requestedAt, attempt }) => {
    const info = await ctx.runQuery(ref<"query", any>("profiles:reviewNotificationInfo"), { profileId, requestedAt });
    if (!info) return;
    const key = process.env.SUPPORT_RESEND_KEY || process.env.AUTH_RESEND_KEY;
    const from = process.env.SUPPORT_EMAIL_FROM || process.env.AUTH_EMAIL_FROM;
    const to = process.env.PROFILE_REVIEW_EMAIL_TO || process.env.SUPPORT_EMAIL_TO;
    const mark = (status: "pending" | "sent" | "failed" | "unconfigured") =>
      ctx.runMutation(ref<"mutation", any>("profiles:markReviewNotification"), { profileId, requestedAt, status });
    if (!key || !from || !to) { await mark("unconfigured"); return; }
    try {
      const queueUrl = new URL("/profile?reviews=1", process.env.SITE_URL || "https://smsheets.com").href;
      const { error } = await new Resend(key).emails.send({
        from, to: to.split(",").map(email => email.trim()).filter(Boolean),
        subject: `[Savage Master Profile review] @${info.handle}`,
        text: `A player profile is waiting for review: @${info.handle}.\n\nSign in with your authorized reviewer account to inspect the current profile and approve it or request changes:\n${queueUrl}\n\nApproval enables public sharing and Chronicles posting. The profile remains private until you approve it. This email is a notification; review decisions happen in the private app queue.`,
      }, { idempotencyKey: `profile-review-${profileId}-${requestedAt}` });
      if (error) throw new Error("Delivery failed");
      await mark("sent");
    } catch {
      await mark(attempt < 2 ? "pending" : "failed");
      if (attempt < 2) await ctx.scheduler.runAfter((attempt + 1) * 60000, ref<"action", any>("profileReviewEmail:notify"), { profileId, requestedAt, attempt: attempt + 1 });
    }
  },
});
