import type { APIRoute } from "astro";
import {
  recommendModels,
  resolveHardware,
  type HardwareInput,
} from "../../lib/compatibility-api";
import { json, preflight, readJsonBody } from "../../lib/api-response";

export const prerender = false;

export const OPTIONS: APIRoute = () => preflight();

export const POST: APIRoute = async ({ request }) => {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const payload = body.value as {
    hardware?: HardwareInput;
    useCase?: string;
    limit?: number;
  } | null;

  if (!payload || typeof payload !== "object") {
    return json({ error: "invalid_payload" }, 400);
  }

  const hardware = resolveHardware(payload.hardware);
  if (!hardware.ok) return json({ error: hardware.error }, 400);

  const recommendations = recommendModels(hardware.value.hw, {
    useCase: payload.useCase,
    limit: payload.limit,
  });
  return json({
    hardware: hardware.value.detected,
    count: recommendations.length,
    recommendations,
  });
};
