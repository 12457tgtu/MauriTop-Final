import { useEffect, useRef } from 'react';
import { useAuth } from '../lib/useAuth';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';

export function useVisitorTracking() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const lastTrackedRef = useRef<{ path: string; time: number }>({ path: '', time: 0 });

  const userId = user?.uid || null;
  const userEmail = user?.email || null;
  const userName = profile?.name || null;
  const userPhone = profile?.phoneNumber || null;
  const path = location.pathname;

  useEffect(() => {
    let isSubscribed = true;

    const trackVisitor = async () => {
      const now = Date.now();
      // Skip redundant tracking if path hasn't changed and last update was less than 30s ago
      if (lastTrackedRef.current.path === path && now - lastTrackedRef.current.time < 30000) {
        return;
      }

      try {
        let sessionId = localStorage.getItem('visitor_session_id');
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('visitor_session_id', sessionId);
        }

        const visitorRef = doc(db, 'active_visitors', sessionId);
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const deviceType = isMobile ? 'Mobile' : 'Desktop';

        const getBrowserName = () => {
          const ua = navigator.userAgent;
          if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
          if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return "Safari";
          if (/firefox|fxios/i.test(ua)) return "Firefox";
          if (/edg/i.test(ua)) return "Edge";
          return "Web";
        };

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

        await setDoc(visitorRef, {
          sessionId,
          userId,
          email: userEmail,
          name: userName,
          phone: userPhone,
          isRegistered: !!userId,
          device: deviceType,
          browser: getBrowserName(),
          timeZone,
          userAgent: navigator.userAgent,
          lastActive: serverTimestamp(),
          path,
        }, { merge: true });

        if (isSubscribed) {
          lastTrackedRef.current = { path, time: Date.now() };
        }
      } catch (error) {
        // Silently handle error (e.g. offline) to prevent breaking UI navigation
        console.warn("Visitor tracking notification skipped:", error);
      }
    };

    trackVisitor();

    // Refresh presence every 2 minutes
    const interval = setInterval(trackVisitor, 120000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [userId, userEmail, userName, userPhone, path]);
}

