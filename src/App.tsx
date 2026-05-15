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

  const isAdminMode = window.location.pathname.includes('admin') || window.location.search.includes('admin') || window.location.hash.includes('admin');
  const isAdmin = !!user && (user.email === 'pimo1999loko@gmail.com' || user.email === 'tangierdrive40@gmail.com' || profile?.isAdmin === true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAdminMode) {
      console.log("[AdminDebug] Checking access:", { isAdmin, user: user?.email, currentView });
      
      // If we are logged in as admin and in admin mode, force navigation to analytics if we are stuck on generic pages
      if (isAdmin && (currentView === 'home' || currentView === 'fleet' || currentView === 'details')) {
        console.log("[AdminDebug] Automating navigation to admin-analytics");
        setCurrentView('admin-analytics');
      }
    }
  }, [isAdmin, isAdminMode, currentView, user?.email]);

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-[#E5E5E5] font-sans flex flex-col overflow-x-hidden select-none" dir="rtl">
      <header className="h-24 flex items-center justify-between px-6 md:px-12 border-b border-white/5 shrink-0 relative z-50">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }}>
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Elegant Logo Icon */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#C5A059] to-[#E5C48B] rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-700 shadow-[0_0_20px_rgba(197,160,89,0.4)]"></div>
            <div className="absolute inset-1 bg-[#0A0A0A] rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-700"></div>
            <span className="relative z-10 font-serif text-[#C5A059] text-xl font-bold italic tracking-tighter">tng</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#C5A059] to-white group-hover:via-white transition-all duration-1000">
              tng Drive
            </span>
            <span className="text-[8px] uppercase tracking-[0.4em] text-[#C5A059] font-bold opacity-70 -mt-1">Luxury Car Rental</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-10 text-[11px] font-bold tracking-[0.1em] text-white/50">
          <button onClick={() => setCurrentView('home')} className={`hover:text-white transition-colors cursor-pointer ${currentView === 'home' ? 'text-[#C5A059] border-b border-[#C5A059] pb-1' : ''}`}>الرئيسية</button>
          <button onClick={() => setCurrentView('fleet')} className={`hover:text-white transition-colors cursor-pointer ${currentView === 'fleet' ? 'text-[#C5A059] border-b border-[#C5A059] pb-1' : ''}`}>أسطول السيارات</button>
          
          {isAdmin && (
            <>
              <button onClick={() => setCurrentView('admin-analytics')} className={`hover:text-white transition-colors cursor-pointer ${currentView.startsWith('admin-') ? 'text-[#C5A059] border-b border-[#C5A059] pb-1' : ''}`}>لوحة التحكم</button>
            </>
          )}
          
          {user ? (
            <div className="flex items-center gap-4 mr-8 border-r border-white/10 pr-8">
              <span className="text-[10px] opacity-50">{user.email}</span>
              <button onClick={logout} className="hover:text-red-400 transition-colors cursor-pointer text-[10px]">تسجيل الخروج</button>
            </div>
          ) : (
            <button 
              onClick={login} 
              className={`transition-all duration-300 cursor-pointer border border-[#C5A059] px-4 py-2 text-[#C5A059] ${isAdminMode ? 'opacity-100 bg-[#C5A059]/10 rounded-sm flex items-center gap-3 px-6' : 'opacity-0 hover:opacity-100 w-10 h-10 rounded-full flex items-center justify-center p-0'}`}
              title="Admin Login"
            >
              <span>🔒</span>
              {isAdminMode && <span className="text-[11px] font-bold tracking-wider">دخول الإدارة</span>}
            </button>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-[#C5A059] hover:bg-white/5 rounded-full transition-colors"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-24 bg-[#0A0A0A] z-40 flex flex-col p-8 gap-6 lg:hidden animate-in fade-in slide-in-from-top-4 duration-300">
             <button onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }} className={`text-right py-4 border-b border-white/5 text-lg ${currentView === 'home' ? 'text-[#C5A059]' : 'text-white/70'}`}>الرئيسية</button>
             <button onClick={() => { setCurrentView('fleet'); setIsMobileMenuOpen(false); }} className={`text-right py-4 border-b border-white/5 text-lg ${currentView === 'fleet' ? 'text-[#C5A059]' : 'text-white/70'}`}>أسطول السيارات</button>
             
             {isAdmin && (
               <>
                 <button onClick={() => { setCurrentView('admin-analytics'); setIsMobileMenuOpen(false); }} className={`text-right py-4 border-b border-white/5 text-lg ${currentView.startsWith('admin-') ? 'text-[#C5A059]' : 'text-white/70'}`}>لوحة التحكم</button>
               </>
             )}

             <div className="mt-auto flex flex-col gap-4">
                {user ? (
                  <>
                    <div className="text-white/30 text-xs text-center">{user.email}</div>
                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full py-4 border border-red-500/30 text-red-500 rounded-sm">تسجيل الخروج</button>
                  </>
                ) : (
                  <button onClick={() => { login(); setIsMobileMenuOpen(false); }} className={`w-full py-4 border border-[#C5A059] text-[#C5A059] rounded-sm ${isAdminMode ? 'block' : 'hidden'}`}>تسجيل الدخول (أدمن)</button>
                )}
             </div>
          </div>
        )}
      </header>

      {/* Admin Sub-navigation (if in admin view) */}
      {isAdmin && currentView.startsWith('admin-') && (
        <div className="h-12 bg-[#141414] border-b border-white/5 flex items-center px-6 md:px-12 gap-8 overflow-x-auto no-scrollbar scroll-smooth">
           <button onClick={() => setCurrentView('admin-analytics')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white ${currentView === 'admin-analytics' ? 'text-[#C5A059]' : 'text-white/30'}`}>الإحصائيات</button>
           <button onClick={() => setCurrentView('admin-bookings')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white ${currentView === 'admin-bookings' ? 'text-[#C5A059]' : 'text-white/30'}`}>الحجوزات</button>
           <button onClick={() => setCurrentView('admin-cars')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white ${currentView === 'admin-cars' ? 'text-[#C5A059]' : 'text-white/30'}`}>السيارات</button>
           <button onClick={() => setCurrentView('admin-assistant')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white ${currentView === 'admin-assistant' ? 'text-[#C5A059]' : 'text-white/30'}`}>المساعد</button>
           <button onClick={() => setCurrentView('admin-settings')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white ${currentView === 'admin-settings' ? 'text-[#C5A059]' : 'text-white/30'}`}>الإعدادات</button>
        </div>
      )}

      <main className={`flex-1 flex flex-col ${currentView === 'home' ? 'px-0 py-0' : 'px-6 md:px-12 py-12 md:py-16'} gap-16 lg:overflow-visible relative`}>
        
        {currentView === 'home' && (
          <>
            <Hero siteName={settings.siteName} onExplore={() => setCurrentView('fleet')} />
            {isAdminMode && !isAdmin && (
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#C5A059] text-black px-6 py-2 rounded-full text-xs font-bold animate-bounce z-40 shadow-xl border-2 border-black">
                يرجى تسجيل الدخول من الزر 🔒 في الأعلى للوصول للوحة التحكم
              </div>
            )}
          </>
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
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('admin', 'true');
              window.location.href = url.toString();
            }} 
            className="text-[8px] text-white/10 hover:text-white/30 transition-colors cursor-pointer"
          >
            Management
          </button>
          <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition-colors font-sans text-xs">
            Instagram
          </a>
          <div className="hidden sm:block font-sans">&copy; {new Date().getFullYear()} {settings.siteName}.</div>
        </div>
      </footer>
    </div>
  );
}
