import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Gamepad2, 
  CreditCard, 
  Tv, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  Calculator,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

export default function MauriTopSEOContent() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <section 
      id="about-mauritop-guide"
      className="max-w-6xl mx-auto px-4 py-12 sm:py-16 text-slate-200"
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? "دليل خدمات موري توب لشحن الألعاب والخدمات الرقمية في موريتانيا" : "Guide des services MauriTop en Mauritanie"}
    >
      {/* Main Header Container */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAr ? 'المنصة الرقمية الأولى في موريتانيا' : 'Plateforme N°1 en Mauritanie'}</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
          {isAr ? (
            <>
              شحن الألعاب والخدمات الرقمية في <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">موريتانيا</span>
            </>
          ) : (
            <>
              Recharge de jeux et services digitaux en <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Mauritanie</span>
            </>
          )}
        </h2>
        
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          {isAr ? (
            <>
              تُعد منصة <strong>موري توب (MAURITOP)</strong> البوابة الموريتانية الرسمية الرائدة لتوفير خدمات <strong>شحن الألعاب الإلكترونية</strong>، <strong>أرخص شحن جواهر</strong>، <strong>تعبئة رصيد شدات</strong>، بطاقات الهدايا الدولية، والاشتراكات الترفيهية والإنتاجية بأسعار منافسة وبالعملة المحلية (الأوقية MRU)، مع تسليم فوري ودعم مصرفي كامل عبر التطبيقات الوطنية وخدمة <strong>MauriPay</strong> المبتكرة.
            </>
          ) : (
            <>
              <strong>MauriTop</strong> est la plateforme de référence en Mauritanie pour la <strong>recharge instantanée</strong> de vos jeux mobiles, cartes cadeaux et abonnements premium en Ouguiya (MRU) avec paiement local sécurisé. Le service de <strong>recharge le moins cher</strong> et le plus rapide du marché via <strong>MauriPay</strong>.
            </>
          )}
        </p>
      </div>



      {/* Detailed Informational Guide Section */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-sm p-6 sm:p-8 md:p-10 space-y-8">
        
        <div className="space-y-3">
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {isAr ? 'لماذا يختار آلاف اللاعبين والمستخدمين في موريتانيا منصة MauriTop؟' : 'Pourquoi choisir la plateforme MauriTop en Mauritanie ?'}
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {isAr ? (
              <>
                صُممت منصة موري توب خصيصاً لتلبية احتياجات مجتمع الألعاب وصناع المحتوى في نواكشوط وجميع الولايات الموريتانية، حيث توفر تجربة سلسة تدمج بين التكنولوجيا الحديثة وأسهل حلول الدفع الموريتانية.
              </>
            ) : (
              <>
                MauriTop répond aux besoins des gamers et créateurs de contenu à Nouakchott et dans toutes les régions mauritaniennes avec une intégration fluide des paiements locaux.
              </>
            )}
          </p>
        </div>

        {/* 4 Feature Bullet Points with semantic tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {isAr ? 'دعم كامل لتطبيقات الدفع البنكية الموريتانية' : 'Paiements locaux acceptés'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr 
                  ? 'الدفع بسهولة عبر بنكيلي (Bankily)، تطبيق مصرفي (Masrvi)، السداد (Sedad)، وكليك (Click) بالأوقية الموريتانية MRU.'
                  : 'Payez facilement via Bankily, Masrvi, Sedad et Click en Ouguiya (MRU).'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {isAr ? 'تسليم فوري وآلي بالـ ID' : 'Livraison ultra-rapide par ID'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr 
                  ? 'معالجة وشحن الطلب في دقائق معدودة فور إتمام التحويل المالي وإرسال إشعار العملية.'
                  : 'Votre compte est crédité en quelques minutes dès confirmation du virement.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {isAr ? 'أمان تام 100% وحماية لبيانات الحسابات' : 'Sécurité et confidentialité 100%'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr 
                  ? 'لا نطلب كلمات المرور لحساباتك. شحن الألعاب يتم حصرياً عبر المعرف الرسمي للاعب (Player ID).'
                  : 'Aucun mot de passe requis. La recharge se fait uniquement via votre ID officiel.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {isAr ? 'دعم فني مباشر على مدار الساعة' : 'Support client réactif'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr 
                  ? 'فريق دعم فني متواجد عبر واتساب والمساعد الذكي للإجابة على جميع الاستفسارات ومتابعة الطلبات.'
                  : 'Notre équipe est à votre écoute sur WhatsApp pour vous assister à tout moment.'}
              </p>
            </div>
          </div>
        </div>

        {/* How to Order Steps */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h4 className="text-base font-bold text-white">
            {isAr ? 'كيف تشحن حسابك في 4 خطوات بسيطة؟' : 'Comment recharger en 4 étapes simples ?'}
          </h4>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-300 list-none">
            <li className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="font-black text-emerald-400 text-sm">01.</span>
              <p className="font-bold text-white">{isAr ? 'اختر الخدمة أو اللعبة' : 'Choisissez le service'}</p>
              <p className="text-slate-400">{isAr ? 'حدد اللعبة أو البطاقة المطلوبة من قائمة الخدمات.' : 'Sélectionnez le jeu ou abonnement.'}</p>
            </li>
            <li className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="font-black text-cyan-400 text-sm">02.</span>
              <p className="font-bold text-white">{isAr ? 'أدخل معرف اللاعب (ID)' : 'Indiquez votre identifiant'}</p>
              <p className="text-slate-400">{isAr ? 'أدخل الـ ID أو البريد الإلكتروني وحدد الباقة.' : 'Entrez votre ID joueur ou email.'}</p>
            </li>
            <li className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="font-black text-purple-400 text-sm">03.</span>
              <p className="font-bold text-white">{isAr ? 'حوّل المبلغ عبر التطبيق البنكي' : 'Payez via Bankily ou Masrvi'}</p>
              <p className="text-slate-400">{isAr ? 'أرسل المبلغ لرقم الحساب وارفع صورة الإشعار.' : 'Transférez le montant exact et envoyez le reçu.'}</p>
            </li>
            <li className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="font-black text-emerald-400 text-sm">04.</span>
              <p className="font-bold text-white">{isAr ? 'استلم الشحن فوراً' : 'Recevez votre recharge'}</p>
              <p className="text-slate-400">{isAr ? 'يصلك الشحن إلى حسابك مباشرة في دقائق.' : 'Votre recharge est créditée en quelques minutes.'}</p>
            </li>
          </ol>
        </div>

        {/* Fast Internal Linking Cloud */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <span className="text-xs font-bold text-slate-400 block">
            {isAr ? 'روابط سريعة واستكشاف الخدمات المتاحة:' : 'Liens rapides et services populaires :'}
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link 
              to="/services/freefire" 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 transition-all font-medium"
            >
              {isAr ? 'شحن جواهر فري فاير (Free Fire)' : 'Recharge Free Fire'}
            </Link>
            <Link 
              to="/services/pubg" 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-all font-medium"
            >
              {isAr ? 'شحن شدات ببجي (PUBG UC)' : 'Recharge PUBG Mobile UC'}
            </Link>
            <Link 
              to="/services/netflix" 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 transition-all font-medium"
            >
              {isAr ? 'اشتراك نتفليكس (Netflix)' : 'Abonnement Netflix'}
            </Link>
            <Link 
              to="/services/canva" 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 text-slate-300 hover:text-purple-300 transition-all font-medium"
            >
              {isAr ? 'اشتراك كانفا برو (Canva Pro)' : 'Abonnement Canva Pro'}
            </Link>
            <Link 
              to="/service-cards" 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-amber-300 transition-all font-medium"
            >
              {isAr ? 'بطاقات الهدايا والمتاجر' : 'Cartes cadeaux Store'}
            </Link>
            <Link 
              to="/calculator" 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 text-slate-300 hover:text-blue-300 transition-all font-medium"
            >
              {isAr ? 'حاسبة كمية وأسعار الشحن' : 'Calculateur de recharge'}
            </Link>
            <Link 
              to="/contact" 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 transition-all font-medium"
            >
              {isAr ? 'الدعم الفني وخدمة العملاء' : 'Support client'}
            </Link>
            <Link 
              to="/assistant" 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-300 transition-all font-medium"
            >
              {isAr ? 'المساعد الذكي (AI)' : 'Assistant IA'}
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
