import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  Zap, 
  ShieldCheck, 
  User, 
  LogOut, 
  Globe, 
  MessageCircle, 
  Calculator, 
  Menu, 
  X,
  ClipboardList
} from "lucide-react";
import { OFFICIAL_PHONE } from "../constants";

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, logout } = useAuth();
  const { language, toggleLanguage, isRtl } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isArabic = language === "ar";

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#070B14]/92 backdrop-blur-md border-b border-white/10 select-none">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5">
        
        {/* Brand Logo */}
        <Link 
          to="/" 
          onClick={closeMenu}
          className="flex items-center gap-2 group focus:outline-none shrink-0"
        >
          <div className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform shrink-0">
            <Zap className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-wider text-white leading-tight">
              MAURI<span className="text-emerald-400">TOP</span>
            </span>
            <span className="text-[8px] sm:text-[9px] text-emerald-400/90 font-medium -mt-0.5 hidden xs:block">
              {isArabic ? "شحن فوري ومضمون 🇲🇷" : "Top-up Express 🇲🇷"}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            to="/"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              location.pathname === "/" 
                ? "text-emerald-400 bg-white/[0.05]" 
                : "text-slate-300 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            {isArabic ? "الرئيسية" : "Accueil"}
          </Link>
          <a
            href="/#services"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.03] transition-colors"
          >
            {isArabic ? "الخدمات" : "Services"}
          </a>
          <Link
            to="/calculator"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              location.pathname === "/calculator" 
                ? "text-emerald-400 bg-white/[0.05]" 
                : "text-slate-300 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            {isArabic ? "حاسبة الأسعار" : "Calculateur"}
          </Link>
          {user && (
            <Link
              to="/orders"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                location.pathname === "/orders" 
                  ? "text-emerald-400 bg-white/[0.05]" 
                  : "text-slate-300 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              {isArabic ? "طلباتي" : "Commandes"}
            </Link>
          )}
          <Link
            to="/contact"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              location.pathname === "/contact" 
                ? "text-emerald-400 bg-white/[0.05]" 
                : "text-slate-300 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            {isArabic ? "تواصل معنا" : "Contact"}
          </Link>
        </nav>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-1.5 xs:gap-2 shrink-0">
          {/* Admin Dashboard Badge (if admin) */}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-[11px] sm:text-xs font-bold transition-colors shadow-sm shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">{isArabic ? "لوحة المشرف" : "Admin"}</span>
            </Link>
          )}

          {/* WhatsApp Support Direct Button */}
          <a
            href={`https://wa.me/222${OFFICIAL_PHONE}?text=${encodeURIComponent(isArabic ? 'السلام عليكم MauriTop' : 'Bonjour MauriTop')}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Support"
            className="flex items-center gap-1 p-1.5 xs:px-2.5 xs:py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] sm:text-xs font-semibold transition-colors active:scale-95 shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">{isArabic ? "دعم واتساب" : "Support"}</span>
          </a>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-1 px-1.5 py-1 xs:px-2 xs:py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-[11px] sm:text-xs font-bold transition-colors shrink-0"
            title={isArabic ? "Changer en Français" : "التبديل إلى العربية"}
          >
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{isArabic ? "FR" : "عربي"}</span>
          </button>

          {/* User Account / Login */}
          {user ? (
            <div className="flex items-center gap-1 shrink-0">
              <Link
                to="/profile"
                className="flex items-center gap-1 px-2 py-1 xs:px-2.5 xs:py-1.5 rounded-lg bg-[#111A2E] hover:bg-[#16223B] border border-white/10 text-[11px] sm:text-xs font-semibold text-slate-200 transition-colors"
              >
                <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] sm:text-[10px] shrink-0">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                </div>
                <span className="hidden sm:inline max-w-[80px] truncate">
                  {profile?.name || user.email?.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={() => logout()}
                title={isArabic ? "تسجيل الخروج" : "Déconnexion"}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors hidden sm:flex shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 px-2.5 py-1 xs:px-3 xs:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span>{isArabic ? "دخول" : "Connexion"}</span>
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#080E1B] px-4 py-3 space-y-2">
          <Link
            to="/"
            onClick={closeMenu}
            className="block py-2 px-3 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/[0.05]"
          >
            {isArabic ? "الرئيسية" : "Accueil"}
          </Link>
          <a
            href="/#services"
            onClick={closeMenu}
            className="block py-2 px-3 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/[0.05]"
          >
            {isArabic ? "جميع الخدمات والألعاب" : "Tous les services"}
          </a>
          <Link
            to="/calculator"
            onClick={closeMenu}
            className="block py-2 px-3 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/[0.05]"
          >
            {isArabic ? "حاسبة الأسعار والكميات" : "Calculateur de prix"}
          </Link>
          <Link
            to="/contact"
            onClick={closeMenu}
            className="block py-2 px-3 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/[0.05]"
          >
            {isArabic ? "تواصل والدعم الفني" : "Contact & Support"}
          </Link>
          {user && (
            <button
              onClick={() => {
                logout();
                closeMenu();
              }}
              className="w-full text-right py-2 px-3 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center justify-between"
            >
              <span>{isArabic ? "تسجيل الخروج" : "Déconnexion"}</span>
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
