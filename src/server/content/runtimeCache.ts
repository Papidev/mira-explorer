import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";
import { getCache, type RuntimeCache } from "@vercel/functions";

const compress = promisify(gzip);
const decompress = promisify(gunzip);

export const getContentCache = (): RuntimeCache =>
  // Callers pass digests as keys: the default 32-bit key hash could serve another entry's body.
  getCache({ namespace: "mira-content", keyHashFunction: (key) => key });

// Compressed, to stay within the free Runtime Cache allowance and its 2 MB item limit.
export const pack = async (body: string) => (await compress(body)).toString("base64");
export const unpack = async (packed: string) =>
  (await decompress(Buffer.from(packed, "base64"))).toString("utf8");
