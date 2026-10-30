import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Diagnostic logger for application health
console.log("[Diagnostics] Initializing MauriTop Firebase client...", {
  projectId: firebaseConfig?.projectId || "N/A",
  authDomain: firebaseConfig?.authDomain || "N/A",
  hasApiKey: Boolean(firebaseConfig?.apiKey),
  databaseId: firebaseConfig?.firestoreDatabaseId || "(default)",
  environment: import.meta.env.MODE
});

const app = initializeApp(firebaseConfig);

// Using initializeFirestore with forced long polling to handle network proxies cleanly and avoid initial stream drops
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);

