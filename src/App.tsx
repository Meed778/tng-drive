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
import { Hero } from './components/Hero';
import { CarFleet } from './components/CarFleet';
import { CarDetails } from './components/CarDetails';
import { cars as mockCars, Car } from './services/carsData';
import { Phone, ChevronUp } from 'lucide-react';

type ViewState = 'home' | 'fleet' | 'details' | 'admin-bookings' | 'admin-cars' | 'admin-analytics' | 'admin-settings';

export default function App() {
  const { user, profile, logout, login, loading } = useAuth();
  const { settings } = useSettings();
  
  const isAdmin = !!user && (
    user.email?.toLowerCase() === 'pimo1999loko@gmail.com' || 
    user.email?.toLowerCase() === 'tangierdrive40@gmail.com' || 
    profile?.isAdmin === true
  );

  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('tng-drive-view');
    if (saved && (saved.startsWith('admin-') || saved === 'fleet' || saved === 'details')) {
      return saved as ViewState;
    }
    return 'fleet';
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
      if (dbCars.length > 0 && dbCars[0].id !== mockCars[0].id) return; // Already fetched from DB
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
  }, []); // Only fetch once on mount

  const selectedCar = selectedCarId ? dbCars.find(c => c.id === selectedCarId) : null;

  const navigateToDetails = (id: string) => {
    setSelectedCarId(id);
    setCurrentView('details');
  };

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        if (isAdmin) {
          setCurrentView('admin-analytics');
        }
      } else if (hash === '#fleet' || hash === '#home' || hash === '') {
        setCurrentView('fleet');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    if (window.location.hash === '#admin' && isAdmin) {
      setCurrentView('admin-analytics');
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAdmin]);

  // Sync currentView to Hash for better UX and Refresh handling
  useEffect(() => {
    if (currentView === 'fleet' || currentView === 'home') {
      if (window.location.hash !== '#fleet') window.history.replaceState(null, '', '#fleet');
    } else if (currentView.startsWith('admin-')) {
      if (window.location.hash !== '#admin') window.history.replaceState(null, '', '#admin');
    }
  }, [currentView]);

  // Reactive Admin Mode Detection
  const [isAdminMode, setIsAdminMode] = useState(() => 
    window.location.pathname.includes('admin') || window.location.search.includes('admin') || window.location.hash.includes('admin')
  );

  useEffect(() => {
    const checkAdminMode = () => {
      const isMode = window.location.pathname.includes('admin') || window.location.search.includes('admin') || window.location.hash.includes('admin');
      setIsAdminMode(isMode);
    };

    window.addEventListener('hashchange', checkAdminMode);
    window.addEventListener('popstate', checkAdminMode);
    return () => {
      window.removeEventListener('hashchange', checkAdminMode);
      window.removeEventListener('popstate', checkAdminMode);
    };
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);

  useEffect(() => {
    if (!authInitialized) return;

    // Redirect logic: Only trigger auto-navigation once when auth is settled
    if (isAdminMode && isAdmin && currentView === 'home' && !hasAutoNavigated) {
      setCurrentView('admin-analytics');
      setHasAutoNavigated(true);
    }
    
    // Redirect non-admins away from admin views
    if (currentView.startsWith('admin-') && !loading && !isAdmin && authInitialized) {
      console.log("[Auth] Unauthorized access to admin view, redirecting to fleet");
      setCurrentView('fleet');
    }
  }, [isAdmin, isAdminMode, authInitialized, loading, hasAutoNavigated, currentView]);

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
      <header className="sticky top-0 h-16 md:h-24 flex items-center justify-between px-4 md:px-12 border-b border-white/5 shrink-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-lg">
        <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => { setCurrentView('fleet'); setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
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
          <div className="fixed inset-0 top-16 md:top-24 bg-[#0A0A0A]/95 backdrop-blur-md z-40 flex flex-col p-8 lg:hidden animate-in fade-in slide-in-from-top-4 duration-300 overflow-y-auto">
             <div className="flex flex-col gap-2">
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
           </div>

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
        <div className="sticky top-16 md:top-24 h-12 bg-[#141414] border-b border-white/5 flex items-center shrink-0 z-40">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#141414] to-transparent z-10 pointer-events-none md:hidden"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#141414] to-transparent z-10 pointer-events-none md:hidden"></div>
          
          <div className="flex items-center px-6 md:px-12 gap-8 overflow-x-auto no-scrollbar scroll-smooth w-full">
             <button onClick={() => setCurrentView('admin-analytics')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white py-4 ${currentView === 'admin-analytics' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30'}`}>الإحصائيات</button>
             <button onClick={() => setCurrentView('admin-bookings')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white py-4 ${currentView === 'admin-bookings' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30'}`}>الحجوزات</button>
             <button onClick={() => setCurrentView('admin-cars')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white py-4 ${currentView === 'admin-cars' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30'}`}>السيارات</button>
             <button onClick={() => setCurrentView('admin-settings')} className={`whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white py-4 ${currentView === 'admin-settings' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30'}`}>الإعدادات</button>
          </div>
        </div>
      )}

      <main className={`flex-1 flex flex-col px-4 md:px-12 py-8 md:py-16 gap-10 md:gap-16 lg:overflow-visible relative`}>
        
        {currentView === 'fleet' && (
           <CarFleet cars={dbCars} onSelectCar={navigateToDetails} />
        )}
        
        {currentView === 'details' && (
           <>
             {!selectedCar && dbCars.length > 0 ? (
               // Fallback if car not found
               <div className="flex flex-col items-center justify-center py-20 text-white/50">
                 <p className="mb-4">عذراً، لم يتم العثور على السيارة.</p>
                 <button onClick={() => setCurrentView('fleet')} className="text-[#C5A059] border border-[#C5A059] px-6 py-2">العودة للأسطول</button>
               </div>
             ) : !selectedCar ? (
               // Loading state for specific car
               <div className="flex flex-col items-center justify-center py-20 animate-pulse text-[#C5A059]">
                 <div className="w-12 h-12 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p>جاري تحميل تفاصيل السيارة...</p>
               </div>
             ) : (
               <CarDetails car={selectedCar} onBack={() => setCurrentView('fleet')} />
             )}
           </>
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

      </main>

      <footer className="h-20 px-6 md:px-12 flex items-center justify-between border-t border-white/5 text-[10px] tracking-[0.1em] text-white/30 shrink-0 mt-8">
        <div className="flex gap-4 md:gap-8 flex-wrap items-center">
          <span>التوصيل للمطار مجاناً</span>
          <span>دعم فني 24/7</span>
          <span>سيارات معقمة بالكامل</span>
          <a href={`https://wa.me/${settings.phoneNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#C5A059] hover:text-white transition-colors font-sans text-xs hidden md:inline-flex items-center gap-1">
            <Phone className="w-3 h-3" /> {settings.phoneNumber}
          </a>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => {
              if (isAdmin) {
                setCurrentView('admin-analytics');
              } else if (!isAdminMode) {
                const url = new URL(window.location.href);
                url.searchParams.set('admin', 'true');
                window.history.pushState({}, '', url.toString());
                setIsAdminMode(true);
                setCurrentView('fleet'); 
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                login();
              }
            }} 
            className={`text-[9px] transition-colors cursor-pointer ${isAdmin ? 'text-[#C5A059] font-bold' : 'text-white/10 hover:text-white/30'}`}
          >
            Management
          </button>
          <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition-colors font-sans text-xs">
            Instagram
          </a>
          {settings.facebookUrl && (
            <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition-colors font-sans text-xs">
              Facebook
            </a>
          )}
          <div className="hidden sm:block font-sans">&copy; {new Date().getFullYear()} {settings.siteName}.</div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${settings.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent('مرحباً! أود الاستفسار عن كراء السيارات')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_4px_30px_rgba(37,211,102,0.6)] hover:scale-110 transition-all duration-300 animate-bounce group"
        title="تواصل معنا عبر واتساب"
      >
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center animate-pulse">
          1
        </span>
      </a>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-full flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0A0A0A] transition-all duration-300"
        title="العودة للأعلى"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}
