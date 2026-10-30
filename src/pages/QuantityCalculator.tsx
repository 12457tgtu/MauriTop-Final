import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SERVICES } from "../data/services";
import { Calculator, ArrowLeft, ArrowRight, Sparkles, AlertCircle, ShoppingBag, Coins, Gift, Globe } from "lucide-react";
import { motion } from "motion/react";
import { formatMRU } from "../lib/utils";
import { useLanguage } from "../contexts/LanguageContext";
import { db } from "../lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { cacheService } from "../lib/cache";
import { Service } from "../types";
import SEO from "../components/SEO";

export default function QuantityCalculator() {
  const { t, language, isRtl } = useLanguage();
  const [dbServices, setDbServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const cached = cacheService.get<Service[]>("db_services");
      if (cached) {
        setDbServices(cached);
        return;
      }
      
      const q = query(collection(db, "services"), orderBy("updatedAt", "desc"));
      try {
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            nameAr: data.nameAr || data.name,
            suggestedPrice: data.priceMru || data.price || data.suggestedPrice || 0,
          } as Service;
        });
        setDbServices(docs);
        cacheService.set("db_services", docs);
      } catch (error) {
        console.error("QuantityCalculator fetch error:", error);
      }
    };
    fetchData();
  }, []);

  const allServices = useMemo(() => {
    const merged: Service[] = [];
    const isDeletedService = (item: any) => {
      if (!item) return false;
      return item.status === 'Deleted' || item.status === 'deleted' || item.isDeleted === true || item.status === 'مسودة' || item.status === 'متوقف';
    };

    SERVICES.forEach(s => {
      const dbMatching = dbServices.find(dbS => dbS.id === s.id);
      if (dbMatching) {
        if (!isDeletedService(dbMatching)) {
          merged.push({
            ...s,
            ...dbMatching,
            priceMru: Number(dbMatching.priceMru ?? dbMatching.price ?? s.suggestedPrice ?? s.minAmount ?? 0),
            unitPrice: Number(dbMatching.ratePerUnit || dbMatching.unitPrice || s.unitPrice || 0),
          } as Service);
        }
      } else {
        merged.push({
            ...s,
            priceMru: Number(s.suggestedPrice || s.minAmount || 0),
            unitPrice: s.unitPrice || 0,
        } as Service);
      }
    });

    dbServices.forEach(dbS => {
      const isDefault = SERVICES.some(s => s.id === dbS.id);
      if (!isDefault) {
        if (!isDeletedService(dbS)) {
          merged.push({
            ...dbS,
            priceMru: Number(dbS.priceMru || dbS.price || 0),
            unitPrice: Number(dbS.ratePerUnit || dbS.unitPrice || 0),
            order: dbS.order || 0
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

  const calculableServices = useMemo(() => {
    return allServices.filter(s => s.unitPrice && s.unitPrice > 0 && s.unitLabel);
  }, [allServices]);

  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState<string>("50");

  const [rates] = useState({
    USD: 39.85,
    EUR: 43.12,
    XOF: 0.065
  });
  const [lastUpdated] = useState("اليوم");
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'XOF'>('USD');
  const [foreignAmount, setForeignAmount] = useState<string>("");

  useEffect(() => {
    if (!selectedId && calculableServices.length > 0) {
      setSelectedId(calculableServices[0].id);
    }
  }, [calculableServices, selectedId]);

  const service = useMemo(() => {
    return calculableServices.find((s) => s.id === selectedId) || calculableServices[0] || {
      id: "freefire",
      name: "Free Fire",
      nameAr: "فري فاير",
      unitLabel: "جوهرة",
      unitPrice: 0.45,
      description: "شحن فوري للجواهر بمعرف اللاعب",
      packages: []
    };
  }, [selectedId, calculableServices]);

  const activePackages = useMemo(() => {
    if (service && service.packages && service.packages.length > 0) {
      return service.packages;
    }
    return [];
  }, [service]);

  const { quantity, remaining } = useMemo(() => {
    const amt = Number(amount) || 0;
    if (!service || !service.unitPrice || amt <= 0) return { quantity: 0, remaining: 0 };

    if (activePackages.length > 0) {
      const exactMatch = activePackages.find(p => p.amount === amt);
      if (exactMatch) {
        return { quantity: exactMatch.quantity, remaining: 0 };
      }
    }

    const calculatedQty = Math.floor(amt / service.unitPrice);
    const actualCost = calculatedQty * service.unitPrice;
    const rem = amt - actualCost;
    return { quantity: calculatedQty, remaining: rem > 0 ? rem : 0 };
  }, [amount, service, activePackages]);

  return (
    <div className="min-h-screen bg-[#070B14] pb-24 text-white" dir={isRtl ? "rtl" : "ltr"}>
      <SEO 
        title={language === 'ar' ? "حاسبة شحن الألعاب والخدمات الرقمية | موري توب" : "Calculateur de Recharge Jeux | MauriTop"}
        description={language === 'ar' 
          ? "احسب كمية شحن جواهر فري فاير وشدات ببجي وغيرها بالأوقية الموريتانية MRU فوراً. حاسبة موري توب الذكية تدعم بنكيلي ومصرفي." 
          : "Calculez instantanément vos recharges Free Fire, PUBG et services digitaux en Ouguiya (MRU) avec le calculateur MauriTop."}
        keywords="حاسبة شحن فري فاير, حاسبة شدات ببجي, أسعار الشحن في موريتانيا, تحويل MRU بنكيلي, MauriTop Calc, MauriPay"
      />
      
      {/* Header */}
      <section className="py-10 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.6} />
            <span>{language === 'ar' ? 'حاسبة ذكية وفورية' : 'Calculateur Intelligent'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {t('calc_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-normal leading-relaxed">
            {t('calc_subtitle')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Panel: Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#0E1626] p-5 sm:p-7 rounded-2xl shadow-md border border-white/10 space-y-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" strokeWidth={1.6} />
                <span>{language === 'ar' ? 'خيارات الحساب' : 'Options de calcul'}</span>
              </h2>

              <div className="space-y-4">
                {/* Select Service */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    {t('select_service_calc')}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {calculableServices.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedId === s.id
                            ? "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500/30"
                            : "border-white/10 bg-[#070B14] text-slate-300 hover:border-emerald-500/30"
                        } ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-[#0E1626]">
                          <img src={s.image || ""} alt={s.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">
                            {s.nameAr || s.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {formatMRU(s.unitPrice)} / {s.unitLabel}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-[#070B14] border border-white/5 p-3.5 rounded-xl flex items-start gap-3">
                  <Coins className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.6} />
                  <div className="text-xs">
                    <span className="font-bold block text-slate-300 mb-0.5">
                      {language === 'ar' ? 'معلومات باقة' : 'Infos pack'} {service.nameAr || service.name}:
                    </span>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      {language === 'ar' 
                        ? `سعر الوحدة الواحدة (${service.unitLabel}) هو ` 
                        : `Le prix unitaire (${service.unitLabel}) est `}
                      <strong className="text-emerald-400 font-bold">{formatMRU(service.unitPrice)}</strong>. {service.description}
                    </p>
                  </div>
                </div>

                {/* Preconfigured Packages if available */}
                {activePackages.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      {t('select_package')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {activePackages.map((pkg, idx) => {
                        const isSelected = Number(amount) === pkg.amount;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAmount(pkg.amount.toString())}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-500 border-emerald-500 text-slate-950 font-bold shadow-sm"
                                : "bg-[#070B14] border-white/10 text-slate-300 hover:border-emerald-500/30"
                            }`}
                          >
                            <Gift className={`w-4 h-4 mb-1 ${isSelected ? "text-slate-950" : "text-emerald-400"}`} strokeWidth={1.6} />
                            <span className="font-bold text-xs">{pkg.quantity} {service.unitLabel}</span>
                            <span className={`text-[10px] ${isSelected ? "text-slate-950/80" : "text-emerald-400"} font-medium mt-0.5`}>
                              {formatMRU(pkg.amount)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Enter Amount */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-300">{language === 'ar' ? 'مبلغ الشحن المستهدف' : 'Montant ciblé'}</span>
                    <span className="text-emerald-400 font-bold">{formatMRU(Number(amount || 0))}</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/^0+(?=\d)/, ''))}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#070B14] text-white focus:border-emerald-500 outline-none font-bold text-xl text-center placeholder:text-slate-600"
                    placeholder={language === 'ar' ? 'اكتب المبلغ هنا...' : 'Saisissez le montant ici...'}
                  />

                  {/* Preset buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[100, 500, 1000, 2000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset.toString())}
                        className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          Number(amount) === preset
                            ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-xs"
                            : "bg-[#070B14] border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/30"
                        }`}
                      >
                        {formatMRU(preset)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency Converter Tool */}
                <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.6} />
                      <span>{language === 'ar' ? 'تحويل العملات الصعبة' : 'Convertisseur de devises'}</span>
                    </h3>
                    {lastUpdated && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-[#070B14] px-2 py-0.5 rounded-full border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{language === 'ar' ? `تحديث: ${lastUpdated}` : `Màj: ${lastUpdated}`}</span>
                      </span>
                    )}
                  </div>

                  {/* Currencies Display List */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* USD */}
                    <div className="bg-[#070B14] border border-white/5 p-2.5 rounded-xl text-center space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {language === 'ar' ? 'الدولار ($)' : 'USD ($)'}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 font-mono block">
                        {amount ? (Number(amount) / rates.USD).toFixed(2) : "0.00"} $
                      </span>
                      <span className="text-[9px] text-slate-500 block font-normal">
                        1$ = {rates.USD} MRU
                      </span>
                    </div>

                    {/* EUR */}
                    <div className="bg-[#070B14] border border-white/5 p-2.5 rounded-xl text-center space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {language === 'ar' ? 'اليورو (€)' : 'EUR (€)'}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 font-mono block">
                        {amount ? (Number(amount) / rates.EUR).toFixed(2) : "0.00"} €
                      </span>
                      <span className="text-[9px] text-slate-500 block font-normal">
                        1€ = {rates.EUR} MRU
                      </span>
                    </div>

                    {/* CFA */}
                    <div className="bg-[#070B14] border border-white/5 p-2.5 rounded-xl text-center space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {language === 'ar' ? 'الفرنك الإفريقي' : 'CFA (XOF)'}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 font-mono block">
                        {amount ? Math.round(Number(amount) / rates.XOF).toLocaleString() : "0"} F
                      </span>
                      <span className="text-[9px] text-slate-500 block font-normal">
                        1 MRU = {Math.round(1 / rates.XOF)} F
                      </span>
                    </div>
                  </div>

                  {/* Interactive Quick Calculator */}
                  <div className="bg-[#070B14] border border-white/5 rounded-xl p-3 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      {language === 'ar' ? 'حساب الشحن من العملة الصعبة مباشرة:' : 'Estimer depuis la devise étrangère :'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5">
                        <select
                          value={selectedCurrency}
                          onChange={(e) => {
                            setSelectedCurrency(e.target.value as 'USD' | 'EUR' | 'XOF');
                            setForeignAmount("");
                          }}
                          className="w-full bg-[#0E1626] border border-white/10 rounded-lg px-2.5 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="USD">{language === 'ar' ? 'دولار أمريكي (USD)' : 'USD ($)'}</option>
                          <option value="EUR">{language === 'ar' ? 'يورو (EUR)' : 'EUR (€)'}</option>
                          <option value="XOF">{language === 'ar' ? 'فرنك إفريقي (CFA)' : 'CFA (XOF)'}</option>
                        </select>
                      </div>
                      
                      <div className="sm:col-span-7 relative">
                        <input
                          type="number"
                          placeholder={language === 'ar' ? 'المبلغ بالعملة الصعبة...' : 'Montant étranger...'}
                          value={foreignAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForeignAmount(val);
                            if (val && !isNaN(Number(val))) {
                              const rate = selectedCurrency === 'USD' ? rates.USD : selectedCurrency === 'EUR' ? rates.EUR : rates.XOF;
                              const calculatedMRU = Math.round(Number(val) * rate);
                              setAmount(calculatedMRU.toString());
                            } else {
                              setAmount("");
                            }
                          }}
                          className="w-full bg-[#0E1626] border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-emerald-400 text-center outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Panel: Dynamic Outputs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0E1626] border border-white/10 text-white p-5 sm:p-7 rounded-2xl shadow-md flex flex-col justify-between h-full space-y-6">
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-emerald-400 font-bold mb-1">
                    {language === 'ar' ? 'الكمية المقدرة المكتسبة' : 'Quantité totale estimée'}
                  </p>
                  <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    {(quantity || 0).toLocaleString()} <span className="text-emerald-400 text-xl font-bold font-sans">{service.unitLabel}</span>
                  </h3>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">
                      {language === 'ar' ? 'إجمالي المبلغ المدخل' : 'Montant total d\'entrée'}
                    </span>
                    <span className="text-white font-bold">{formatMRU(Number(amount || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">
                      {language === 'ar' ? 'سعر الكمية الفعلي' : 'Prix net équivalent'}
                    </span>
                    <span className="text-white font-bold">{formatMRU(quantity * (service.unitPrice || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">
                      {language === 'ar' ? 'المبلغ المتبقي' : 'Reste'}
                    </span>
                    <span className="text-amber-400 font-bold">{formatMRU(remaining)}</span>
                  </div>

                  <div className="flex items-start gap-2 bg-[#070B14] border border-white/5 p-3 rounded-xl mt-3">
                    <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.6} />
                    <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                      {t('rate_calc_hint')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Service CTA */}
              <div>
                <Link
                  to={`/services/${service.id}`}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.6} />
                  <span>
                    {language === 'ar' 
                      ? `اطلب شحن ${service.nameAr || service.name} الآن` 
                      : `Recharger ${service.name} maintenant`}
                  </span>
                  {isRtl ? (
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.6} />
                  ) : (
                    <ArrowRight className="w-4 h-4" strokeWidth={1.6} />
                  )}
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
