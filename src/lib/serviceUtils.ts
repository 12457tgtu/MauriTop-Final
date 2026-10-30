import type { Service } from "../types";

/**
 * دالة لتوليد واستخراج معرف ثابت (Stable ID) موحد للخدمة
 * تقوم بتنظيف المعرف من أي فروقات في الأحرف الكبيرة أو الصغيرة أو الرموز الزائدة
 * وتطابق الأسماء الشائعة لتجنب تكرار نفس الخدمة بصيغ متعددة
 */
export function getStableServiceId(service: Partial<Service>): string {
  if (!service) return "";

  // 1. تنظيف المعرف الأساسي إن وُجد
  const rawId = (service.id || "").trim().toLowerCase();

  // 2. توحيد المعرفات الشائعة التي قد تتكرر بأكثر من صيغة في قواعد البيانات
  if (rawId === "pubg" || rawId.startsWith("pubg-") || rawId.startsWith("pubg_") || rawId.includes("pubg")) {
    return "pubg";
  }
  if (rawId === "freefire" || rawId === "free-fire" || rawId === "free_fire" || rawId.includes("freefire")) {
    return "freefire";
  }
  if (rawId === "netflix" || rawId.startsWith("netflix-") || rawId.startsWith("netflix_")) {
    return "netflix";
  }
  if (rawId === "shahid" || rawId.startsWith("shahid-") || rawId.startsWith("shahid_") || rawId.includes("shahid")) {
    return "shahid";
  }
  if (rawId === "tod" || rawId.startsWith("tod-") || rawId.startsWith("tod_") || rawId.includes("tod")) {
    return "tod";
  }
  if (rawId === "spotify" || rawId.startsWith("spotify-") || rawId.startsWith("spotify_")) {
    return "spotify";
  }
  if (rawId === "apple" || rawId.startsWith("apple-") || rawId.startsWith("itunes")) {
    return "apple";
  }
  if (rawId === "googleplay" || rawId === "google-play" || rawId === "google_play" || rawId.includes("googleplay")) {
    return "googleplay";
  }
  if (rawId === "playstation" || rawId === "psn" || rawId.startsWith("playstation-") || rawId.startsWith("psn-")) {
    return "playstation";
  }
  if (rawId === "mobilelegends" || rawId === "mobile-legends" || rawId === "mobile_legends") {
    return "mobilelegends";
  }
  if (rawId === "fifa" || rawId.startsWith("ea-sports") || rawId.startsWith("fc-mobile") || rawId.startsWith("fc_mobile")) {
    return "fifa";
  }
  if (rawId === "roblox" || rawId.startsWith("roblox-") || rawId.startsWith("roblox_")) {
    return "roblox";
  }

  // 3. إذا كان المعرف محددًا وواضحًا
  if (rawId) return rawId;

  // 4. استخراج المعرف البديل من الاسم بالإنجليزية أو العربية في حال غياب id
  const nameEn = (service.name || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (nameEn) return nameEn;

  return (service.nameAr || "").trim().replace(/\s+/g, "_").toLowerCase();
}

/**
 * دالة التحقق مما إذا كانت الخدمة بيانات تجريبية قديمة أو محذوفة
 */
export function isTestOrDeletedService(service: Partial<Service>): boolean {
  if (!service) return true;

  // فحص حالة الحذف
  if (
    service.status === "deleted" ||
    service.status === "Deleted" ||
    (service as any).isDeleted === true
  ) {
    return true;
  }

  // فحص الكلمات الدلالية التجريبية (Test Data Filter)
  const testKeywords = [
    "test",
    "demo",
    "sample",
    "fake",
    "temp",
    "تجريب",
    "اختبار",
    "وهمي",
    "مؤقت",
    "تجربة",
  ];

  const idLower = (service.id || "").toLowerCase();
  const nameLower = (service.name || "").toLowerCase();
  const nameAr = service.nameAr || "";
  const nameFr = (service.nameFr || "").toLowerCase();

  const isTestFlag = Boolean((service as any).isTest);

  return (
    isTestFlag ||
    testKeywords.some(
      (kw) =>
        idLower.includes(kw) ||
        nameLower.includes(kw) ||
        nameAr.includes(kw) ||
        nameFr.includes(kw)
    )
  );
}

/**
 * دالة dedupeByStableId:
 * تضمن إزالة أي تكرار للخدمات المعروضة للمستخدم بالاعتماد على معرف فريد ثابت (Stable ID)
 * مع تصفية البيانات التجريبية أو المحذوفة، وترتيب الخدمات بحسب الحقل order المحدد لها
 */
export function dedupeByStableId(services: Service[]): Service[] {
  if (!Array.isArray(services)) return [];

  const seenIds = new Set<string>();
  const deduped: Service[] = [];

  for (const item of services) {
    if (!item) continue;

    // استبعاد الخدمات التجريبية أو المحذوفة
    if (isTestOrDeletedService(item)) {
      continue;
    }

    // استخراج المعرف الفريد الثابت
    const stableId = getStableServiceId(item);
    if (!stableId) continue;

    // منع التكرار
    if (seenIds.has(stableId)) {
      continue;
    }

    seenIds.add(stableId);
    deduped.push(item);
  }

  // ترتيب الخدمات حسب ترتيب العرض order المحدد
  return deduped.sort((a, b) => {
    const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
    const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
    return orderA - orderB;
  });
}

// [MONETIZATION_PLACEHOLDER]: مكان مهيأ لإدراج الخدمات المميزة أو الإعلانات الممولة (Featured / Sponsored / AdMob)
export const MONETIZATION_CONFIG = {
  enableSponsoredSlots: false,
  adMobBannerSlotId: null as string | null,
};
