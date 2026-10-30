import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { SERVICES } from "../data/services";
import { useLanguage } from "../contexts/LanguageContext";
import { Search, Sparkles, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { Service } from "../types";
import { isValidImageUrl, cn } from "../lib/utils";
import { resolveServiceImage } from "../lib/serviceImages";
import { cacheService } from "../lib/cache";
import ServiceGrid, { GridService } from "./ServiceGrid";
import ServicesByCategory from "./ServicesByCategory";
import { handleFirestoreError, OperationType } from "../lib/utils";
import { useToast } from "../contexts/ToastContext";

export default function ServicesSection() {
  const { language, isRtl } = useLanguage();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const focusSearch = searchParams.get("focusSearch") === "true";

  useEffect(() => {
    if (focusSearch) {
      const input = document.getElementById("service-search-input") as HTMLInputElement;
      if (input) {
        input.focus();
        // Remove the parameter after focus
        setSearchParams(prev => {
          prev.delete("focusSearch");
          return prev;
        }, { replace: true });
      }
    }
  }, [focusSearch, setSearchParams]);

  const setSearch = (val: string) => {
    setSearchParams(prev => {
      if (val) {
        prev.set("search", val);
      } else {
        prev.delete("search");
      }
      return prev;
    });
  };

  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial cached data for instant render from localStorage or durable IndexedDB
    const cached = cacheService.get<Service[]>("db_services");
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setDbServices(cached);
      setLoading(false);
    } else {
      cacheService.getDurableServices().then((durable) => {
        if (durable && Array.isArray(durable) && durable.length > 0) {
          setDbServices(durable);
          setLoading(false);
        }
      });
    }

    // 2. Real-time Firestore sync to guarantee user-added/updated images are reflected immediately
    const unsub = onSnapshot(
      collection(db, "services"),
      (snapshot) => {
        let docs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            nameAr: data.nameAr || data.name,
            suggestedPrice: data.priceMru || data.suggestedPrice || data.price || 0,
          } as Service;
        });

        // Local styling normalization
        docs = docs.map(d => {
          const targetSubKeys = ['tod', 'shahid', 'netflix', 'spotify', 'disney', 'osn', 'bein', 'youtube', 'shahid-vip', 'tod-vip', 'pubg', 'freefire', 'cod-mobile', 'mobilelegends', 'fifa'];
          const isSubscriptionOrGame = targetSubKeys.some(key => d.id.toLowerCase().includes(key)) || (d.category === 'اشتراكات رقمية' || d.category === 'ألعاب' || d.category === 'اشتراكات');
          if (isSubscriptionOrGame) {
            return { ...d, imageFit: 'cover', imagePadding: 0 };
          }
          return d;
        });

        setDbServices(docs);
        cacheService.set("db_services", docs);
        setLoading(false);
      },
      (error) => {
        console.warn("ServicesSection real-time sync error, using fallback:", error);
        handleFirestoreError(error, OperationType.GET, "services");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [language, showToast]);

  const allServices = useMemo(() => {
    const merged: Service[] = [];

    const isDeletedService = (item: any) => {
      if (!item) return false;
      return item.status === 'Deleted' || item.status === 'deleted' || item.isDeleted === true;
    };

    SERVICES.forEach(s => {
      const dbMatching = dbServices.find(dbS => dbS.id === s.id);
      if (dbMatching) {
        if (!isDeletedService(dbMatching)) {
          const { resolvedImage, resolvedImageUrl } = resolveServiceImage(dbMatching, s);

          merged.push({
            ...s,
            ...dbMatching,
            image: resolvedImage,
            imageUrl: resolvedImageUrl,
            priceMru: Number(dbMatching.priceMru ?? dbMatching.price ?? s.suggestedPrice ?? s.minAmount ?? 0),
            imageFit: dbMatching.imageFit || s.imageFit || 'cover',
            imagePadding: dbMatching.imagePadding !== undefined ? Number(dbMatching.imagePadding) : 0,
            status: dbMatching.status || 'نشط',
            fields: s.fields,
            packages: s.packages || [],
            unit: s.unit || dbMatching.unit
          } as Service);
        }
      } else {
        merged.push({
          ...s,
          imageUrl: s.imageUrl || s.image,
          priceMru: Number(s.suggestedPrice || s.minAmount || 0),
          imageFit: s.imageFit || 'cover',
          imagePadding: 0,
          status: 'نشط',
          packages: s.packages || [],
        } as Service);
      }
    });

    dbServices.forEach(dbS => {
      const isDefault = SERVICES.some(s => s.id === dbS.id);
      if (!isDefault) {
        if (!isDeletedService(dbS)) {
          const { resolvedImage, resolvedImageUrl } = resolveServiceImage(dbS);

          merged.push({
            id: dbS.id,
            name: dbS.name || '',
            nameAr: dbS.nameAr || dbS.name || '',
            nameFr: dbS.nameFr || dbS.name || '',
            description: dbS.description || '',
            descriptionAr: dbS.descriptionAr || dbS.description || '',
            descriptionFr: dbS.descriptionFr || dbS.description || '',
            category: dbS.category || 'خدمات رقمية',
            categoryAr: dbS.categoryAr || dbS.category || 'خدمات رقمية',
            categoryFr: dbS.categoryFr || dbS.category || 'Services Numériques',
            pricingMode: dbS.pricingMode || 'fixed',
            requiredFields: dbS.requiredFields || [],
            image: resolvedImage,
            imageUrl: resolvedImageUrl,
            priceMru: Number(dbS.priceMru || dbS.price || 0),
            badge: dbS.badge || 'خدمات رقمية',
            imageFit: dbS.imageFit || 'cover',
            imagePadding: dbS.imagePadding !== undefined ? Number(dbS.imagePadding) : 0,
            status: dbS.status || 'نشط',
            fields: dbS.fields || [],
            packages: dbS.packages || [],
            unit: dbS.unit || '',
            order: dbS.order
          } as Service);
        }
      }
    });

    return merged.sort((a, b) => {
      const orderA = (a.order !== undefined && a.order !== null) ? a.order : 999;
      const orderB = (b.order !== undefined && b.order !== null) ? b.order : 999;
      return orderA - orderB;
    });
  }, [dbServices]);

  const filteredServices = useMemo(() => {
    return allServices.filter((s) => {
      if (s.status === 'مسودة' || s.status === 'Draft' || s.status === 'draft' || s.status === 'متوقف' || s.status === 'متوقفة' || s.status === 'inactive' || s.status === 'غير نشط') {
        return false;
      }
      return s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.nameAr && s.nameAr.toLowerCase().includes(search.toLowerCase())) ||
        (s.nameFr && s.nameFr.toLowerCase().includes(search.toLowerCase()));
    });
  }, [search, allServices]);

  const navigate = useNavigate();

  const selectService = (id: string) => {
    navigate(`/services/${id}`);
  };

  const gridServices = useMemo(() => {
    return filteredServices.map((s) => {
      let mappedCategory = "خدمات رقمية";
      
      const gameIds = ['pubg', 'freefire', 'cod-mobile', 'mobilelegends', 'fifa'];
      const isKnownGame = gameIds.some(id => s.id.toLowerCase().includes(id));

      if (isKnownGame) {
        mappedCategory = "ألعاب";
      } else {
        const cat = (s.category || "").trim();
        const catAr = (s.categoryAr || "").trim();
        const norm = (cat + " " + catAr + " " + (s.name || "") + " " + (s.nameAr || "")).toLowerCase();
        
        if (cat === "games" || cat === "ألعاب" || norm.includes("ألعاب") || norm.includes("العاب") || norm.includes("jeux") || norm.includes("game")) {
          mappedCategory = "ألعاب";
        } else if (cat === "digital_subs" || cat === "اشتراكات رقمية" || norm.includes("اشتراك") || norm.includes("abonnement") || norm.includes("streaming") || norm.includes("tv")) {
          mappedCategory = "اشتراكات رقمية";
        } else if (cat === "gift_cards" || cat === "بطاقات الهدايا" || norm.includes("بطاق") || norm.includes("carte") || norm.includes("gift")) {
          mappedCategory = "بطاقات الهدايا";
        } else {
          mappedCategory = "خدمات رقمية";
        }
      }

      return {
        id: s.id,
        title: language === 'ar' ? (s.nameAr || s.name) : (s.nameFr || s.name),
        titleAr: s.nameAr || s.name,
        titleFr: s.nameFr || s.name,
        imageUrl: s.imageUrl || s.image || "",
        price: s.priceMru || s.suggestedPrice || 0,
        priceMru: s.priceMru || s.suggestedPrice || 0,
        category: mappedCategory,
        status: "active",
        descriptionAr: language === 'ar' ? (s.descriptionAr || s.description) : (s.descriptionFr || s.description || s.descriptionAr || s.description),
        imageFit: s.imageFit || 'cover',
        imagePadding: s.imagePadding || 0,
        pricingMode: s.pricingMode || "fixed",
        quantity: s.quantity !== undefined ? s.quantity : 999,
        order: s.order
      } as any;
    });
  }, [filteredServices, language]);

  return (
    <section id="services" className="w-full px-2 xs:px-3 sm:px-4 py-0 mt-0">
      {/* Improved mobile-first search bar with enhanced visibility and compact spacing */}
      <div className="flex flex-col gap-2 mb-2 sm:mb-3 max-w-2xl mx-auto px-0.5 pt-1">
        <div className="w-full relative group">
          <div className={cn(
            "absolute inset-y-0 flex items-center pointer-events-none text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors z-10",
            isRtl ? "right-3.5" : "left-3.5"
          )}>
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <input
            id="service-search-input"
            type="text"
            placeholder={language === 'ar' ? 'ابحث عن لعبة أو خدمة رقمية...' : 'Rechercher un jeu ou service...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full h-12 sm:h-13 bg-[#111B2E] border border-white/10 rounded-2xl outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 text-white text-xs sm:text-sm font-bold transition-all placeholder:text-slate-400 shadow-sm",
              isRtl ? "pr-10 pl-9" : "pl-10 pr-9"
            )}
            dir={isRtl ? "rtl" : "ltr"}
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-[#0E1626] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors z-10 cursor-pointer text-xs",
                isRtl ? "left-2.5" : "right-2.5"
              )}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <ServicesByCategory services={[]} onOpenService={() => {}} loading={true} />
      ) : filteredServices.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-lg mx-auto"
        >
          <div className="w-24 h-24 bg-primary-main/10 rounded-full flex items-center justify-center mb-8 relative border border-primary-main/20 shadow-[0_0_50px_-12px_rgba(30,202,211,0.3)] group">
            <Search className="w-10 h-10 text-primary-main transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center border-2 border-main-bg">
              <span className="text-[10px] font-black text-white">!</span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-text-primary mb-3 italic tracking-tight">
            {language === 'ar' ? "لم نجد ما تبحث عنه" : "Aucun résultat trouvé"}
          </h3>
          <p className="text-text-secondary text-sm font-bold max-w-sm mb-10 leading-relaxed opacity-80">
            {language === 'ar' 
              ? `عذراً، لم نجد أي خدمة تطابق "${search}". تأكد من الاسم أو اطلبها مباشرة من الدعم.` 
              : `Désolé, aucun service ne correspond à "${search}". Vérifiez l'orthographe ou demandez-nous.`}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <button 
              onClick={() => setSearch("")}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-text-primary border border-border-light font-black rounded-2xl transition-all active:scale-95 text-sm"
            >
              {language === 'ar' ? "مسح البحث" : "Effacer"}
            </button>
            <Link 
              to="/contact" 
              className="w-full sm:w-auto px-8 py-4 bg-primary-main text-slate-950 font-black rounded-2xl transition-all hover:opacity-90 active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-main/20"
            >
              <MessageCircle className="w-4 h-4" />
              {language === 'ar' ? "اطلب الخدمة الآن" : "Commander maintenant"}
            </Link>
          </div>
        </motion.div>
      ) : (
        <ServicesByCategory 
          services={gridServices} 
          onOpenService={(service) => selectService(service.id)} 
        />
      )}
    </section>
  );
}
