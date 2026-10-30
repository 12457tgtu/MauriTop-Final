import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { AnimatePresence, motion } from 'motion/react';
import Navbar from './components/Navbar';
import BottomNavigation from './components/BottomNavigation';
import LoadingSpinner from './components/LoadingSpinner';
import SkeletonPageLoader from './components/SkeletonPageLoader';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatusBanner from './components/NetworkStatusBanner';
import FCMNotificationBanner from './components/FCMNotificationBanner';
import SplashScreen from './components/SplashScreen';
import Layout from './components/Layout';
import FloatingAiButton from './components/FloatingAiButton';
import RequireAdmin from './routes/RequireAdmin';
import { useVisitorTracking } from './hooks/useVisitorTracking';

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const PostsAdmin = lazy(() => import("./components/PostsAdmin"));
const ServicesManager = lazy(() => import("./pages/ServicesManager"));
const ServiceCardsPage = lazy(() => import("./pages/ServiceCardsPage"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));
const OrderService = lazy(() => import("./pages/OrderService"));
const QuantityCalculator = lazy(() => import("./pages/QuantityCalculator"));
const Profile = lazy(() => import("./pages/Profile"));
const KycVerification = lazy(() => import("./pages/KycVerification"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Contact = lazy(() => import("./pages/Contact"));
const AiAssistant = lazy(() => import("./pages/AiAssistant"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));

function VisitorTracker() {
  useVisitorTracking();
  return null;
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) return <LoadingSpinner fullScreen size="lg" />;
  if (!user) return <Navigate to={adminOnly ? "/admin/login" : "/login"} />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  if (profile?.blocked && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-main-bg p-4">
        <div className="bg-card-bg p-10 rounded-3xl shadow-xl text-center max-w-md border border-border-light">
          <h1 className="text-2xl font-black text-red-600 mb-4 font-sans">
            حسابك محظور / Votre compte est bloqué
          </h1>
          <p className="text-text-secondary mb-6">
            يرجى التواصل مع الإدارة لاسترجاع الوصول إلى حسابك. / Veuillez contacter l'administration pour réactiver votre compte.
          </p>
          <button onClick={() => (window.location.href = '/contact')} className="bg-primary-main text-main-bg px-8 py-3 rounded-xl font-bold">
            تواصل معنا / Contactez-nous
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const { user, isAdmin, loading } = useAuth();
  const [showSplash, setShowSplash] = React.useState(() => {
    return !sessionStorage.getItem("splash_seen");
  });

  const handleSplashFinish = React.useCallback(() => {
    try {
      sessionStorage.setItem("splash_seen", "true");
    } catch {
      // Ignore storage restrictions
    }
    setShowSplash(false);
  }, []);

  if (loading && showSplash) {
    return (
      <SplashScreen onFinish={handleSplashFinish} minimumDurationMs={1600} />
    );
  }

  if (loading) {
    return (
      <LoadingSpinner fullScreen size="xl" />
    );
  }

  return (
    <HelmetProvider>
      {showSplash && (
        <SplashScreen onFinish={handleSplashFinish} minimumDurationMs={1600} />
      )}
      <LanguageProvider>
        <ToastProvider>
          <Router>
            <VisitorTracker />
            <AppContent user={user} isAdmin={isAdmin} />
          </Router>
        </ToastProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

function InviteHandler() {
  const { refId } = useParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (refId) {
      localStorage.setItem('referrerId', refId);
    }
    navigate('/register');
  }, [refId, navigate]);

  return (
    <LoadingSpinner fullScreen message="جاري توجيهك..." />
  );
}

function AppContent({ user, isAdmin }: { user: any; isAdmin: boolean }) {
  const { isRtl } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [pushNotification, setPushNotification] = React.useState<{ title: string; body: string } | null>(null);
  const [isPushOpen, setIsPushOpen] = React.useState(false);
  const isInitialLoad = React.useRef(true);

  // Scroll to top automatically when navigating to any new page
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const fetchNotifications = async () => {
      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.size > 0 && !isInitialLoad.current) {
          // Simplistic notification check for new unread messages
        }
        isInitialLoad.current = false;
      } catch (err) {
        console.warn("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 1000 * 60 * 30); // Poll every 30 minutes

    const fcmCleanup = () => {
      clearInterval(interval);
    };

    const unsub = () => fcmCleanup();

    let fcmUnsubscribe: (() => void) | null = null;
    import("./lib/fcm").then(({ listenForForegroundMessages }) => {
      listenForForegroundMessages((payload) => {
        if (payload?.notification) {
          setPushNotification({
            title: payload.notification.title || (isRtl ? "إشعار فوري" : "Notification"),
            body: payload.notification.body || ""
          });
          setIsPushOpen(true);
        }
      }).then(unsubFn => {
        if (typeof unsubFn === "function") {
          fcmUnsubscribe = unsubFn;
        }
      });
    }).catch(err => console.log("FCM import skipped:", err));

    return () => {
      unsub();
      if (fcmUnsubscribe) fcmUnsubscribe();
    };
  }, [user, isRtl]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`min-h-screen flex flex-col bg-main-bg text-text-primary ${isRtl ? 'rtl font-sans' : 'ltr font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <NetworkStatusBanner />
      {!isAdminRoute && <Navbar />}
      <main className={`flex-grow ${isAdminRoute ? 'pt-0' : 'pt-0'} ${!isAdminRoute ? 'pb-28 sm:pb-32 md:pb-8' : ''}`}>
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full flex-grow"
            >
              <Suspense fallback={<SkeletonPageLoader />}>
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/invite/:refId" element={<InviteHandler />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={user ? <Navigate to="/orders" replace /> : <Register />} />
                  <Route path="/dashboard" element={<Navigate to="/orders" replace />} />
                  <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                  <Route path="/admin/posts" element={<RequireAdmin><PostsAdmin /></RequireAdmin>} />
                  <Route path="/admin/services-manager" element={<RequireAdmin><ServicesManager /></RequireAdmin>} />
                  <Route path="/admin/login" element={user && isAdmin ? <Navigate to="/admin" /> : <AdminLogin />} />
                  <Route path="/services" element={<Navigate to="/#services" replace />} />
                  <Route path="/games" element={<Navigate to="/#services" replace />} />
                  <Route path="/gift-cards" element={<Layout><ServiceCardsPage /></Layout>} />
                  <Route path="/history" element={<ProtectedRoute><Layout><TransactionHistory /></Layout></ProtectedRoute>} />
                  <Route path="/services/:id" element={<Layout><OrderService /></Layout>} />
                  <Route path="/calculator" element={<Layout><QuantityCalculator /></Layout>} />
                  <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                  <Route path="/kyc" element={<ProtectedRoute><Layout><KycVerification /></Layout></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
                  <Route path="/contact" element={<Layout><Contact /></Layout>} />
                  <Route path="/assistant" element={<AiAssistant />} />
                  <Route path="/service-cards" element={<Layout><ServiceCardsPage /></Layout>} />
                  <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
                  <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
                  <Route path="*" element={<Layout><NotFound /></Layout>} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      {!isAdminRoute && <FloatingAiButton />}
      {!isAdminRoute && <BottomNavigation />}
      <FCMNotificationBanner
        isOpen={isPushOpen}
        title={pushNotification?.title || ""}
        body={pushNotification?.body || ""}
        onClose={() => setIsPushOpen(false)}
        onClick={() => {
          setIsPushOpen(false);
          navigate("/notifications");
        }}
      />
    </div>
  );
}
