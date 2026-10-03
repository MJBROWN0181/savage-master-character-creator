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
    const to = process.env.PROFILE_REVIEW_EMAIL_TO || info.recipient || process.env.PROFILE_MODERATOR_ADMIN_EMAILS || process.env.PROFILE_REVIEWER_EMAILS || process.env.BUG_EDITOR_EMAILS || process.env.SUPPORT_EMAIL_TO;
    const recipients = (to || "").split(",").map((email: string) => email.trim()).filter(Boolean);
    const mark = (status: "pending" | "sent" | "failed" | "unconfigured") =>
      ctx.runMutation(ref<"mutation", any>("profiles:markReviewNotification"), { profileId, requestedAt, status });
    if (!key || !from || !recipients.length) { await mark("unconfigured"); return; }
    try {
      const reviewUrl = new URL("/profile-reviews", process.env.SITE_URL || "https://smsheets.com");
      reviewUrl.searchParams.set("profile", profileId);
      const safeHandle = info.handle.replace(/[&<>"']/g, (char: string) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
      const safeUrl = reviewUrl.href.replace(/&/g, "&amp;");
      const { error } = await new Resend(key).emails.send({
        from, to: recipients,
        subject: `[Savage Master Profile review] @${info.handle}`,
        text: `A player profile is waiting for review: @${info.handle}.\n\nReview this profile:\n${reviewUrl.href}\n\nSign in with your authorized reviewer account, check the profile, and approve it or request changes. Approval enables public sharing and Chronicles posting. The profile remains private until approved. Another reviewer must review your own profile.`,
        html: `<h1>A profile is ready for your review</h1><p>@${safeHandle} submitted a profile for public sharing.</p><p><a href="${safeUrl}" style="display:inline-block;padding:12px 20px;background:#23302d;color:#fff;border-radius:6px;text-decoration:none">Review profile</a></p><p>Sign in with your authorized reviewer account, check the profile, and approve it or request changes. The profile stays private until approved.</p><p>Another reviewer must review your own profile.</p>`,
      }, { idempotencyKey: `profile-review-${profileId}-${requestedAt}` });
      if (error) throw new Error("Delivery failed");
      await mark("sent");
    } catch {
      await mark(attempt < 2 ? "pending" : "failed");
      if (attempt < 2) await ctx.scheduler.runAfter((attempt + 1) * 60000, ref<"action", any>("profileReviewEmail:notify"), { profileId, requestedAt, attempt: attempt + 1 });
    }
  },
});
