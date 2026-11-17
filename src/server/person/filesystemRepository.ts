import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { personSchema, type Person } from "./types";

// Reads the saved local People used by local-only Stories. Mira Admin owns Person generation.
export const createFilesystemPersonRepository = (rootPath = process.cwd()) => {
  const peoplePath = path.join(rootPath, "data", "people");

  const get = (personId: string) => {
    const filePath = path.join(peoplePath, personId, "person.json");
    if (!existsSync(filePath)) return undefined;
    try {
      const person = personSchema.parse(JSON.parse(readFileSync(filePath, "utf-8")));
      if (person.id !== personId) {
        throw new Error(`Person ID ${person.id} does not match directory ${personId}.`);
      }
      return person;
    } catch (error) {
      throw new Error(`Invalid Person file ${filePath}: ${String(error)}`, { cause: error });
    }
  };

  return {
    get,
    list: () =>
      existsSync(peoplePath)
        ? readdirSync(peoplePath, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => get(entry.name))
            .filter((person): person is Person => Boolean(person))
        : [],
  };
};

export const personRepository = createFilesystemPersonRepository();
