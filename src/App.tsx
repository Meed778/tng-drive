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
  const { user, profile, logout, login, loading } = useAuth();
  const { settings } = useSettings();
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('tng-drive-view');
    if (saved && (saved.startsWith('admin-') || saved === 'fleet' || saved === 'details')) {
      return saved as ViewState;
    }
    return 'home';
  });

  useEffect(() => {
    localStorage.setItem('tng-drive-view', currentView);
  }, [currentView]);

  const [selectedCarId, setSelectedCarId] = useState<string | null>(() => {
    return localStorage.getItem('tng-drive-selected-car');
  });

  useEffect(() => {
    if (selectedCarId) {
      localStorage.setItem('tng-drive-selected-car', selectedCarId);
    } else {
      localStorage.removeItem('tng-drive-selected-car');
    }
  }, [selectedCarId]);

  const [authInitialized, setAuthInitialized] = useState(false);
  
  const [dbCars, setDbCars] = useState<Car[]>([]);

  useEffect(() => {
    if (!loading) {
      setAuthInitialized(true);
    }
  }, [loading]);

  useEffect(() => {
    async function fetchCars() {
      try {
        const snap = await getDocs(collection(db, 'cars'));
        if (snap.empty) {
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

  // Improved Admin Detection
  const isAdminMode = window.location.pathname.includes('admin') || window.location.search.includes('admin') || window.location.hash.includes('admin');
  const isAdmin = !!user && (user.email === 'pimo1999loko@gmail.com' || user.email === 'tangierdrive40@gmail.com' || profile?.isAdmin === true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authInitialized) return;

    // Handle Admin Mode Navigation
    // If user specifically entered admin mode but isn't on an admin view, send them there
    if (isAdminMode && isAdmin && !currentView.startsWith('admin-')) {
      setCurrentView('admin-analytics');
    }
    
    // Redirect non-admins away from admin views immediately if they are unauthorized
    if (currentView.startsWith('admin-') && !loading && !isAdmin) {
      console.log("[Auth] Unauthorized access to admin view, redirecting to home");
      setCurrentView('home');
    }
  }, [isAdmin, isAdminMode, currentView, authInitialized, loading]);

  if (loading && !authInitialized) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-serif text-[#C5A059]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-16 h-16 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
           <div className="text-xl tracking-widest uppercase animate-pulse">Tangier Drive</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-[#E5E5E5] font-sans flex flex-col overflow-x-hidden select-none" dir="rtl">
      <header className="h-24 flex items-center justify-between px-4 md:px-12 border-b border-white/5 shrink-0 relative z-50">
        <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }}>
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
            {/* Elegant Logo Icon */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#C5A059] to-[#E5C48B] rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-700 shadow-[0_0_20px_rgba(197,160,89,0.4)]"></div>
            <div className="absolute inset-1 bg-[#0A0A0A] rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-700"></div>
            <span className="relative z-10 font-serif text-[#C5A059] text-lg md:text-xl font-bold italic tracking-tighter">tng</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg md:text-2xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#C5A059] to-white group-hover:via-white transition-all duration-1000">
              tng Drive
            </span>
            <span className="text-[7px] md:text-[8px] uppercase tracking-[0.4em] text-[#C5A059] font-bold opacity-70 -mt-0.5 md:-mt-1 whitespace-nowrap">Luxury Car Rental</span>
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
          <div className="fixed inset-0 top-24 bg-[#0A0A0A] z-40 flex flex-col p-8 gap-4 lg:hidden animate-in fade-in slide-in-from-top-4 duration-300 overflow-y-auto">
             <button onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }} className={`text-right py-4 border-b border-white/5 text-lg ${currentView === 'home' ? 'text-[#C5A059]' : 'text-white/70'}`}>الرئيسية</button>
             <button onClick={() => { setCurrentView('fleet'); setIsMobileMenuOpen(false); }} className={`text-right py-4 border-b border-white/5 text-lg ${currentView === 'fleet' ? 'text-[#C5A059]' : 'text-white/70'}`}>أسطول السيارات</button>
             
             {isAdmin && (
               <div className="flex flex-col gap-2 py-4 border-b border-white/5">
                 <span className="text-right text-[10px] uppercase tracking-widest text-white/30 mb-2 font-bold px-1">لوحة التحكم</span>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setCurrentView('admin-analytics'); setIsMobileMenuOpen(false); }} className={`text-right p-3 bg-white/5 rounded-sm text-sm ${currentView === 'admin-analytics' ? 'text-[#C5A059] border border-[#C5A059]/30' : 'text-white/70'}`}>الإحصائيات</button>
                    <button onClick={() => { setCurrentView('admin-bookings'); setIsMobileMenuOpen(false); }} className={`text-right p-3 bg-white/5 rounded-sm text-sm ${currentView === 'admin-bookings' ? 'text-[#C5A059] border border-[#C5A059]/30' : 'text-white/70'}`}>الحجوزات</button>
                    <button onClick={() => { setCurrentView('admin-cars'); setIsMobileMenuOpen(false); }} className={`text-right p-3 bg-white/5 rounded-sm text-sm ${currentView === 'admin-cars' ? 'text-[#C5A059] border border-[#C5A059]/30' : 'text-white/70'}`}>السيارات</button>
                    <button onClick={() => { setCurrentView('admin-settings'); setIsMobileMenuOpen(false); }} className={`text-right p-3 bg-white/5 rounded-sm text-sm ${currentView === 'admin-settings' ? 'text-[#C5A059] border border-[#C5A059]/30' : 'text-white/70'}`}>الإعدادات</button>
                 </div>
               </div>
             )}

             <div className="mt-8 flex flex-col gap-4">
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
        <div className="relative h-12 bg-[#141414] border-b border-white/5 flex items-center shrink-0">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#141414] to-transparent z-10 pointer-events-none md:hidden"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#141414] to-transparent z-10 pointer-events-none md:hidden"></div>
          
          <div className="flex items-center px-6 md:px-12 gap-8 overflow-x-auto no-scrollbar scroll-smooth w-full">
             <button onClick={() => setCurrentView('admin-analytics')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white py-4 ${currentView === 'admin-analytics' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30'}`}>الإحصائيات</button>
             <button onClick={() => setCurrentView('admin-bookings')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white py-4 ${currentView === 'admin-bookings' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30'}`}>الحجوزات</button>
             <button onClick={() => setCurrentView('admin-cars')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white py-4 ${currentView === 'admin-cars' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30'}`}>السيارات</button>
             <button onClick={() => setCurrentView('admin-assistant')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white py-4 ${currentView === 'admin-assistant' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30'}`}>المساعد</button>
             <button onClick={() => setCurrentView('admin-settings')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white py-4 ${currentView === 'admin-settings' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30'}`}>الإعدادات</button>
          </div>
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
