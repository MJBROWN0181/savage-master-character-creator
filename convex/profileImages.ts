import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
export const validate = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error("Sign in to upload images.");
    const info = await ctx.runQuery(internal.profiles.mediaInfo, { storageId });
    if (
      !info ||
      info.size > 4 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(
        info.contentType || "",
      )
    )
      throw new Error("Use a PNG, JPEG, or WebP image under 4 MB.");
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Image not found.");
    const response = await fetch(url);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const starts = (a: number[]) => a.every((b, i) => bytes[i] === b);
    const png = starts([137, 80, 78, 71, 13, 10, 26, 10]),
      jpg = starts([255, 216, 255]),
      webp =
        starts([82, 73, 70, 70]) &&
        [87, 69, 66, 80].every((b, i) => bytes[i + 8] === b);
    if (
      bytes.length > 4 * 1024 * 1024 ||
      bytes.length < 16 ||
      !(png || jpg || webp)
    )
      throw new Error("Use a PNG, JPEG, or WebP image under 4 MB.");
    await ctx.runMutation(internal.profiles.registerMedia, {
      ownerId,
      storageId,
    });
    return storageId;
  },
});
