export const languages = {
  th: "ไทย",
  en: "English",
} as const;

export type Lang = keyof typeof languages;
export const defaultLang: Lang = "th";

export const ui = {
  th: {
    nav: {
      models: "โมเดลทั้งหมด",
      playground: "Playground",
      compare: "เปรียบเทียบ",
      tier: "อันดับโมเดล",
      docs: "คู่มือ",
      why: "ทำไม",
      blog: "บล็อก",
      openMenu: "เปิดเมนู",
      closeMenu: "ปิดเมนู",
      switchLang: "English",
      // The visible label is just the language name, which a screen reader
      // would announce without saying what the link does.
      switchLangAria: "อ่านหน้านี้เป็นภาษาอังกฤษ",
      updatedPrefix: "อัปเดต",
      justNow: "เมื่อครู่นี้",
      minsAgo: "นาทีที่แล้ว",
      hoursAgo: "ชม.ที่แล้ว",
      daysAgo: "วันที่แล้ว",
    },
    footer: {
      forkNotice: "AiNaiDee สร้างต่อยอดจาก",
      by: "โดย",
      trademarkNotice:
        "ชื่อผลิตภัณฑ์ โลโก้ และแบรนด์ทั้งหมดเป็นทรัพย์สินของเจ้าของแต่ละราย Apple, NVIDIA, AMD, Intel, Qualcomm และชื่อโมเดล AI ทั้งหมดที่กล่าวถึงในเว็บนี้เป็นเครื่องหมายการค้าของเจ้าของนั้นๆ เว็บนี้ไม่มีความเกี่ยวข้องหรือได้รับการรับรองจากบริษัทเหล่านี้แต่อย่างใด",
      dataCreditPrefix: "ข้อมูลอ้างอิงจาก",
      and: "และ",
    },
    home: {
      title: "เครื่องคุณรัน AI ตัวไหนได้บ้าง?",
      subtitle: "ตรวจดูว่าเครื่องของคุณรันโมเดล AI ตัวไหนได้จริง",
    },
    catalog: {
      title: "โมเดล AI ที่รันเองได้",
      subtitle: "ค้นทั้งแคตตาล็อก จัดเกรดตาม GPU, Mac หรือเครื่องที่คุณเลือก",
      metaTitle: "โมเดล AI ที่รันเองได้ทั้งหมด — AiNaiDee",
      metaDescription:
        "แคตตาล็อกโมเดล AI แบบเปิดทั้งหมด กรองตามงาน ผู้พัฒนา และสัญญาอนุญาต พร้อมเกรดตามเครื่องของคุณ",
    },
    picks: {
      code: "รันโมเดลเขียนโค้ดได้ไหม?",
      chat: "รันโมเดลคุยทั่วไปได้ไหม?",
      reasoning: "รันโมเดลคิดวิเคราะห์ได้ไหม?",
      vision: "รันโมเดลดูรูปได้ไหม?",
      seeAll: "ดูทั้งหมด",
      empty: "เครื่องนี้ยังไม่มีตัวไหนรันได้สบายในหมวดนี้",
      browseAll: "ดูแคตตาล็อกทั้งหมด",
      browseAllHint: "อยากกรองเองแบบละเอียด",
    },
    modelList: {
      verdictEyebrow: "จากฮาร์ดแวร์ที่ตรวจพบ",
      verdictOf: "จาก",
      verdictSuffix: "โมเดลรันได้ดี",
      verdictOffloadNote: "รันได้เพิ่ม แต่ต้องใช้ CPU offload — ช้าลงมาก",
      gpuTooltip: "ตรวจจับ GPU ผ่าน API ของเบราว์เซอร์ — เป็นค่าประมาณ สเปกจริงอาจต่างไป",
      gpuAria: "ข้อมูล GPU",
      gpuDetecting: "กำลังตรวจ...",
      vramTooltip: "VRAM — หน่วยความจำการ์ดจอสำหรับโหลดโมเดล บน Apple Silicon/iGPU จะใช้ร่วมกับ RAM ระบบ",
      vramAria: "ข้อมูล VRAM",
      bandwidthTooltip: "GB/s — แบนด์วิดท์หน่วยความจำ ยิ่งสูงยิ่งประมวลผลเร็ว",
      bandwidthAria: "ข้อมูลแบนด์วิดท์",
      sysramTooltip: "RAM ระบบ — ใช้ตอนโมเดลใหญ่เกิน VRAM (CPU offload) ยิ่งมากยิ่งรันโมเดลใหญ่ได้ แต่ช้าลง",
      sysramAria: "ข้อมูล RAM ระบบ",
      sysramTooltipApple: "หน่วยความจำรวม — Apple Silicon ใช้ RAM ร่วมกันระหว่าง CPU และ GPU ไม่มี RAM ระบบแยกสำหรับ offload",
      sysramTooltipOther: "RAM ระบบ — ใช้ตอนโมเดลใหญ่เกิน VRAM (CPU offload) ยิ่งมากยิ่งรันโมเดลใหญ่ได้ แต่ช้าลง",
      gpuCoresTooltip: "จำนวนคอร์ GPU — ยิ่งเยอะยิ่งประมวลผลแบบขนานได้เร็วขึ้น",
      gpuCoresAria: "ข้อมูลคอร์ GPU",
      hwNotice: "ค่าประมาณจาก API ของเบราว์เซอร์ สเปกจริงอาจแตกต่างไป",
      webgpuSupported: "เบราว์เซอร์ของคุณรองรับ WebGPU — ตรวจจับ GPU ได้แม่นยำขึ้นและรันโมเดลในเบราว์เซอร์ได้",
      webgpuUnsupported: "เบราว์เซอร์ของคุณไม่รองรับ WebGPU — การตรวจจับฮาร์ดแวร์อาจไม่แม่นยำ ลองใช้ Chrome หรือ Edge เพื่อผลลัพธ์ที่ดีกว่า",
      gradeWord: "เกรด",
      grades: {
        S: "รันลื่น",
        A: "รันดี",
        B: "พอใช้",
        C: "ตึงๆ",
        D: "แทบไม่ไหว",
        F: "หนักเกินไป",
        unknown: "ไม่ทราบ",
      },
      gradeTooltips: {
        S: "เกรด S — VRAM เหลือเฟือ ประมวลผลเร็ว",
        A: "เกรด A — รันลื่น มีที่ว่างเหลือ",
        B: "เกรด B — พอใช้ ใช้หน่วยความจำเกือบเต็ม",
        C: "เกรด C — พอดีตัว ประมวลผลช้าลง",
        D: "เกรด D — พอรันได้ ช้ามาก",
        F: "เกรด F — หน่วยความจำไม่พอรันโมเดลนี้",
      },
      searchPlaceholder: "ค้นหาโมเดล...",
      filterStatusAll: "ทุกเกรด",
      filterStatusFeatured: "ยอดนิยม",
      filterStatusCanRun: "รันได้ (S/A/B)",
      filterStatusTight: "ตึงๆ (C/D)",
      filterStatusCannotRun: "หนักเกินไป (F)",
      filterUseAll: "ทุกงาน",
      filterProviderAll: "ทุกผู้พัฒนา",
      filterLicenseAll: "ทุกสัญญาอนุญาต",
      filterLicenseCommercial: "ใช้เชิงพาณิชย์ได้",
      filterLicenseNonCommercial: "ห้ามใช้เชิงพาณิชย์",
      sortScore: "เรียง: คะแนน",
      sortParamsAsc: "เรียง: Params ↑",
      sortParamsDesc: "เรียง: Params ↓",
      sortRelease: "เรียง: ใหม่สุด",
      sortContext: "เรียง: Context",
      sortToks: "เรียง: ความเร็ว",
      sortVram: "เรียง: VRAM ↑",
      sortDownloads: "เรียง: ความนิยม",
      yourMachine: "เครื่องของคุณ",
      detectingHardware: "กำลังตรวจฮาร์ดแวร์…",
      rulerHelp2: "แถบที่หยุดก่อนเส้นสีส้มคือรันได้สบาย ส่วนที่ล้ำเส้นออกไปต้องยืม RAM ระบบมาช่วย ซึ่งช้าลงมาก",
      tagTool: "เรียกใช้เครื่องมือได้",
      tagThinking: "คิดวิเคราะห์",
      tagVision: "ดูรูป",
      tagFeatured: "ยอดนิยม",
      allModelsDivider: "โมเดลทั้งหมด",
      noResultsTitle: "ไม่พบโมเดล",
      noResultsBody: "ลองปรับคำค้นหาหรือตัวกรองดูครับ",
      resetFilters: "ล้างตัวกรอง",
      customDevice: "กำหนดเอง",
      capacityUnified: "หน่วยความจำรวม {ram} GB · ใช้ได้จริงราว {usable} GB",
      capacityNoGpu: "ไม่พบการ์ดจอแยก · อาศัย RAM ระบบ {ram} GB",
      capacityDiscrete: "VRAM {usable} GB · RAM ระบบ {ram} GB",
      speedSample:
        "ลองดูสิ! เวลารันโมเดลนี้จริงๆ จะประมาณนี้เลย ข้อความจะไหลออกมาทีละคำแบบเรียลไทม์ ให้เห็นภาพก่อนติดตั้งจริง",
      speedTiers: {
        fast: "เร็วทันใจ",
        smooth: "ลื่น",
        ok: "สบายๆ",
        slow: "ช้า",
        painful: "ทรมาน",
      },
    },
  },
  en: {
    nav: {
      models: "All models",
      playground: "Playground",
      compare: "Compare",
      tier: "Tier List",
      docs: "Docs",
      why: "Why",
      blog: "Blog",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      switchLang: "ไทย",
      switchLangAria: "อ่านหน้านี้เป็นภาษาไทย — read this page in Thai",
      updatedPrefix: "Updated",
      justNow: "just now",
      minsAgo: "min ago",
      hoursAgo: "hr ago",
      daysAgo: "days ago",
    },
    footer: {
      forkNotice: "AiNaiDee, a fork of",
      by: "by",
      trademarkNotice:
        "All product names, logos, and brands are property of their respective owners. Apple, NVIDIA, AMD, Intel, Qualcomm, and all AI model names mentioned on this site are trademarks of their respective owners. This site is not affiliated with or endorsed by any of these companies.",
      dataCreditPrefix: "Data sourced from",
      and: "and",
    },
    home: {
      title: "Which AI can your machine run?",
      subtitle: "Find out which AI models your machine can actually run.",
    },
    catalog: {
      title: "Local AI models you can run",
      subtitle: "Search the full catalog — graded for your GPU, Mac or chosen device.",
      metaTitle: "All local AI models — AiNaiDee",
      metaDescription:
        "The full open model catalog. Filter by task, lab and license, graded against your own machine.",
    },
    picks: {
      code: "Can I run coding models?",
      chat: "Can I run chat models?",
      reasoning: "Can I run reasoning models?",
      vision: "Can I run vision models?",
      seeAll: "See all",
      empty: "Nothing in this category runs comfortably on this machine yet.",
      browseAll: "Browse the full catalog",
      browseAllHint: "Want to filter it yourself",
    },
    modelList: {
      verdictEyebrow: "Based on detected hardware",
      verdictOf: "of",
      verdictSuffix: "models run well",
      verdictOffloadNote: "more run, but need CPU offload — much slower",
      gpuTooltip: "GPU detected via browser APIs — an estimate, real specs may differ",
      gpuAria: "GPU info",
      gpuDetecting: "Detecting...",
      vramTooltip: "VRAM — graphics memory used to load the model. Shared with system RAM on Apple Silicon/iGPUs",
      vramAria: "VRAM info",
      bandwidthTooltip: "GB/s — memory bandwidth. Higher means faster processing",
      bandwidthAria: "Bandwidth info",
      sysramTooltip: "System RAM — used when a model is too big for VRAM (CPU offload). More RAM runs bigger models, but slower",
      sysramAria: "System RAM info",
      sysramTooltipApple: "Unified memory — Apple Silicon shares RAM between CPU and GPU, no separate system RAM for offloading",
      sysramTooltipOther: "System RAM — used for CPU offloading when a model doesn't fit in VRAM. More RAM means bigger models via offloading (slower)",
      gpuCoresTooltip: "GPU core count — more cores means faster parallel processing",
      gpuCoresAria: "GPU cores info",
      hwNotice: "Estimated from browser APIs — real specs may differ",
      webgpuSupported: "Your browser supports WebGPU — more accurate GPU detection and in-browser model inference",
      webgpuUnsupported: "Your browser doesn't support WebGPU — hardware detection may be less accurate. Try Chrome or Edge for better results",
      gradeWord: "Grade",
      grades: {
        S: "Runs great",
        A: "Runs well",
        B: "OK",
        C: "Tight",
        D: "Barely runs",
        F: "Too heavy",
        unknown: "Unknown",
      },
      gradeTooltips: {
        S: "Grade S — plenty of VRAM to spare, fast inference",
        A: "Grade A — runs smoothly with room to spare",
        B: "Grade B — OK, memory nearly full",
        C: "Grade C — tight fit, slower inference",
        D: "Grade D — runs, but very slow",
        F: "Grade F — not enough memory to run this model",
      },
      searchPlaceholder: "Search models...",
      filterStatusAll: "All grades",
      filterStatusFeatured: "Popular",
      filterStatusCanRun: "Runs (S/A/B)",
      filterStatusTight: "Tight (C/D)",
      filterStatusCannotRun: "Too heavy (F)",
      filterUseAll: "All use cases",
      filterProviderAll: "All providers",
      filterLicenseAll: "All licenses",
      filterLicenseCommercial: "Commercial use OK",
      filterLicenseNonCommercial: "No commercial use",
      sortScore: "Sort: Score",
      sortParamsAsc: "Sort: Params ↑",
      sortParamsDesc: "Sort: Params ↓",
      sortRelease: "Sort: Newest",
      sortContext: "Sort: Context",
      sortToks: "Sort: Speed",
      sortVram: "Sort: VRAM ↑",
      sortDownloads: "Sort: Popularity",
      yourMachine: "Your machine",
      detectingHardware: "Detecting hardware…",
      rulerHelp2: "Bars stopping before the orange line run comfortably. Bars crossing it need to borrow system RAM, which is much slower.",
      tagTool: "Can call tools",
      tagThinking: "Reasoning",
      tagVision: "Vision",
      tagFeatured: "Popular",
      allModelsDivider: "All models",
      noResultsTitle: "No models found",
      noResultsBody: "Try adjusting your search or filters.",
      resetFilters: "Clear filters",
      customDevice: "Custom",
      capacityUnified: "Unified memory {ram} GB · ~{usable} GB usable",
      capacityNoGpu: "No discrete GPU detected · falling back to {ram} GB system RAM",
      capacityDiscrete: "VRAM {usable} GB · System RAM {ram} GB",
      speedSample:
        "Sure! Running this model locally feels roughly like this. Each token streams in real time so you can preview the perceived chat experience before installing.",
      speedTiers: {
        fast: "Blazing",
        smooth: "Smooth",
        ok: "Comfortable",
        slow: "Slow",
        painful: "Painful",
      },
    },
  },
} as const;

type Dictionary = (typeof ui)[Lang];

/**
 * Every dotted path in the dictionary that resolves to a string, e.g.
 * "nav.playground" or "modelList.grades.S".
 *
 * `t()` is typed against this rather than plain `string` because a missing key
 * fails silently: the lookup below falls back to returning the key itself, so a
 * typo ships as visible UI text ("modelList.gradeWord" rendered to the user)
 * with no error anywhere. With the union, a typo is a compile error instead.
 * Thai is the source of truth — a key must exist in `th` to be usable.
 */
type StringPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : `${K}.${StringPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = StringPaths<(typeof ui)["th"]>;

function getByPath(obj: unknown, path: string[]): unknown {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function useTranslations(lang: Lang) {
  return function t(key: TranslationKey): string {
    const path = key.split(".");
    const value = getByPath(ui[lang] as Dictionary, path);
    if (typeof value === "string") return value;
    // A key present in Thai but not yet translated falls back rather than
    // rendering blank, so a partially-translated locale still reads sensibly.
    const fallback = getByPath(ui[defaultLang] as Dictionary, path);
    if (typeof fallback === "string") return fallback;
    return key;
  };
}
