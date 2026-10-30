import React from "react";
import { CheckCircle2, Copy, ShieldCheck, PhoneCall, Wallet, UserCheck, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

// Bank logos
import sadadLogoImg from "../assets/images/sadad_real_logo_1779370189416.png";
import bankilyLogoImg from "../assets/images/bankily_real_logo_1779370169060.png";

interface PaymentMethodCardProps {
  paymentMethod: "bankily" | "sadad" | string;
  amount: number | string;
  language: string;
  copied: boolean;
  onCopy: () => void;
  accountNumber?: string;
  accountHolder?: string;
  serviceTitle?: string;
  serviceImage?: string;
  serviceCategory?: string;
  isAvailable?: boolean;
  unavailableReason?: string;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethod,
  amount,
  language,
  copied,
  onCopy,
  accountNumber,
  accountHolder,
  serviceTitle,
  isAvailable = true,
  unavailableReason,
}) => {
  const isArabic = language === "ar";
  const isBankily = paymentMethod === "bankily";

  // Official branding
  const methodInfo = isBankily
    ? {
        name: isArabic ? "بنكيلي (Bankily)" : "Bankily (BPM)",
        bank: isArabic ? "البنك الشعبي الموريتاني" : "Banque Populaire de Mauritanie",
        logo: bankilyLogoImg,
      }
    : {
        name: isArabic ? "سداد (Sedad)" : "Sedad (BIM)",
        bank: isArabic ? "البنك الإسلامي الموريتاني" : "Banque Islamique de Mauritanie",
        logo: sadadLogoImg,
      };

  // Official verified default numbers
  const defaultNum = isBankily ? "32024902" : "27329380";
  const rawNum = (accountNumber || defaultNum).trim().replace(/\s+/g, "");

  // Guaranteed single line format with non-breaking space (\u00A0)
  const formattedNumber =
    rawNum.length === 8
      ? `${rawNum.slice(0, 4)}\u00A0${rawNum.slice(4, 8)}`
      : rawNum;

  const resolvedAccountHolder =
    accountHolder ||
    (isArabic ? "موري توب للاستلام" : "MauriTop Réception");

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full rounded-2xl bg-[#091122] border border-slate-800/80 p-4 sm:p-5 shadow-lg space-y-3.5 select-none transition-all"
    >
      {/* 1. Header: Bank Identification */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
            <img
              src={methodInfo.logo}
              alt={methodInfo.name}
              className="w-full h-full object-contain filter brightness-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-black text-white tracking-tight">
                {methodInfo.name}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={11} className="text-emerald-400" />
                <span>{isArabic ? "حساب معتمد" : "Officiel"}</span>
              </span>
            </div>
            <span className="text-xs text-slate-400 block truncate mt-0.5">
              {methodInfo.bank}
            </span>
          </div>
        </div>

        {serviceTitle && (
          <div className="hidden sm:block text-right rtl:text-left text-xs font-bold text-slate-300 bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded-lg truncate max-w-[150px]">
            {serviceTitle}
          </div>
        )}
      </div>

      {/* Unavailable Alert if disabled */}
      {!isAvailable && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>
            {unavailableReason ||
              (isArabic
                ? "طريقة الدفع هذه متوقفة مؤقتاً للصيانة، يرجى اختيار وسيلة أخرى."
                : "Mode de paiement temporairement indisponible.")}
          </span>
        </div>
      )}

      {/* 2. Structured Data Cards with Soft Corners & Illustrative Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        
        {/* Card A: Required Amount */}
        <div className="rounded-xl bg-[#060B17] border border-slate-800/80 p-3 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Wallet size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block leading-tight">
                {isArabic ? "المبلغ المطلوب تحويله" : "Montant à transférer"}
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono tabular-nums leading-tight">
                {amount}{" "}
                <span className="text-xs font-sans text-emerald-400 font-bold">MRU</span>
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded bg-white/[0.03]">
            {isArabic ? "أوقية جديدة" : "MRU"}
          </span>
        </div>

        {/* Card B: Beneficiary Name */}
        <div className="rounded-xl bg-[#060B17] border border-slate-800/80 p-3 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <UserCheck size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block leading-tight">
                {isArabic ? "اسم المستلم في التطبيق" : "Nom du bénéficiaire"}
              </span>
              <span className="text-sm font-bold text-white block truncate leading-tight mt-0.5">
                {resolvedAccountHolder}
              </span>
            </div>
          </div>
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
        </div>
      </div>

      {/* 3. Card C: Official Transfer Number with Guaranteed Non-Splitting Digits & Copy Button */}
      <div className="rounded-xl bg-[#060B17] border border-slate-800/90 p-3 sm:p-3.5 space-y-2 shadow-inner">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300">
            <PhoneCall size={14} className="text-emerald-400" />
            <span>{isArabic ? "رقم التحويل المعتمد للاستلام" : "Numéro de transfert officiel"}</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {isArabic ? "اضغط للنسخ" : "Cliquer pour copier"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 bg-[#040812] border border-slate-800 rounded-lg p-2 sm:p-2.5">
          {/* Strictly single line: whitespace-nowrap, non-breaking space, font-mono */}
          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none" dir="ltr">
            <span className="text-lg sm:text-2xl font-black text-white font-mono tracking-[0.14em] tabular-nums whitespace-nowrap select-all block text-left">
              {formattedNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={onCopy}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 shadow-sm select-none",
              copied
                ? "bg-emerald-500 text-slate-950 font-black"
                : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            )}
          >
            {copied ? (
              <>
                <CheckCircle2 size={13} className="text-slate-950 stroke-[3]" />
                <span className="whitespace-nowrap">{isArabic ? "تم النسخ ✓" : "Copié ✓"}</span>
              </>
            ) : (
              <>
                <Copy size={13} className="text-slate-300" />
                <span className="whitespace-nowrap">{isArabic ? "نسخ الرقم" : "Copier"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Short, Elegant, Professional Direction */}
      <div className="pt-1 flex items-center gap-2 text-xs text-slate-400">
        <Sparkles size={14} className="text-amber-400 shrink-0" />
        <p className="leading-snug">
          {isArabic ? (
            <>حوّل المبلغ المطلوب عبر تطبيق <strong className="text-white">{isBankily ? "بنكيلي" : "سداد"}</strong> إلى الرقم أعلاه، ثم أدخل رقم هاتفك المُرسِل وارفق الإيصال بالأسفل.</>
          ) : (
            <>Effectuez le transfert vers ce numéro, puis renseignez votre numéro et joignez le reçu ci-dessous.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default PaymentMethodCard;
