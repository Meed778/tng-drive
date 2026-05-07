import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Car } from '../services/carsData';
import { useSettings } from '../services/useSettings';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

interface CarFleetProps {
  onSelectCar: (carId: string) => void;
  cars: Car[];
}

export function CarFleet({ onSelectCar, cars }: CarFleetProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [showFilters, setShowFilters] = useState(false);
  const { settings } = useSettings();
  
  const categories = useMemo(() => ['All', ...Array.from(new Set(cars.map(c => c.category)))], [cars]);
  const brands = useMemo(() => ['All', ...Array.from(new Set(cars.map(c => c.brand)))], [cars]);
  
  const maxPrice = useMemo(() => Math.max(...cars.map(c => c.pricePerDay), 10000), [cars]);

  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const matchesCategory = categoryFilter === 'All' || car.category === categoryFilter;
      const matchesBrand = brandFilter === 'All' || car.brand === brandFilter;
      const matchesSearch = 
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
        car.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = car.pricePerDay >= priceRange[0] && car.pricePerDay <= priceRange[1];
      
      return matchesCategory && matchesBrand && matchesSearch && matchesPrice;
    });
  }, [cars, categoryFilter, brandFilter, searchTerm, priceRange]);

  const clearFilters = () => {
    setCategoryFilter('All');
    setBrandFilter('All');
    setSearchTerm('');
    setPriceRange([0, 20000]);
  };

  if (cars.length === 0) {
    return (
      <div className="w-full flex justify-center py-24 text-white/50">
        جاري تحميل أسطول السيارات... أو لا توجد سيارات متاحة حالياً.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pt-8 fade-in">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-serif text-[#C5A059] mb-2">{settings.heroTitle}</h2>
          <p className="text-white/50 text-sm">{settings.heroSubtitle}</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#C5A059] transition-colors" />
          <input 
            type="text" 
            placeholder="ابحث عن ماركة أو موديل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141414] border border-white/10 rounded-none py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5A059]/50 transition-all"
            dir="rtl"
          />
        </div>
      </div>

      {/* Filter Controls Component */}
      <div className="mb-12 border-y border-white/5 py-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-6 py-2 text-[10px] uppercase tracking-[0.2em] transition-all border whitespace-nowrap ${
                  categoryFilter === cat 
                    ? 'border-[#C5A059] bg-[#C5A059] text-[#0A0A0A]' 
                    : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat === 'All' ? 'الكل' : cat}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-2 text-[10px] uppercase tracking-[0.2em] border transition-all ${
              showFilters ? 'border-[#C5A059] text-[#C5A059]' : 'border-white/10 text-white/50 hover:border-white/20'
            }`}
          >
            <SlidersHorizontal size={14} />
            تصفية متقدمة
            <ChevronDown size={14} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded Filters Pane */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 p-8 bg-[#0F0F0F] border border-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Brand Filter */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-white/30 block">الماركة</label>
              <div className="relative">
                <select 
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 py-3 px-4 text-sm text-white appearance-none focus:outline-none focus:border-[#C5A059]/50"
                >
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand === 'All' ? 'جميع الماركات' : brand}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-white/30 block flex justify-between">
                <span>نطاق السعر (درهم/يوم)</span>
                <span className="text-[#C5A059]">أقصى {priceRange[1]}</span>
              </label>
              <div className="px-2 pt-2">
                <input 
                  type="range" 
                  min="0" 
                  max={maxPrice} 
                  step="500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-[#C5A059] bg-white/5 h-1.5 rounded-full"
                />
                <div className="flex justify-between text-[10px] text-white/30 mt-2">
                  <span>0</span>
                  <span>{maxPrice}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-end justify-end gap-4">
              <button 
                onClick={clearFilters}
                className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors flex items-center gap-2 mb-2"
              >
                <X size={14} />
                مسح التصفية
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-8 flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          تم العثور على <span className="text-white">{filteredCars.length}</span> سيارات
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredCars.length > 0 ? (
          filteredCars.map(car => (
            <div 
              key={car.id} 
              className="group bg-[#141414] border border-white/5 p-6 cursor-pointer hover:border-[#C5A059]/50 transition-colors flex flex-col justify-between min-h-[400px]"
              onClick={() => onSelectCar(car.id)}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[#C5A059] text-[10px] uppercase tracking-widest block mb-1">{car.brand}</span>
                    <h3 className="text-3xl font-serif text-white group-hover:text-[#C5A059] transition-colors">{car.model}</h3>
                  </div>
                  <span className="text-white/30 text-2xl font-serif italic">{car.year}</span>
                </div>
                
                <div className="w-full h-48 bg-white/5 mb-6 overflow-hidden flex items-center justify-center relative">
                   <img src={car.imageUrl} alt={car.model} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-white/5 pt-4">
                <div>
                  <span className="block text-[10px] uppercase tracking-[0.1em] text-white/30 mb-1">السعر اليومي</span>
                  <span className="text-xl font-bold text-white">{car.pricePerDay} <span className="text-xs text-white/50 font-normal">درهم</span></span>
                </div>
                <div className="w-10 h-10 border border-white/10 flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#0A0A0A] group-hover:border-[#C5A059] transition-all duration-300">
                  ←
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center border border-dashed border-white/10">
            <p className="text-white/30 text-sm">لم يتم العثور على سيارات تطابق بحثك. حاول تغيير معايير البحث.</p>
            <button 
              onClick={clearFilters}
              className="mt-4 text-[#C5A059] text-xs uppercase tracking-widest hover:underline"
            >
              إعادة تعيين الكل
            </button>
          </div>
        )}
      </div>

      {/* Contact & Map Section */}
      <div className="w-full border-t border-white/5 pt-16 pb-8 mt-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Contact Info */}
          <div className="w-full lg:w-1/3 flex flex-col gap-8">
            <div>
              <h3 className="text-3xl font-serif text-[#C5A059] mb-4">تواصل معنا</h3>
              <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
                {settings.description}
              </p>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 border border-[#C5A059]/30 flex items-center justify-center shrink-0 text-[#C5A059] text-xl">
                  📍
                </div>
                <div className="flex flex-col justify-center min-h-12 py-1">
                  <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">العنوان</span>
                  <span className="text-sm text-white/90 whitespace-pre-line leading-relaxed">{settings.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 border border-[#C5A059]/30 flex items-center justify-center shrink-0 text-[#C5A059] text-xl">
                  📞
                </div>
                <div className="flex flex-col justify-center h-12">
                  <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">الهاتف / واتساب</span>
                  <span className="text-sm text-white/90 font-mono tracking-widest" dir="ltr">{settings.phoneNumber}</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 border border-[#C5A059]/30 flex items-center justify-center shrink-0 text-[#C5A059] text-xl">
                  ✉️
                </div>
                <div className="flex flex-col justify-center h-12">
                  <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">البريد الإلكتروني</span>
                  <span className="text-sm text-white/90 font-mono">{settings.email}</span>
                </div>
              </div>

              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group cursor-pointer">
                <div className="w-12 h-12 border border-[#C5A059]/30 flex items-center justify-center shrink-0 text-[#C5A059] text-xl group-hover:bg-[#C5A059] group-hover:text-[#0A0A0A] transition-colors">
                  📸
                </div>
                <div className="flex flex-col justify-center h-12">
                  <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">انستغرام</span>
                  <span className="text-sm text-white/90 font-mono group-hover:text-[#C5A059] transition-colors">{settings.instagramHandle}</span>
                </div>
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="w-full lg:w-2/3 h-[400px] border border-white/10 bg-[#0A0A0A] p-2 relative group overflow-hidden">
            <div className="absolute inset-0 border-[4px] border-[#0A0A0A] pointer-events-none z-10"></div>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3237.96205791781!2d-5.8152345!3d35.7517173!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd0b808ad6a28fd9%3A0xc6cbde8cbce3e507!2sTangier%2C%20Morocco!5e0!3m2!1sen!2sus!4v1714080000000!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{ filter: 'grayscale(1) contrast(1.2) opacity(0.8) invert(1) hue-rotate(180deg)' }}
              className="border-0 transition-all duration-700 ease-in-out group-hover:filter-none"
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
