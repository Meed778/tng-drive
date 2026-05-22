import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface SiteSettings {
  siteName: string;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  phoneNumber: string;
  email: string;
  address: string;
  instagramUrl: string;
  instagramHandle: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  aboutTitle: string;
  aboutText: string;
  termsText: string;
  insuranceText: string;
  fuelPolicy: string;
  mileagePolicy: string;
  driverRequirements: string;
  paymentMethods: string;
  cancellationPolicy: string;
  additionalServices: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
}

const defaultSettings: SiteSettings = {
  siteName: "TNG Drive",
  heroTitle: "أسطول السيارات",
  heroSubtitle: "اختر السيارة المناسبة لرحلتك القادمة",
  description: "نحن هنا لمساعدتك على مدار الساعة. تفضل بزيارة مكتبنا أو تواصل معنا بأي وقت لأي استفسار عن خدماتنا وحجوزاتك.",
  phoneNumber: "+212 709 49 70 98",
  email: "tangierdrive40@gmail.com",
  address: "شارع محمد الخامس، وسط المدينة\nطنجة، المغرب 90000",
  instagramUrl: "https://www.instagram.com/tng_drive?igsh=MTRmcDl5YzZvM2JjNg==",
  instagramHandle: "@tng_drive",
  facebookUrl: "https://web.facebook.com/profile.php?id=61574586352895",
  tiktokUrl: "https://www.tiktok.com/@tng_drive",
  youtubeUrl: "",
  aboutTitle: "من نحن",
  aboutText: "TNG Drive هي شركة رائدة في مجال كراء السيارات بطنجة، المغرب. نقدم أسطولاً متنوعاً من السيارات الاقتصادية والفاخرة لتناسب جميع احتياجاتكم. مع خدمة توصيل مجانية للمطار ودعم فني على مدار الساعة، نضمن لكم تجربة كراء سلسة ومريحة.",
  termsText: "• يجب أن لا يقل عمر السائق عن 21 سنة.\n• تقديم رخصة سياقة سارية المفعول (سائحون: رخصة دولية أو رخصة أصلية مع بطاقة التعريف).\n• إيداع شيك أو مبلغ نقدي كتأمين (Caution) حسب فئة السيارة.\n• يمنع تدخين السجائر أو الشيشة داخل السيارة.\n• يمنع قيادة السيارة خارج المغرب دون إذن مسبق.\n• الإلتزام بقوانين السير وعدم تجاوز السرعة المحددة.\n• في حالة المخالفات المرورية، يتحمل السائق المسؤولية كاملة.",
  insuranceText: "جميع سياراتنا مؤمنة بالكامل ضد الغير. يمكنكم إضافة تأمين شامل يغطي الأضرار الخاصة والسرقة والحرائق بتكلفة إضافية رمزية. الاستفادة من التأمين تتطلب الإبلاغ الفوري عن أي حادث وملء محضر شرطة.",
  fuelPolicy: "تستلم السيارة بخزان ممتلئ ويجب إعادتها بنفس الحالة. في حال إعادتها بخزان غير ممتلئ، سيتم خصم قيمة الوقود الناقص مع رسوم خدمة إضافية.",
  mileagePolicy: "جميع سياراتنا بدون حدود للكيلومترات (كيلومترات غير محدودة) لتستمتع برحلتك بحرية تامة.",
  driverRequirements: "• السن الأدنى: 21 سنة (قد تختلف حسب فئة السيارة).\n• رخصة سياقة سارية المفعول (سائحون: رخصة دولية مطلوبة).\n• بطاقة تعريف وطنية أو جواز سفر.\n• إيداع تأمين نقدي (Caution) حسب فئة السيارة.\n• للسيارات الفاخرة: السن الأدنى 25 سنة.",
  paymentMethods: "طرق الدفع المتاحة: الدفع نقداً (درهم)، التحويل البنكي، وبطاقات الائتمان (Visa, Mastercard).",
  cancellationPolicy: "• إلغاء الحجز مجاني تماماً قبل 48 ساعة من موعد الاستلام.\n• الإلغاء خلال 24-48 ساعة: خصم 25% من قيمة الحجز.\n• الإلغاء خلال أقل من 24 ساعة: خصم 50%.\n• في حالة عدم الحضور (No Show): خصم كامل قيمة اليوم الأول.",
  additionalServices: "• توصيل مجاني من وإلى مطار طنجة ابن بطوطة.\n• سائق إضافي: 50 درهماً إضافياً في اليوم.\n• كرسي أطفال: مجاناً (حسب التوفر).\n• نظام تحديد المواقع GPS: 30 درهماً في اليوم.\n• توصيل السيارة إلى الفندق: مجاناً داخل طنجة.\n• خدمة 24/7 للطوارئ والمساعدات.",
  cloudinaryCloudName: "",
  cloudinaryUploadPreset: "",
};

const SettingsContext = createContext<{settings: SiteSettings, loading: boolean}>({settings: defaultSettings, loading: true});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let _mounted = true;
    
    const docRef = doc(db, 'settings', 'general');

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && _mounted) {
        setSettings({ ...defaultSettings, ...docSnap.data() as SiteSettings });
      }
      if (_mounted) setLoading(false);
    }, (error) => {
      console.error("Error fetching settings:", error);
      if (_mounted) setLoading(false);
    });
    
    return () => {
      _mounted = false;
      unsub();
    };
  }, []);

  // Update dynamic document title when specific settings change
  useEffect(() => {
    if (settings.siteName) {
      document.title = `${settings.siteName} | كراء السيارات في طنجة`;
    }
  }, [settings.siteName]);

  return <SettingsContext.Provider value={{settings, loading}}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
