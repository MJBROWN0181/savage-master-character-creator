import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function snapshot(name: string) {
  return { version: 1, character: { name, setting: "deadlands", concept:'',notes:'',race:null,heritageChoice:null,attributes:{agility:4,smarts:4,spirit:4,strength:4,vigor:4},skills:{athletics:4,commonKnowledge:4,notice:4,persuasion:4,stealth:4},hindrancePointsSpent:{attributes:0,edges:0,skills:0},funds:500,edges:[],hindrances:[],languages:[],bonusRules:[],gear:[],powers:[] } };
}

test("players can only list, load, and update their own characters", async () => {
  const t = convexTest(schema, modules);
  const aliceId = await t.run(ctx => ctx.db.insert("users", { email: "alice@example.test" }));
  const bobId = await t.run(ctx => ctx.db.insert("users", { email: "bob@example.test" }));
  const alice = t.withIdentity({ subject: aliceId });
  const bob = t.withIdentity({ subject: bobId });

  const id = await alice.mutation(api.characters.save, { snapshot: snapshot("Scout") });
  expect((await alice.query(api.characters.list, {})).map(c => c.name)).toEqual(["Scout"]);
  expect(await alice.query(api.characters.load, { id })).toEqual(snapshot("Scout"));
  expect(await bob.query(api.characters.list, {})).toEqual([]);
  await expect(bob.query(api.characters.load, { id })).rejects.toThrow("Character not found");
  await expect(bob.mutation(api.characters.save, { id, snapshot: snapshot("Stolen") })).rejects.toThrow("Character not found");
  expect((await alice.query(api.characters.load, { id })).character.name).toBe("Scout");
  await alice.mutation(api.characters.save, { id, snapshot: snapshot("Ranger") });
  expect((await alice.query(api.characters.load, { id })).character.name).toBe("Ranger");
});

test("signed-out users cannot write or load a character", async () => {
  const t = convexTest(schema, modules);
  await expect(t.mutation(api.characters.save, { snapshot: snapshot("Guest") })).rejects.toThrow("Sign in");
  expect(await t.query(api.characters.list, {})).toEqual([]);
});

test('rejects malformed and injected identifiers before storing',async()=>{
  const t=convexTest(schema,modules);const user=await t.run(ctx=>ctx.db.insert('users',{email:'validator@example.test'}));const client=t.withIdentity({subject:user});
  const bad=snapshot('Bad');bad.character.edges=["x');alert(1)//"] as never[];
  await expect(client.mutation(api.characters.save,{snapshot:bad})).rejects.toThrow('Invalid character');
  await expect(client.mutation(api.characters.save,{snapshot:{version:1,character:{name:'Incomplete'}}})).rejects.toThrow('Invalid character');
  expect(await client.query(api.characters.list,{})).toEqual([]);
});
