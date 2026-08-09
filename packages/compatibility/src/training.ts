// ── Fine-tuning feasibility ────────────────────────────────
//
// "Can I run this?" (index.ts) answers inference. This answers the second
// question from docs/idea.md: "if I fine-tune this with LoRA, does my
// hardware hold up?" Same hardware-fit logic (evaluateModel/computeScore),
// different memory formula — training needs room for gradients and
// optimizer state, not just the frozen weights inference uses.

import type { Grade, HardwareInfo, ModelStatus } from "./index";
import { computeScore, evaluateModel, memoryPercentage, scoreToGrade } from "./index";

export type TrainingMethod = "qlora" | "lora" | "full";

interface TrainingProfile {
  /** GB of VRAM per billion params for the frozen/trainable weights themselves. */
  bytesPerParam: number;
  /** Fixed GB for optimizer state + activations at the reference context/batch. */
  baseOverheadGB: number;
}

// Reference point: seqLen 512, batch size 1 — see estimateTrainingVRAM.
//
// - qlora: 4-bit frozen base (~0.5 B/param) + LoRA adapter grads/optimizer +
//   activations. Constants fitted to Dettmers et al. 2023 (QLoRA paper,
//   Table 9): 7B≈5.4GB, 13B≈9GB, 33B≈21GB, 65B≈41GB.
// - lora: fp16 frozen base (2 B/param, same as F16 inference) + adapter
//   grads/optimizer + activations. Matches the commonly cited "~16GB to
//   LoRA-tune a 7B model" figure (7*2 + 2 = 16).
// - full: fp16 weights (2) + fp16 grads (2) + fp32 master weights (4) +
//   AdamW fp32 moments m,v (4+4) = 16 bytes/param, the standard
//   mixed-precision full-fine-tune breakdown. Matches "~120GB to fully
//   fine-tune a 7B model" (7*16 + 4 ≈ 116).
const TRAINING_PROFILES: Record<TrainingMethod, TrainingProfile> = {
  qlora: { bytesPerParam: 0.6, baseOverheadGB: 1.2 },
  lora: { bytesPerParam: 2.0, baseOverheadGB: 2.0 },
  full: { bytesPerParam: 16.0, baseOverheadGB: 4.0 },
};

export const TRAINING_METHODS: Record<TrainingMethod, { label: string; description: string }> = {
  qlora: { label: "QLoRA", description: "4-bit base + LoRA adapters — lowest VRAM, small quality tradeoff" },
  lora: { label: "LoRA", description: "fp16 base (frozen) + LoRA adapters — better quality, more VRAM" },
  full: { label: "Full fine-tune", description: "Every weight trainable — best quality, far more VRAM" },
};

export interface TrainingEstimateOptions {
  /** Training sequence length. Activation memory scales roughly linearly with this. Default 512. */
  contextLength?: number;
  /** Training batch size. Activation memory scales roughly linearly with this. Default 1. */
  batchSize?: number;
}

export function estimateTrainingVRAM(
  paramsBillions: number,
  method: TrainingMethod,
  options: TrainingEstimateOptions = {},
): number {
  const { contextLength = 512, batchSize = 1 } = options;
  const profile = TRAINING_PROFILES[method];
  const activationScale = Math.max(0.25, (contextLength / 512) * Math.max(1, batchSize));
  const gb = paramsBillions * profile.bytesPerParam + profile.baseOverheadGB * activationScale;
  return Math.round(gb * 10) / 10;
}

export interface TrainingEvaluation {
  method: TrainingMethod;
  vramGB: number;
  status: ModelStatus;
  grade: Grade;
}

export function evaluateTrainingComplete(
  paramsBillions: number,
  hw: HardwareInfo,
  method: TrainingMethod,
  options: TrainingEstimateOptions = {},
): TrainingEvaluation {
  const vramGB = estimateTrainingVRAM(paramsBillions, method, options);
  const status = evaluateModel(vramGB, hw);
  const memPct = memoryPercentage(vramGB, hw);
  // No token/sec-equivalent metric for training, so speed falls back to the
  // status-based default inside computeScore (same fallback inference uses
  // when toksPerSec is unavailable).
  const score = computeScore(status, null, paramsBillions, memPct);
  const grade = scoreToGrade(score, status);
  return { method, vramGB, status, grade };
}
