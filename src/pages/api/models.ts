import type { APIRoute } from "astro";
import { models } from "../../data/models";
import { serializeModelSummary } from "../../lib/compatibility-api";
import { json, preflight } from "../../lib/api-response";

export const prerender = false;

export const OPTIONS: APIRoute = () => preflight();

export const GET: APIRoute = ({ url }) => {
  const provider = url.searchParams.get("provider")?.trim().toLowerCase();
  const useCase = url.searchParams.get("useCase")?.trim().toLowerCase();
  const filtered = models.filter(
    (model) =>
      (!provider || model.provider.toLowerCase() === provider) &&
      (!useCase ||
        model.useCase.some((value) => value.toLowerCase() === useCase)),
  );

  return json(
    { count: filtered.length, models: filtered.map(serializeModelSummary) },
    200,
    "public, max-age=3600",
  );
};
