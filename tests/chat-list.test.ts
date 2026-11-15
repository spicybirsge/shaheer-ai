import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { database } from "../src/lib/db";
import { listChats, parseChatCursor } from "../src/lib/db/chats";

test("chat pagination reaches beyond 100 chats with stable ties, exact timestamps and owner isolation", async () => {
  const pg = new PGlite();
  try {
    await pg.exec(await readFile("drizzle/0000_remarkable_piledriver.sql", "utf8"));
    await pg.exec(`
      insert into "user" (id,name,email) values ('a','A','a@example.com'),('b','B','b@example.com');
      insert into chats (id,user_id,updated_at)
      select 'chat-' || lpad(i::text,3,'0'), 'a',
        case when i <= 65 then timestamptz '2026-11-15 00:00:00.123456+00'
        else timestamptz '2026-11-15 00:00:00.123455+00' end
      from generate_series(1,105) i;
      insert into chats (id,user_id,deleted) values ('other','b',false),('deleted','a',true);
    `);
    const db = drizzle(pg) as unknown as ReturnType<typeof database>;
    const expected = (await pg.query<{ id: string }>(
      "select id from chats where user_id='a' and deleted=false order by updated_at desc,id desc",
    )).rows.map(({ id }) => id);
    const ids: string[] = [];
    let cursor: ReturnType<typeof parseChatCursor>;
    for (let pageNumber = 0; pageNumber < 4; pageNumber++) {
      const page = await listChats("a", cursor, db);
      assert.equal(page.chats.length, pageNumber === 3 ? 15 : 30);
      ids.push(...page.chats.map(({ id }) => id));
      cursor = page.nextCursor ? parseChatCursor(page.nextCursor) : undefined;
      assert.equal(page.nextCursor === null, pageNumber === 3);
    }
    assert.deepEqual(ids, expected);
    assert.equal(new Set(ids).size, 105);
    assert.deepEqual((await listChats("b", undefined, db)).chats.map(({ id }) => id), ["other"]);
    assert.deepEqual(await listChats("missing", undefined, db), { chats: [], nextCursor: null });

    const first = await listChats("a", undefined, db);
    const boundary = first.chats.at(-1)!.id;
    await pg.query("delete from chats where id=$1", [boundary]);
    await pg.exec("insert into chats (id,user_id) values ('newest','a')");
    const second = await listChats("a", parseChatCursor(first.nextCursor!), db);
    assert.deepEqual(second.chats.map(({ id }) => id), expected.slice(30, 60));
  } finally {
    await pg.close();
  }
});

test("chat cursor validation rejects malformed and invalid dates", () => {
  assert.equal(parseChatCursor(null), undefined);
  for (const cursor of ["", "!", "a".repeat(2049), ...[
    {}, null, { id: "x", updatedAt: "2026-02-31T00:00:00.000000Z" },
    { id: "x", updatedAt: "invalid" }, { id: "", updatedAt: "2026-11-15T00:00:00.000000Z" },
  ].map((value) => Buffer.from(JSON.stringify(value)).toString("base64url"))]) {
    assert.throws(() => parseChatCursor(cursor), /Invalid chat cursor/);
  }
});
