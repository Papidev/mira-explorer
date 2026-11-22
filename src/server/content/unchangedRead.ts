import type { RuntimeCache } from "@vercel/functions";
import type { Pool } from "pg";
import { getContentCache, pack, unpack } from "./runtimeCache";

const retentionSeconds = 30 * 24 * 60 * 60;
// ponytail: evicts oldest first by count (about 30 MB at today's part sizes); bound bytes if parts grow.
const memoryLimit = 1000;

/**
 * Reads a large query while downloading only what changed, to stay within Supabase's egress quota.
 *
 * The query returns `kind`, `key` (both text) and `value` (jsonb) rows, which PostgreSQL groups into
 * at most 16 parts by key. Every read asks the database for the parts' digests, so it is never
 * stale: only the bodies come from memory or Vercel's shared cache. Missing bodies come from one
 * statement that returns every digest again, so a result never mixes two database snapshots.
 */
export const createUnchangedRead = (
  getShared: () => Pick<RuntimeCache, "get" | "set"> = getContentCache,
) => {
  const memory = new Map<string, string>();
  const remember = (digest: string, body: string) => {
    memory.set(digest, body);
    if (memory.size > memoryLimit) memory.delete(memory.keys().next().value!);
  };

  return async (client: Pick<Pool, "query">, sql: string, values: unknown[] = []) => {
    const parts = `WITH parts AS MATERIALIZED (
      SELECT md5(body) AS digest, body FROM (
        SELECT string_agg(jsonb_build_array(kind, key, value)::text, ','
          ORDER BY kind COLLATE "C", key COLLATE "C") AS body
        FROM (${sql}) entries GROUP BY left(md5(kind || key), 1)
      ) grouped)`;
    let { rows } = await client.query<{ digest: string; body?: string | null }>(
      `${parts} SELECT digest FROM parts`,
      values,
    );

    const bodies = new Map<string, string>();
    await Promise.all(
      rows.map(async ({ digest }) => {
        const held = memory.get(digest);
        if (held !== undefined) return bodies.set(digest, held);
        try {
          const shared = await getShared().get(digest);
          if (typeof shared !== "string") return;
          const body = await unpack(shared);
          remember(digest, body);
          bodies.set(digest, body);
        } catch {
          // The cache is only an optimization: the database supplies whatever it cannot.
        }
      }),
    );

    if (rows.some(({ digest }) => !bodies.has(digest))) {
      ({ rows } = await client.query<{ digest: string; body?: string | null }>(
        `${parts} SELECT digest,
          CASE WHEN digest = ANY($${values.length + 1}::text[]) THEN NULL ELSE body END AS body
        FROM parts`,
        [...values, [...bodies.keys()]],
      ));
      await Promise.all(
        rows.map(async ({ digest, body }) => {
          if (typeof body !== "string") return;
          bodies.set(digest, body);
          remember(digest, body);
          try {
            await getShared().set(digest, await pack(body), {
              ttl: retentionSeconds,
              name: "content-part",
            });
          } catch {
            // As above.
          }
        }),
      );
    }

    const entries = rows
      .flatMap(
        ({ digest }) => JSON.parse(`[${bodies.get(digest)}]`) as Array<[string, string, unknown]>,
      )
      .sort(([, left], [, right]) => (left < right ? -1 : left > right ? 1 : 0));
    /** The values of one kind, ordered by key. */
    return (kind: string) =>
      entries.filter(([entryKind]) => entryKind === kind).map(([, , value]) => value);
  };
};

export const readUnchanged = createUnchangedRead();
