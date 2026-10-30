import React, { useEffect, useState, useMemo } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { SERVICES } from "../data/services";
import OrderForm from "../components/OrderForm";
import { useLanguage } from "../contexts/LanguageContext";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { Service } from "../types";
import { isValidImageUrl } from "../lib/utils";
import { resolveServiceImage } from "../lib/serviceImages";
import { cacheService } from "../lib/cache";
import { generateDynamicSEOTags } from "../lib/seoUtils";
import { getProductServiceSchema } from "../lib/structuredData";
import PriceGuideSection from "../components/PriceGuideSection";

export default function OrderService() {
  const { id } = useParams();
  const { language, isRtl } = useLanguage();
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const cached = cacheService.get<Service[]>("db_services");
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setDbServices(cached);
      setLoading(false);
    }
    
    const unsub = onSnapshot(
      collection(db, "services"),
      (snapshot) => {
        const docs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            nameAr: data.nameAr || data.name,
            nameFr: data.nameFr || data.name,
            descriptionFr: data.descriptionFr || data.description || '',
            suggestedPrice: data.priceMru || data.suggestedPrice || data.price || 0,
          } as Service;
        });
        setDbServices(docs);
        cacheService.set("db_services", docs);
        setLoading(false);
      },
      (error) => {
        console.error("OrderService sync error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

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
            fields: dbMatching.fields || s.fields,
            packages: dbMatching.packages || s.packages || [],
            unit: s.unit || dbMatching.unit
          } as Service);
        }
      } else {
        merged.push({
          ...s,
          imageUrl: s.imageUrl || s.image || "",
          image: s.image || s.imageUrl || "",
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
            nameFr: dbS.nameFr || dbS.name || '',
            description: dbS.description || '',
            descriptionAr: dbS.descriptionAr || dbS.description || '',
            descriptionFr: dbS.descriptionFr || dbS.description || '',
            image: resolvedImage,
            imageUrl: resolvedImageUrl,
            priceMru: Number(dbS.priceMru || dbS.price || 0),
            badge: dbS.badge || 'خدمات رقمية',
            imageFit: dbS.imageFit || 'cover',
            imagePadding: dbS.imagePadding !== undefined ? Number(dbS.imagePadding) : 0,
            status: dbS.status || 'نشط',
            fields: dbS.fields || [],
            packages: dbS.packages || [],
            unit: dbS.unit || ''
          } as Service);
        }
      }
    });

    return merged;
  }, [dbServices]);

  const service = useMemo(() => {
    return allServices.find(s => s.id === id);
  }, [id, allServices]);
  
  const isAvailable = useMemo(() => {
    if (!service) return false;
    const s = (service.status || '').toLowerCase();
    const isDel = service.isDeleted === true || s === 'deleted' || s === 'محذوف';
    if (isDel) return false;
    return s !== 'مسودة' && s !== 'draft' && s !== 'متوقف' && s !== 'متوقفة' && s !== 'صيانة' && s !== 'maintenance' && s !== 'inactive' && s !== 'غير متوفر';
  }, [service]);
  
  if (loading) {
    return (
      <div className="w-full mt-10">
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="inline-flex items-center gap-2 bg-card-bg px-4 py-2 rounded-xl border border-border-light w-36 h-10 animate-pulse">
          </div>
        </div>
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
           <div className="space-y-8">
             <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 animate-pulse">
                <div className="bg-main-bg rounded-2xl w-24 h-24 md:w-32 md:h-32 flex-shrink-0"></div>
                <div className="flex-1 min-w-0 w-full space-y-4">
                   <div className="h-8 bg-main-bg rounded-lg w-1/2 md:w-1/3"></div>
                   <div className="h-4 bg-main-bg rounded-lg w-3/4 md:w-1/2"></div>
                   <div className="h-4 bg-main-bg rounded-lg w-1/4 md:w-1/6"></div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
                <div className="lg:col-span-8 space-y-8">
                   <div className="glass-card rounded-3xl p-6 h-64"></div>
                   <div className="glass-card rounded-3xl p-6 h-64"></div>
                </div>
                <div className="lg:col-span-4 space-y-8">
                   <div className="glass-card rounded-3xl p-6 h-[400px]"></div>
                </div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return <Navigate to="/#services" replace />;
  }

  const serviceName = language === 'ar' ? (service.nameAr || service.name) : (service.nameFr || service.name);
  const serviceDesc = service.descriptionAr || service.description || (language === 'ar'
    ? `شحن فوري ومباشر لـ ${serviceName} في موريتانيا بأفضل الأسعار عبر بنكيلي ومصرفي وسداد بالأوقية MRU.`
    : `Recharge instantanée de ${serviceName} en Mauritanie par Bankily, Masrvi et Sedad.`);

  if (!isAvailable) {
    return (
      <div className="w-full mt-10" dir={isRtl ? "rtl" : "ltr"}>
        <div className="max-w-7xl mx-auto px-4 mt-6 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary-main hover:opacity-80 font-bold transition-colors bg-card-bg px-4 py-2 rounded-xl border border-border-light"
          >
            {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{language === 'ar' ? 'العودة للرئيسية' : 'Retour à l\'accueil'}</span>
          </Link>
          <PriceGuideSection />
        </div>

        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="glass-card rounded-3xl p-8 border border-amber-500/30 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-amber-400">
              <span className="text-3xl">⚠️</span>
            </div>

            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {language === 'ar' ? 'غير متوفرة حالياً' : 'Actuellement Indisponible'}
              </span>
              <h2 className="text-2xl font-black text-white">
                {serviceName}
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {language === 'ar'
                  ? 'نعتذر لزبنائنا الكرام، استقبال الطلبات لهذه الخدمة متوقف مؤقتاً في الوقت الراهن. يمكنك استكشاف الخدمات الأخرى المتاحة أو التواصل معنا عبر واتساب لمعرفة موعد توفرها.'
                  : 'Nous nous excusons, les commandes pour ce service sont temporairement suspendues.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-white/5">
              <Link
                to="/#services"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg"
              >
                {language === 'ar' ? 'تصفح الخدمات المتوفرة' : 'Voir les services disponibles'}
              </Link>
              <a
                href="https://wa.me/22232014902"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <span>{language === 'ar' ? 'استفسار عبر واتساب (32014902)' : 'Contacter WhatsApp'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-10">
      {generateDynamicSEOTags({
        title: `شحن ${serviceName} في موريتانيا | موري توب`,
        description: serviceDesc,
        keywords: `شحن ${serviceName}, شحن ${service.name} موريتانيا, ${service.name} بنكيلي, ${service.name} مصرفي, شحن ألعاب نواكشوط, MauriTop ${service.name}, MauriPay`,
        image: service.imageUrl || service.image,
        url: `/services/${service.id}`,
        type: "product",
        structuredData: getProductServiceSchema(service)
      })}
      <div className="max-w-7xl mx-auto px-4 mt-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary-main hover:opacity-80 font-bold transition-colors bg-card-bg px-4 py-2 rounded-xl border border-border-light"
        >
          {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{language === 'ar' ? 'العودة للرئيسية' : 'Retour à l\'accueil'}</span>
        </Link>
        <PriceGuideSection />
      </div>
      
      <OrderForm preSelectedServiceId={id} />
    </div>
  );
}
