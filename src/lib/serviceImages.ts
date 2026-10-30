import { isValidImageUrl } from "./utils";
import freefireImg from "../assets/images/freefire_service_1779283121131.png";
import pubgImg from "../assets/images/pubg_service_1779283143166.png";
import netflixImg from "../assets/images/netflix_service_1779283170112.png";
import snapchatImg from "../assets/images/snapchat_service_1779283197080.png";
import tiktokImg from "../assets/images/tiktok_service_1779283225636.png";
import googleplayImg from "../assets/images/googleplay_service_1779283248304.png";
import { persistentImageCache } from "./persistentImageCache";

export const getFallbackServiceImage = (serviceName: string, serviceId?: string) => {
  // Check if we have a persisted custom image in storage first
  if (serviceId) {
    const persisted = persistentImageCache.getServiceImageSync(serviceId);
    if (persisted && persisted !== "none" && persisted !== "removed") {
      return persisted;
    }
  }

  const name = (serviceName || "").toLowerCase();
  const id = (serviceId || "").toLowerCase();
  
  if (name.includes("snapchat") || name.includes("سناب") || id.includes("snapchat")) {
    return snapchatImg;
  }
  if (name.includes("netflix") || name.includes("نتفليكس") || id.includes("netflix")) {
    return netflixImg;
  }
  if (name.includes("tiktok") || name.includes("تيك") || id.includes("tiktok")) {
    return tiktokImg;
  }
  if (name.includes("free") || name.includes("فري") || name.includes("جواهر") || id.includes("freefire")) {
    return freefireImg;
  }
  if (name.includes("pubg") || name.includes("ببجي") || name.includes("ببج") || name.includes("شدات") || id.includes("pubg")) {
    return pubgImg;
  }
  if (name.includes("google") || name.includes("بلاي") || name.includes("play") || id.includes("googleplay")) {
    return googleplayImg;
  }
  return "";
};

/**
 * Resolves the final image URL for a service document from Firestore merged with a default static service definition.
 * Prioritizes user custom uploaded images from Firestore (imageUrl or image property) and persistent storage over default static images.
 */
export function resolveServiceImage(dbDoc?: any, staticService?: any): { resolvedImageUrl: string; resolvedImage: string } {
  if (!dbDoc) {
    const defaultUrl = staticService?.imageUrl || staticService?.image || "";
    return { resolvedImageUrl: defaultUrl, resolvedImage: defaultUrl };
  }

  // 1. Check if Firestore document has a valid custom image (imageUrl or image)
  const dbImageUrl = typeof dbDoc.imageUrl === "string" ? dbDoc.imageUrl.trim() : "";
  const dbImage = typeof dbDoc.image === "string" ? dbDoc.image.trim() : "";

  const customImage = dbImageUrl || dbImage;

  if (customImage) {
    if (customImage === "none" || customImage === "removed") {
      return { resolvedImageUrl: "", resolvedImage: "" };
    }
    // Save to persistent image cache for offline / network fluctuation resilience
    if (dbDoc.id) {
      persistentImageCache.saveServiceImage(dbDoc.id, customImage);
    }
    // Return custom image directly
    return { resolvedImageUrl: customImage, resolvedImage: customImage };
  }

  // 2. Check if persistent storage has a cached custom image for this service ID
  if (dbDoc.id) {
    const cachedCustom = persistentImageCache.getServiceImageSync(dbDoc.id);
    if (cachedCustom && cachedCustom !== "none" && cachedCustom !== "removed") {
      return { resolvedImageUrl: cachedCustom, resolvedImage: cachedCustom };
    }
  }

  // 3. Fallback to static service default if Firestore document didn't specify any image
  const defaultUrl = staticService?.imageUrl || staticService?.image || "";
  return { resolvedImageUrl: defaultUrl, resolvedImage: defaultUrl };
}
