import { convexTest } from "convex-test";
import { test, expect, vi } from "vitest";
import { makeFunctionReference as ref } from "convex/server";
import schema from "./schema";
const modules = import.meta.glob("./**/*.ts");
test("profile images reject spoofed files and cannot be claimed by another account", async () => {
  const t = convexTest(schema, modules);
  const a = await t.run((c) =>
    c.db.insert("users", { email: "image@test.example" }),
  );
  const b = await t.run((c) =>
    c.db.insert("users", { email: "other-image@test.example" }),
  );
  const owner = t.withIdentity({ subject: a }),
    other = t.withIdentity({ subject: b });
  const bad = new Blob(["<html>not a photo</html>"], { type: "image/png" });
  const badId = await t.run((c) => c.storage.store(bad));
  // convex-test omits the Content-Type metadata normally set by HTTP uploads.
  await t.run((c) => (c.db as any).patch(badId, { contentType: "image/png" }));
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(bad)),
  );
  try {
    await expect(
      owner.action(ref<"action">("profileImages:validate"), {
        storageId: badId,
      }),
    ).rejects.toThrow("PNG, JPEG");
    const bytes = new Uint8Array(24);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    const image = new Blob([bytes], { type: "image/png" });
    const storageId = await t.run((c) => c.storage.store(image));
    await t.run((c) =>
      (c.db as any).patch(storageId, { contentType: "image/png" }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(image)),
    );
    await owner.action(ref<"action">("profileImages:validate"), { storageId });
    await expect(
      other.action(ref<"action">("profileImages:validate"), { storageId }),
    ).rejects.toThrow("another account");
    const id = await owner.mutation(save, { ...draft, avatarId: storageId });
    expect((await owner.query(mine, {})).avatarId).toBe(storageId);
    await owner.mutation(save, draft);
    expect((await owner.query(mine, {})).avatarId).toBeUndefined();
    expect(id).toBeTruthy();
  } finally {
    vi.unstubAllGlobals();
  }
});
const draft = {
  handle: "table-hero",
  displayName: "Hero",
  bio: "Hello",
  games: ["Savage Worlds"],
  memory: "A daring rescue",
  roles: ["player", "gm"] as ("player" | "gm")[],
  links: [],
  favorites: [],
  highlights: [],
  appearance: {
    background: "midnight",
    accent: "gold",
    font: "classic",
    layout: "balanced",
    sections: ["about", "games", "memory", "characters", "journal"],
  },
  ageConfirmed: true, communityAccepted: true,
};
const save = ref<"mutation">("profiles:save"),
  mine = ref<"query">("profiles:mine"),
  read = ref<"query">("profiles:publicProfile"),
  review = ref<"mutation">("profiles:requestReview"),
  moderate = ref<"mutation">("profiles:moderate");
test("one account has one player and GM profile; age confirmation and ownership are enforced", async () => {
  const t = convexTest(schema, modules);
  const a = await t.run((c) =>
      c.db.insert("users", { email: "a@test.example" }),
    ),
    b = await t.run((c) => c.db.insert("users", { email: "b@test.example" }));
  const owner = t.withIdentity({ subject: a }),
    other = t.withIdentity({ subject: b });
  await expect(
    owner.mutation(save, { ...draft, ageConfirmed: false }),
  ).rejects.toThrow("18 or older");
  const id = await owner.mutation(save, draft);
  expect(await owner.mutation(save, { ...draft, bio: "Updated" })).toBe(id);
  expect((await owner.query(mine, {})).roles).toEqual(["player", "gm"]);
  expect(await other.query(mine, {})).toBeNull();
  expect(await t.query(read, { handle: draft.handle })).toBeNull();
  await expect(other.mutation(save, draft)).rejects.toThrow("taken");
  await expect(
    owner.mutation(save, { ...draft, handle: "changed" }),
  ).rejects.toThrow("stays fixed");
  await expect(
    owner.mutation(save, {
      ...draft,
      links: [{ label: "Unsafe", url: "javascript:alert(1)", kind: "social" }],
    }),
  ).rejects.toThrow("HTTPS");
  const characterId = await t.run((c) =>
    c.db.insert("characters", {
      ownerId: b,
      name: "Other hero",
      snapshot: {},
      updatedAt: 1,
    }),
  );
  await expect(
    owner.mutation(save, { ...draft, favorites: [{ characterId }] }),
  ).rejects.toThrow("own saved characters");
  const journalId = await t.run((c) =>
    c.db.insert("privateJournals", {
      ownerId: a,
      kind: "gm",
      text: "Secret villain",
      updatedAt: 1,
    }),
  );
  await expect(
    owner.mutation(save, {
      ...draft,
      highlights: [{ journalId, excerpt: "Secret villain" }],
    }),
  ).rejects.toThrow("GM notes remain private");
});
test("review gates public sharing and freezes approved excerpts without exposing account information", async () => {
  const t = convexTest(schema, modules);
  const user = await t.run((c) =>
    c.db.insert("users", { email: "private@test.example" }),
  );
  const owner = t.withIdentity({ subject: user });
  const journalId = await t.run((c) =>
    c.db.insert("privateJournals", {
      ownerId: user,
      kind: "player",
      text: "Public memory. Private remainder.",
      updatedAt: 1,
    }),
  );
  const profileId = await owner.mutation(save, {
    ...draft,
    highlights: [{ journalId, excerpt: "Public memory." }],
  });
  await owner.mutation(review, {});
  expect(await t.query(read, { handle: draft.handle })).toBeNull();
  let p = await owner.query(mine, {});
  await t.mutation(moderate, {
    profileId,
    expectedUpdatedAt: p.updatedAt,
    approve: true,
  });
  let publicData = await t.query(read, { handle: draft.handle });
  expect(publicData.highlights).toEqual([{ excerpt: "Public memory." }]);
  expect(publicData.ownerId).toBeUndefined();
  expect(publicData.ageConfirmedAt).toBeUndefined();
  expect(JSON.stringify(publicData)).not.toContain("private@test.example");
  await owner.mutation(save, { ...draft, bio: "Unreviewed change" });
  expect((await t.query(read, { handle: draft.handle })).bio).toBe("Hello");
  await t.run(ctx => ctx.db.patch(profileId, { reviewRequestedAt: Date.now() - 61000 }));
  await owner.mutation(review, {});
  p = await owner.query(mine, {});
  await owner.mutation(save, { ...draft, bio: "Changed after submission" });
  await expect(
    t.mutation(moderate, {
      profileId,
      expectedUpdatedAt: p.updatedAt,
      approve: true,
    }),
  ).rejects.toThrow("Profile changed");
  await owner.mutation(ref<"mutation">("profiles:unpublish"), {});
  expect(await t.query(read, { handle: draft.handle })).toBeNull();
});
