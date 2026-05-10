/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './services/firebase';
import { useAuth } from './services/useAuth';
import { useSettings } from './services/useSettings';
import { AdminBookings } from './components/AdminBookings';
import { AdminCars } from './components/AdminCars';
import { AdminAnalytics } from './components/AdminAnalytics';
import { AdminSettings } from './components/AdminSettings';
import { AdminAssistant } from './components/AdminAssistant';
import { Hero } from './components/Hero';
import { CarFleet } from './components/CarFleet';
import { CarDetails } from './components/CarDetails';
import { cars as mockCars, Car } from './services/carsData';
import { CarFront } from 'lucide-react';

type ViewState = 'home' | 'fleet' | 'details' | 'admin-bookings' | 'admin-cars' | 'admin-analytics' | 'admin-settings' | 'admin-assistant';

export default function App() {
  const { user, profile, logout, login } = useAuth();
  const { settings } = useSettings();
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  
  const [dbCars, setDbCars] = useState<Car[]>([]);
  const [logoIndex, setLogoIndex] = useState(0);

  const logoImages = [
    // Lamborghini
    "https://images.unsplash.com/photo-1544839309-847253d865c3?auto=format&fit=crop&q=100&w=2048&h=2048",
    // G-Class
    "https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=100&w=2048&h=2048",
    // Rolls Royce
    "https://images.unsplash.com/photo-1631700611307-37dbcb89df7e?auto=format&fit=crop&q=100&w=2048&h=2048",
    // Ferrari/Supercar
    "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=100&w=2048&h=2048",
    // Mercedes AMG
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=100&w=2048&h=2048"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLogoIndex((prev) => (prev + 1) % logoImages.length);
    }, 4500); // changes every 4.5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchCars() {
      try {
        const snap = await getDocs(collection(db, 'cars'));
        if (snap.empty) {
          // Fallback to mock data visually if DB is empty, without attempting to write to it (which causes permission errors for normal users)
          setDbCars(mockCars);
        } else {
          setDbCars(snap.docs.map(d => ({ id: d.id, ...d.data() } as Car)));
        }
      } catch (err) {
        console.error("Error fetching cars:", err);
      }
    }
    fetchCars();
  }, [currentView]);

  const selectedCar = selectedCarId ? dbCars.find(c => c.id === selectedCarId) : null;

  const navigateToDetails = (id: string) => {
    setSelectedCarId(id);
    setCurrentView('details');
  };

  const isAdmin = profile?.isAdmin || user?.email === 'pimo1999loko@gmail.com';

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-[#E5E5E5] font-sans flex flex-col overflow-x-hidden select-none" dir="rtl">
      <header className="h-24 flex items-center justify-between px-6 md:px-12 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setCurrentView('home')}>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C5A059] transform group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(197,160,89,0.3)]">
            <img 
              src={logoImages[logoIndex]} 
              alt="Logo" 
              className="w-full h-full object-cover transition-opacity duration-1000" 
            />
          </div>
          <span className="text-xl font-serif tracking-[0.2em] uppercase text-white group-hover:text-[#C5A059] transition-colors">
            {settings.siteName}
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-10 text-[11px] font-bold tracking-[0.1em] text-white/50">
          <button onClick={() => setCurrentView('home')} className={`hover:text-white transition-colors cursor-pointer ${currentView === 'home' ? 'text-[#C5A059] border-b border-[#C5A059] pb-1' : ''}`}>الرئيسية</button>
          <button onClick={() => setCurrentView('fleet')} className={`hover:text-white transition-colors cursor-pointer ${currentView === 'fleet' ? 'text-[#C5A059] border-b border-[#C5A059] pb-1' : ''}`}>أسطول السيارات</button>
          
          {isAdmin && (
            <>
              <button onClick={() => setCurrentView('admin-analytics')} className={`hover:text-white transition-colors cursor-pointer ${currentView === 'admin-analytics' ? 'text-[#C5A059] border-b border-[#C5A059] pb-1' : ''}`}>الإحصائيات</button>
              <button onClick={() => setCurrentView('admin-bookings')} className={`hover:text-white transition-colors cursor-pointer ${currentView === 'admin-bookings' ? 'text-[#C5A059] border-b border-[#C5A059] pb-1' : ''}`}>الحجوزات</button>
              <button onClick={() => setCurrentView('admin-cars')} className={`hover:text-white transition-colors cursor-pointer ${currentView === 'admin-cars' ? 'text-[#C5A059] border-b border-[#C5A059] pb-1' : ''}`}>إدارة السيارات</button>
              <button id="ai-assistant-tab-trigger" onClick={() => setCurrentView('admin-assistant')} className={`hover:text-white transition-colors cursor-pointer ${currentView === 'admin-assistant' ? 'text-[#C5A059] border-b border-[#C5A059] pb-1' : ''}`}>المساعد الذكي</button>
              <button onClick={() => setCurrentView('admin-settings')} className={`hover:text-white transition-colors cursor-pointer ${currentView === 'admin-settings' ? 'text-[#C5A059] border-b border-[#C5A059] pb-1' : ''}`}>إعدادات الموقع</button>
            </>
          )}
          
          {user ? (
            <div className="flex items-center gap-4 mr-8 border-r border-white/10 pr-8">
              <span className="text-[10px]">{user.email}</span>
              <button onClick={logout} className="hover:text-red-400 transition-colors cursor-pointer text-[10px]">تسجيل الخروج</button>
            </div>
          ) : (
            <button 
              onClick={login} 
              className={`hover:text-white transition-opacity cursor-pointer border border-[#C5A059] px-4 py-2 text-[#C5A059] ${window.location.search.includes('admin') ? 'opacity-100' : 'opacity-0 hover:opacity-100'} w-8 h-8 rounded-full flex items-center justify-center p-0`}
              title="Admin Login"
            >
              🔒
            </button>
          )}
        </nav>
      </header>

      <main className={`flex-1 flex flex-col ${currentView === 'home' ? 'px-0 py-0' : 'px-6 md:px-12 py-12 md:py-16'} gap-16 lg:overflow-visible`}>
        
        {currentView === 'home' && (
          <Hero siteName={settings.siteName} onExplore={() => setCurrentView('fleet')} />
        )}

        {currentView === 'fleet' && (
           <CarFleet cars={dbCars} onSelectCar={navigateToDetails} />
        )}

        {currentView === 'details' && selectedCar && (
          <CarDetails car={selectedCar} onBack={() => setCurrentView('fleet')} />
        )}

        {currentView === 'admin-bookings' && isAdmin && (
           <AdminBookings />
        )}
        
        {currentView === 'admin-cars' && isAdmin && (
           <AdminCars />
        )}

        {currentView === 'admin-analytics' && isAdmin && (
           <AdminAnalytics />
        )}

        {currentView === 'admin-settings' && isAdmin && (
           <AdminSettings />
        )}

        {currentView === 'admin-assistant' && isAdmin && (
           <AdminAssistant />
        )}

      </main>

      <footer className="h-20 px-6 md:px-12 flex items-center justify-between border-t border-white/5 text-[10px] tracking-[0.1em] text-white/30 shrink-0 mt-8">
        <div className="flex gap-6 md:gap-12 flex-wrap">
          <span>التوصيل للمطار مجاناً</span>
          <span>دعم فني 24/7</span>
          <span>سيارات معقمة بالكامل</span>
        </div>
        <div className="flex items-center gap-6">
          <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition-colors font-sans text-xs">
            Instagram
          </a>
          <div className="hidden sm:block font-sans">&copy; {new Date().getFullYear()} {settings.siteName}.</div>
        </div>
      </footer>
    </div>
  );
}
