import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Zap, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { resolveServiceImage } from "../lib/serviceImages";
import { dedupeByStableId } from "../lib/serviceUtils";
import { cacheService } from "../lib/cache";
import type { Service } from "../types";
import { motion } from "motion/react";
import OptimizedImage from "./OptimizedImage";

export function FeaturedServicesSection() {
  const { language, isRtl } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    // 1. Instant load from cache
    const cached = cacheService.get<Service[]>("featured_services");
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setServices(cached);
    }
    
    // 2. Real-time sync
    const unsub = onSnapshot(
      collection(db, "services"),
      async (snapshot) => {
        const dbServices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        const merged: Service[] = [];
        const { SERVICES } = await import("../data/services");
        
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
                imageFit: dbMatching.imageFit || s.imageFit || 'cover',
                imagePadding: dbMatching.imagePadding !== undefined ? Number(dbMatching.imagePadding) : 0,
                priceMru: Number(dbMatching.priceMru ?? (dbMatching as any).price ?? s.suggestedPrice ?? s.minAmount ?? 0),
                status: dbMatching.status || 'نشط'
              } as Service);
            }
          } else {
            merged.push({ 
              ...s, 
              imageUrl: s.imageUrl || s.image || "",
              image: s.image || s.imageUrl || "",
              status: 'نشط', 
              imageFit: s.imageFit || 'cover', 
              imagePadding: 0 
            });
          }
        });
        
        dbServices.forEach(dbS => {
          if (!SERVICES.some(s => s.id === dbS.id)) {
            if (!isDeletedService(dbS)) {
              const { resolvedImage, resolvedImageUrl } = resolveServiceImage(dbS);
              merged.push({
                ...dbS,
                nameAr: dbS.nameAr || dbS.name,
                image: resolvedImage,
                imageUrl: resolvedImageUrl,
                priceMru: Number(dbS.priceMru || (dbS as any).price || 0),
                imageFit: dbS.imageFit || 'cover',
                imagePadding: dbS.imagePadding !== undefined ? Number(dbS.imagePadding) : 0,
                status: dbS.status || 'نشط'
              } as Service);
            }
          }
        });

        const sortedMerged = merged.sort((a, b) => {
          const orderA = (a.order !== undefined && a.order !== null) ? a.order : 999;
          const orderB = (b.order !== undefined && b.order !== null) ? b.order : 999;
          return orderA - orderB;
        });

        const dedupedFeatured = dedupeByStableId(sortedMerged);
        setServices(dedupedFeatured);
        cacheService.set("featured_services", dedupedFeatured);
      },
      (err) => {
        console.error("FeaturedServices sync error:", err);
      }
    );

    return () => unsub();
  }, []);

  const featuredOnes = services.filter(s => s.status === 'نشط' || s.status === 'active').slice(0, 4);

  if (featuredOnes.length === 0) return null;

  return (
    <section dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className={isRtl ? "text-right" : "text-left"}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Sparkles className="w-4 h-4" strokeWidth={1.6} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {language === 'ar' ? 'الخدمات الأكثر طلباً' : 'Services Populaires'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-xl leading-relaxed">
            {language === 'ar' 
              ? 'اختياراتنا المميزة لأفضل وأسرع خدمات الشحن الرقمي في موريتانيا.' 
              : 'Notre sélection des services les plus demandés en Mauritanie.'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featuredOnes.map((service, index) => {
          const serviceName = language === 'ar' ? (service.nameAr || service.name) : (service.nameFr || service.name);
          const imageUrl = service.imageUrl || service.image || (service as any).image;
          
          return (
            <motion.article
              key={service.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1626] shadow-md hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video w-full bg-[#070B14] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-transparent to-transparent z-10 pointer-events-none" />
                  
                  {imageUrl ? (
                    <OptimizedImage
                      src={imageUrl}
                      alt={serviceName}
                      fallbackTitle={serviceName}
                      fallbackId={service.id}
                      aspectRatio="16/9"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      objectFit={service.imageFit === 'contain' ? 'contain' : 'cover'}
                      padding={service.imagePadding || (service.imageFit === 'contain' ? 8 : 0)}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <Zap size={32} strokeWidth={1.6} />
                    </div>
                  )}
                  
                  {service.badge && (
                    <span className="absolute right-2.5 top-2.5 z-20 rounded-md bg-emerald-950/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                      {service.badge}
                    </span>
                  )}
                </div>

                <div className={`p-4 pt-2 text-white relative z-20 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <h3 className="text-sm font-bold text-white tracking-normal leading-snug line-clamp-1 group-hover:text-emerald-300 transition-colors">
                    {serviceName}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-normal mt-1">
                    {language === 'ar' ? (service.descriptionAr || service.description) : (service.descriptionFr || service.description || service.descriptionAr || service.description)}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-white/5 mt-2 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-normal">
                    {service.pricingMode === 'quote' ? (language === 'ar' ? 'التسعير' : 'Tarif') : (language === 'ar' ? 'يبدأ من' : 'À partir de')}
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {service.pricingMode === 'quote' ? (language === 'ar' ? 'طلب تسعير' : 'Sur devis') : `${service.priceMru || 0} MRU`} 
                  </span>
                </div>
                <Link
                  to={`/services/${service.id}`}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <span>{language === 'ar' ? 'شحن فوري' : 'Recharger'}</span>
                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.6} /> : <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.6} />}
                </Link>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
