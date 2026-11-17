import {
  createPostgresContent,
  catalogWriteSchema,
  categoryCatalogCreateSchema,
  categoryCatalogRenameSchema,
  categoryCatalogMoveSchema,
  categoryCatalogDeleteSchema,
  personUpdateSchema,
  poiCategoriesWriteSchema,
  storyWriteSchema,
  poiTypesWriteSchema,
  typeCategoryRuleWriteSchema,
} from "./postgresContent";
import { publishedCategorySchema, publishedPoiSummarySchema } from "./publishedContent";
import { adminPeopleIdsSchema } from "./adminReads";
import {
  authenticateContentRequest,
  contentErrorResponse,
  ContentHttpError,
  contentJson,
  parseContentInput,
  readContentBody,
} from "./http";
import { z } from "zod";

export const createContentHandler =
  (getRepository: () => ReturnType<typeof createPostgresContent>) =>
  async (request: Request, context: { params: Promise<{ segments: string[] }> }) => {
    try {
      authenticateContentRequest(request);
      const { segments } = await context.params;
      const [resource, identity, action] = segments;
      if (
        (resource === "catalogs" &&
          segments.length === 3 &&
          ["inventory", "stories"].includes(action)) ||
        (resource === "people" && segments.length === 1 && request.method === "GET")
      ) {
        if (request.method !== "GET")
          return contentJson(
            { error: { code: "invalid", message: "This method is not supported." } },
            405,
            { Allow: "GET" },
          );
        const parameters = new URL(request.url).searchParams;
        const readIds = <T>(schema: z.ZodType<T>, optional: string[] = []) => {
          if (
            [...parameters.keys()].some((key) => key !== "ids" && !optional.includes(key)) ||
            [...parameters.keys(), "ids"].some((key) => parameters.getAll(key).length > 1) ||
            !parameters.has("ids")
          )
            throw new ContentHttpError(400, "invalid", "Expected one ids query parameter.");
          return parseContentInput(schema, parameters.get("ids")!.split(","));
        };
        if (resource === "people") {
          const ids = readIds(adminPeopleIdsSchema);
          return contentJson({ people: await getRepository().getAdminPeople(ids) });
        }
        const city = parseContentInput(publishedPoiSummarySchema.shape.city, identity);
        if (action === "inventory")
          return contentJson(await getRepository().getAdminInventory(city));
        const ids = readIds(
          z
            .array(z.uuid())
            .min(1)
            .max(25)
            .refine((values) => new Set(values).size === values.length),
          ["people"],
        );
        const people = parameters.get("people");
        if (people !== null && people !== "omit")
          throw new ContentHttpError(400, "invalid", "Expected people=omit.");
        const repository = getRepository();
        const stories = await repository.getAdminStories(city, ids);
        if (people === "omit") return contentJson({ stories });
        // Admin clients that predate the People read expect each Story's profiles embedded.
        // ponytail: remove this branch (and require people=omit) once every Admin reads People separately.
        const personIds = [
          ...new Set(
            stories.flatMap(({ detail }) =>
              detail.story.relatedPeople.map(({ personId }) => personId),
            ),
          ),
        ];
        const profiles = new Map<
          string,
          Awaited<ReturnType<typeof repository.getAdminPeople>>[number]
        >();
        for (let start = 0; start < personIds.length; start += 100)
          for (const profile of await repository.getAdminPeople(
            personIds.slice(start, start + 100),
          ))
            profiles.set(profile.personId, profile);
        return contentJson({
          stories: stories.map((story) => ({
            ...story,
            people: story.detail.story.relatedPeople.flatMap(({ personId }) =>
              profiles.has(personId) ? [profiles.get(personId)!] : [],
            ),
          })),
        });
      }
      if (resource === "type-rules" && segments.length === 1) {
        if (request.method === "GET")
          return contentJson(await getRepository().getTypeCategoryRules());
        if (request.method !== "PUT")
          return contentJson(
            { error: { code: "invalid", message: "This method is not supported." } },
            405,
            { Allow: "GET, PUT" },
          );
        const input = parseContentInput(
          typeCategoryRuleWriteSchema,
          await readContentBody(request),
        );
        return contentJson(await getRepository().saveTypeCategoryRule(input));
      }
      if (resource === "categories" && segments.length === 3 && action === "delete") {
        if (request.method !== "PUT")
          return contentJson(
            { error: { code: "invalid", message: "This method is not supported." } },
            405,
            { Allow: "PUT" },
          );
        const input = parseContentInput(
          categoryCatalogDeleteSchema.omit({ id: true }),
          await readContentBody(request),
        );
        const id = parseContentInput(publishedCategorySchema.shape.id, identity);
        return contentJson(await getRepository().deleteCategory({ ...input, id }));
      }
      if (resource === "categories" && segments.length === 3 && action === "move") {
        if (request.method !== "PUT")
          return contentJson(
            { error: { code: "invalid", message: "This method is not supported." } },
            405,
            { Allow: "PUT" },
          );
        const input = parseContentInput(
          categoryCatalogMoveSchema.omit({ id: true }),
          await readContentBody(request),
        );
        const id = parseContentInput(publishedCategorySchema.shape.id, identity);
        return contentJson(await getRepository().moveCategory({ ...input, id }));
      }
      if (resource === "categories" && segments.length === 2) {
        if (request.method !== "PUT")
          return contentJson(
            { error: { code: "invalid", message: "This method is not supported." } },
            405,
            { Allow: "PUT" },
          );
        const input = parseContentInput(
          categoryCatalogRenameSchema.omit({ id: true }),
          await readContentBody(request),
        );
        const id = parseContentInput(publishedCategorySchema.shape.id, identity);
        return contentJson(await getRepository().renameCategory({ ...input, id }));
      }
      if (resource === "categories" && segments.length === 1) {
        if (request.method === "GET")
          return contentJson(await getRepository().getCategoryCatalog());
        if (request.method !== "PUT")
          return contentJson(
            { error: { code: "invalid", message: "This method is not supported." } },
            405,
            { Allow: "GET, PUT" },
          );
        const input = parseContentInput(
          categoryCatalogCreateSchema,
          await readContentBody(request),
        );
        return contentJson(await getRepository().createCategory(input));
      }
      if (resource === "catalogs" && segments.length === 3 && action === "types") {
        if (request.method !== "GET")
          return contentJson(
            { error: { code: "invalid", message: "This method is not supported." } },
            405,
            { Allow: "GET" },
          );
        const city = parseContentInput(publishedPoiSummarySchema.shape.city, identity);
        return contentJson(await getRepository().getCityPoiTypes(city));
      }
      const catalog = resource === "catalogs" && segments.length === 2;
      const poi =
        resource === "pois" &&
        segments.length === 3 &&
        ["story", "baseline", "categories", "categories-baseline", "types"].includes(action);
      const person =
        resource === "people" &&
        (segments.length === 2 || (segments.length === 3 && action === "baseline"));
      if (!catalog && !poi && !person)
        throw new ContentHttpError(
          404,
          "not-found",
          "The requested content endpoint does not exist.",
        );
      const allow =
        poi && action === "types"
          ? "GET, PUT"
          : catalog
            ? "GET, PUT"
            : ["baseline", "categories-baseline"].includes(action)
              ? "GET"
              : "PUT";
      if (!allow.split(", ").includes(request.method))
        return contentJson(
          { error: { code: "invalid", message: "This method is not supported." } },
          405,
          { Allow: allow },
        );
      const id = parseContentInput(
        catalog
          ? publishedPoiSummarySchema.shape.city
          : poi
            ? z.uuid().toLowerCase()
            : z.string().min(1),
        identity,
      );
      if (request.method === "GET") {
        const repository = getRepository();
        const result = catalog
          ? await repository.getCatalogBaseline(id)
          : poi
            ? action === "types"
              ? await repository.getPoiTypes(id)
              : action === "categories-baseline"
                ? await repository.getPoiCategoriesBaseline(id)
                : await repository.getPoiBaseline(id)
            : await repository.getPersonBaseline(id);
        if (!result)
          throw new ContentHttpError(404, "not-found", "The requested baseline does not exist.");
        return contentJson(result);
      }
      const body = await readContentBody(request);
      if (catalog) {
        const input = parseContentInput(catalogWriteSchema, body);
        if (input.city !== id)
          throw new ContentHttpError(400, "invalid", "Route and body identities must match.");
        return contentJson({ status: await getRepository().synchronizeCatalog(input) });
      }
      if (poi && action === "types") {
        const input = parseContentInput(poiTypesWriteSchema, body);
        if (input.poiId !== id)
          throw new ContentHttpError(400, "invalid", "Route and body identities must match.");
        return contentJson(await getRepository().savePoiTypes(input));
      }
      if (poi && action === "categories") {
        const input = parseContentInput(poiCategoriesWriteSchema, body);
        if (input.poiId !== id)
          throw new ContentHttpError(400, "invalid", "Route and body identities must match.");
        return contentJson(await getRepository().savePoiCategories(input));
      }
      if (poi) {
        const input = parseContentInput(storyWriteSchema, body);
        if (input.detail.id !== id)
          throw new ContentHttpError(400, "invalid", "Route and body identities must match.");
        return contentJson({ status: await getRepository().saveStory(input) });
      }
      const input = parseContentInput(personUpdateSchema, body);
      if (input.person.id !== id)
        throw new ContentHttpError(400, "invalid", "Route and body identities must match.");
      return contentJson({ status: await getRepository().savePerson(input) });
    } catch (error) {
      return contentErrorResponse(error);
    }
  };
