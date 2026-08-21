import type { Lang } from "@/i18n/ui";

export const USE_CASE_LABELS = {
  th: {
    chat: "คุยทั่วไป",
    code: "เขียนโค้ด",
    reasoning: "คิดวิเคราะห์",
    vision: "ดูรูป",
    multilingual: "หลายภาษา",
    edge: "เครื่องเล็ก",
    rag: "ค้นเอกสาร",
    image: "สร้างรูป",
    video: "สร้างวิดีโอ",
  },
  en: {
    chat: "Chat",
    code: "Coding",
    reasoning: "Reasoning",
    vision: "Vision",
    multilingual: "Multilingual",
    edge: "Edge",
    rag: "RAG",
    image: "Image",
    video: "Video",
  },
} as const;

export function useCaseLabel(uses: string[], lang: Lang): string {
  const table = USE_CASE_LABELS[lang] as Record<string, string>;
  return uses.map((u) => table[u] ?? u).join(", ");
}
