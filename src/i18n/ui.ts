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
      // The Thai spelling of the brand has to appear in real copy somewhere:
      // the site was only ever spelled "AiNaiDee" in Latin script, so a search
      // for "AI ไหนดี" had nothing on the page to match. Written unspaced,
      // which is how the query is actually typed.
      subtitle: "AI ไหนดี? ตรวจดูว่าเครื่องของคุณรันโมเดล AI ตัวไหนได้จริง",
      metaTitle: "AiNaiDee (เอไอไหนดี) — เครื่องคุณรัน AI ตัวไหนได้บ้าง?",
      metaDescription:
        "เอไอไหนดี (AiNaiDee) ตรวจฮาร์ดแวร์ของคุณและดูว่ารันโมเดล AI ตัวไหนได้บ้าง วิเคราะห์ GPU, CPU และ RAM ในเบราว์เซอร์",
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
      image: "รันโมเดลสร้างรูปได้ไหม?",
      video: "รันโมเดลสร้างวิดีโอได้ไหม?",
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
    device: {
      backToDevices: "อุปกรณ์ทั้งหมด",
      subtitle: "{device} รันโมเดล AI ตัวไหนได้บ้าง?",
      metaTitle: "{device} — รัน AI ได้ไหม? | AiNaiDee",
      metaDescription:
        "เช็คว่า {device} รันโมเดล AI ตัวไหนได้บ้าง พร้อมข้อมูล VRAM ที่ต้องใช้ ประมาณการความเร็ว และความเข้ากันได้",
      jsonLdDescription: "เช็คว่า {device} รันโมเดล AI ตัวไหนได้บ้างในเครื่อง",
    },
    blog: {
      title: "บล็อก",
      subtitle: "คู่มือและบันทึกเรื่องรัน AI บนเครื่องตัวเอง",
      metaTitle: "บล็อก — AiNaiDee",
      metaDescription:
        "คู่มือและบันทึกเรื่องรัน AI บนเครื่องตัวเอง — ฮาร์ดแวร์ quantization และสิ่งที่ใช้ได้จริง",
      jsonLdName: "บล็อก AiNaiDee",
      notConfiguredPrefix: "บล็อกยังไม่พร้อมใช้งาน — ยังไม่ได้ตั้งค่า",
      notConfiguredAnd: "และ",
      notConfiguredSee: "ดูรายละเอียดที่",
      noPosts: "ยังไม่มีบทความ",
      readTime: "อ่าน {mins} นาที",
      backToBlog: "กลับไปหน้าบล็อก",
      postTitleSuffix: " — บล็อก AiNaiDee",
    },
    license: {
      backToModels: "กลับไปหน้าโมเดล",
      tierOpen: "เปิดกว้าง",
      tierPartial: "มีเงื่อนไข",
      tierRestricted: "จำกัด",
      metaTitle: "สัญญาอนุญาต {license} — AiNaiDee",
      metaDescription:
        "{fullName}: {summary} ดูว่าใช้และห้ามใช้อะไรได้บ้างกับโมเดล AI ที่มีสัญญาอนุญาตแบบ {license}",
      jsonLdHome: "หน้าแรก",
      commercialAllowedTitle: "อนุญาตให้ใช้เชิงพาณิชย์",
      commercialAllowedDesc: "คุณสามารถใช้โมเดลภายใต้สัญญาอนุญาตนี้ในผลิตภัณฑ์และบริการเชิงพาณิชย์ได้",
      commercialRestrictedTitle: "จำกัดการใช้เชิงพาณิชย์",
      commercialRestrictedDesc: "สัญญาอนุญาตนี้ไม่อนุญาตให้ใช้เชิงพาณิชย์แบบไม่จำกัด ตรวจสอบเงื่อนไขด้านล่าง",
      whatYouCanDo: "สิ่งที่ทำได้",
      conditions: "เงื่อนไข",
      whatYouCannotDo: "สิ่งที่ทำไม่ได้",
      noteLabel: "หมายเหตุ",
      readFullLicense: "อ่านสัญญาอนุญาตฉบับเต็ม",
      modelsUsingThisLicense: "โมเดลที่ใช้สัญญาอนุญาตนี้",
      disclaimerPrefix: "นี่คือสรุปแบบย่อเพื่อให้ข้อมูลเท่านั้น ไม่ใช่คำแนะนำทางกฎหมาย ควรอ่าน",
      disclaimerLinkText: "สัญญาอนุญาตฉบับเต็ม",
      disclaimerSuffix: "ก่อนตัดสินใจใช้โมเดลนี้ในโปรเจกต์ของคุณ",
    },
    docs: {
      metaTitle: "คู่มือ — AiNaiDee",
      metaDescription: "เรียนรู้เรื่อง quantization, VRAM, parameters และคำศัพท์อื่นๆ เกี่ยวกับโมเดล AI ที่ใช้ในเว็บนี้",
      jsonLdName: "คู่มือ AiNaiDee — คำศัพท์โมเดล AI",
      heading: "คู่มือ",
      subtitle: "คำศัพท์และแนวคิดสำคัญที่ใช้ในเว็บ AiNaiDee อธิบายแบบเข้าใจง่าย",

      paramsBody: "เวลาเห็นตัวเลขแบบ \"7B\" หรือ \"70B\" นั่นคือจำนวนพารามิเตอร์ (weights) ของโมเดล หน่วยเป็นพันล้าน ยิ่งพารามิเตอร์เยอะ โมเดลก็มักจะฉลาดและมีความสามารถมากขึ้น แต่ก็ต้องใช้หน่วยความจำมากขึ้นและรันช้าลงด้วย โมเดล 7B เหมาะกับงานพื้นฐาน 13B–34B คือจุดสมดุลที่ลงตัว ส่วน 70B ขึ้นไปให้คุณภาพใกล้เคียงระดับ frontier แต่ต้องใช้ฮาร์ดแวร์ที่แรงจริงจัง",
      paramsChartCaption: "ขนาดโมเดล vs ความสามารถ (tradeoff)",

      quantBody: "Quantization คือการลดความละเอียด (precision) ของน้ำหนักโมเดล เพื่อให้ไฟล์เล็กลงและรันเร็วขึ้น แลกกับคุณภาพที่ลดลงบ้าง ชื่อของแต่ละฟอร์แมตจะบอกจำนวนบิตที่ใช้:",
      quantChartCaption: "คุณภาพ vs ขนาดไฟล์ (สำหรับโมเดล 7B)",
      quantTableFormat: "รูปแบบ",
      quantTableBits: "บิต",
      quantTableQuality: "คุณภาพ",
      quantTableNotes: "หมายเหตุ",
      quantQualityLow: "ต่ำ",
      quantQualityGood: "ดี",
      quantQualityVeryGood: "ดีมาก",
      quantQualityExcellent: "ยอดเยี่ยม",
      quantQualityOriginal: "ต้นฉบับ",
      quantNoteQ2K: "ไฟล์เล็กที่สุด แต่คุณภาพลดลงเห็นได้ชัด",
      quantNoteQ4KM: "สมดุลระหว่างขนาดกับคุณภาพดีที่สุด — นิยมใช้มากที่สุด",
      quantNoteQ6K: "แทบไม่เสียคุณภาพ ขนาดไฟล์เพิ่มขึ้นพอประมาณ",
      quantNoteQ8: "คุณภาพแทบไม่ลด แต่ไฟล์ใหญ่ขึ้น",
      quantNoteF16: "ความละเอียดเต็ม ไฟล์ใหญ่ที่สุด",

      vramBody: "VRAM คือหน่วยความจำบนการ์ดจอ (GPU) การจะรันโมเดลได้ ไฟล์ที่ quantized แล้วทั้งไฟล์ต้องใส่ลงใน VRAM ได้พอดี (หรือใน unified memory บน Apple Silicon) ถ้าโมเดลต้องการ VRAM 8 GB แต่การ์ดจอมีแค่ 6 GB มันจะรันไม่ได้ดี — อาจรันไม่ได้เลย หรือต้องถอยไปใช้ CPU inference ซึ่งช้ากว่ามาก",

      moeBody: "โมเดลแบบ Mixture of Experts (MoE) จะแบ่งพารามิเตอร์ออกเป็นกลุ่มที่เรียกว่า \"experts\" ในแต่ละโทเคนจะมีแค่บาง expert ที่ทำงาน — เช่น Mixtral 8x7B มีพารามิเตอร์รวม 46.7B แต่ใช้งานจริงแค่ราว 12.9B ต่อโทเคน นั่นแปลว่าคุณได้คุณภาพระดับโมเดลใหญ่ แต่ความเร็วระดับโมเดลเล็ก ข้อแลกเปลี่ยนคือโมเดลทั้งก้อนยังต้องใส่ลงในหน่วยความจำให้ได้ ถึงแม้ตอนประมวลผลจะใช้แค่บางส่วนก็ตาม",
      moeChartCaption: "การกระจายงานให้ expert ใน MoE (ตัวอย่าง Mixtral)",

      denseVsMoePrefix: "โมเดลแบบ",
      denseVsMoeMiddle: "จะเปิดใช้พารามิเตอร์ทั้งหมดในทุกโทเคน — เห็นเท่าไหร่ก็ได้เท่านั้น ส่วนโมเดลแบบ",
      denseVsMoeSuffix: "มีพารามิเตอร์รวมมากกว่า แต่ใช้แค่บางส่วนต่อโทเคน โมเดลแบบ dense เข้าใจง่ายและคาดเดาเรื่องหน่วยความจำ/ความเร็วได้แม่นยำกว่า ส่วนโมเดลแบบ MoE ให้คุณภาพเกินตัวได้ แต่ต้องใช้ VRAM มากกว่าที่จำนวนพารามิเตอร์ที่ทำงานจริงจะบ่งบอก",

      contextBody: "Context length คือจำนวนโทเคนที่โมเดลประมวลผลได้ในครั้งเดียว — รวมทั้งอินพุตและเอาต์พุต โมเดลที่มี \"context 128K\" จะรับข้อความได้ประมาณ 100,000 คำในการสนทนาเดียว context ที่ยาวขึ้นเหมาะกับการวิเคราะห์เอกสารหรือบทสนทนายาวๆ แต่ใช้หน่วยความจำมากขึ้นด้วย การใช้งานทั่วไปบนเครื่องส่วนตัวส่วนใหญ่ใช้ context แค่ 4K–8K ก็เพียงพอแล้ว",

      toksIntro: "นี่คือความเร็วในการประมวลผล — โมเดลสร้างข้อความได้เร็วแค่ไหน แนวทางคร่าวๆ มีดังนี้:",
      toksFast: "เร็วปรี๊ดเหมือนไม่มีดีเลย์ เหมาะกับการใช้งานแบบโต้ตอบ",
      toksComfortable: "เร็วและลื่นไหล",
      toksUsable: "ใช้งานได้ รอนิดหน่อย",
      toksBatch: "พอใช้ได้กับงานแบบ batch",
      toksPainful: "ทรมานถ้าใช้งานแบบโต้ตอบ",

      ggufPrefix: "GGUF คือฟอร์แมตไฟล์ที่ใช้โดย",
      ggufSuffix: "และเครื่องมืออื่นๆ อย่าง Ollama, LM Studio และ GPT4All มันเก็บน้ำหนักโมเดลที่ quantized แล้วไว้ในไฟล์เดียว พร้อมรันบน CPU หรือ GPU เวลาดาวน์โหลดโมเดลจาก HuggingFace มาใช้บนเครื่อง ปกติแล้วคุณจะมองหาเวอร์ชัน GGUF",

      bandwidthBody: "Memory bandwidth (วัดเป็น GB/s) กำหนดว่าอ่านข้อมูลจาก VRAM ได้เร็วแค่ไหน ระหว่างการประมวลผล คอขวดหลักคือการอ่านน้ำหนักโมเดลจากหน่วยความจำ — ดังนั้นยิ่ง bandwidth สูง ก็ยิ่งได้ tok/s มากขึ้น นี่คือเหตุผลที่ Mac ตระกูล Apple Silicon (ที่มี unified memory bandwidth สูง) รันโมเดลใหญ่ได้ดีอย่างน่าประหลาดใจ และทำไม RTX 4090 ถึงสร้างข้อความได้เร็วกว่า RTX 4060 แม้จะใช้ VRAM เท่ากัน",
      bandwidthChartCaption: "เปรียบเทียบ memory bandwidth (GB/s)",
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
      image: "Can I run image models?",
      video: "Can I run video models?",
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
    device: {
      backToDevices: "all devices",
      subtitle: "Which AI models can your {device} run locally?",
      metaTitle: "{device} — Can it run AI? | AiNaiDee",
      metaDescription:
        "Find out which AI models you can run locally on {device}. VRAM requirements, performance estimates, and compatibility.",
      jsonLdDescription: "Find out which AI models your {device} can run locally.",
    },
    blog: {
      title: "Blog",
      subtitle: "Guides and notes on running AI models locally.",
      metaTitle: "Blog — AiNaiDee",
      metaDescription:
        "Guides and notes on running AI models locally — hardware, quantization, and what actually works.",
      jsonLdName: "AiNaiDee Blog",
      notConfiguredPrefix: "The blog isn't wired up yet —",
      notConfiguredAnd: "and",
      notConfiguredSee: "See",
      noPosts: "No posts yet.",
      readTime: "{mins} min read",
      backToBlog: "back to blog",
      postTitleSuffix: " — AiNaiDee Blog",
    },
    license: {
      backToModels: "Back to models",
      tierOpen: "Open",
      tierPartial: "Partial",
      tierRestricted: "Restricted",
      metaTitle: "{license} License — AiNaiDee",
      metaDescription:
        "{fullName}: {summary} See what you can and can't do with {license}-licensed AI models.",
      jsonLdHome: "Home",
      commercialAllowedTitle: "Commercial use allowed",
      commercialAllowedDesc: "You can use models under this license in commercial products and services.",
      commercialRestrictedTitle: "Commercial use restricted",
      commercialRestrictedDesc: "This license does not allow unrestricted commercial use. Check the conditions below.",
      whatYouCanDo: "What you can do",
      conditions: "Conditions",
      whatYouCannotDo: "What you cannot do",
      noteLabel: "NOTE",
      readFullLicense: "Read the full license text",
      modelsUsingThisLicense: "Models using this license",
      disclaimerPrefix: "This is a simplified summary for informational purposes only. It is not legal advice. Always read the",
      disclaimerLinkText: "full license text",
      disclaimerSuffix: "before making decisions about using a model in your project.",
    },
    docs: {
      metaTitle: "Docs — AiNaiDee",
      metaDescription: "Learn about quantization, VRAM, parameters, and other AI model terminology used on AiNaiDee.",
      jsonLdName: "AiNaiDee Docs — AI Model Terminology",
      heading: "Docs",
      subtitle: "Key terms and concepts used on AiNaiDee, explained simply.",

      paramsBody: "When you see \"7B\" or \"70B\", that's the number of parameters (weights) in the model — in billions. More parameters generally means the model is smarter and more capable, but also needs more memory and is slower to run. A 7B model is great for basic tasks, 13B–34B is a solid sweet spot, and 70B+ delivers near-frontier quality but needs serious hardware.",
      paramsChartCaption: "Size vs capability tradeoff",

      quantBody: "Quantization reduces the precision of a model's weights to make it smaller and faster, at the cost of some quality. The names tell you the bit-width:",
      quantChartCaption: "Quality vs size (for a 7B model)",
      quantTableFormat: "Format",
      quantTableBits: "Bits",
      quantTableQuality: "Quality",
      quantTableNotes: "Notes",
      quantQualityLow: "Low",
      quantQualityGood: "Good",
      quantQualityVeryGood: "Very good",
      quantQualityExcellent: "Excellent",
      quantQualityOriginal: "Original",
      quantNoteQ2K: "Smallest size, noticeable quality loss",
      quantNoteQ4KM: "Best balance of size and quality — most popular",
      quantNoteQ6K: "Near-lossless, moderate size increase",
      quantNoteQ8: "Minimal quality loss, larger file",
      quantNoteF16: "Full precision, largest size",

      vramBody: "VRAM is the memory on your GPU. To run a model, the entire quantized file needs to fit in VRAM (or in unified memory on Apple Silicon). If a model needs 8 GB of VRAM and your GPU has 6 GB, it won't run well — it'll either fail or fall back to much slower CPU inference.",

      moeBody: "A Mixture of Experts model splits its parameters into groups called \"experts.\" On each token, only a few experts are active — for example, Mixtral 8x7B has 46.7B total parameters but only activates ~12.9B per token. This means you get the quality of a larger model with the speed of a smaller one. The tradeoff: the full model still needs to fit in memory, even though only part of it runs at inference time.",
      moeChartCaption: "MoE expert routing (Mixtral example)",

      denseVsMoePrefix: "A",
      denseVsMoeMiddle: "model activates all its parameters for every token — what you see is what you get. A",
      denseVsMoeSuffix: "model has more total parameters but only uses a subset per token. Dense models are simpler and more predictable in terms of memory/speed. MoE models can punch above their weight in quality but need more VRAM than their active parameter count suggests.",

      contextBody: "Context length is how many tokens the model can process at once — input and output combined. A \"128K context\" model can handle roughly 100,000 words in a single conversation. Longer context is great for analyzing documents or long conversations, but uses more memory. Most local usage works fine with 4K–8K context.",

      toksIntro: "This is the inference speed — how fast the model generates text. A rough guide:",
      toksFast: "Instant feel, great for interactive use",
      toksComfortable: "Fast and comfortable",
      toksUsable: "Usable, slight wait",
      toksBatch: "Workable for batch tasks",
      toksPainful: "Painful for interactive use",

      ggufPrefix: "GGUF is the file format used by",
      ggufSuffix: "and tools like Ollama, LM Studio, and GPT4All. It stores quantized model weights in a single file that's ready to run on CPU or GPU. When you download a model from HuggingFace for local use, you're usually looking for the GGUF version.",

      bandwidthBody: "Memory bandwidth (measured in GB/s) determines how fast data can be read from VRAM. During inference, the bottleneck is reading model weights from memory — so higher bandwidth means more tokens per second. This is why Apple Silicon Macs (with high unified memory bandwidth) can run larger models surprisingly well, and why an RTX 4090 generates text faster than an RTX 4060 even at the same VRAM usage.",
      bandwidthChartCaption: "Memory bandwidth comparison (GB/s)",
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
