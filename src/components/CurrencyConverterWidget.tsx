import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calculator, ArrowRightLeft, DollarSign, Coins, X, Info, Sparkles } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

// Exchange Rates relative to 1 Unit of foreign currency in MRU
const DEFAULT_RATES = {
  USD: 39.8,
  USDT: 40.0,
  EUR: 43.2,
};

type CurrencyKey = keyof typeof DEFAULT_RATES;

export default function CurrencyConverterWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { isRtl, language } = useLanguage();

  const [mruAmount, setMruAmount] = useState<string>("1000");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyKey>("USDT");
  const [foreignAmount, setForeignAmount] = useState<string>("");

  const rate = DEFAULT_RATES[selectedCurrency];

  // Recalculate foreign amount when MRU or selected currency changes
  useEffect(() => {
    const num = parseFloat(mruAmount);
    if (!isNaN(num) && num >= 0) {
      setForeignAmount((num / rate).toFixed(2));
    } else {
      setForeignAmount("");
    }
  }, [mruAmount, selectedCurrency, rate]);

  const handleMruChange = (val: string) => {
    setMruAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setForeignAmount((num / rate).toFixed(2));
    } else {
      setForeignAmount("");
    }
  };

  const handleForeignChange = (val: string) => {
    setForeignAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setMruAmount(Math.round(num * rate).toString());
    } else {
      setMruAmount("");
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0E1626] hover:bg-[#121D31] text-white border border-white/10 hover:border-emerald-500/40 text-xs font-bold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
        title="حاسبة تحويل العملات"
      >
        <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Calculator className="w-3.5 h-3.5" strokeWidth={1.6} />
        </div>

        <span className="group-hover:text-emerald-300 transition-colors">
          {language === "ar" ? "حاسبة العملات (MRU ⇄ $)" : "Convertisseur (MRU ⇄ $)"}
        </span>

        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400">
          $
        </span>
      </button>

      {/* Modal Dialog */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] overflow-y-auto p-4 flex items-center justify-center min-h-full bg-[#070B14]/80 backdrop-blur-xs animate-fadeIn">
            <div 
              className="bg-[#0E1626] border border-white/10 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-right relative overflow-hidden my-auto"
              dir={isRtl ? "rtl" : "ltr"}
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Coins className="w-4 h-4" strokeWidth={1.6} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-bold text-white">
                        {language === "ar" ? "حاسبة تحويل العملات" : "Calculateur de devises"}
                      </h3>
                      <Sparkles className="w-3 h-3 text-emerald-400" strokeWidth={1.6} />
                    </div>
                    <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                      {language === "ar" ? "أسعار صرف الأوقية الموريتانية (MRU)" : "Taux de change approximatif (MRU)"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" strokeWidth={1.6} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-3.5 relative z-10">
                
                {/* Currency Selector Label & Rate Indicator */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>{language === "ar" ? "اختر العملة المقابلة:" : "Sélectionner la devise:"}</span>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold">
                    <span>1 {selectedCurrency}</span>
                    <span>=</span>
                    <span className="text-white">{rate} MRU</span>
                  </div>
                </div>

                {/* Segmented Buttons */}
                <div className="grid grid-cols-3 gap-2 bg-[#070B14] p-1 rounded-xl border border-white/5">
                  {(["USDT", "USD", "EUR"] as CurrencyKey[]).map((curr) => {
                    const isSelected = selectedCurrency === curr;
                    return (
                      <button
                        key={curr}
                        onClick={() => setSelectedCurrency(curr)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-xs"
                            : "bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {curr === "USDT" ? <Coins className="w-3.5 h-3.5" strokeWidth={1.6} /> : <DollarSign className="w-3.5 h-3.5" strokeWidth={1.6} />}
                        <span>{curr}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Input 1: MRU */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    {language === "ar" ? "المبلغ بالأوقية الموريتانية (MRU):" : "Montant en MRU:"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={mruAmount}
                      onChange={(e) => handleMruChange(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#070B14] border border-white/10 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none transition-all font-mono"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-[#121D31] border border-white/10 px-2 py-0.5 rounded-lg">
                      MRU
                    </span>
                  </div>
                </div>

                {/* Swap / Reverse Indicator */}
                <div className="flex justify-center my-0.5">
                  <div className="w-7 h-7 rounded-full bg-[#070B14] border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ArrowRightLeft className="w-3 h-3 rotate-90" strokeWidth={1.6} />
                  </div>
                </div>

                {/* Input 2: Foreign Currency */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    {language === "ar" ? `المقابل بـ (${selectedCurrency}):` : `Équivalent en (${selectedCurrency}):`}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={foreignAmount}
                      onChange={(e) => handleForeignChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#070B14] border border-white/10 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm font-bold text-emerald-400 outline-none transition-all font-mono"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                      {selectedCurrency}
                    </span>
                  </div>
                </div>

                {/* Quick Preset Value Chips */}
                <div className="pt-1">
                  <p className="text-[11px] font-bold text-slate-400 mb-1.5">
                    {language === "ar" ? "اختيار سريع للمبالغ الشائعة:" : "Sélection rapide:"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["100", "500", "1000", "2000", "5000", "10000"].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleMruChange(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${
                          mruAmount === preset
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs"
                            : "bg-[#070B14] hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-300 border-white/5 hover:border-emerald-500/30 active:scale-95"
                        }`}
                      >
                        {Number(preset).toLocaleString()} MRU
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explanatory Footer Note */}
                <div className="bg-[#070B14] border border-white/5 p-3 rounded-xl flex items-start gap-2 mt-3">
                  <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.6} />
                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                    {language === "ar"
                      ? "هذه الحاسبة توفر تقديرًا تقريبيًا وفقًا لمتوسط أسعار الصرف الحالية لتسهيل المعاينة قبل الشحن."
                      : "Ce calculateur fournit une estimation selon les taux actuels."}
                  </p>
                </div>

              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
