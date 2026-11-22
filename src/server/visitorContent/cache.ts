import { createHash } from "node:crypto";
import type { RuntimeCache } from "@vercel/functions";
import { getContentCache, pack, unpack } from "@/server/content/runtimeCache";
import { visitorLabels } from "@/server/content/visitorLabels";

const recheckAfter = 10 * 60_000;
// Saves and deploys replace entries long before this: in practice they never expire.
const retentionSeconds = 365 * 24 * 60 * 60;
// Longer than the 25-second query timeout, so it follows any read that overlapped the save.
const clearAgainAfter = 30_000;

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
// Labels hold caller-supplied ids, while Vercel sends tags unencoded in headers and URLs.
const toTag = (label: string) => `visitor-${hash(label).slice(0, 16)}`;

export type SharedEntries<T> = {
  name: string;
  /** Undefined when the cache must not be shared across instances. */
  deployment?: string;
  /** The entry's labels, or undefined for a value not to share, such as a missing identity. */
  labels: (value: T) => string[] | undefined;
  getShared?: () => Pick<RuntimeCache, "get" | "set">;
};

/**
 * Keeps each value in instance memory for 10 minutes. After that, Vercel's shared cache says whether
 * it is still current, and the database is read only when a save or deploy cleared it. The shared
 * entry is a small version, so rechecking the map doesn't download it again.
 */
export const createCachedRead = <T>(
  read: (id: string) => Promise<T>,
  now: () => number = Date.now,
  shared?: SharedEntries<T>,
) => {
  type Held = { value: T; version?: string };

  const load = async (id: string, held?: Held): Promise<Held> => {
    if (!shared?.deployment) return { value: await read(id) };
    const { name, deployment, labels, getShared = getContentCache } = shared;
    const key = hash(JSON.stringify([deployment, name, id]));
    try {
      const version = await getShared().get(key);
      if (typeof version === "string") {
        if (held?.version === version) return held;
        const body = await getShared().get(version);
        if (typeof body === "string")
          return { value: JSON.parse(await unpack(body)) as T, version };
      }
    } catch {
      // An unavailable cache leaves the database as the source.
    }
    const value = await read(id);
    const entryLabels = labels(value);
    if (!entryLabels) return { value };
    const body = JSON.stringify(value);
    const version = hash(body);
    try {
      await getShared().set(version, await pack(body), { ttl: retentionSeconds, name });
      await getShared().set(key, version, {
        ttl: retentionSeconds,
        name: `${name}-version`,
        tags: [visitorLabels.all, ...entryLabels].map(toTag),
      });
    } catch {
      // As above.
    }
    return { value, version };
  };

  // Each server instance keeps a bounded cache; no credentials enter its keys or values.
  const entries = new Map<string, { checkedAt: number; result: Promise<Held> }>();
  return async (id: string): Promise<T> => {
    const cached = entries.get(id);
    if (cached && now() < cached.checkedAt + recheckAfter) return (await cached.result).value;
    const entry = {
      checkedAt: now(),
      result: (async () => load(id, await cached?.result))().catch(() => {
        if (entries.get(id) === entry) entries.delete(id);
        // Sanitize the shared promise too: concurrent callers must never receive driver errors.
        throw new Error("Published content is temporarily unavailable.");
      }),
    };
    entries.delete(id);
    entries.set(id, entry);
    if (entries.size > 200) entries.delete(entries.keys().next().value!);
    return (await entry.result).value;
  };
};

/** Clears now and again later, when a read that overlapped the save can no longer store old content. */
export const createVisitorClear =
  (
    later: (task: () => Promise<void>) => void,
    getShared: () => Pick<RuntimeCache, "expireTag"> = getContentCache,
  ) =>
  async (labels: string[]) => {
    const tags = [...new Set(labels.map(toTag))];
    const expire = async () => {
      try {
        // Vercel sends tags in the URL, so a category change can't send hundreds at once.
        for (let start = 0; start < tags.length; start += 100)
          await getShared().expireTag(tags.slice(start, start + 100));
      } catch {
        // The content is saved, so this never fails the write. A redeploy also clears.
        console.error("Visitor cache clear failed.");
      }
    };
    later(async () => {
      await new Promise((resolve) => setTimeout(resolve, clearAgainAfter));
      await expire();
    });
    await expire();
  };
