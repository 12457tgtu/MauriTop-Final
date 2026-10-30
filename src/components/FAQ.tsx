import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { HelpCircle, ChevronDown } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

const faqsAr: FAQItem[] = [
  {
    q: "كيف تتم عملية الشحن وتأكيد الطلب؟",
    a: "عملية الشحن سهلة وآمنة للغاية: تختار الخدمة المطلوبة، تدخل البيانات مثل الـ ID أو رقم الحساب والكمية، ثم تقوم بتحويل المبلغ عبر وسيلة السداد المحلية المفضلة لديك ورفع إيصال التحويل مباشرة داخل المنصة. تتابع بعدها حالة الطلب لحظة بلحظة حتى الاكتمال.",
  },
  {
    q: "هل أحتاج إلى إنشاء حساب لاستخدام المنصة؟",
    a: "نعم، يمكنك إنشاء حساب جديد سريع خلال ثوانٍ برقم الهاتف أو البريد الإلكتروني. يضمن لك الحساب حفظ جميع طلباتك، وتتبع حالة اشتراكاتك وأكوادك الخاصة بأمان من لوحة التحكم.",
  },
  {
    q: "كيف يمكنني تتبع حالة طلبي بعد إرساله؟",
    a: "بمجرد إرسال طلبك، يمكنك الانتقال لشاشة 'طلباتي' من القائمة السفلية لتتبع التحديثات مباشرة. كما ستتلقى إشعاراً فورياً بمجرد تأكيد الطلب واكتمال عملية الشحن.",
  },
  {
    q: "ما هي طرق الدفع المحلية المتاحة في موريتانيا؟",
    a: "ندعم جميع التطبيقات المصرفية المحلية المعتمدة في موريتانيا مثل Bankily (بنكيلي)، Masrvi (مسريفي)، Sedad (سداد)، والتطبيقات المالية الأخرى لتوفير أسرع وأسلس تجربة دفع.",
  },
];

const faqsFr: FAQItem[] = [
  {
    q: "Comment fonctionne le processus de commande ?",
    a: "Le processus est simple et sécurisé : sélectionnez le service désiré, saisissez vos identifiants (ID joueur ou compte), effectuez le paiement via votre moyen local préféré et importez le reçu. Vous pourrez suivre l'avancement en temps réel jusqu'à la livraison.",
  },
  {
    q: "Ai-je besoin d'un compte pour commander ?",
    a: "Oui, la création d'un compte prend quelques secondes avec votre numéro ou e-mail. Cela vous permet de retrouver l'historique de vos commandes, vos abonnements et vos codes de recharge en toute sécurité.",
  },
  {
    q: "Comment puis-je suivre l'état de ma commande ?",
    a: "Après validation, rendez-vous dans la rubrique 'Mes Commandes' depuis la barre de navigation pour voir l'état en direct et recevoir des notifications instantanées.",
  },
  {
    q: "Quels sont les modes de paiement locaux acceptés ?",
    a: "Nous acceptons tous les moyens de paiement bancaires et mobiles populaires en Mauritanie tels que Bankily, Masrvi, Sedad et autres applications pour un règlement rapide et sans tracas.",
  },
];

export default function FAQ() {
  const { language } = useLanguage();
  const faqs = language === 'ar' ? faqsAr : faqsFr;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <section 
      id="faq"
      className="mt-12 max-w-5xl mx-auto px-4 content-visibility-auto" 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="rounded-2xl border border-white/10 bg-[#0E1626] p-5 sm:p-8 relative overflow-hidden shadow-xl">
        
        {/* Section Badge & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
            <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.6} />
            <span>{language === 'ar' ? "الأسئلة الشائعة" : "F.A.Q"}</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
            {language === 'ar' ? 'إجابات على أسئلتك الأكثر تكراراً' : 'Questions Fréquemment Posées'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl font-medium">
            {language === 'ar' 
              ? 'كل ما تحتاج معرفته عن كيفية الطلب، السداد، والشحن الفوري عبر منصة موري توب' 
              : 'Tout ce que vous devez savoir sur le processus de recharge et de paiement'}
          </p>
        </div>

        {/* FAQ Accordion Items */}
        <div className="space-y-2.5">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'border-emerald-500/40 bg-[#121D31] shadow-md shadow-emerald-950/20' 
                    : 'border-white/5 bg-[#070B14]/60 hover:border-white/15 hover:bg-[#070B14]'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full text-right flex items-center justify-between p-4 gap-3 cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className={`text-xs sm:text-sm font-bold transition-colors ${
                      isOpen ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {item.q}
                    </span>
                  </div>
                  <div className={`p-1.5 rounded-lg transition-all duration-200 shrink-0 ${
                    isOpen ? 'bg-emerald-500/20 text-emerald-400 rotate-180' : 'bg-white/5 text-slate-400'
                  }`}>
                    <ChevronDown className="w-4 h-4" strokeWidth={1.6} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-white/5 mt-1 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
