import { describe, expect, it } from "vitest";
import {
  estimateTrainingVRAM,
  evaluateTrainingComplete,
  TRAINING_METHODS,
  type HardwareInfo,
} from "../src/lib/hardware";

// ── Helpers ──────────────────────────────────────────────────

function makeHW(overrides: Partial<HardwareInfo> = {}): HardwareInfo {
  return {
    gpuRenderer: null,
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
    platform: null,
    cpuBenchmark: null,
    isMobile: false,
    deviceName: null,
    ...overrides,
  } as HardwareInfo;
}

// ── estimateTrainingVRAM — anchored to published reference numbers ────

describe("estimateTrainingVRAM", () => {
  it("qlora tracks the QLoRA paper's reported footprints (seqLen 512, batch 1)", () => {
    // Dettmers et al. 2023, Table 9
    expect(estimateTrainingVRAM(7, "qlora")).toBeCloseTo(5.4, 1);
    expect(estimateTrainingVRAM(13, "qlora")).toBeCloseTo(9.0, 1);
    expect(estimateTrainingVRAM(33, "qlora")).toBeCloseTo(21.0, 1);
    expect(estimateTrainingVRAM(65, "qlora")).toBeCloseTo(40.2, 1);
  });

  it("lora matches the commonly cited ~16GB figure for a 7B model", () => {
    expect(estimateTrainingVRAM(7, "lora")).toBeCloseTo(16, 1);
  });

  it("full fine-tune matches the commonly cited ~116GB figure for a 7B model", () => {
    expect(estimateTrainingVRAM(7, "full")).toBeCloseTo(116, 1);
  });

  it("orders methods qlora < lora < full for the same model", () => {
    const q = estimateTrainingVRAM(8, "qlora");
    const l = estimateTrainingVRAM(8, "lora");
    const f = estimateTrainingVRAM(8, "full");
    expect(q).toBeLessThan(l);
    expect(l).toBeLessThan(f);
  });

  it("scales overhead with context length and batch size, not the base term", () => {
    const base = estimateTrainingVRAM(7, "qlora", { contextLength: 512, batchSize: 1 });
    const longerCtx = estimateTrainingVRAM(7, "qlora", { contextLength: 2048, batchSize: 1 });
    const biggerBatch = estimateTrainingVRAM(7, "qlora", { contextLength: 512, batchSize: 4 });
    expect(longerCtx).toBeGreaterThan(base);
    expect(biggerBatch).toBeGreaterThan(base);
  });

  it("is monotonically increasing in model size", () => {
    for (const method of ["qlora", "lora", "full"] as const) {
      expect(estimateTrainingVRAM(13, method)).toBeGreaterThan(estimateTrainingVRAM(7, method));
    }
  });
});

// ── evaluateTrainingComplete ────────────────────────────────

describe("evaluateTrainingComplete", () => {
  it("a 24GB GPU can QLoRA-tune a 7B model but not full fine-tune it", () => {
    const hw = makeHW({ estimatedVRAM: 24, systemRAM: 32 });
    const qlora = evaluateTrainingComplete(7, hw, "qlora");
    const full = evaluateTrainingComplete(7, hw, "full");
    expect(qlora.status).not.toBe("cannot-run");
    expect(full.status).toBe("cannot-run");
    expect(full.grade).toBe("F");
  });

  it("returns the requested method and a VRAM figure matching estimateTrainingVRAM", () => {
    const hw = makeHW({ estimatedVRAM: 24, systemRAM: 32 });
    const result = evaluateTrainingComplete(7, hw, "lora");
    expect(result.method).toBe("lora");
    expect(result.vramGB).toBe(estimateTrainingVRAM(7, "lora"));
  });

  it("unknown hardware yields an unknown status and '?' grade", () => {
    const hw = makeHW();
    const result = evaluateTrainingComplete(7, hw, "qlora");
    expect(result.status).toBe("unknown");
    expect(result.grade).toBe("?");
  });
});

// ── TRAINING_METHODS metadata ───────────────────────────────

describe("TRAINING_METHODS", () => {
  it("has a label and description for all three methods", () => {
    for (const method of ["qlora", "lora", "full"] as const) {
      expect(TRAINING_METHODS[method].label).toBeTruthy();
      expect(TRAINING_METHODS[method].description).toBeTruthy();
    }
  });
});
