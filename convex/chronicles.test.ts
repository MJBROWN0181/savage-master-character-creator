import { convexTest } from "convex-test";
import { test, expect } from "vitest";
import { makeFunctionReference as ref } from "convex/server";
import schema from "./schema";
const modules = import.meta.glob("./**/*.ts");
const post = {
  title: "A bridge of stars",
  body: "Our ranger guided the party safely home.",
  game: "Pathfinder 2e",
  kind: "Session tale",
  consent: true,
};
async function fixture() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (c) => {
    const ids = [];
    for (const handle of ["bard", "ranger", "stranger"]) {
      const ownerId = await c.db.insert("users", {
        email: handle + "@test.example",
      });
      await c.db.insert("profiles", {
        ownerId,
        handle,
        displayName: "PRIVATE DRAFT",
        bio: "SECRET",
        games: [],
        memory: "",
        roles: [],
        links: [],
        favorites: [],
        highlights: [],
        appearance: {
          background: "midnight",
          accent: "gold",
          font: "classic",
          layout: "balanced",
          sections: [],
        },
        ageConfirmedAt: Date.now(),
        updatedAt: Date.now(),
        reviewStatus: "approved",
        publicSnapshot: { displayName: handle, games: [], links: [] },
      });
      ids.push(ownerId);
    }
    return ids;
  });
  return {
    t,
    ids,
    a: t.withIdentity({ subject: ids[0] }),
    b: t.withIdentity({ subject: ids[1] }),
    c: t.withIdentity({ subject: ids[2] }),
  };
}
test("publishing requires sign in, reviewed profile, consent and bounded content; exposes reviewed identity only", async () => {
  const { t, a, ids } = await fixture();
  await expect(
    t.mutation(ref<"mutation">("chronicles:publish"), post),
  ).rejects.toThrow("Sign in");
  await expect(
    a.mutation(ref<"mutation">("chronicles:publish"), {
      ...post,
      consent: false,
    }),
  ).rejects.toThrow("Confirm");
  await expect(
    a.mutation(ref<"mutation">("chronicles:publish"), {
      ...post,
      body: "x".repeat(2001),
    }),
  ).rejects.toThrow("Check");
  await a.mutation(ref<"mutation">("chronicles:publish"), post);
  const feed: any = await t.query(ref<"query">("chronicles:feed"), {});
  expect(feed.posts[0].author.name).toBe("bard");
  expect(JSON.stringify(feed)).not.toContain("SECRET");
  expect(JSON.stringify(feed)).not.toContain("PRIVATE DRAFT");
  expect(feed.posts[0].ownerId).toBeUndefined();
  await t.run(async (c) => {
    const p = await c.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", ids[0]))
      .unique();
    await c.db.patch(p!._id, { reviewStatus: "private" });
  });
  expect(
    ((await t.query(ref<"query">("chronicles:feed"), {})) as any).posts,
  ).toHaveLength(0);
  await expect(
    a.mutation(ref<"mutation">("chronicles:publish"), post),
  ).rejects.toThrow("review");
});
test("toasts toggle once per player, deletion is owner-only, reports are deduplicated and hidden tales cannot be toasted", async () => {
  const { t, a, b } = await fixture(),
    id: any = await a.mutation(ref<"mutation">("chronicles:publish"), post);
  await b.mutation(ref<"mutation">("chronicles:toast"), { id });
  expect(
    ((await b.query(ref<"query">("chronicles:feed"), {})) as any).posts[0],
  ).toMatchObject({ toastCount: 1, toasted: true });
  await b.mutation(ref<"mutation">("chronicles:toast"), { id });
  expect(
    ((await t.query(ref<"query">("chronicles:feed"), {})) as any).posts[0]
      .toastCount,
  ).toBe(0);
  await expect(
    b.mutation(ref<"mutation">("chronicles:remove"), { id }),
  ).rejects.toThrow("own");
  for (let i = 0; i < 2; i++)
    await b.mutation(ref<"mutation">("chronicles:report"), {
      id,
      reason: "Unwanted spoilers",
    });
  expect(
    await t.run((c) => c.db.query("chronicleReports").collect()),
  ).toHaveLength(1);
  await a.mutation(ref<"mutation">("chronicles:remove"), { id });
  expect(
    ((await t.query(ref<"query">("chronicles:feed"), {})) as any).posts,
  ).toHaveLength(0);
  await expect(
    b.mutation(ref<"mutation">("chronicles:toast"), { id }),
  ).rejects.toThrow("unavailable");
});
test("following can be disabled by the storyteller; mutual blocks hide posts and prevent interactions", async () => {
  const { t, a, b, ids } = await fixture(),
    id: any = await a.mutation(ref<"mutation">("chronicles:publish"), post);
  await b.mutation(ref<"mutation">("chronicles:follow"), {
    handle: "bard",
    enabled: true,
  });
  expect(
    (
      (await b.query(ref<"query">("chronicles:feed"), {
        following: true,
      })) as any
    ).posts,
  ).toHaveLength(1);
  await a.mutation(ref<"mutation">("chronicles:setFollowers"), {
    enabled: false,
  });
  expect(
    (
      (await b.query(ref<"query">("chronicles:feed"), {
        following: true,
      })) as any
    ).posts,
  ).toHaveLength(0);
  await expect(
    b.mutation(ref<"mutation">("chronicles:follow"), {
      handle: "bard",
      enabled: true,
    }),
  ).rejects.toThrow("turned off");
  await b.mutation(ref<"mutation">("chronicles:follow"), {
    handle: "bard",
    enabled: false,
  });
  await t.run((c) =>
    c.db.insert("friendBlocks", { ownerId: ids[0], blockedId: ids[1] }),
  );
  expect(
    ((await b.query(ref<"query">("chronicles:feed"), {})) as any).posts,
  ).toHaveLength(0);
  await expect(
    b.mutation(ref<"mutation">("chronicles:toast"), { id }),
  ).rejects.toThrow("unavailable");
});
test("Tomes require membership to post; leaving removes posting access and closing a Tome hides its tales", async () => {
  const { t, a, b } = await fixture(),
    tomeId: any = await a.mutation(ref<"mutation">("chronicles:createTome"), {
      name: "The Silver Lantern",
      description: "Our tabletop group",
    });
  await expect(
    b.mutation(ref<"mutation">("chronicles:publish"), { ...post, tomeId }),
  ).rejects.toThrow("Join");
  await b.mutation(ref<"mutation">("chronicles:join"), {
    id: tomeId,
    enabled: true,
  });
  await b.mutation(ref<"mutation">("chronicles:publish"), { ...post, tomeId });
  expect(
    ((await t.query(ref<"query">("chronicles:feed"), { tomeId })) as any).posts,
  ).toHaveLength(1);
  await b.mutation(ref<"mutation">("chronicles:join"), {
    id: tomeId,
    enabled: false,
  });
  await expect(
    b.mutation(ref<"mutation">("chronicles:publish"), { ...post, tomeId }),
  ).rejects.toThrow("Join");
  await expect(
    b.mutation(ref<"mutation">("chronicles:archiveTome"), { id: tomeId }),
  ).rejects.toThrow("owner");
  await a.mutation(ref<"mutation">("chronicles:archiveTome"), { id: tomeId });
  expect(
    ((await t.query(ref<"query">("chronicles:feed"), {})) as any).posts,
  ).toHaveLength(0);
});
test("feed cursor pagination retains every tale with equal timestamps", async () => {
  const { t, ids } = await fixture();
  await t.run(async (c) => {
    for (let i = 0; i < 30; i++)
      await c.db.insert("chroniclePosts", {
        ownerId: ids[0],
        ...post,
        consent: undefined,
        createdAt: 1,
        toastCount: 0,
        hidden: false,
      } as any);
  });
  const first: any = await t.query(ref<"query">("chronicles:feed"), {}),
    second: any = await t.query(ref<"query">("chronicles:feed"), {
      before: first.next,
    });
  expect(
    new Set([...first.posts, ...second.posts].map((p) => p._id)).size,
  ).toBe(30);
  expect(second.next).toBeNull();
});
