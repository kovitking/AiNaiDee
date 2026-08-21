import { describe, expect, it } from "vitest";
import {
  getLineageCurrent,
  getLineageSuccessor,
  isCurrentInLineage,
  models,
  type LineageFields,
} from "@ainaidee/models";

function model(fields: LineageFields): LineageFields {
  return fields;
}

describe("lineage helpers", () => {
  const older = model({
    id: "qwen-old",
    lineage: "qwen-dense-27b",
    releaseDate: "2026-04",
    paramsBillions: 27,
  });
  const newer = model({
    id: "qwen-new",
    lineage: "qwen-dense-27b",
    releaseDate: "2026-08",
    paramsBillions: 27,
  });
  const unique = model({
    id: "one-off",
    releaseDate: "2024-01",
    paramsBillions: 8,
  });

  it("picks the newest releaseDate in a lineage", () => {
    const current = getLineageCurrent([older, newer]);
    expect(current.get("qwen-dense-27b")?.id).toBe("qwen-new");
  });

  it("treats models without lineage as current", () => {
    expect(isCurrentInLineage(unique, [older, newer, unique])).toBe(true);
    expect(getLineageSuccessor(unique, [older, newer, unique])).toBeNull();
  });

  it("returns the successor only for superseded models", () => {
    const catalog = [older, newer];
    expect(isCurrentInLineage(older, catalog)).toBe(false);
    expect(isCurrentInLineage(newer, catalog)).toBe(true);
    expect(getLineageSuccessor(older, catalog)?.id).toBe("qwen-new");
    expect(getLineageSuccessor(newer, catalog)).toBeNull();
  });

  it("breaks ties with params then id", () => {
    const a = model({
      id: "a",
      lineage: "same",
      releaseDate: "2026-01",
      paramsBillions: 10,
    });
    const b = model({
      id: "b",
      lineage: "same",
      releaseDate: "2026-01",
      paramsBillions: 12,
    });
    expect(getLineageCurrent([a, b]).get("same")?.id).toBe("b");
  });
});

describe("catalog lineages", () => {
  // Upstream's own catalog assertions do not apply here: this fork has no
  // GLM-5.3, and it deliberately leaves coder/reasoning variants out of the
  // general-model lineage of the same size (a coding model is a different
  // product slot, not an older generation of the chat model).

  it("keeps only GLM-5.2 current in glm-frontier", () => {
    const glm5 = models.find((m) => m.id === "glm-5");
    const glm51 = models.find((m) => m.id === "glm-5.1");
    const glm52 = models.find((m) => m.id === "glm-5.2");
    expect(glm5 && isCurrentInLineage(glm5, models)).toBe(false);
    expect(glm51 && isCurrentInLineage(glm51, models)).toBe(false);
    expect(glm52 && isCurrentInLineage(glm52, models)).toBe(true);
    expect(glm5 && getLineageSuccessor(glm5, models)?.id).toBe("glm-5.2");
  });

  it("supersedes Qwen 3.5/3.6 27B with Qwen 3.8 27B", () => {
    const q35 = models.find((m) => m.id === "qwen3.5-27b");
    const q36 = models.find((m) => m.id === "qwen3.6-27b");
    const q38 = models.find((m) => m.id === "qwen3.8-27b");
    expect(q35 && isCurrentInLineage(q35, models)).toBe(false);
    expect(q36 && isCurrentInLineage(q36, models)).toBe(false);
    expect(q38 && isCurrentInLineage(q38, models)).toBe(true);
    // 3.6 and 3.8 share a release month, so this rides the id tie-break.
    expect(q36 && getLineageSuccessor(q36, models)?.id).toBe("qwen3.8-27b");
  });

  it("supersedes Typhoon 2 8B with Typhoon 2.1 12B", () => {
    const t2 = models.find((m) => m.id === "typhoon2-8b");
    const t21 = models.find((m) => m.id === "typhoon2.1-12b");
    expect(t2 && isCurrentInLineage(t2, models)).toBe(false);
    expect(t21 && isCurrentInLineage(t21, models)).toBe(true);
    expect(t2 && getLineageSuccessor(t2, models)?.id).toBe("typhoon2.1-12b");
  });

  it("leaves coder variants out of the general lineage", () => {
    const coder = models.find((m) => m.id === "qwen3-coder-30b-a3b");
    expect(coder?.lineage).toBeUndefined();
    expect(coder && isCurrentInLineage(coder, models)).toBe(true);
  });

  it("does not exclude models without a lineage", () => {
    const llama = models.find((m) => m.id === "llama3.1-8b");
    expect(llama?.lineage).toBeUndefined();
    expect(llama && isCurrentInLineage(llama, models)).toBe(true);
  });

  it("every lineage slot resolves to exactly one current model", () => {
    const slots = new Set(models.flatMap((m) => (m.lineage ? [m.lineage] : [])));
    expect(slots.size).toBeGreaterThan(0);
    for (const slot of slots) {
      const members = models.filter((m) => m.lineage === slot);
      expect(members.length).toBeGreaterThan(1);
      expect(members.filter((m) => isCurrentInLineage(m, models))).toHaveLength(1);
    }
  });
});
