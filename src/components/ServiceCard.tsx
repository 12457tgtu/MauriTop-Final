import React from 'react';
import { Service } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Clock, Zap, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ServiceCardProps {
  service: Service;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const rawStatus = (service.status || '').toLowerCase();
  const isDeleted = service.status === 'deleted' || service.status === 'Deleted' || service.isDeleted === true;
  const isAvailable = !isDeleted && rawStatus !== 'inactive' && rawStatus !== 'غير متوفر' && rawStatus !== 'متوقف' && rawStatus !== 'صيانة' && rawStatus !== 'draft';

  const minPrice = service.packages && service.packages.length > 0
    ? service.packages.reduce((min, p) => (p.amount < min ? p.amount : min), service.packages[0]?.amount || 0)
    : service.priceMru || service.suggestedPrice || service.minAmount || 0;

  return (
    <div
      onClick={() => navigate(`/services/${service.id}`)}
      className={cn(
        "glass-card group relative p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer rounded-3xl",
        isAvailable 
          ? "hover:border-emerald-500/50 hover:-translate-y-1 active:scale-[0.98]" 
          : "border-amber-500/20 bg-slate-900/40 hover:border-amber-500/40"
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1E2B4B] to-[#151F37] border border-white/10 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
            {service.imageUrl || service.image ? (
              <img 
                src={service.imageUrl || service.image} 
                alt={service.name} 
                className={cn("w-full h-full object-cover", !isAvailable && "grayscale opacity-75")} 
              />
            ) : (
              <Zap className="w-6 h-6 text-emerald-400" />
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            {!isAvailable ? (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {language === 'ar' ? 'غير متوفر حالياً' : 'Indisponible'}
              </span>
            ) : service.badge ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                {service.badge}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{language === 'ar' ? 'فوري' : 'Instantané'}</span>
              </span>
            )}
          </div>
        </div>

        <h3 className={cn(
          "text-lg font-black transition-colors",
          isAvailable ? "text-white group-hover:text-emerald-300" : "text-slate-300"
        )}>
          {language === 'ar' ? (service.nameAr || service.name) : (service.nameFr || service.name)}
        </h3>

        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {language === 'ar' ? (service.descriptionAr || service.description) : (service.descriptionFr || service.description)}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className={cn("text-sm font-black", isAvailable ? "text-emerald-400" : "text-slate-400")}>
          {minPrice} MRU
        </span>
        <span className={cn(
          "text-xs flex items-center gap-1 font-bold",
          isAvailable ? "text-slate-400 group-hover:text-emerald-400" : "text-amber-400/90"
        )}>
          <span>
            {isAvailable 
              ? (language === 'ar' ? 'طلب الخدمة' : 'Commander') 
              : (language === 'ar' ? 'غير متوفر حالياً' : 'Indisponible')}
          </span>
          {isAvailable && (language === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />)}
        </span>
      </div>
    </div>
  );
};

export default ServiceCard;
