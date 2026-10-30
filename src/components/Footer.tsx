import React from 'react';
import { ShieldCheck, MessageCircle, Clock, Zap, HelpCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OFFICIAL_PHONE } from '../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#080D17] border-t border-white/5 pt-12 pb-[calc(var(--bottom-nav-clearance,96px)+env(safe-area-inset-bottom,20px))] md:pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top footer columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/5">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <span className="text-xl font-black text-white">MAURI<span className="text-emerald-400">TOP</span></span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              المنصة الموريتانية المتخصصة في شحن الألعاب والاشتراكات الرقمية وبطاقات الهدايا بأسرع وقت وأفضل الأسعار بالعملة المحلية (MRU).
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>تسليم معتمد ومضمون 100%</span>
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white">طرق الدفع المحلية 🇲🇷</h4>
            <p className="text-[11px] text-slate-400">
              ادفع مباشرة من حسابك البنكي أو محفظتك الإلكترونية بدون أي تعقيد:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-1 rounded bg-[#131C31] border border-white/10 text-rose-300 font-bold">بنكيلي (Bankily)</span>
              <span className="px-2 py-1 rounded bg-[#131C31] border border-white/10 text-sky-300 font-bold">السداد (Sadad)</span>
              <span className="px-2 py-1 rounded bg-[#131C31] border border-white/10 text-emerald-300 font-bold">مصرفي (Masrvi)</span>
              <span className="px-2 py-1 rounded bg-[#131C31] border border-white/10 text-amber-300 font-bold">كليك (Click)</span>
              <span className="px-2 py-1 rounded bg-[#131C31] border border-white/10 text-purple-300 font-bold">أمانتي (Amanty)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/orders"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تتبع حالة طلبك السابقة</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>شروط الاستخدام والضمان الذهبي</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>سياسة الخصوصية والأمان</span>
                </Link>
              </li>
              <li>
                <a
                  href="#faq"
                  className="hover:text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الأسئلة الشائعة حول الشحن بالآيدي</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Direct WhatsApp Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white">خدمة العملاء والدعم المباشر</h4>
            <p className="text-xs text-slate-400">
              فريق دعم موريتاني متواجد يومياً لمساعدتك والإجابة على أي استفسار:
            </p>
            <a
              href={`https://wa.me/222${OFFICIAL_PHONE}?text=${encodeURIComponent('السلام عليكم MauriTop')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تواصل عبر الواتساب: {OFFICIAL_PHONE.match(/.{1,2}/g)?.join(' ')}</span>
            </a>
            <p className="text-[10px] text-slate-500">
              نواكشوط، موريتانيا • خدمة فورية 24/7
            </p>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <p className="text-[11px] text-slate-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()} منصة <strong className="text-white">MauriTop</strong> للخدمات الرقمية.
          </p>
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            صُمم بأعلى معايير الأمان والسرعة لخدمة المستخدم في موريتانيا 🇲🇷
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
