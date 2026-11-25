import { randomUUID } from "node:crypto";
import type { PublishedPerson } from "@mira/shared";
import { describe, expect, it, vi } from "vitest";
import { visitorLabels } from "@/server/content/visitorLabels";
import { createCachedRead, createVisitorClear } from "./cache";
import { createOnlineVisitorReads } from "./reads";

const minutes = (count: number) => count * 60_000;

describe("visitor read cache", () => {
  it("rechecks a value after 10 minutes, then observes removal", async () => {
    let time = 0;
    let publication: string | null = "saved";
    let reads = 0;
    const read = createCachedRead(
      async () => {
        reads++;
        return publication;
      },
      () => time,
    );
    expect(await read("poi")).toBe("saved");
    publication = null;
    time = minutes(10) - 1;
    expect(await read("poi")).toBe("saved");
    expect(reads).toBe(1);
    time = minutes(10);
    expect(await read("poi")).toBeNull();
    publication = "replacement";
    time = minutes(20);
    expect(await read("poi")).toBe("replacement");
  });

  it("never serves expired content on failure, sanitizes errors and allows recovery", async () => {
    let time = 0;
    let available = true;
    const read = createCachedRead(
      async () => {
        if (!available) throw new Error("postgres://sensitive-connection");
        return "published";
      },
      () => time,
    );
    expect(await read("poi")).toBe("published");
    available = false;
    time = minutes(10);
    await expect(read("poi")).rejects.toThrow("Published content is temporarily unavailable.");
    available = true;
    expect(await read("poi")).toBe("published");
  });

  it("bounds the number of cached identities", async () => {
    let reads = 0;
    const read = createCachedRead(async (id) => {
      reads++;
      return id;
    });
    for (let i = 0; i < 201; i++) await read(String(i));
    await read("200");
    expect(reads).toBe(201);
    await read("0");
    expect(reads).toBe(202);
  });
});

// Outside Vercel, getCache is the SDK's own in-memory cache, with the same tag semantics.
describe("shared visitor cache", () => {
  const setup = () => {
    const state = { time: 0, reads: 0, value: "first" as string | null, available: true };
    const deployment = randomUUID();
    const instance = (deployed: string = deployment) =>
      createCachedRead(
        async () => {
          state.reads++;
          if (!state.available) throw new Error("down");
          return state.value;
        },
        () => state.time,
        {
          name: "test",
          deployment: deployed,
          labels: (value) => (value === null ? undefined : [deployment]),
        },
      );
    return { state, deployment, instance };
  };

  it("never expires, even during a database outage, until a clear or deploy", async () => {
    const { state, deployment, instance } = setup();
    const read = instance();
    expect(await read("poi")).toBe("first");
    state.available = false;
    state.time = minutes(30 * 24 * 60);
    expect(await read("poi")).toBe("first");
    expect(await instance()("poi")).toBe("first");
    expect(state.reads).toBe(1);

    await expect(instance("next-deployment")("poi")).rejects.toThrow("temporarily unavailable");
    await createVisitorClear(() => {})([deployment]);
    state.time += minutes(10) - 1;
    expect(await read("poi")).toBe("first");
    state.time += 1;
    await expect(read("poi")).rejects.toThrow("temporarily unavailable");
    state.available = true;
    state.value = "second";
    expect(await read("poi")).toBe("second");
  });

  it("never shares a missing identity", async () => {
    const { state, instance } = setup();
    state.value = null;
    expect(await instance()("poi")).toBeNull();
    state.value = "published";
    expect(await instance()("poi")).toBe("published");
  });

  it("rechecks a held value without downloading it again", async () => {
    const entries = new Map<string, unknown>();
    const fetched: unknown[] = [];
    let time = 0;
    const read = createCachedRead(
      async () => "x".repeat(1000),
      () => time,
      {
        name: "test",
        deployment: "deployment",
        labels: () => ["test"],
        getShared: () => ({
          get: async (key) => {
            const value = entries.get(key) ?? null;
            fetched.push(value);
            return value;
          },
          set: async (key, value) => void entries.set(key, value),
        }),
      },
    );
    await read("rome");
    time = minutes(10);
    await read("rome");
    expect(fetched).toEqual([null, expect.stringMatching(/^[0-9a-f]{64}$/)]);
  });

  it("reads the database when the shared cache fails", async () => {
    const failing = async () => {
      throw new Error("cache down");
    };
    const read = createCachedRead(async () => "published", Date.now, {
      name: "test",
      deployment: "deployment",
      labels: () => ["test"],
      getShared: () => ({ get: failing, set: failing }),
    });
    expect(await read("poi")).toBe("published");
  });

  it("clears again after a read that overlapped the save stored old content", async () => {
    vi.useFakeTimers();
    try {
      const { state, deployment, instance } = setup();
      let later!: Promise<void>;
      // More labels than one clear request sends.
      const others = Array.from({ length: 250 }, (_, index) => String(index));
      await createVisitorClear((task) => void (later = task()))([...others, deployment]);
      expect(await instance()("poi")).toBe("first");
      state.value = "second";
      expect(await instance()("poi")).toBe("first");
      await vi.advanceTimersByTimeAsync(30_000);
      await later;
      expect(await instance()("poi")).toBe("second");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears a Person linked to more POIs than an entry's tags allow", async () => {
    let reads = 0;
    const deployment = randomUUID();
    const person = {
      id: "augustus",
      linkedPois: Array.from({ length: 127 }, (_, index) => ({ id: String(index) })),
    } as PublishedPerson;
    const visit = () =>
      createOnlineVisitorReads(
        () => ({
          getCityPreviews: async () => Promise.reject(new Error("unused")),
          getStory: async () => undefined,
          getPerson: async () => {
            reads++;
            return person;
          },
        }),
        deployment,
      ).getPerson(person.id);
    await visit();
    await visit();
    expect(reads).toBe(1);
    await createVisitorClear(() => {})([visitorLabels.anyPoi]);
    await visit();
    expect(reads).toBe(2);
  });
});
