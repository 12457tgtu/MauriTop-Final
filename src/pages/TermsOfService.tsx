import React from "react";
import SEO from "../components/SEO";
import { ShieldCheck, CheckCircle2, AlertCircle, Clock, CreditCard, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white px-4 py-12">
      <SEO 
        title="الشروط والأحكام والخدمة | موري توب MauriTop" 
        description="شروط الاستخدام وأحكام خدمة شحن الألعاب والبطاقات الرقمية في منصة موري توب بموريتانيا عبر بنكيلي ومصرفي وسداد. حقوق المستخدم وضمان الشحن."
        keywords="شروط الاستخدام موري توب, أحكام الخدمة, سياسة الشحن, MauriTop terms, قوانين الشحن موريتانيا, بنكيلي, MauriPay"
      />
      <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10 space-y-8">
        <div className="space-y-3 border-b border-white/10 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>اتفاقية الاستخدام والخدمة</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black">الشروط والأحكام - موري توب MauriTop</h1>
          <p className="text-slate-400 text-sm">
            آخر تحديث: {new Date().getFullYear()} • استخدامك للمنصة يعني موافقتك الكاملة على هذه الشروط.
          </p>
        </div>

        <section className="space-y-6 text-slate-300 leading-relaxed text-sm sm:text-base">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">1</span>
              طبيعة الخدمة
            </h2>
            <p className="text-slate-300">
              منصة <strong>موري توب (MauriTop)</strong> هي منصة رقمية موريتانية متخصصة في شحن رصيد الألعاب الإلكترونية (مثل Free Fire، PUBG Mobile)، بطاقات الهدايا الرقمية، والاشتراكات، وتعمل كوسيط موثوق لتسهيل الدفع بالأوقية الموريتانية (MRU) عبر التطبيقات البنكية المعتمدة.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">2</span>
              صحة البيانات ورقم اللاعب (Player ID)
            </h2>
            <p className="text-slate-300">
              يتحمل العميل المسؤولية الكاملة عن صحة البيانات المدخلة (مثل الـ ID، اسم المستخدم، أو رقم الهاتف). لا تتحمل المنصة أي مسؤولية في حال إدخال معرف خاطئ وتم تنفيذ الشحن عليه بنجاح من قبل النظام.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">3</span>
              وسائل الدفع وتأكيد التحويل
            </h2>
            <p className="text-slate-300">
              يتم الدفع بالتحويل المباشر عبر المحافظ البنكية الموريتانية المعتمدة (بنكيلي Bankily، مصرفي Masrvi، سداد Sedad، غزة باي GazaPay، أمانتي Amanty). يتم معالجة وتنفيذ الطلب فور مطابقة رقم العملية (Reference) وإشعار الدفع من قبل الإدارة.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">4</span>
              أوقات التنفيذ والتسليم
            </h2>
            <p className="text-slate-300">
              يتم تنفيذ معظم الطلبات بشكل فوري إلى غضون دقائق معدودة (1 - 15 دقيقة) خلال ساعات العمل الرسمية. في حالات الضغط أو الصيانة قد يستغرق الطلب وقتاً إضافياً مع التزامنا التام بحفظ حقوق العملاء.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">5</span>
              سياسة الإلغاء والاسترجاع
            </h2>
            <p className="text-slate-300">
              نظراً لطبيعة المنتجات الرقمية، لا يمكن إلغاء الطلب أو استرجاع المبلغ بعد اكتمال الشحن وتسليم الرمز أو الرصيد إلى الحساب. في حال تعذر تنفيذ الخدمة بسبب مشكلة فنية أو عدم توفر المنتج، يحق للعميل استرداد كامل المبلغ المدفوع.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">6</span>
              الدعم الفني والشكاوى
            </h2>
            <p className="text-slate-300">
              في حال وجود أي استفسار أو مشكلة في الطلب، يرجى التواصل مع فريق الدعم الفني عبر واتساب الرسمي <strong>+222 27329380</strong> مع تزويدنا برقم الطلب لتسريع الخدمة.
            </p>
          </div>
        </section>

        <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
          <Link 
            to="/" 
            className="text-emerald-400 font-bold hover:underline text-sm"
          >
            ← العودة للصفحة الرئيسية
          </Link>
          <Link 
            to="/privacy" 
            className="text-slate-400 hover:text-white text-sm"
          >
            سياسة الخصوصية وحماية البيانات
          </Link>
        </div>
      </div>
    </main>
  );
}
