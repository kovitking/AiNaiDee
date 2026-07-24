import {
  getActiveParamsBillions,
  models,
  type AIModel,
  type Quantization,
} from "../data/models";
import {
  evaluateModelComplete,
  isAppleSiliconCheck,
  matchApple,
  matchGPU,
  type HardwareInfo,
  type ModelStatus,
} from "./hardware";

export interface HardwareInput {
  cpu?: { name?: string; cores?: number; threads?: number } | null;
  ramGb?: number | null;
  ram?: number | null;
  gpu?: {
    name?: string | null;
    vramGb?: number | null;
    memoryBandwidthGbps?: number | null;
  } | null;
  appleSilicon?: boolean | null;
  mobile?: boolean | null;
  platform?: string | null;
}

type ApiStatus =
  | "comfortable"
  | "tight"
  | "cpu-offload"
  | "insufficient"
  | "unknown";

const STATUS_MAP: Record<ModelStatus, ApiStatus> = {
  "can-run": "comfortable",
  "tight": "tight",
  "can-run-slow": "cpu-offload",
  "cannot-run": "insufficient",
  "unknown": "unknown",
};

const round1 = (value: number): number => Math.round(value * 10) / 10;

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function baseHardware(input: HardwareInput, partial: Partial<HardwareInfo>): HardwareInfo {
  const deviceName = input.gpu?.name?.trim() || null;
  return {
    gpuRenderer: deviceName,
    gpuVendor: null,
    gpuCores: null,
    ramGB: null,
    estimatedVRAM: null,
    memoryBandwidth: null,
    systemRAM: null,
    deviceMemoryRaw: null,
    webgpu: false,
    webgpuDevice: null,
    webgpuArch: null,
    isAppleSilicon: false,
    totalUsableRAM: null,
    platform: input.platform ?? null,
    cpuBenchmark: null,
    isMobile: input.mobile === true,
    deviceName,
    ...partial,
  };
}

export interface ResolvedHardware {
  hw: HardwareInfo;
  detected: {
    kind: "apple-silicon" | "gpu" | "cpu";
    device: string | null;
    vramGb: number | null;
    ramGb: number | null;
    memoryBandwidthGbps: number | null;
  };
}

export function resolveHardware(
  input: HardwareInput | null | undefined,
): { ok: true; value: ResolvedHardware } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "missing_hardware" };
  }

  const ramGb = positiveNumber(input.ramGb ?? input.ram);
  const gpuName = input.gpu?.name?.trim() || null;
  let vramGb = positiveNumber(input.gpu?.vramGb);
  let bandwidth = positiveNumber(input.gpu?.memoryBandwidthGbps);

  const appleMatch = gpuName ? matchApple(gpuName) : null;
  const isApple =
    input.appleSilicon === true ||
    (input.appleSilicon !== false &&
      !!gpuName &&
      (isAppleSiliconCheck(gpuName) || !!appleMatch));

  if (isApple) {
    const totalRam = ramGb ?? appleMatch?.ram ?? null;
    bandwidth ??= appleMatch?.bw ?? null;
    if (totalRam === null) {
      return { ok: false, error: "missing_ram_for_apple_silicon" };
    }

    return {
      ok: true,
      value: {
        hw: baseHardware(input, {
          isAppleSilicon: true,
          totalUsableRAM: totalRam,
          ramGB: totalRam,
          memoryBandwidth: bandwidth,
          platform: input.platform ?? "macOS",
        }),
        detected: {
          kind: "apple-silicon",
          device: gpuName,
          vramGb: null,
          ramGb: totalRam,
          memoryBandwidthGbps: bandwidth,
        },
      },
    };
  }

  const gpuMatch = gpuName ? matchGPU(gpuName) : null;
  vramGb ??= gpuMatch?.vram || null;
  bandwidth ??= gpuMatch?.bw || null;

  if (vramGb !== null) {
    return {
      ok: true,
      value: {
        hw: baseHardware(input, {
          estimatedVRAM: vramGb,
          totalUsableRAM: vramGb,
          ramGB: vramGb,
          systemRAM: ramGb,
          memoryBandwidth: bandwidth,
        }),
        detected: {
          kind: "gpu",
          device: gpuName,
          vramGb,
          ramGb,
          memoryBandwidthGbps: bandwidth,
        },
      },
    };
  }

  if (ramGb === null) {
    return { ok: false, error: "missing_ram_or_vram" };
  }

  bandwidth ??= 50;
  return {
    ok: true,
    value: {
      hw: baseHardware(input, {
        totalUsableRAM: ramGb,
        ramGB: ramGb,
        systemRAM: ramGb,
        memoryBandwidth: bandwidth,
      }),
      detected: {
        kind: "cpu",
        device: gpuName,
        vramGb: null,
        ramGb,
        memoryBandwidthGbps: bandwidth,
      },
    },
  };
}

export function findModel(modelId: string): AIModel | null {
  const normalized = normalizeId(modelId);
  if (!normalized) return null;

  return (
    models.find((model) => model.id.toLowerCase() === modelId.toLowerCase()) ??
    models.find((model) => normalizeId(model.id) === normalized) ??
    models.find(
      (model) => model.ollamaId && normalizeId(model.ollamaId) === normalized,
    ) ??
    null
  );
}

function findQuant(model: AIModel, quantization: string): Quantization | null {
  const normalized = normalizeId(quantization);
  return (
    model.quants.find((quant) => normalizeId(quant.name) === normalized) ?? null
  );
}

function pickRecommendedQuant(model: AIModel, hw: HardwareInfo): Quantization {
  const byQuality = [...model.quants].sort((a, b) => b.bits - a.bits);
  let fallback: Quantization | null = null;

  for (const quant of byQuality) {
    const result = evaluateModelComplete(
      quant.vramGB,
      hw,
      model.paramsBillions,
      { activeParamsBillions: getActiveParamsBillions(model) },
    );
    if (result.status === "can-run") return quant;
    if (
      fallback === null &&
      (result.status === "tight" || result.status === "can-run-slow")
    ) {
      fallback = quant;
    }
  }

  return fallback ?? byQuality[byQuality.length - 1]!;
}

function availableMemory(hw: HardwareInfo): number | null {
  if (hw.isAppleSilicon || hw.isMobile) return hw.totalUsableRAM;
  return hw.estimatedVRAM ?? hw.totalUsableRAM;
}

function compatibilityNotes(
  status: ModelStatus,
  quant: Quantization,
  recommended: Quantization,
  headroom: number | null,
  tokensPerSecond: number | null,
): string[] {
  const notes: string[] = [];

  if (status === "can-run") {
    notes.push("The model should fit comfortably in available memory.");
  } else if (status === "tight") {
    notes.push(
      "The model fits with little headroom; reduce context length if memory errors occur.",
    );
  } else if (status === "can-run-slow") {
    notes.push(
      "The model requires CPU offloading to system RAM, which will reduce speed.",
    );
  } else if (status === "cannot-run") {
    notes.push(`The model does not fit at ${quant.name}.`);
  }

  if (recommended.name !== quant.name) {
    notes.push(
      `${recommended.name} is the recommended quantization for this hardware.`,
    );
  }
  if (headroom !== null && headroom > 0 && status !== "cannot-run") {
    notes.push(
      `About ${round1(headroom)} GB remains for context and the KV cache.`,
    );
  }
  if (tokensPerSecond !== null) {
    notes.push(
      `Estimated at roughly ${tokensPerSecond} tokens/second from memory bandwidth.`,
    );
  }

  return notes;
}

export function evaluateCompatibility(
  hw: HardwareInfo,
  model: AIModel,
  quantization?: string | null,
):
  | { ok: true; value: ReturnType<typeof buildCompatibilityResult> }
  | { ok: false; error: string; available?: string[] } {
  const requested = quantization ? findQuant(model, quantization) : null;
  if (quantization && !requested) {
    return {
      ok: false,
      error: "invalid_quantization",
      available: model.quants.map((quant) => quant.name),
    };
  }

  const recommended = pickRecommendedQuant(model, hw);
  const quant = requested ?? recommended;
  return {
    ok: true,
    value: buildCompatibilityResult(hw, model, quant, recommended),
  };
}

function buildCompatibilityResult(
  hw: HardwareInfo,
  model: AIModel,
  quant: Quantization,
  recommended: Quantization,
) {
  const result = evaluateModelComplete(
    quant.vramGB,
    hw,
    model.paramsBillions,
    { activeParamsBillions: getActiveParamsBillions(model) },
  );
  const memory = availableMemory(hw);
  const headroom = memory === null ? null : round1(memory - quant.vramGB);

  return {
    compatible:
      result.status !== "cannot-run" && result.status !== "unknown",
    status: STATUS_MAP[result.status],
    grade: result.grade,
    score: result.score,
    modelId: model.id,
    modelName: model.name,
    quantization: quant.name,
    recommendedQuantization: recommended.name,
    estimated: {
      tokensPerSecond: result.toksPerSec,
      modelSizeGb: quant.diskGB,
      vramRequiredGb: quant.vramGB,
      ramRequiredGb: model.recommendedRamGB,
      memoryHeadroomGb: headroom,
    },
    notes: compatibilityNotes(
      result.status,
      quant,
      recommended,
      headroom,
      result.toksPerSec,
    ),
  };
}

export function recommendModels(
  hw: HardwareInfo,
  options: { useCase?: string | null; limit?: number | null } = {},
) {
  const useCase = options.useCase?.trim().toLowerCase() || null;
  const requestedLimit =
    typeof options.limit === "number" && Number.isFinite(options.limit)
      ? Math.floor(options.limit)
      : 5;
  const limit = Math.max(1, Math.min(25, requestedLimit));
  const pool = useCase
    ? models.filter((model) =>
        model.useCase.some((value) => value.toLowerCase() === useCase),
      )
    : models;

  return pool
    .map((model) => {
      const quant = pickRecommendedQuant(model, hw);
      const result = evaluateModelComplete(
        quant.vramGB,
        hw,
        model.paramsBillions,
        { activeParamsBillions: getActiveParamsBillions(model) },
      );
      if (result.status === "cannot-run" || result.status === "unknown") {
        return null;
      }
      return {
        modelId: model.id,
        name: model.name,
        provider: model.provider,
        family: model.family,
        paramsBillions: model.paramsBillions,
        useCase: model.useCase,
        quantization: quant.name,
        status: STATUS_MAP[result.status],
        grade: result.grade,
        score: result.score,
        estimatedTokensPerSecond: result.toksPerSec,
        vramRequiredGb: quant.vramGB,
        diskSizeGb: quant.diskGB,
        url: model.url,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.paramsBillions - a.paramsBillions ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

export function serializeModel(model: AIModel) {
  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    family: model.family,
    params: model.params,
    paramsBillions: model.paramsBillions,
    activeParams: model.activeParams ?? null,
    architecture: model.architecture,
    releaseDate: model.releaseDate,
    contextLength: model.contextLength,
    useCase: model.useCase,
    description: model.description,
    url: model.url,
    license: model.license ?? null,
    tools: model.tools ?? false,
    thinking: model.thinking ?? false,
    minRamGB: model.minRamGB,
    recommendedRamGB: model.recommendedRamGB,
    ollamaId: model.ollamaId ?? null,
    lmStudioId: model.lmStudioId ?? null,
    quants: model.quants,
  };
}

export function serializeModelSummary(model: AIModel) {
  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    family: model.family,
    params: model.params,
    paramsBillions: model.paramsBillions,
    architecture: model.architecture,
    releaseDate: model.releaseDate,
    contextLength: model.contextLength,
    useCase: model.useCase,
    url: model.url,
    license: model.license ?? null,
  };
}
