import React, { useEffect, useMemo, useState } from "react";
import { ImageUploader } from "../components/ImageUploader";
import LoadingSpinner from "../components/LoadingSpinner";
import { ServicesManagerSkeleton } from "../components/Skeleton";
import { db, storage } from "../lib/firebase";
import { SERVICES } from "../data/services";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  getDocs,
  deleteDoc,
  runTransaction,
  writeBatch,
  updateDoc,
  onSnapshot,
  query,
  where,
  limit
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import { uploadFileWithProgress } from "../services/fileUpload";
import { cacheService } from "../lib/cache";
import {
  Plus,
  Trash2,
  Maximize,
  Minimize,
  ChevronRight,
  Check,
  Settings,
  DollarSign,
  Image as ImageIcon,
  Layout,
  Database,
  Search,
  Eye,
  EyeOff,
  Power,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RefreshCw,
  Archive,
  Cloud,
  Code
} from "lucide-react";
import { isValidImageUrl, cn, compressImage } from "../lib/utils";
import type { Service } from "../types";
import { useToast } from "../contexts/ToastContext";
import { getFallbackServiceImage, resolveServiceImage } from "../lib/serviceImages";
import { persistentImageCache } from "../lib/persistentImageCache";

const REQUIRED_FIELD_OPTIONS = [
  { id: "playerId", label: "Player ID", labelAr: "رقم اللاعب" },
  { id: "email", label: "Email", labelAr: "البريد الإلكتروني" },
  { id: "username", label: "Username", labelAr: "اسم المستخدم" },
  { id: "phone", label: "Phone", labelAr: "رقم الهاتف" },
  { id: "amountMru", label: "Amount (MRU)", labelAr: "المبلغ" },
  { id: "cardId", label: "Card ID", labelAr: "رقم البطاقة" },
  { id: "pageLink", label: "Page Link", labelAr: "رابط الصفحة" },
  { id: "profileLink", label: "Profile Link", labelAr: "رابط الحساب" },
  { id: "objective", label: "Objective", labelAr: "هدف الحملة" },
  { id: "budgetMru", label: "Budget (MRU)", labelAr: "الميزانية" },
  { id: "appleIdEmail", label: "Apple ID Email", labelAr: "بريد Apple ID" },
  { id: "note", label: "Note", labelAr: "ملاحظة" },
];

const CATEGORIES = [
  { id: "games", label: "Games", labelAr: "ألعاب", labelFr: "Jeux", aliases: ["games", "ألعاب", "العاب", "Jeux", "jeux"] },
  {
    id: "digital_subs",
    label: "Digital Subscriptions",
    labelAr: "اشتراكات رقمية",
    labelFr: "Abonnements Numériques",
    aliases: ["digital_subs", "اشتراكات رقمية", "الاشتراكات الرقمية", "اشتراكات", "الاشتراكات", "Abonnements Numériques", "abonnements"]
  },
  { id: "gift_cards", label: "Gift Cards", labelAr: "بطاقات الهدايا", labelFr: "Cartes Cadeaux", aliases: ["gift_cards", "بطاقات الهدايا", "البطاقات", "بطاقات", "Cartes Cadeaux", "cartes"] },
  { id: "digital_services", label: "Digital Services", labelAr: "خدمات رقمية", labelFr: "Services Numériques", aliases: ["digital_services", "خدمات رقمية", "الخدمات الرقمية", "خدمات", "الخدمات", "Services Numériques", "services"] },
];

function matchCategory(serviceCat?: string, filterCat?: string): boolean {
  if (!filterCat || filterCat === "all") return true;
  if (!serviceCat) return false;
  
  const cleanCat = serviceCat.trim().toLowerCase();
  const cleanFilter = filterCat.trim().toLowerCase();

  if (cleanCat === cleanFilter) return true;

  const targetCat = CATEGORIES.find(
    (c) => c.id.toLowerCase() === cleanFilter || 
           c.labelAr.toLowerCase() === cleanFilter || 
           c.label.toLowerCase() === cleanFilter
  );

  if (!targetCat) {
    return cleanCat.includes(cleanFilter) || cleanFilter.includes(cleanCat);
  }

  return (
    cleanCat === targetCat.id.toLowerCase() ||
    cleanCat === targetCat.labelAr.toLowerCase() ||
    cleanCat === targetCat.label.toLowerCase() ||
    Boolean(targetCat.aliases?.some((a) => cleanCat.includes(a.toLowerCase()) || a.toLowerCase().includes(cleanCat)))
  );
}

export default function ServicesManager() {
  const { showToast } = useToast();
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [emptySnapshot, setEmptySnapshot] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "pricing" | "fields" | "appearance"
  >("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "active" | "inactive" | "archived" | "deleted">("all");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderCountForService, setOrderCountForService] = useState<number | null>(null);
  const [checkingOrders, setCheckingOrders] = useState(false);

  const [formData, setFormData] = useState<Partial<Service>>({
    name: "",
    nameAr: "",
    nameFr: "",
    descriptionAr: "",
    descriptionFr: "",
    category: "games",
    imageUrl: "",
    pricingMode: "fixed",
    priceMru: 0,
    minAmountMru: 0,
    maxAmountMru: 0,
    allowCustomAmount: false,
    requiredFields: [],
    quantity: 1,
    status: "active",
    badge: "",
    order: 1,
    imageFit: "cover",
    imagePadding: 0,
  });

  useEffect(() => {
    // 1. Initial cached render for fast UI display
    const cached = cacheService.get<Service[]>("db_services_admin");
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setDbServices(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // 2. Real-time Firestore sync
    const unsubscribe = onSnapshot(
      collection(db, "services"),
      (snapshot) => {
        setFetchError(null);
        setEmptySnapshot(snapshot.empty);

        const loaded: Service[] = [];
        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (!data) return;
          // Retain all services including inactive/deleted so the admin can view and restore them
          loaded.push({ id: d.id, ...data } as Service);
        });

        const sorted = loaded.sort((a, b) => (Number(a.order) || 9999) - (Number(b.order) || 9999));
        setDbServices(sorted);
        cacheService.set("db_services_admin", sorted);
        cacheService.set("db_services", sorted);
        setLoading(false);
      },
      (error) => {
        console.error("[ServicesManager] Firestore sync error:", error);
        setFetchError(error.message || String(error));
        showToast("فشل في مزامنة الخدمات مع Firestore", "error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [showToast]);

  // Unified Authoritative Merged Services List:
  // Combines the base code catalog (SERVICES in src/data/services.ts) with Firestore documents
  // Ensures that all services visible to storefront customers appear in the Admin Dashboard,
  // and preserves Firestore edits, statuses, prices, images, and custom services.
  const allServices = useMemo(() => {
    const serviceMap = new Map<string, Service & { isDefaultCatalog?: boolean; hasDbRecord?: boolean }>();

    // 1. First populate all default services from code catalog
    SERVICES.forEach((s) => {
      const { resolvedImage, resolvedImageUrl } = resolveServiceImage(s);
      serviceMap.set(s.id, {
        ...s,
        image: resolvedImage,
        imageUrl: resolvedImageUrl,
        priceMru: Number(s.priceMru ?? s.suggestedPrice ?? s.minAmount ?? 0),
        imageFit: s.imageFit || "cover",
        imagePadding: s.imagePadding ?? 0,
        status: s.status || "active",
        packages: s.packages || [],
        order: s.order ?? 9999,
        isDefaultCatalog: true,
        hasDbRecord: false,
      });
    });

    // 2. Overlay Firestore documents (custom services or customized base services)
    dbServices.forEach((dbS) => {
      const existing = serviceMap.get(dbS.id);
      const { resolvedImage, resolvedImageUrl } = resolveServiceImage(dbS, existing);

      const rawStatus = dbS.status || (dbS.isDeleted ? "deleted" : (existing?.status || "active"));
      const isDeleted = Boolean(dbS.isDeleted || rawStatus === "deleted" || rawStatus === "Deleted");

      serviceMap.set(dbS.id, {
        ...(existing || {}),
        ...dbS,
        image: resolvedImage,
        imageUrl: resolvedImageUrl,
        priceMru: Number(dbS.priceMru ?? (dbS as any).price ?? existing?.priceMru ?? 0),
        imageFit: dbS.imageFit || existing?.imageFit || "cover",
        imagePadding: dbS.imagePadding !== undefined ? Number(dbS.imagePadding) : (existing?.imagePadding || 0),
        status: isDeleted ? "deleted" : rawStatus,
        isDeleted,
        fields: dbS.fields || (existing as any)?.fields || [],
        packages: dbS.packages || existing?.packages || [],
        order: dbS.order !== undefined && dbS.order !== null ? Number(dbS.order) : (existing?.order ?? 9999),
        isDefaultCatalog: Boolean(existing?.isDefaultCatalog),
        hasDbRecord: true,
      });
    });

    return Array.from(serviceMap.values());
  }, [dbServices]);

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    const foundCat = CATEGORIES.find(
      c => c.id === service.category || c.labelAr === service.category || (c.aliases && c.aliases.includes(service.category || ""))
    );
    const normalizedCategory = foundCat ? foundCat.id : (service.category || "games");

    setFormData({
      ...service,
      category: normalizedCategory,
      categoryAr: service.categoryAr || foundCat?.labelAr || "",
      categoryFr: service.categoryFr || foundCat?.label || "",
      priceMru: Number(service.priceMru ?? (service as any).price ?? service.suggestedPrice ?? 0),
      order: service.order ?? 1,
    });
    setIsEditing(true);
    setActiveTab("general");
  };

  const handleCreateNew = () => {
    setSelectedService(null);
    setFormData({
      name: "",
      nameAr: "",
      nameFr: "",
      descriptionAr: "",
      descriptionFr: "",
      category: "games",
      imageUrl: "",
      pricingMode: "fixed",
      priceMru: 0,
      minAmountMru: 0,
      maxAmountMru: 0,
      allowCustomAmount: false,
      requiredFields: [],
      quantity: 1,
      status: "active",
      badge: "",
      order: allServices.length + 1,
      imageFit: "cover",
      imagePadding: 0,
    });
    setIsEditing(true);
    setActiveTab("general");
  };

  const handleImageUpload = async (blob: Blob) => {
    try {
      setUploadProgress(10);
      
      // Convert Blob to Base64
      const rawBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(new Error("File read error"));
        reader.readAsDataURL(blob);
      });
      
      setUploadProgress(40);
      
      // Compress image for optimal size and fast saving
      const compressedBase64 = await compressImage(rawBase64, 600, 600, 0.7);
      
      setFormData(prev => ({ ...prev, imageUrl: compressedBase64, image: compressedBase64 }));
      setUploadProgress(100);
      showToast("تم اختيار الصورة وتحسينها بنجاح (احفظ التغييرات للتطبيق)", "success");
      
      setTimeout(() => setUploadProgress(0), 400);
    } catch (err) {
      console.error("Image upload error:", err);
      showToast("فشل معالجة الصورة: " + (err as Error).message, "error");
      setUploadProgress(0);
    }
  };

  const saveService = async () => {
    console.log("saveService called, formData:", formData);
    if (!formData.nameAr || !formData.nameFr) {
      showToast("يرجى إدخال اسم الخدمة بالعربية والفرنسية", "error");
      return;
    }

    const id = selectedService?.id || doc(collection(db, "services")).id;
    let finalImageUrl = formData.imageUrl !== undefined ? formData.imageUrl : (formData.image !== undefined ? formData.image : "");

    try {
      setLoading(true);

      // If the image is a Base64 string, compress and upload to durable Storage with full progress tracking
      if (finalImageUrl && finalImageUrl.startsWith("data:")) {
        try {
          setUploadProgress(15);
          const compressedBase64 = await compressImage(finalImageUrl, 800, 800, 0.75);
          const imageId = selectedService?.id || id;
          const storagePath = `services/${imageId}_${Date.now()}.webp`;
          
          const uploadedUrl = await uploadFileWithProgress(compressedBase64, storagePath, (percent) => {
            setUploadProgress(percent);
          });

          if (!uploadedUrl) {
            throw new Error("لم يتم استلام رابط التخزين السحابي للصورة");
          }
          finalImageUrl = uploadedUrl;
        } catch (uploadErr: any) {
          console.error("Storage upload error during saveService:", uploadErr);
          throw new Error(`تعذر رفع الصورة إلى التخزين السحابي: ${uploadErr?.message || "خطأ في الشبكة أو أذونات التخزين"}`);
        }
      }

      const maxOrder = allServices.length > 0 ? Math.max(...allServices.map(s => s.order || 0)) : 0;
      const parsedOrder = Number(formData.order);
      const orderVal = (formData.order === undefined || formData.order === null || isNaN(parsedOrder) || parsedOrder <= 0)
        ? maxOrder + 1
        : parsedOrder;

      const finalData = {
        ...formData,
        order: orderVal,
        imageUrl: finalImageUrl,
        image: finalImageUrl,
        id,
        updatedAt: serverTimestamp(),
        createdAt: selectedService
          ? (selectedService as any).createdAt || serverTimestamp()
          : serverTimestamp(),
      };

      // Strip out any undefined values to prevent Firestore payload crashes
      const cleanData: any = {};
      Object.entries(finalData).forEach(([key, val]) => {
        if (val !== undefined) {
          cleanData[key] = val;
        }
      });

      await setDoc(doc(db, "services", id), cleanData, { merge: true });
      
      // Update local state immediately for instant feedback
      setDbServices(prev => {
        const existingIndex = prev.findIndex(s => s.id === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...cleanData, id };
          return updated;
        } else {
          return [{ ...cleanData, id }, ...prev];
        }
      });

      // Persist custom image into durable IndexedDB and Service Worker cache
      if (finalImageUrl) {
        persistentImageCache.saveServiceImage(id, finalImageUrl);
      }

      // Invalidate all related caches to ensure the UI updates instantly everywhere
      cacheService.remove("db_services");
      cacheService.remove("db_services_admin");
      cacheService.remove("featured_services");
      
      showToast(selectedService ? "تم حفظ صورة الخدمة والتعديلات بنجاح" : "تمت إضافة الخدمة بنجاح", "success");
      setIsEditing(false);
      setSelectedService(null);
    } catch (error: any) {
      console.error("Save error:", error);
      showToast(`فشل في الحفظ: ${error.message || "خطأ غير معروف"}`, "error");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const confirmDeleteService = async (permanent: boolean = false) => {
    if (!serviceToDelete) return;
    const id = serviceToDelete.id;
    setIsDeleting(true);
    try {
      const previousRecordUrl = serviceToDelete.imageUrl || serviceToDelete.image;
      if (previousRecordUrl && previousRecordUrl.includes("firebasestorage.googleapis.com")) {
        try {
          const oldImageRef = ref(storage, previousRecordUrl);
          await deleteObject(oldImageRef);
        } catch (e) {
          console.warn("Old image deletion skipped:", e);
        }
      }

      const isBaseDefault = (serviceToDelete as any).isDefaultCatalog;

      if (permanent && !isBaseDefault) {
        // Permanent document deletion from Firestore
        await deleteDoc(doc(db, "services", id));
        showToast(
          `تم حذف خدمة "${serviceToDelete.nameAr || serviceToDelete.name}" نهائياً من قاعدة البيانات`,
          "success"
        );
      } else {
        // Safe archiving: mark as deleted in Firestore to hide from storefront while preserving order history
        await setDoc(
          doc(db, "services", id),
          {
            status: "deleted",
            isDeleted: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        showToast(
          `تمت أرشفة وإخفاء خدمة "${serviceToDelete.nameAr || serviceToDelete.name}" بنجاح`,
          "success"
        );
      }

      // Invalidate all related caches to ensure the UI updates instantly everywhere
      cacheService.remove("db_services");
      cacheService.remove("db_services_admin");
      cacheService.remove("featured_services");

      setServiceToDelete(null);
      setOrderCountForService(null);
    } catch (error: any) {
      console.error("Delete service error:", error);
      showToast(`فشل في حذف الخدمة: ${error.message || "خطأ غير متوقع"}`, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteService = async (service: Service) => {
    setServiceToDelete(service);
    setCheckingOrders(true);
    setOrderCountForService(null);
    try {
      const q1 = query(collection(db, "orders"), where("serviceId", "==", service.id), limit(10));
      const q2 = query(collection(db, "orders"), where("serviceType", "==", service.id), limit(10));
      const q3 = query(collection(db, "orders"), where("serviceType", "==", service.nameAr || service.name), limit(10));

      const [snap1, snap2, snap3] = await Promise.all([
        getDocs(q1).catch(() => ({ size: 0 })),
        getDocs(q2).catch(() => ({ size: 0 })),
        getDocs(q3).catch(() => ({ size: 0 }))
      ]);

      const totalFound = (snap1?.size || 0) + (snap2?.size || 0) + (snap3?.size || 0);
      setOrderCountForService(totalFound);
    } catch (e) {
      console.warn("Could not check orders count (fail-safe mode):", e);
      // Fail-safe protection: if query fails, protect historical data by assuming orders exist
      setOrderCountForService(1);
    } finally {
      setCheckingOrders(false);
    }
  };

  const restoreService = async (service: Service) => {
    try {
      setLoading(true);
      await setDoc(
        doc(db, "services", service.id),
        {
          status: "active",
          isDeleted: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      cacheService.remove("db_services");
      cacheService.remove("db_services_admin");
      cacheService.remove("featured_services");

      showToast(`تمت استعادة خدمة "${service.nameAr || service.name}" وتفعيلها بنجاح`, "success");
    } catch (err: any) {
      console.error("Restore service error:", err);
      showToast(`فشل في استعادة الخدمة: ${err.message || "خطأ غير متوقع"}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const moveService = async (service: Service, direction: 'up' | 'down') => {
    // Find position of the service in the visible list (filteredServices)
    const visibleIdx = filteredServices.findIndex((s) => s.id === service.id);
    if (visibleIdx === -1) return;

    let targetVisibleIdx = direction === 'up' ? visibleIdx - 1 : visibleIdx + 1;
    if (targetVisibleIdx < 0 || targetVisibleIdx >= filteredServices.length) return;

    const targetService = filteredServices[targetVisibleIdx];

    // Find their positions in the full unfiltered services array
    const idx = allServices.findIndex((s) => s.id === service.id);
    const targetIdx = allServices.findIndex((s) => s.id === targetService.id);
    if (idx === -1 || targetIdx === -1) return;

    // Get current order values or assign them based on position
    let currentOrder = (service.order !== undefined && service.order !== null) ? Number(service.order) : (idx + 1);
    let targetOrder = (targetService.order !== undefined && targetService.order !== null) ? Number(targetService.order) : (targetIdx + 1);

    // Swap order values. If they are the same, assign distinct sequential ones
    if (currentOrder === targetOrder) {
      currentOrder = idx + 1;
      targetOrder = targetIdx + 1;
    }

    try {
      const batch = writeBatch(db);
      
      // Use set with merge to support default services not yet initialized in DB
      batch.set(doc(db, 'services', service.id), { order: targetOrder }, { merge: true });
      batch.set(doc(db, 'services', targetService.id), { order: currentOrder }, { merge: true });

      await batch.commit();

      // Invalidate all related caches to ensure the UI updates instantly everywhere
      cacheService.remove("db_services");
      cacheService.remove("db_services_admin");
      cacheService.remove("featured_services");
      
      showToast("تم ترتيب الخدمة بنجاح", "success");
    } catch (error) {
      showToast("فشل في ترتيب الخدمة", "error");
      console.error(error);
    }
  };

  const toggleField = (fieldId: string) => {
    const currentReq = formData.requiredFields || [];
    const currentOpt = formData.optionalFields || [];
    
    if (currentReq.includes(fieldId)) {
      setFormData({
        ...formData,
        requiredFields: currentReq.filter((id) => id !== fieldId),
      });
    } else {
      setFormData({ 
        ...formData, 
        requiredFields: [...currentReq, fieldId],
        optionalFields: currentOpt.filter(id => id !== fieldId) // Remove from optional if adding to required
      });
    }
  };

  const toggleOptionalField = (fieldId: string) => {
    const currentOpt = formData.optionalFields || [];
    const currentReq = formData.requiredFields || [];
    
    if (currentOpt.includes(fieldId)) {
      setFormData({
        ...formData,
        optionalFields: currentOpt.filter((id) => id !== fieldId),
      });
    } else {
      setFormData({ 
        ...formData, 
        optionalFields: [...currentOpt, fieldId],
        requiredFields: currentReq.filter((id) => id !== fieldId) // Remove from required if adding to optional
      });
    }
  };

  const toggleServiceStatus = async (service: Service) => {
    const isSvcActive = (service.status === "active" || service.status === "نشط") && !service.isDeleted;
    const newStatus = isSvcActive ? "inactive" : "active";

    try {
      await setDoc(
        doc(db, "services", service.id),
        {
          status: newStatus,
          isDeleted: false,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      // Instant local state update
      setDbServices(prev => {
        const idx = prev.findIndex(s => s.id === service.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], status: newStatus, isDeleted: false };
          return updated;
        } else {
          return [{ ...service, status: newStatus, isDeleted: false }, ...prev];
        }
      });

      // Invalidate all related caches
      cacheService.remove("db_services");
      cacheService.remove("db_services_admin");
      cacheService.remove("featured_services");

      showToast(
        newStatus === "active" 
          ? `تم تفعيل خدمة "${service.nameAr || service.name}" وإتاحتها للعملاء` 
          : `تم جعل خدمة "${service.nameAr || service.name}" غير متوفرة حالياً`, 
        newStatus === "active" ? "success" : "info"
      );
    } catch (err: any) {
      console.error("Toggle status error:", err);
      showToast("فشل في تعديل حالة الخدمة", "error");
    }
  };

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = allServices.filter((s) => {
      const rawStatus = (s.status || "").toLowerCase();
      const isDel = s.isDeleted || rawStatus === "deleted" || rawStatus === "محذوف";
      const isArchived = !isDel && (rawStatus === "archived" || rawStatus === "مؤرشف");
      const isActive = !isDel && !isArchived && (rawStatus === "active" || rawStatus === "نشط");
      const isInactive = !isDel && !isArchived && !isActive;

      // Status filter
      if (selectedStatusFilter === "active" && !isActive) return false;
      if (selectedStatusFilter === "inactive" && !isInactive) return false;
      if (selectedStatusFilter === "archived" && !isArchived) return false;
      if (selectedStatusFilter === "deleted" && !isDel) return false;
      // In "all" tab, display active, inactive, and archived services, hiding only deleted/suppressed ones
      if (selectedStatusFilter === "all" && isDel) return false;

      // Category filter with alias matching
      if (selectedCategoryFilter !== "all" && !matchCategory(s.category, selectedCategoryFilter)) {
        return false;
      }

      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.nameAr?.toLowerCase().includes(q) ||
        s.nameFr?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.categoryAr?.toLowerCase().includes(q) ||
        s.categoryFr?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q)
      );
    });
    console.log(`[ServicesManager] Filtered services (searchQuery="${searchQuery}", category="${selectedCategoryFilter}", status="${selectedStatusFilter}") count: ${result.length}/${allServices.length}`);
    
    return result.sort((a, b) => {
      const orderA = a.order ?? 9999;
      const orderB = b.order ?? 9999;
      return orderA - orderB;
    });
  }, [allServices, searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            إدارة الخدمات
          </h2>
          <p className="mt-1 text-slate-500 font-bold">
            تحكم كامل في الخدمات والأسعار.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-6 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-cyan-600/10 active:scale-95"
        >
          <Plus size={20} />
          إضافة خدمة جديدة
        </button>
      </div>

      {/* DB Status Indicators */}
      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 animate-in fade-in duration-300">
          <AlertCircle className="shrink-0 mt-0.5 text-red-600" size={18} />
          <div className="text-xs font-bold">
            <p className="font-black">خطأ في جلب البيانات من قاعدة البيانات:</p>
            <p className="mt-1 font-mono">{fetchError}</p>
          </div>
        </div>
      )}

      {emptySnapshot && !fetchError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 animate-in fade-in duration-300">
          <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={18} />
          <div className="text-xs font-bold">
            <p className="font-black">تنبيه: قاعدة البيانات فارغة</p>
            <p className="mt-1">لم يتم العثور على أي مستندات في مجموعة الخدمات (services) على Firestore. سيتم استخدام الإعدادات الافتراضية للخدمات المدمجة فقط.</p>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Top Sticky Header for Service Editing */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="رجوع للقائمة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-800 leading-tight">
                  {selectedService ? `تعديل خدمة: ${formData.nameAr || formData.name}` : "إضافة خدمة جديدة"}
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  قم بتعديل بيانات الخدمة والأسعار والمظهر ثم اضغط حفظ التغييرات.
                </p>
              </div>
            </div>

            {/* Action Buttons in Header */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
              <button
                onClick={() => {
                  console.log("Save button clicked, formData:", formData);
                  saveService();
                }}
                disabled={loading || uploadProgress > 0}
                className={cn(
                  "w-full sm:w-auto px-6 py-3.5 text-white rounded-2xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 order-1 sm:order-2",
                  (loading || uploadProgress > 0)
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95"
                )}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>حفظ التغييرات</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-2xl font-black text-xs border border-slate-200/80 transition-all cursor-pointer shrink-0 order-2 sm:order-1"
              >
                إلغاء التعديل
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          {uploadProgress > 0 && (
            <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-2xl">
              <div className="flex justify-between text-xs font-black text-cyan-700 mb-2">
                <span>جاري معالجة الصورة...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-cyan-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-600 transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Horizontal Scrollable Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-none">
            {[
              { id: "general", label: "المعلومات العامة", icon: Layout },
              { id: "pricing", label: "نظام التسعير", icon: DollarSign },
              { id: "fields", label: "الحقول المطلوبة", icon: Database },
              { id: "appearance", label: "المظهر والصورة", icon: ImageIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-black text-xs whitespace-nowrap cursor-pointer shrink-0",
                  activeTab === tab.id
                    ? "bg-white text-cyan-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form Content Card */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-5 md:p-8 shadow-sm">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      الاسم بالعربية
                    </label>
                    <input
                      type="text"
                      value={formData.nameAr || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nameAr: e.target.value,
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-bold"
                      placeholder="ببجي موبايل - شحن شدات"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      الاسم بالفرنسية/الإنجليزية
                    </label>
                    <input
                      type="text"
                      value={formData.nameFr || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nameFr: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-bold"
                      placeholder="PUBG Mobile UC"
                    />
                  </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        الفئة
                      </label>
                      <select
                        value={formData.category || "games"}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-black select-none"
                      >
                        {CATEGORIES.map((cat) => (
                          <option
                            key={cat.id}
                            value={cat.id}
                            className="bg-white"
                          >
                            {cat.labelAr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        ترتيب الظهور (رقم)
                      </label>
                      <input
                        type="number"
                        value={formData.order ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, order: e.target.value === "" ? "" as any : Number(e.target.value) })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-bold"
                        placeholder="مثال: 1"
                      />
                    </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      الوصف بالعربية
                    </label>
                    <textarea
                      value={formData.descriptionAr || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descriptionAr: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-bold min-h-[120px]"
                      placeholder="وصف مختصر للخدمة..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      الوصف بالفرنسية
                    </label>
                    <textarea
                      value={formData.descriptionFr || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descriptionFr: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-bold min-h-[120px]"
                      placeholder="Description en français..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      الحالة
                    </label>
                    <select
                      value={formData.status || "active"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-black"
                    >
                      <option value="active" className="bg-white">
                        نشط (Active)
                      </option>
                      <option value="inactive" className="bg-white">
                        غير نشط (Inactive)
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      وسم مميز (Badge)
                    </label>
                    <input
                      type="text"
                      value={formData.badge || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, badge: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-bold"
                      placeholder="جديد، عرض محدود..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      مود التسعير (Pricing Mode)
                    </label>
                    <select
                      value={formData.pricingMode || "fixed"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricingMode: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-black"
                    >
                      <option value="fixed" className="bg-white">
                        سعر ثابت (Fixed)
                      </option>
                      <option value="range" className="bg-white">
                        نطاق مبالغ (Range)
                      </option>
                      <option value="custom" className="bg-white">
                        مبلغ حر (Custom)
                      </option>
                      <option value="quote" className="bg-white">
                        طلب عرض سعر (Quote)
                      </option>
                    </select>
                  </div>

                  {(formData.pricingMode === "fixed" ||
                    formData.pricingMode === "custom") && (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        السعر الأساسي (MRU)
                      </label>
                      <input
                        type="number"
                        value={formData.priceMru ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priceMru: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-cyan-600 outline-none focus:border-cyan-500/50 transition-all font-black text-xl"
                      />
                    </div>
                  )}
                </div>

                {formData.pricingMode === "range" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        الحد الأدنى (Min)
                      </label>
                      <input
                        type="number"
                        value={formData.minAmountMru ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minAmountMru: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white rounded-xl px-5 py-3 text-slate-800 border border-slate-200 outline-none focus:border-cyan-500/50 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        الحد الأقصى (Max)
                      </label>
                      <input
                        type="number"
                        value={formData.maxAmountMru ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxAmountMru: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white rounded-xl px-5 py-3 text-slate-800 border border-slate-200 outline-none focus:border-cyan-500/50 font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="p-6 bg-cyan-50 border border-cyan-100 rounded-3xl flex items-start gap-4">
                  <AlertCircle
                    className="text-cyan-600 shrink-0 mt-1"
                    size={20}
                  />
                  <div className="text-sm">
                    <h4 className="text-cyan-700 font-black mb-1 text-right">
                      ملاحظة حول نظام المبالغ:
                    </h4>
                    <p className="text-slate-600 font-bold leading-relaxed text-right">
                      - في حال اختيار "نطاق مبالغ"، سيظهر للمستخدم حقل رقمي بين القيمة الصغرى والكبرى.
                      <br />
                      - في حال "مبلغ حر"، يمكن للمستخدم كتابة أي مبلغ يريده.
                      <br />- "طلب عرض سعر" يخفي المبالغ ويجعلها 0 مؤقتاً لحين مراجعة الإدارة.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "fields" && (
              <div className="space-y-6 text-right">
                <h3 className="text-lg font-black text-slate-800">
                  خيارات إضافية:
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-between">
                    <div className="text-right">
                      <h4 className="font-bold text-cyan-700">تتطلب كود تفعيل (PIN)</h4>
                      <p className="text-[10px] text-slate-500 mt-1">إذا تم التفعيل، سيظهر حقل لإدخال الكود عند اكتمال الطلب وسيعرض للمستخدم.</p>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, requiresCode: !formData.requiresCode })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative shrink-0",
                        formData.requiresCode ? "bg-cyan-600" : "bg-slate-300"
                      )}
                    >
                      <span className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                        formData.requiresCode ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-800 mt-8">
                  اختر الحقول المطلوبة:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {REQUIRED_FIELD_OPTIONS.map((field) => {
                    const isSelected = formData.requiredFields?.includes(
                      field.id,
                    );
                    const isOptional = formData.optionalFields?.includes(
                      field.id,
                    );
                    return (
                      <div key={field.id} className="flex gap-1 relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => toggleField(field.id)}
                          className={cn(
                            "flex-1 flex flex-col items-start px-4 py-3 transition-all text-right",
                            isSelected
                              ? "bg-cyan-100 text-cyan-700 font-black shadow-[inset_2px_0_0_0_#0891b2]"
                              : "text-slate-500 hover:bg-slate-100 font-bold",
                          )}
                        >
                          <span className="text-sm">{field.labelAr} (إجباري)</span>
                          <span className="text-[9px] opacity-60 uppercase">{field.label}</span>
                        </button>
                        
                        <div className="w-[1px] bg-slate-200 my-2"></div>
                        
                        <button
                          type="button"
                          onClick={() => toggleOptionalField(field.id)}
                          className={cn(
                            "flex border-r border-slate-200 flex-col items-center justify-center px-3 py-3 transition-all",
                            isOptional
                              ? "bg-amber-100 text-amber-700 font-black"
                              : "text-slate-400 hover:bg-slate-100 font-bold",
                          )}
                        >
                          <span className="text-[10px] whitespace-nowrap">اختياري</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-8 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <ImageUploader
                      onFileSelected={handleImageUpload}
                      onImageSelected={(base64) =>
                        setFormData((prev) => ({
                          ...prev,
                          imageUrl: base64,
                          image: base64,
                        }))
                      }
                      initialPreview={formData.imageUrl || formData.image}
                      label="تحميل صورة الخدمة"
                      imageFit={formData.imageFit}
                      aspect={16/11}
                    />

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                        أو رابط الصورة المباشر (URL)
                      </label>
                      <input
                        type="url"
                        value={formData.imageUrl || formData.image || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            imageUrl: e.target.value,
                            image: e.target.value,
                          }))
                        }
                        placeholder="https://example.com/image.png"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 font-bold outline-none focus:border-cyan-500/50 transition-all text-left ltr"
                      />
                      {selectedService && SERVICES.some((s) => s.id === selectedService.id) && (
                        <button
                          type="button"
                          onClick={() => {
                            const defaultStatic = SERVICES.find((s) => s.id === selectedService.id);
                            const defaultImg = defaultStatic?.imageUrl || defaultStatic?.image || "";
                            setFormData((prev) => ({
                              ...prev,
                              imageUrl: defaultImg,
                              image: defaultImg,
                            }));
                            showToast("تمت استعادة الصورة الافتراضية للخدمة", "info");
                          }}
                          className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline flex items-center gap-1.5 mt-2"
                        >
                          <RotateCcw size={13} />
                          <span>استعادة الصورة الافتراضية لهذه الخدمة</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        نمط الصورة (Image Fit)
                      </label>
                      <select
                        value={formData.imageFit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            imageFit: e.target.value as any,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-black"
                      >
                        <option value="cover" className="bg-white">
                          غطاء (Cover)
                        </option>
                        <option value="contain" className="bg-white">
                          احتواء (Contain)
                        </option>
                      </select>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <div className="flex justify-between text-xs font-black text-slate-500 mb-2">
                        <span>هامش الصورة:</span>
                        <span className="text-cyan-600">
                          {formData.imagePadding}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="2"
                        value={formData.imagePadding}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            imagePadding: Number(e.target.value),
                          })
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Sticky/Prominent Save Bar for all tabs */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/80 -mx-5 -mb-5 md:-mx-8 md:-mb-8 p-5 md:p-6 rounded-b-[2.5rem]">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-bold">
                <Check size={18} className="text-emerald-600 shrink-0" />
                <span>اضغط "حفظ صورة الخدمة والتغييرات" للتأكيد وتحديث الخدمة فوراً على المنصة.</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl font-black text-xs border border-slate-200 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => saveService()}
                  disabled={loading || uploadProgress > 0}
                  className={cn(
                    "w-full sm:w-auto px-8 py-3.5 text-white rounded-2xl font-black text-xs shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0 active:scale-95",
                    (loading || uploadProgress > 0)
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 ring-2 ring-emerald-500/20"
                  )}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>حفظ صورة الخدمة والتغييرات الآن</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* List Header / Filters */}
          <div className="mb-8 flex flex-col gap-5">
            <div className="relative flex-1 group">
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="ابحث عن اسم الخدمة أو الفئة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-5 py-4 text-slate-800 outline-none focus:border-cyan-500/30 transition-all font-bold placeholder-slate-400 shadow-sm"
              />
            </div>

            {/* Category & Status Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategoryFilter("all")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border cursor-pointer",
                    selectedCategoryFilter === "all"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  جميع الفئات ({allServices.filter(s => !(s.status === "deleted" || s.isDeleted)).length})
                </button>
                {CATEGORIES.map((cat) => {
                  const count = allServices.filter(s => {
                    const isDel = s.status === "deleted" || s.isDeleted;
                    return !isDel && matchCategory(s.category, cat.id);
                  }).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border cursor-pointer",
                        selectedCategoryFilter === cat.id
                          ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {cat.labelAr} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200/60 overflow-x-auto max-w-full">
                <button
                  onClick={() => setSelectedStatusFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap",
                    selectedStatusFilter === "all"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  الكل ({allServices.filter(s => !(s.status === "deleted" || s.isDeleted)).length})
                </button>
                <button
                  onClick={() => setSelectedStatusFilter("active")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                    selectedStatusFilter === "active"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-emerald-700"
                  )}
                >
                  <Eye size={12} />
                  نشط ({allServices.filter(s => (s.status === "active" || s.status === "نشط") && !s.isDeleted).length})
                </button>
                <button
                  onClick={() => setSelectedStatusFilter("inactive")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                    selectedStatusFilter === "inactive"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-amber-700"
                  )}
                >
                  <EyeOff size={12} />
                  مخفي ({allServices.filter(s => s.status !== "active" && s.status !== "نشط" && s.status !== "archived" && s.status !== "مؤرشف" && s.status !== "deleted" && !s.isDeleted).length})
                </button>
                <button
                  onClick={() => setSelectedStatusFilter("archived")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                    selectedStatusFilter === "archived"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-purple-700"
                  )}
                >
                  <Archive size={12} />
                  مؤرشف ({allServices.filter(s => (s.status === "archived" || s.status === "مؤرشف") && !s.isDeleted).length})
                </button>
                <button
                  onClick={() => setSelectedStatusFilter("deleted")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                    selectedStatusFilter === "deleted"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-rose-700"
                  )}
                >
                  <Trash2 size={12} />
                  محذوف ({allServices.filter(s => s.status === "deleted" || s.isDeleted).length})
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <ServicesManagerSkeleton />
          ) : filteredServices.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="text-slate-400" size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800">
                لم يتم العثور على أي خدمات في هذا القسم
              </h3>
              <p className="mt-2 text-xs text-slate-500 font-bold max-w-sm mx-auto">
                يمكنك تغيير الفلاتر الحالية أو إضافة خدمة جديدة إلى المتجر.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSelectedStatusFilter("all");
                    setSelectedCategoryFilter("all");
                    setSearchQuery("");
                  }}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs transition-all cursor-pointer"
                >
                  إعادة ضبط الفلاتر
                </button>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black text-xs transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  إضافة خدمة جديدة
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const catInfo = CATEGORIES.find(c => matchCategory(service.category, c.id));
                const isDel = service.status === "deleted" || service.isDeleted === true;
                const isActive = (service.status === "active" || service.status === "نشط") && !isDel;
                const hasDb = Boolean((service as any).hasDbRecord);

                return (
                  <div
                    key={service.id}
                    className={cn(
                      "bg-white border rounded-[2rem] overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative",
                      isDel
                        ? "border-rose-300 bg-rose-50/10 opacity-75"
                        : isActive
                        ? "border-slate-200"
                        : "border-amber-300/80 bg-amber-50/20"
                    )}
                  >
                    {/* Image Area */}
                    <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden border-b border-slate-100 flex-shrink-0">
                      {/* Data Source Badge (Base Catalog vs Firestore Override vs Custom) */}
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 items-start">
                        {Boolean((service as any).isDefaultCatalog) && !hasDb && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/90 text-purple-300 backdrop-blur-md shadow-sm border border-purple-500/30 flex items-center gap-1">
                            <Code size={10} className="text-purple-400" />
                            القاعدة الأساسية (Catalog)
                          </span>
                        )}
                        {Boolean((service as any).isDefaultCatalog) && hasDb && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/90 text-cyan-300 backdrop-blur-md shadow-sm border border-cyan-500/30 flex items-center gap-1">
                            <Cloud size={10} className="text-cyan-400" />
                            تخصيص السحاب (Override)
                          </span>
                        )}
                        {!Boolean((service as any).isDefaultCatalog) && hasDb && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/90 text-emerald-300 backdrop-blur-md shadow-sm border border-emerald-500/30 flex items-center gap-1">
                            <Database size={10} className="text-emerald-400" />
                            مُضاف لسحاب (Custom)
                          </span>
                        )}
                      </div>

                      {service.imageUrl || service.image ? (
                        <img
                          src={service.imageUrl || service.image!}
                          className={cn(
                            "w-full h-full transition-transform duration-700 group-hover:scale-105",
                            service.imageFit === "contain"
                              ? "object-contain"
                              : "object-cover",
                            (!isActive || isDel) && "grayscale opacity-80"
                          )}
                          style={{ padding: `${service.imagePadding || 0}px` }}
                          alt={service.nameAr}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.dataset.failed) {
                              target.dataset.failed = 'true';
                              target.src = getFallbackServiceImage(service.nameAr || service.name || '', service.id);
                            } else {
                              target.style.display = 'none';
                            }
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <ImageIcon size={40} />
                        </div>
                      )}

                      {/* Status Badges - Clickable Quick Toggle */}
                      <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end z-10">
                        {isDel ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border bg-rose-500/20 text-rose-800 border-rose-500/30 flex items-center gap-1">
                            <Archive size={12} />
                            <span>مؤرشف</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleServiceStatus(service)}
                            title="انقر لتبديل حالة الخدمة (تفعيل/إخفاء)"
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer",
                              isActive
                                ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/30 hover:bg-emerald-100"
                                : "bg-amber-500/10 text-amber-800 border-amber-500/30 hover:bg-amber-100"
                            )}
                          >
                            {isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                            <span>{isActive ? "نشط" : "مخفي"}</span>
                          </button>
                        )}
                        {service.badge && (
                          <span className="px-3 py-1 rounded-full text-[9px] font-black bg-amber-500 text-white shadow-sm">
                            {service.badge}
                          </span>
                        )}
                      </div>

                      {/* Category Label */}
                      <div className="absolute bottom-3 right-3">
                        <span className="px-3 py-1 rounded-xl text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-sm shadow-sm">
                          {catInfo?.labelAr || service.categoryAr || service.category}
                        </span>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="mb-4">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-base font-black text-slate-800 line-clamp-1 leading-tight text-right">
                            {service.nameAr || service.name}
                          </h3>
                          <div className="text-left shrink-0 font-mono">
                            <span className="text-base font-black text-cyan-600">
                              {service.pricingMode === "quote"
                                ? "عقد"
                                : service.priceMru}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold mr-1">
                              MRU
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider text-right">
                          {service.nameFr || service.name}
                        </p>
                        {service.descriptionAr && (
                          <p className="mt-1.5 text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed text-right">
                            {service.descriptionAr}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        {isDel ? (
                          <>
                            <button
                              type="button"
                              onClick={() => restoreService(service)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              <RotateCcw size={14} />
                              <span>استعادة الخدمة</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteService(service)}
                              className="flex items-center justify-center p-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white active:scale-95 rounded-xl transition-all border border-rose-200 cursor-pointer shrink-0"
                              title="حذف نهائي جذرى"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleEdit(service)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-black text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              <Settings size={14} />
                              <span>تعديل</span>
                            </button>

                            {/* Quick Active / Inactive Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleServiceStatus(service)}
                              className={cn(
                                "flex items-center justify-center p-2.5 rounded-xl transition-all border active:scale-95 cursor-pointer shrink-0",
                                isActive 
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-200" 
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-200"
                              )}
                              title={isActive ? "إخفاء الخدمة" : "تفعيل الخدمة"}
                            >
                              {isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>

                            {/* Sort Up */}
                            <button
                              type="button"
                              onClick={() => moveService(service, 'up')}
                              className="flex items-center justify-center p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-95 rounded-xl transition-all border border-slate-200 cursor-pointer shrink-0"
                              title="تحريك للأعلى"
                            >
                              <ArrowUp size={15} />
                            </button>
                            
                            {/* Sort Down */}
                            <button
                              type="button"
                              onClick={() => moveService(service, 'down')}
                              className="flex items-center justify-center p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-95 rounded-xl transition-all border border-slate-200 cursor-pointer shrink-0"
                              title="تحريك للأسفل"
                            >
                              <ArrowDown size={15} />
                            </button>

                            {/* Delete/Archive */}
                            <button
                              type="button"
                              onClick={() => deleteService(service)}
                              className="flex items-center justify-center p-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white active:scale-95 rounded-xl transition-all border border-rose-200 cursor-pointer shrink-0"
                              title="حذف أو أرشفة الخدمة"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-right">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-7 h-7 stroke-[2]" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                إدارة حذف وأرشفة الخدمة
              </h3>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                الخدمة المحددة:{" "}
                <span className="text-rose-600 font-black">
                  "{serviceToDelete.nameAr || serviceToDelete.name}"
                </span>{" "}
                (معرّف: <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{serviceToDelete.id}</code>)
              </p>
            </div>

            {/* Checking Orders Reference Notification */}
            {checkingOrders && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-600" />
                <span>جاري التحقق من سجل الطلبات السابقة...</span>
              </div>
            )}

            {!checkingOrders && orderCountForService !== null && orderCountForService > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
                <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={16} />
                <div>
                  <p className="font-black">تنبيه حماية تاريخ الطلبات والفواتير:</p>
                  <p className="mt-0.5 text-amber-800 leading-relaxed font-medium">
                    يوجد <strong className="font-mono text-amber-950">{orderCountForService}</strong> طلب سليم مسجل بهذا المعرّف. لحماية سلامة بيانات الفواتير السابقة للعملاء، تم حظر الحذف النهائي التدميري. يُفضل اختيار <strong>أرشفة وإخفاء الخدمة</strong> لمنع الشراء الجديد مع الحفاظ الكامل على سجلات النظام.
                  </p>
                </div>
              </div>
            )}

            {(serviceToDelete as any).isDefaultCatalog && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-[11px] text-purple-900 font-bold leading-relaxed">
                💡 هذه الخدمة تنتمي للكتالوج الافتراضي. الأرشفة تسجل إخفاءها في قاعدة البيانات السحابية لمنع ظهورها للعملاء في واجهة المتجر.
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              {/* Option 1: Safe Archive (Recommended) */}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => confirmDeleteService(false)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التنفيذ...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>أرشفة وإخفاء الخدمة (الموصى به)</span>
                  </>
                )}
              </button>

              {/* Option 2: Permanent Delete (Only allowed when no order references exist) */}
              {orderCountForService === 0 && !(serviceToDelete as any).isDefaultCatalog && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => confirmDeleteService(true)}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>حذف نهائي من قاعدة البيانات</span>
                </button>
              )}

              {/* Cancel Button */}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setServiceToDelete(null);
                  setOrderCountForService(null);
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
