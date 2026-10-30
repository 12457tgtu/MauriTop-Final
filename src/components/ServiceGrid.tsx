import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Sparkles, Flame, Tv, ShoppingCart } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import OptimizedImage from "./OptimizedImage";

export type GridService = {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  category: string;
  status: "active" | "inactive";
  badge?: string;
  imageFit?: 'cover' | 'contain';
  imagePadding?: number;
  pricingMode?: "fixed" | "custom" | "quote";
  quantity?: number;
  order?: number;
};

type Props = {
  services: GridService[];
  loading?: boolean;
};

// 3 primary categories exactly: اشتراكات رقمية - بطاقات الهدايا - خدمات رقمية
const CATEGORY_META: Record<string, { ar: string; fr: string; icon: any; color: string }> = {

  "اشتراكات رقمية": { 
    ar: "اشتراكات رقمية", 
    fr: "Abonnements Numériques", 
    icon: Tv, 
    color: "text-secondary-main bg-secondary-main/10" 
  },
  "بطاقات الهدايا": { 
    ar: "بطاقات الهدايا", 
    fr: "Cartes Cadeaux", 
    icon: ShoppingCart, 
    color: "text-accent-gold bg-accent-gold/10" 
  },
  "خدمات رقمية": { 
    ar: "خدمات رقمية", 
    fr: "Services Numériques", 
    icon: Sparkles, 
    color: "text-primary-main bg-primary-main/10" 
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
} as const;

export default function ServiceGrid({ services, loading }: Props) {
  const navigate = useNavigate();
  const { language, isRtl } = useLanguage();

  // 1) Filter active services
  const activeServices = useMemo(() => {
    return services.filter((s) => s.status === "active");
  }, [services]);

  // 2) Group services dynamically into original 3 classes
  const servicesByCategory = useMemo(() => {
    const groups: Record<string, GridService[]> = {
      "اشتراكات رقمية": [],
      "بطاقات الهدايا": [],
      "خدمات رقمية": []
    };

    activeServices.forEach((s) => {
      let cat = s.category || "خدمات رقمية";
      if (cat !== "اشتراكات رقمية" && cat !== "بطاقات الهدايا" && cat !== "خدمات رقمية") {
        const norm = cat.toLowerCase();
        if (norm.includes("اشتراك") || norm.includes("abonnement") || norm.includes("netf") || norm.includes("tod") || norm.includes("shahid") || norm.includes("plus") || norm.includes("snapchat")) {
          cat = "اشتراكات رقمية";
        } else if (norm.includes("بطاق") || norm.includes("carte") || norm.includes("cadeau") || norm.includes("gift") || norm.includes("card") || norm.includes("free") || norm.includes("pubg") || norm.includes("play")) {
          cat = "بطاقات الهدايا";
        } else {
          cat = "خدمات رقمية";
        }
      }
      if (groups[cat]) {
        groups[cat].push(s);
      } else {
        groups["خدمات رقمية"].push(s);
      }
    });

    // Sort services in each group by the `order` field
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const orderA = a.order ?? 9999;
        const orderB = b.order ?? 9999;
        return orderA - orderB;
      });
    });

    return groups;
  }, [activeServices]);

  // Filter categories with items
  const categories = useMemo(() => {
    return Object.keys(servicesByCategory).filter(cat => servicesByCategory[cat].length > 0);
  }, [servicesByCategory]);

  const handleScrollToPart = (catName: string) => {
    const el = document.getElementById(`cat-section-${catName}`);
    if (el) {
      const offsetY = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: offsetY, behavior: "auto" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-main-bg py-3 mb-6">
          <div className="max-w-7xl mx-auto flex gap-2 overflow-hidden py-0.5 px-4 sm:px-6 lg:px-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-white/5 shrink-0" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          {[1, 2].map((section) => (
            <section key={section} className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white/5" />
                  <div className="h-4 w-32 bg-white/5 rounded" />
                </div>
                <div className="h-4 w-16 bg-white/5 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 items-stretch">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="overflow-hidden rounded-xl bg-card-bg flex flex-col border border-white/5">
                    <div className="w-full aspect-[4/5] bg-white/5" />
                    <div className="py-4 px-2 flex justify-center bg-card-bg">
                      <div className="h-3 w-20 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (activeServices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      
      <div className="bg-main-bg py-3 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center gap-2 overflow-x-auto scrollbar-none py-0.5 flex-row">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const title = language === "ar" ? (meta?.ar || cat) : (meta?.fr || cat);
            const IconComponent = meta?.icon || Sparkles;

            return (
              <button
                key={cat}
                onClick={() => handleScrollToPart(cat)}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-card-bg/60 border border-border-light text-text-secondary hover:text-primary-main hover:border-primary-main/40 text-xs font-black shrink-0 transition-all duration-300 active:scale-95"
              >
                <IconComponent className="w-4 h-4 text-primary-main transition-transform duration-300 group-hover:scale-110" />
                <span>{title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid displays */}
      <div className="space-y-5">
        {categories.map((cat) => {
          const items = servicesByCategory[cat];
          if (items.length === 0) return null;

          const meta = CATEGORY_META[cat];
          const sectionTitle = language === "ar" ? (meta?.ar || cat) : (meta?.fr || cat);
          const IconComponent = meta?.icon || Sparkles;
          const colorClass = meta?.color || "text-primary-main bg-primary-main/10";

          return (
            <section 
              key={cat} 
              id={`cat-section-${cat}`}
              className="space-y-2 scroll-mt-20"
            >
              <div className="flex items-center gap-4 mb-6 sm:mb-10 select-none" dir={isRtl ? "rtl" : "ltr"}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass.replace('text-', 'bg-').replace('500', '500/10')} border border-border-light`}>
                  {/* Category icon removed as requested */}
                  <div className={`w-2 h-2 rounded-full ${colorClass.replace('text-', 'bg-')}`} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-text-primary tracking-tight uppercase">
                    {sectionTitle}
                  </h2>
                  <div className={`h-1 w-12 rounded-full mt-1 ${colorClass.replace('text-', 'bg-')} opacity-60 border border-border-light`} />
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent opacity-20" />
                <span className="rounded-xl bg-card-bg/80 px-3 py-1 text-[10px] sm:text-xs font-black text-text-secondary ring-1 ring-border-light">
                  {items.length} {language === "ar" ? "خدمات" : "services"}
                </span>
              </div>

              {/* Exact uniform height cards with gap-3.5 (14px) */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-20px" }}
                className="grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 items-stretch"
              >
                {items.map((service, idx) => (
                  <motion.div
                    key={service.id}
                    variants={itemVariants}
                    whileHover={{ 
                      y: -4, 
                      scale: 1.015,
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/services/${service.id}`)}
                    className="group cursor-pointer overflow-hidden rounded-[2.5rem] bg-[#0f172a] flex flex-col border border-white/5 hover:border-cyan-500/30 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10 content-visibility-auto"
                  >
                    
                    <div className="w-full aspect-video relative bg-slate-900 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent z-10 pointer-events-none" />
                      
                      {/* Screenshot-style Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-5 sm:h-6 bg-[#0f172a] rounded-b-2xl z-20 border-x border-b border-white/5" />

                      <OptimizedImage
                        src={service.imageUrl}
                        alt={service.title}
                        fallbackTitle={service.title}
                        fallbackId={service.id}
                        aspectRatio="16/9"
                        loading={idx < 4 ? "eager" : "lazy"}
                        fetchPriority={idx < 4 ? "high" : "auto"}
                        objectFit={service.imageFit === 'contain' ? 'contain' : 'cover'}
                        padding={service.imagePadding || (service.imageFit === 'contain' ? 10 : 0)}
                        className="transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      {/* Sale Badge Style */}
                      {idx % 5 === 0 && (
                        <div className="absolute bottom-3 right-3 z-30">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-full flex flex-col items-center justify-center text-white border-2 border-white/20 rotate-12 group-hover:rotate-0 transition-transform">
                            <span className="text-[8px] sm:text-[9px] font-black leading-none">عرض</span>
                            <span className="text-[8px] sm:text-[9px] font-black leading-none">اليوم</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simple Bottom Title Panel - Bold Dark Block */}
                    <div className="py-4 px-3 text-center flex flex-col justify-center items-center bg-[#111a2e] border-t border-white/5 relative z-20 min-h-[76px] sm:min-h-[88px]" dir={isRtl ? "rtl" : "ltr"}>
                      <h3 className="text-xs sm:text-sm font-black text-text-primary group-hover:text-primary-main transition-colors line-clamp-1 uppercase tracking-wider mb-1">
                        {service.title}
                      </h3>
                      
                      {/* Price Display */}
                      <div className="text-[10px] sm:text-xs font-black text-[#1ECAD3]">
                        {service.pricingMode === "quote" ? (
                          language === "ar" ? "طلب سعر" : "Sur devis"
                        ) : (
                          `${service.price} MRU`
                        )}
                      </div>

                      {/* Stock badge if limited */}
                      {service.quantity !== undefined && service.quantity < 10 && service.quantity > 0 && (
                        <span className="mt-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-500 rounded-full">
                          {service.quantity === 1 ? (
                            language === "ar" ? "خدمة محدودة" : "Service limité"
                          ) : (
                            language === "ar" ? `متبقي ${service.quantity}` : `Reste ${service.quantity}`
                          )}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          );
        })}
      </div>

    </div>
  );
}
