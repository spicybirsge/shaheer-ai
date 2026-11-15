import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { reserveMessage, DAILY_LIMIT } from "../src/lib/quota";
import { loadOwnedHistory } from "../src/lib/db/history";
import type { database } from "../src/lib/db";
test("migration and quota enforce 50 concurrent sends, independent accounts and UTC dates", async () => {
  const pg = new PGlite();
  try {
    await pg.exec(
      await readFile("drizzle/0000_remarkable_piledriver.sql", "utf8"),
    );
    await pg.exec(
      `insert into "user" (id,name,email) values ('a','A','a@example.com'),('b','B','b@example.com'); set timezone='Pacific/Honolulu'; insert into daily_usage values ('a','2000-01-01',20);`,
    );
    const db = drizzle(pg) as unknown as ReturnType<typeof database>;
    const results = await Promise.all(
      Array.from({ length: DAILY_LIMIT * 2 }, () => reserveMessage("a", db)),
    );
    assert.equal(results.filter(Boolean).length, DAILY_LIMIT);
    assert.equal(await reserveMessage("a", db), false);
    assert.equal(await reserveMessage("b", db), true);
    const stored = await pg.query<{ count: number }>(
      `select count from daily_usage where user_id='a' and day=to_char(now() at time zone 'UTC','YYYY-MM-DD')`,
    );
    assert.equal(stored.rows[0].count, DAILY_LIMIT);
    await pg.exec(`
      insert into chats (id,user_id) values ('chat-a','a'),('chat-b','b');
      insert into chat_events values ('chat-a',0,0,'{}'),('chat-b',0,0,'{}');
      insert into account (id,account_id,provider_id,user_id,access_token) values ('oauth-a','google-a','google','a','secret'),('oauth-b','google-b','google','b','other');
      insert into session (id,expires_at,token,user_id) values ('session-a',now()+interval '1 day','token-a','a'),('session-b',now()+interval '1 day','token-b','b');
    `);
    const history = await loadOwnedHistory("chat-a", "a", db);
    assert.equal(history.length, 1);
    assert.deepEqual(await loadOwnedHistory("chat-a", "b", db), []);
    assert.deepEqual(await loadOwnedHistory("missing", "a", db), []);
    await pg.exec("update chats set deleted=true where id='chat-a'");
    assert.deepEqual(await loadOwnedHistory("chat-a", "a", db), []);
    await pg.exec(`delete from "user" where id='a'`);
    for (const table of ["chats", "account", "session", "daily_usage"]) {
      const result = await pg.query<{ user_id: string }>(
        `select user_id from ${table}`,
      );
      assert.ok(result.rows.length > 0);
      assert.ok(
        result.rows.every((row) => row.user_id === "b"),
        `${table} must cascade only the deleted user's records`,
      );
    }
    const events = await pg.query<{ chat_id: string }>(
      "select chat_id from chat_events",
    );
    assert.deepEqual(
      events.rows.map((row) => row.chat_id),
      ["chat-b"],
    );
  } finally {
    await pg.close();
  }
});
