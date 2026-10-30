import React from "react";
import SEO from "../components/SEO";

export default function PrivacyPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white px-4 py-12">
      <SEO 
        title="سياسة الخصوصية وحماية البيانات | موري توب MauriTop" 
        description="تعرف على سياسة الخصوصية وحماية بيانات المستخدمين والمعاملات في منصة موري توب لشحن الألعاب والخدمات الرقمية بموريتانيا عبر بنكيلي ومصرفي."
        keywords="سياسة الخصوصية موري توب, حماية البيانات موري توب, MauriTop privacy policy, أمان الدفع موريتانيا, بنكيلي آمن"
      />
      <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
        <h1 className="text-3xl md:text-4xl font-black">سياسة الخصوصية</h1>
        <p className="mt-4 text-slate-300 leading-7">
          نحن نحترم خصوصية المستخدمين، ونتعامل مع البيانات التي يتم إدخالها في المنصة
          بهدف تنفيذ الطلبات وتحسين الخدمة فقط.
        </p>

        <section className="mt-8 space-y-6 text-slate-300 leading-7">
          <div>
            <h2 className="text-xl font-bold text-white">1) المعلومات التي نجمعها</h2>
            <p className="mt-2">
              قد نجمع معلومات مثل: اسم الخدمة، رقم اللاعب أو البريد الإلكتروني أو اسم المستخدم،
              رقم المرسل، مرجع العملية، وصورة إثبات الدفع.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">2) كيف نستخدم المعلومات</h2>
            <p className="mt-2">
              تُستخدم البيانات فقط لتنفيذ الطلبات، التحقق من الدفع، التواصل مع المستخدم،
              وتحسين جودة الخدمة.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">3) مشاركة المعلومات</h2>
            <p className="mt-2">
              لا نقوم ببيع بيانات المستخدمين. قد تتم مشاركة المعلومات فقط عند الحاجة لتنفيذ الطلب أو
              التواصل المرتبط به.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">4) حفظ البيانات</h2>
            <p className="mt-2">
              قد يتم الاحتفاظ بالبيانات لفترة مناسبة لمتابعة الطلبات أو حل أي مشكلة أو التحقق من
              المعاملات.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">5) أمان المعلومات</h2>
            <p className="mt-2">
              نعمل على حماية البيانات بقدر الإمكان، لكن لا يمكن ضمان الأمان الكامل لأي منصة إلكترونية.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">6) مسؤولية المستخدم</h2>
            <p className="mt-2">
              المستخدم مسؤول عن إدخال بيانات صحيحة والتأكد من صحة مرجع العملية وإرفاق صورة دفع واضحة.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">7) تحديث السياسة</h2>
            <p className="mt-2">
              قد يتم تحديث هذه السياسة من وقت لآخر بما يناسب تطوير المنصة أو تحسين الخدمات.
            </p>
          </div>
        </section>

        <div className="mt-10 pt-6 border-t border-white/10 text-sm text-slate-400">
          تم تطوير هذه المنصة من خلال خبير الأمن السيبراني خي الحاج اعمر، مع الشكر والتقدير على جهوده.
        </div>
      </div>
    </main>
  );
}
