import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Smartphone, 
  ShieldCheck, 
  Copy, 
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  Globe,
  Settings2,
  Info,
  X
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/utils";
import { 
  PaymentMethodConfig, 
  PaymentSettingsMap, 
  DEFAULT_PAYMENT_CONFIGS, 
  subscribePaymentSettings, 
  savePaymentSettings 
} from "../lib/paymentSettings";

import bankilyLogoImg from "../assets/images/bankily_real_logo_1779370169060.png";
import sadadLogoImg from "../assets/images/sadad_real_logo_1779370189416.png";
import gazaLogoImg from "../assets/images/gaza_real_logo_1779370210822.png";

export const AdminPaymentManager: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<PaymentSettingsMap>(DEFAULT_PAYMENT_CONFIGS);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewMethodKey, setPreviewMethodKey] = useState<string | null>(null);

  // New method draft form
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethodConfig>>({
    id: "",
    label: "",
    labelAr: "",
    labelFr: "",
    phone: "",
    accountHolderAr: "موري توب للاستلام",
    accountHolderFr: "MauriTop Réception",
    enabled: true,
    type: "manual",
    integrationStatus: "active",
    isCustom: true,
    descAr: "",
    descFr: "",
    instructionsAr: ""
  });

  useEffect(() => {
    const unsubscribe = subscribePaymentSettings((data) => {
      setSettings(data);
    });
    return () => unsubscribe();
  }, []);

  const handleFieldChange = (methodId: string, field: keyof PaymentMethodConfig, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [methodId]: {
        ...prev[methodId],
        [field]: value,
      },
    }));
  };

  const handleToggleStatus = (methodId: string) => {
    const current = settings[methodId]?.enabled !== false;
    handleFieldChange(methodId, "enabled", !current);
    showToast(
      !current 
        ? `تم تفعيل استقبال الشحن عبر ${settings[methodId]?.labelAr || methodId} بنجاح` 
        : `تم تعطيل الشحن عبر ${settings[methodId]?.labelAr || methodId} (سيظهر للزبائن: غير متوفر)`,
      !current ? "success" : "info"
    );
  };

  const handleSaveAll = async () => {
    try {
      setIsSavingAll(true);
      await savePaymentSettings(settings);
      showToast("تم حفظ جميع تعديلات طرق الدفع وتطبيقها فورياً على المتجر في Firestore بنجاح 🎉", "success");
    } catch (err: any) {
      console.error("Save payment settings error:", err);
      showToast(`فشل حفظ الإعدادات: ${err?.message || "خطأ غير متوقع"}`, "error");
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("هل أنت متأكد من استعادة الإعدادات الافتراضية لطرق الدفع (تفعيل بنكيلي بالرقم 32024902 وتطبيقات سداد وغزة باي معطلة)؟")) {
      const defaultState = { ...DEFAULT_PAYMENT_CONFIGS };
      defaultState.bankily.phone = "32024902";
      defaultState.bankily.enabled = true;
      defaultState.sadad.enabled = false;
      defaultState.gaza.enabled = false;
      defaultState.paypal.enabled = false;
      
      setSettings(defaultState);
      showToast("تمت استعادة الإعدادات المطلوبة، يرجى الضغط على حفظ التغييرات لتثبيتها.", "info");
    }
  };

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    showToast("تم نسخ رقم الحساب", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddNewMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethod.labelAr?.trim() || !newMethod.id?.trim()) {
      showToast("يرجى إدخال معرف الوسيلة واسمها بالعربية", "error");
      return;
    }

    const safeId = newMethod.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!safeId) {
      showToast("معرف الوسيلة يجب أن يحتوي على أحرف إنجليزية وأرقام فقط", "error");
      return;
    }

    if (settings[safeId]) {
      showToast("طريقة الدفع هذه موجودة مسبقاً بنفس المعرف", "error");
      return;
    }

    const added: PaymentMethodConfig = {
      id: safeId,
      label: newMethod.label?.trim() || safeId,
      labelAr: newMethod.labelAr.trim(),
      labelFr: newMethod.labelFr?.trim() || newMethod.label?.trim() || safeId,
      phone: newMethod.phone?.trim() || "",
      accountHolderAr: newMethod.accountHolderAr?.trim() || "موري توب للاستلام",
      accountHolderFr: newMethod.accountHolderFr?.trim() || "MauriTop Réception",
      enabled: newMethod.enabled !== false,
      type: newMethod.type || "manual",
      integrationStatus: newMethod.integrationStatus || "active",
      isCustom: true,
      descAr: newMethod.descAr?.trim() || `الدفع عبر ${newMethod.labelAr.trim()}`,
      descFr: newMethod.descFr?.trim() || `Paiement via ${newMethod.label?.trim() || safeId}`,
      instructionsAr: newMethod.instructionsAr?.trim() || ""
    };

    setSettings((prev) => ({ ...prev, [safeId]: added }));
    setIsAddModalOpen(false);
    setNewMethod({
      id: "",
      label: "",
      labelAr: "",
      labelFr: "",
      phone: "",
      accountHolderAr: "موري توب للاستلام",
      accountHolderFr: "MauriTop Réception",
      enabled: true,
      type: "manual",
      integrationStatus: "active",
      isCustom: true,
      descAr: "",
      descFr: "",
      instructionsAr: ""
    });

    showToast(`تمت إضافة وسيلة الدفع "${added.labelAr}"! يرجى الضغط على "حفظ جميع التغييرات" لتثبيتها في قاعدة البيانات.`, "success");
  };

  const handleDeleteCustomMethod = (methodId: string) => {
    if (["bankily", "sadad", "gaza", "paypal"].includes(methodId)) {
      showToast("لا يمكن حذف طرق الدفع الأساسية للنظام، يمكنك فقط تعطيلها", "error");
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف وسيلة الدفع "${settings[methodId]?.labelAr || methodId}"؟`)) {
      setSettings((prev) => {
        const next = { ...prev };
        delete next[methodId];
        return next;
      });
      showToast("تم حذف وسيلة الدفع، اضغط حفظ لتأكيد التغيير في Firestore.", "info");
    }
  };

  const methodLogos: Record<string, string> = {
    bankily: bankilyLogoImg,
    sadad: sadadLogoImg,
    gaza: gazaLogoImg,
  };

  const activeMethodsCount = Object.values(settings).filter((m) => m.enabled !== false).length;
  const disabledMethodsCount = Object.values(settings).filter((m) => m.enabled === false).length;

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">إدارة طرق ووسائل الدفع وحسابات الاستلام</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                التحكم المباشر في وسائل الدفع المحلية والدولية، أرقام الحسابات، وإضافة وسائل جديدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>المفعلة للعملاء: {activeMethodsCount}</span>
            </span>

            {disabledMethodsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>المعطلة: {disabledMethodsCount}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md shadow-cyan-600/20"
          >
            <Plus size={16} />
            <span>إضافة وسيلة دفع جديدة</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-slate-700"
          >
            <RotateCcw size={15} />
            <span>ضبط الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSavingAll}
            className={cn(
              "px-6 py-3.5 rounded-2xl font-black text-xs text-slate-950 transition-all flex items-center gap-2.5 shadow-lg cursor-pointer active:scale-95",
              isSavingAll 
                ? "bg-slate-600 cursor-not-allowed text-white" 
                : "bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/20"
            )}
          >
            <Save size={16} />
            <span>{isSavingAll ? "جاري الحفظ..." : "حفظ جميع التغييرات في Firestore"}</span>
          </button>
        </div>
      </div>

      {/* Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.entries(settings).map(([key, method]) => {
          const isEnabled = method.enabled !== false;
          const logo = methodLogos[key];
          const isSpecialMethod = ["bankily", "sadad", "gaza", "paypal"].includes(key);
          const isPayPal = key === "paypal";

          return (
            <div 
              key={key}
              className={cn(
                "rounded-3xl border p-5 flex flex-col justify-between transition-all shadow-lg relative overflow-hidden",
                isEnabled 
                  ? "bg-slate-900 border-emerald-500/30 shadow-emerald-500/5" 
                  : "bg-slate-950/80 border-slate-800 opacity-90"
              )}
            >
              {/* Top Accent Bar */}
              <div className={cn(
                "absolute top-0 inset-x-0 h-1.5",
                isPayPal
                  ? "bg-blue-500"
                  : isEnabled ? "bg-emerald-500" : "bg-slate-700"
              )} />

              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/10 p-2 flex items-center justify-center shrink-0">
                      {logo ? (
                        <img src={logo} alt={method.labelAr} className="w-full h-full object-contain" />
                      ) : isPayPal ? (
                        <Globe className="w-6 h-6 text-blue-400" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-base font-black text-white">{method.labelAr}</h4>
                        {method.isCustom && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            مخصصة
                          </span>
                        )}
                        {isPayPal && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            دولي
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 block">{method.label}</span>
                    </div>
                  </div>

                  {/* Actions (Toggle & Delete) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(key)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border",
                        isEnabled
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                          : "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                      )}
                    >
                      {isEnabled ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>مفعل</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} />
                          <span>معطل</span>
                        </>
                      )}
                    </button>

                    {!isSpecialMethod && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomMethod(key)}
                        title="حذف وسيلة الدفع المخصصة"
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* PayPal Status Warning Banner */}
                {isPayPal && (
                  <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-black text-blue-300">
                      <ShieldCheck size={14} />
                      <span>حالة التكامل الدولي (PayPal API):</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-blue-200/80">
                      {method.integrationStatus === "not_configured"
                        ? "⚠️ غير مهيأ حالياً: يتطلب إعداد بيانات الاعتماد الرسمية (Client ID & Secret) على خادم آمن قبل اعتماده للدفع الآلي."
                        : method.integrationStatus === "sandbox_testing"
                        ? "🧪 جاهز للاختبار التجريبي (Sandbox)"
                        : "متاح للاستخدام"}
                    </p>
                  </div>
                )}

                {/* Account Number / Phone Field */}
                {!isPayPal && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 block">
                      {key === "bankily" ? "رقم حساب بنكيلي (المعتمد: 32024902)" : "رقم حساب الاستلام / الهاتف"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={method.phone || ""}
                        onChange={(e) => handleFieldChange(key, "phone", e.target.value)}
                        placeholder={key === "bankily" ? "32024902" : "رقم الحساب أو الهاتف"}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black text-white focus:border-emerald-500 outline-none transition-all dir-ltr text-right"
                      />
                      {method.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(key, method.phone)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
                          title="نسخ الرقم"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Account Holder Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 block">
                    اسم صاحب الحساب أو المستلم
                  </label>
                  <input
                    type="text"
                    value={method.accountHolderAr || ""}
                    onChange={(e) => handleFieldChange(key, "accountHolderAr", e.target.value)}
                    placeholder="موري توب للاستلام"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 block">
                    وصف أو تعليمات تظهر للعميل
                  </label>
                  <input
                    type="text"
                    value={method.descAr || ""}
                    onChange={(e) => handleFieldChange(key, "descAr", e.target.value)}
                    placeholder="الدفع السريع والمباشر..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {isEnabled ? "🟢 متاح للعملاء" : "🔴 غير متاح حالياً"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMethodKey(key)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>معاينة</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAll}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Save size={13} />
                    <span>حفظ</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add New Payment Method Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <h4 className="text-lg font-black text-white">إضافة وسيلة دفع جديدة للمتجر</h4>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddNewMethod} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">معرف الوسيلة البرمجي (ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="masrvi أو click أو barid"
                    value={newMethod.id || ""}
                    onChange={(e) => setNewMethod({ ...newMethod, id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">الاسم بالعربية</label>
                  <input
                    type="text"
                    required
                    placeholder="مصرفي أو كليك BMCI"
                    value={newMethod.labelAr || ""}
                    onChange={(e) => setNewMethod({ ...newMethod, labelAr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">الاسم بالفرنسية / اللاتينية</label>
                  <input
                    type="text"
                    placeholder="Masrvi أو BMCI Click"
                    value={newMethod.label || ""}
                    onChange={(e) => setNewMethod({ ...newMethod, label: e.target.value, labelFr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">رقم الهاتف أو الحساب</label>
                  <input
                    type="text"
                    placeholder="رقم الهاتف أو الحساب البنكي"
                    value={newMethod.phone || ""}
                    onChange={(e) => setNewMethod({ ...newMethod, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">اسم صاحب الحساب</label>
                <input
                  type="text"
                  placeholder="موري توب للاستلام"
                  value={newMethod.accountHolderAr || ""}
                  onChange={(e) => setNewMethod({ ...newMethod, accountHolderAr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">وصف وتعليمات الدفع للعميل</label>
                <input
                  type="text"
                  placeholder="التحويل المباشر مع كتابة رقم الطلب في الملاحظة..."
                  value={newMethod.descAr || ""}
                  onChange={(e) => setNewMethod({ ...newMethod, descAr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black transition-all shadow-md shadow-cyan-600/25"
                >
                  إضافة الوسيلة الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Checkout Preview Modal */}
      {previewMethodKey && settings[previewMethodKey] && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Eye size={16} className="text-emerald-400" />
                <span>معاينة كما يراها العميل في صفحة الطلب:</span>
              </h4>
              <button 
                onClick={() => setPreviewMethodKey(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 p-1.5 flex items-center justify-center">
                    {methodLogos[previewMethodKey] ? (
                      <img src={methodLogos[previewMethodKey]} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{settings[previewMethodKey].labelAr}</p>
                    <p className="text-[10px] text-slate-400">{settings[previewMethodKey].descAr}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black",
                  settings[previewMethodKey].enabled !== false ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                )}>
                  {settings[previewMethodKey].enabled !== false ? "متاح للطلب" : "غير متوفر"}
                </span>
              </div>

              {settings[previewMethodKey].phone && (
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between font-mono">
                  <span className="text-slate-400 text-[11px]">رقم الاستلام:</span>
                  <span className="font-black text-emerald-400 text-sm">{settings[previewMethodKey].phone}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPreviewMethodKey(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
            >
              إغلاق المعاينة
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
