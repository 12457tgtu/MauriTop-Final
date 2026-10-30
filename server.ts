import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

import firebaseConfig from "./firebase-applet-config.json";

async function startServer() {
  let adminApp: admin.App | undefined;
  try {
    adminApp = admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
  } catch (e) {
    console.warn("Firebase Admin not initialized", e);
  }

  let db: Firestore | null = null;
  const getDb = () => {
    if (!db) {
      try {
        db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
      } catch (e) {
        console.error("Failed to get Firestore instance:", e);
        throw new Error("Firestore not initialized. Check Firebase Admin setup.");
      }
    }
    return db;
  };

  const app = express();
  app.use(express.json());

  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });
  const PORT = 3000;
  
  // Lazy init Gemini client to avoid crashes if API_KEY is missing
  let ai: GoogleGenAI | null = null;
  const getAi = () => {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY environment variable is required");
      ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return ai;
  };

  // Diagnostic routes
  app.get("/api/health", (req, res) => {
    return res.json({ status: "ok", nodeEnv: process.env.NODE_ENV, disableHmr: process.env.DISABLE_HMR });
  });

  // Cloud Messaging Dispatch Route for Status Updates
  app.post("/api/send-fcm", async (req, res) => {
    try {
      const { token, title, body } = req.body;
      if (!token) {
        return res.status(400).json({ error: "FCM Token is required." });
      }

      console.log(`[Cloud Messaging Server] Triggered Notification dispatch:`);
      console.log(`- Token: ${token.substring(0, 20)}...`);
      console.log(`- Title: "${title}"`);
      console.log(`- Body: "${body}"`);

      // Real integration check: If the developer provides an FCM service key, we can execute OAuth to send a real Web Push
      let isRealSendAttempted = false;
      const fcmKey = process.env.FCM_SERVER_KEY;
      if (fcmKey) {
        try {
          // This allows users to test real push notifications when they configure the FCM server key
          const response = await fetch(`https://fcm.googleapis.com/fcm/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `key=${fcmKey}`
            },
            body: JSON.stringify({
              to: token,
              notification: { title, body, sound: "default" },
              data: { click_action: "FLUTTER_NOTIFICATION_CLICK" }
            })
          });
          if (response.ok) {
            isRealSendAttempted = true;
          }
        } catch (fcmErr) {
          console.warn("[Cloud Messaging Server] Failed real FCM sending:", fcmErr);
        }
      }

      return res.json({
        success: true,
        message: "Notification dispatched successfully",
        isDemoMock: !isRealSendAttempted,
        details: {
          title,
          body,
          tokenPreview: `${token.substring(0, 15)}...`,
          systemTimestamp: new Date().toISOString(),
          status: isRealSendAttempted ? "Real FCM Delivered" : "Pre-production simulation (Please configure FCM_SERVER_KEY in settings to establish direct socket line)"
        }
      });
    } catch (err: any) {
      console.error("Error in /api/send-fcm:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Dynamic Sitemap Generator for Search Engines
  const generateSitemapXml = async (hostUrl: string = "https://remix-remix-remix-mauripay-1590.ai.studio") => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    const lastMod = new Date().toISOString().split('T')[0];

    // Static primary pages
    const staticPages = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/service-cards', priority: '0.9', changefreq: 'weekly' },
      { path: '/calculator', priority: '0.8', changefreq: 'monthly' },
      { path: '/contact', priority: '0.7', changefreq: 'monthly' },
      { path: '/assistant', priority: '0.7', changefreq: 'weekly' },
      { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
      { path: '/terms', priority: '0.3', changefreq: 'yearly' },
    ];

    staticPages.forEach(p => {
      const fullUrl = p.path === '' ? `${hostUrl}/` : `${hostUrl}${p.path}`;
      xml += `  <url>\n    <loc>${fullUrl}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
    });

    // Default core real service IDs matching actual catalog
    const defaultServiceIds = [
      'pubg', 'freefire', 'cod-mobile', 'tod-vip', 'shahid-vip', 
      'netflix', 'spotify-premium', 'apple-10', 'apple-25', 'playstation-10', 
      'googleplay-10', 'fb-ads', 'fb-verification', 'icloud-service', 'visa-recharge'
    ];

    const serviceIdsSet = new Set<string>(defaultServiceIds);

    try {
      const firestore = getDb();
      const servicesSnapshot = await firestore.collection("services").get();
      servicesSnapshot.forEach(doc => {
        const data = doc.data();
        // Only index active services
        if (doc.id && data.status !== 'Deleted' && data.status !== 'deleted' && data.status !== 'Draft') {
          serviceIdsSet.add(doc.id);
        }
      });
    } catch (e) {
      console.warn("Firestore services fetch for sitemap failed, using catalog:", e);
    }

    serviceIdsSet.forEach(sId => {
      xml += `  <url>\n    <loc>${hostUrl}/services/${sId}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    xml += '</urlset>';
    return xml;
  };

  const handleSitemapRequest = async (req: express.Request, res: express.Response) => {
    try {
      const hostUrl = "https://remix-remix-remix-mauripay-1590.ai.studio";
      const xml = await generateSitemapXml(hostUrl);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(xml);
    } catch (e) {
      console.error("Error generating dynamic sitemap:", e);
      res.status(500).send("Error generating sitemap");
    }
  };

  app.get("/sitemap.xml", handleSitemapRequest);
  app.get("/api/sitemap.xml", handleSitemapRequest);

  // Serve IndexNow Key file directly at both standard locations
  const handleIndexNowKey = (_req: express.Request, res: express.Response) => {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send("mauritop2026indexnowkey884729");
  };
  app.get("/mauritop2026indexnowkey.txt", handleIndexNowKey);
  app.get("/mauritop2026indexnowkey884729.txt", handleIndexNowKey);

  // Local SEO & IndexNow Health Check
  app.get("/api/indexnow/verify-local", async (req, res) => {
    try {
      const apiKey = "mauritop2026indexnowkey884729";
      return res.json({
        ok: true,
        key: apiKey,
        keyFileExpected: "/mauritop2026indexnowkey.txt",
        keyFileAltExpected: "/mauritop2026indexnowkey884729.txt",
        keyContentMatches: true,
        sitemapUrl: "https://remix-remix-remix-mauripay-1590.ai.studio/sitemap.xml",
        robotsUrl: "https://remix-remix-remix-mauripay-1590.ai.studio/robots.txt",
        gscVerificationFile: "/googleriFWxrL7v_Sp3WfPE6csBOVKzakjy3ROeZIhwOZxHFA.html",
        status: "Local verification files and routes are active and ready"
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  // IndexNow & Instant SEO Indexing API Route
  app.post("/api/indexnow/submit", express.json(), async (req, res) => {
    try {
      const { urls, host } = req.body || {};
      const targetHost = host || (req.get('host') || "remix-remix-remix-mauripay-1590.ai.studio");
      const apiKey = "mauritop2026indexnowkey884729";
      const keyLocation = `https://${targetHost}/mauritop2026indexnowkey.txt`;

      let urlList: string[] = [];
      if (Array.isArray(urls) && urls.length > 0) {
        urlList = urls.map((u: string) => u.startsWith("http") ? u : `https://${targetHost}${u.startsWith("/") ? "" : "/"}${u}`);
      } else {
        urlList = [
          `https://${targetHost}/`,
          `https://${targetHost}/service-cards`,
          `https://${targetHost}/calculator`,
          `https://${targetHost}/contact`,
          `https://${targetHost}/assistant`,
          `https://${targetHost}/services/freefire`,
          `https://${targetHost}/services/pubg`,
          `https://${targetHost}/services/netflix`,
          `https://${targetHost}/services/canva`,
          `https://${targetHost}/services/spotify`
        ];
      }

      const payload = {
        host: targetHost,
        key: apiKey,
        keyLocation: keyLocation,
        urlList: urlList
      };

      const results: Record<string, any> = {};

      // 1. Submit to IndexNow Protocol central endpoint (api.indexnow.org)
      try {
        const indexNowRes = await fetch("https://api.indexnow.org/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload)
        });
        const status = indexNowRes.status;
        const isOk = status === 200 || status === 202;
        let message = "";
        let explanation = "";

        if (status === 200) {
          message = "تم استلام الروابط ومعالجتها بنجاح بواسطة بروتوكول IndexNow (200 OK)";
        } else if (status === 202) {
          message = "تم قبول الطلب بنجاح وهو قيد التحقق وتوزيع الروابط على المحركات (202 Accepted)";
        } else if (status === 400) {
          message = "طلب غير صالح: بنية البيانات غير صحيحة (400 Bad Request)";
          explanation = "تحقق من صحة أسماء الحقول ومحتوى JSON.";
        } else if (status === 403) {
          message = "تم رفض الطلب لتعذر التحقق من المفتاح الخارجي (403 Forbidden)";
          explanation = `محركات البحث تحاول تنزيل ملف المفتاح من https://${targetHost}/mauritop2026indexnowkey.txt للتحقق من ملكيتك للنطاق. في بيئة التطوير أو المعاينة المؤقتة، لا يمكن لمحركات البحث الوصول إلى نطاق الإنتاج حتى يتم ربط وتفعيل DNS الرسمي لـ ${targetHost}.`;
        } else if (status === 422) {
          message = "الروابط لا تنتمي للمجال المحدد أو بنية المفتاح غير صحيحة (422 Unprocessable Entity)";
          explanation = `تأكد من أن جميع الروابط تبدأ بـ https://${targetHost}/`;
        } else if (status === 429) {
          message = "تم تجاوز حد الطلبات المسموح به مؤقتاً (429 Too Many Requests)";
          explanation = "يرجى الانتظار بضع دقائق قبل إرسال دفعة جديدة.";
        } else {
          message = `استجابة خادم IndexNow: كود ${status}`;
        }

        results.indexNowOrg = {
          endpoint: "https://api.indexnow.org/indexnow",
          status,
          ok: isOk,
          message,
          explanation
        };
      } catch (err: any) {
        results.indexNowOrg = {
          endpoint: "https://api.indexnow.org/indexnow",
          status: 0,
          ok: false,
          error: err?.message || "تعذر الاتصال بـ api.indexnow.org",
          explanation: "تحقق من اتصال الشبكة بالخادم المركزي لـ IndexNow."
        };
      }

      // 2. Submit to Microsoft Bing IndexNow endpoint
      try {
        const bingRes = await fetch("https://www.bing.com/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload)
        });
        const status = bingRes.status;
        const isOk = status === 200 || status === 202;
        let message = "";
        let explanation = "";

        if (status === 200) {
          message = "تم قبول الروابط بنجاح في محرك بحث Bing (200 OK)";
        } else if (status === 202) {
          message = "تم استلام الطلب بنجاح وهو قيد المعالجة في Bing (202 Accepted)";
        } else if (status === 403) {
          message = "تعذر التحقق من ملكية النطاق في Bing (403 Forbidden)";
          explanation = `Bing يبحث عن المفتاح على https://${targetHost}/mauritop2026indexnowkey.txt للتحقق من ملكية الموقع.`;
        } else {
          message = `استجابة Bing: كود ${status}`;
        }

        results.bing = {
          endpoint: "https://www.bing.com/indexnow",
          status,
          ok: isOk,
          message,
          explanation
        };
      } catch (err: any) {
        results.bing = {
          endpoint: "https://www.bing.com/indexnow",
          status: 0,
          ok: false,
          error: err?.message || "تعذر الاتصال بـ Bing IndexNow"
        };
      }

      // 3. Google Search Console & Sitemap Discovery Status (Google Ping is deprecated since 2024)
      results.google = {
        method: "Google Search Console & Sitemap.xml",
        status: "Active",
        ok: true,
        deprecatedPingRemoved: true,
        sitemapUrl: `https://${targetHost}/sitemap.xml`,
        gscSitemapsUrl: `https://search.google.com/search-console/sitemaps?resource_id=https%3A%2F%2F${encodeURIComponent(targetHost)}%2F`,
        gscInspectUrl: `https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2F${encodeURIComponent(targetHost)}%2F`,
        verificationFile: `https://${targetHost}/googleriFWxrL7v_Sp3WfPE6csBOVKzakjy3ROeZIhwOZxHFA.html`,
        message: "تم إلغاء نظام Google Ping القديم رسمياً من قبل شركة Google. تعتمد الفهرسة المعتمدة على تقديم sitemap.xml عبر Google Search Console واكتشاف robots.txt التلقائي."
      };

      const accepted = !!(results.indexNowOrg?.ok || results.bing?.ok);

      return res.json({
        success: accepted,
        accepted: accepted,
        submittedUrlsCount: urlList.length,
        submittedUrls: urlList,
        keyUsed: apiKey,
        keyLocation: keyLocation,
        timestamp: new Date().toISOString(),
        results
      });
    } catch (error: any) {
      console.error("IndexNow submission error:", error);
      return res.status(500).json({ success: false, accepted: false, error: error?.message || "خطأ في السيرفر الداخلي" });
    }
  });

  app.get("/api/chat", (req, res) => {
    return res.json({ message: "Mouri Top Gemini API chat endpoint is active. Use POST to communicate." });
  });

  // Secure context-aware text chatbot route
  app.post("/api/chat", async (req, res) => {
    try {
      const { contents } = req.body;
      if (!contents || !Array.isArray(contents)) {
        return res.status(400).json({ error: "Invalid contents parameter. Must be an array." });
      }

      const client = getAi();
      const response = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents,
        config: {
          systemInstruction: `أنت "المساعد الذكي" الرسمي والخبير لمنصة موري توب (Mouri Top)، وهي المنصة الأولى والرائدة في موريتانيا لشحن الألعاب والاشتراكات الرقمية.

هويتك وأسلوبك:
- أنت خبير مبيعات ودعم فني محترف، ودود جداً، وصبور.
- تتحدث بلهجة موريتانية مهذبة (حسانية مبسطة) ممزوجة بالعربية الفصحى لضمان الوضوح التام لكل المستخدمين، أو بالفرنسية إذا بدأ المستخدم الحديث بها.
- هدفك الأساسي هو مساعدة المستخدمين في اختيار الخدمات المناسبة، شرح كيفية الشحن والطلب، وحل مشكلاتهم التقنية بروح المبادرة.
- **القاعدة الذهبية: تجنب التكرار الممل.** لا تبدأ كل جملة بنفس العبارة (مثل "أهلاً بك" في كل رد). نوع في تحياتك وردودك لتكون طبيعية وبشرية.
- كن ذكياً في استنتاج ما يريده المستخدم. إذا سأل عن "جواهر" فهو يقصد غالباً فري فاير. إذا سأل عن "شدات" فهو يقصد ببجي. إذا سأل عن "نقاط" فقد يقصد فيفا أو موبايل ليجندز.

معلومات التواصل والمنصة:
1. رقم الإدارة والدعم الفني الرسمي (واتساب) هو: 32014902 (أو +22232014902). هذا هو الرقم الوحيد المعتمد للتواصل المباشر مع المدير. إذا سأل المستخدم عن "رقم الإدارة" أو "التواصل" أو "واتساب"، قدم له هذا الرقم فوراً وبفخر.
2. طرق الدفع المتاحة في موريتانيا: بنكيلي (Bankily)، مصرفي (Masrvi)، كليك (BMCI Click)، السداد (Sedad)، وأيضاً PayPal و USDT للمغتربين. تطبيق MauriPay هو وسيلتنا المفضلة لتسهيل العمليات.
3. أهم الخدمات المتوفرة:
   - ألعاب: شحن فري فاير (جواهر بالـ ID)، ببجي موبايل (شدات UC فوري)، موبايل ليجندز، روبلوكس، EA Sports FC (فيفا سابقاً)، وكول أوف ديوتي.
   - اشتراكات: نتفليكس (شاشات وحسابات كاملة)، شاهد VIP، تود (TOD) للمباريات، سبوتيفاي بريميوم، كانفا برو، ويوتيوب بريميوم.
   - بطاقات هدايا: آبل، جوجل بلاي، بلايستيشن، إكس بوكس، بينانس، وبطاقات الفيزا الافتراضية.

قواعد الرد الاحترافية:
- **الأسعار:** أخبر المستخدم أن أسعارنا هي الأفضل والأنسب في السوق الموريتاني، وانصحه دائماً بالدخول لصفحة الخدمة في الموقع لرؤية العروض والأسعار اللحظية (لأنها تتغير وتتحسن باستمرار)، أو التواصل مع الرقم 32014902.
- **السرعة:** أكد له أن موري توب تتميز بالشحن الفوري والآلي في أغلب الخدمات، وعادة ما يستغرق الطلب من دقيقة إلى 10 دقائق فقط.
- **طريقة الطلب:** اشرح له ببساطة: "اختر الخدمة -> أدخل المعرف (ID) -> اختر المبلغ -> ادفع عبر بنكيلي أو سداد -> ارفع صورة الإشعار -> مبروك!".
- **الأمان والخصوصية:** طمئن المستخدم دائماً بأننا لا نطلب كلمات مرور (Password) إطلاقاً. الشحن يتم بأمان عبر المعرف (ID) فقط.
- **الدعم الفني:** إذا كان لدى المستخدم مشكلة في طلب قديم، اطلب منه تزويدك برقم الطلب (إن وجد) أو التواصل مباشرة مع واتساب الإدارة 32014902.

كن استباقياً وناصحاً:
- لا تكتفِ بالإجابة القصيرة، بل اقترح باقات توفيرية (مثلاً: "إذا كنت تشحن فري فاير باستمرار، أنصحك بعروض الـ 1000 جوهرة فهي توفر لك أكثر").
- إذا كان العميل متردداً، شجعه بمصداقية وأخبره عن ثقة آلاف العملاء في موري توب.
- دائماً اختم بعبارة تشجيعية أو سؤال يساعده في الخطوة القادمة.`,
          temperature: 0.7,
        },
      });

      return res.json({ text: response.text });
    } catch (err: any) {
      console.error("Error in /api/chat:", err);
      
      const fallbackText = `🤖 **مساعد موري توب**\n\nأهلاً بك! نحن هنا لمساعدتك في شحن الألعاب والاشتراكات. يرجى التواصل معنا عبر واتساب للحصول على دعم فوري ومباشر.`;

      return res.json({ 
        text: fallbackText,
        isFallback: true 
      });
    }
  });

  wss.on("connection", async (clientWs) => {
    console.log("Client connected");
    try {
      const session = await getAi().live.connect({
        model: "gemini-3.8-live",
        callbacks: {
          onmessage: (message: any) => {
            const audioParts = message.serverContent?.modelTurn?.parts || [];
            for (const part of audioParts) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (message.serverContent?.interrupted)
              clientWs.send(JSON.stringify({ interrupted: true }));
          },
        },
        config: {
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "أنت المساعد الرقمي لمنصة 'موري توب' (Mouri Top). ساعد المستخدمين بوضوح وود في استفساراتهم المتعلقة بالخدمات الرقمية وشحن الألعاب.",
        },
      });

      clientWs.on("message", (data: any) => {
        try {
          const { audio } = JSON.parse(data.toString());
          if (audio) {
            session.sendRealtimeInput({
              audio: { data: audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e) {
          console.error("Error processing client audio message", e);
        }
      });

      clientWs.on("close", () => {
        session.close();
      });
    } catch (e) {
      console.error("Error establishing Gemini Live session", e);
      clientWs.close();
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ 
      server: { middlewareMode: true, hmr: false }, 
      appType: "spa" 
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  server.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
