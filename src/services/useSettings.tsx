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
