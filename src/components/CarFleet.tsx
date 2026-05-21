import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Car } from '../services/carsData';
import { useSettings } from '../services/useSettings';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, Phone, MapPin, Mail, Shield, Fuel, Gauge, CreditCard, Car, Users, Clock, CheckCircle, ShieldCheck, Truck, Baby, Map, Star, Award, TrendingUp, HeadphonesIcon, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
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
    <div className="w-full flex flex-col pt-4 md:pt-8 fade-in">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
        <div className="md:max-w-xl">
          <h2 className="text-3xl md:text-4xl font-serif text-[#C5A059] mb-2">{settings.heroTitle}</h2>
          <p className="text-white/50 text-xs md:text-sm">{settings.heroSubtitle}</p>
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
      <div className="mb-8 md:mb-12 border-y border-white/5 py-4 md:py-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-5 md:px-6 py-2.5 md:py-2 text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all border whitespace-nowrap rounded-sm flex-shrink-0 active:scale-95 touch-manipulation ${
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
            className={`flex items-center justify-center gap-2 px-6 py-3 md:py-2 text-[10px] uppercase tracking-[0.2em] border transition-all active:scale-95 touch-manipulation ${
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredCars.length > 0 ? (
            filteredCars.map(car => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={car.id} 
                className="group bg-[#141414] border border-white/5 p-5 md:p-6 cursor-pointer hover:border-[#C5A059]/50 transition-colors flex flex-col justify-between min-h-[360px] md:min-h-[400px] active:scale-[0.98] transition-transform"
                onClick={() => onSelectCar(car.id)}
              >
                <div>
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div>
                      <span className="text-[#C5A059] text-[9px] md:text-[10px] uppercase tracking-widest block mb-1">{car.brand}</span>
                      <h3 className="text-2xl md:text-3xl font-serif text-white group-hover:text-[#C5A059] transition-colors line-clamp-1">{car.model}</h3>
                    </div>
                    <span className="text-white/30 text-xl md:text-2xl font-serif italic">{car.year}</span>
                  </div>
                  
                  <div className="w-full h-40 md:h-48 bg-white/5 mb-4 md:mb-6 overflow-hidden flex items-center justify-center relative rounded-sm">
                     <img src={car.imageUrl} alt={car.model} loading="lazy" referrerPolicy="no-referrer" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                  <div>
                    <span className="block text-[9px] md:text-[10px] uppercase tracking-[0.1em] text-white/30 mb-1">السعر اليومي</span>
                    <span className="text-xl font-bold text-white tracking-widest">{car.pricePerDay} <span className="text-[10px] text-white/50 font-normal">درهم</span></span>
                  </div>
                  <div className="w-10 h-10 border border-white/10 flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#0A0A0A] group-hover:border-[#C5A059] transition-all duration-300 rounded-sm">
                    ←
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-lg">
              <p className="text-white/30 text-sm">لم يتم العثور على سيارات تطابق بحثك.</p>
              <button 
                onClick={clearFilters}
                className="mt-4 text-[#C5A059] text-xs uppercase tracking-widest hover:underline"
              >
                إعادة تعيين الكل
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* About Us Section */}
      <div className="w-full border-t border-white/5 pt-16 pb-8 mt-16">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="w-full lg:w-1/2">
            <div className="relative w-full h-[300px] md:h-[400px] bg-gradient-to-br from-[#C5A059]/20 to-transparent border border-white/5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 md:w-48 md:h-48 border-2 border-[#C5A059]/30 rounded-full flex items-center justify-center">
                  <Car className="w-16 h-16 md:w-24 md:h-24 text-[#C5A059] opacity-60" />
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <span className="text-[#C5A059] text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">عن الشركة</span>
            <h3 className="text-3xl md:text-4xl font-serif text-white mb-6">{settings.aboutTitle}</h3>
            <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
              {settings.aboutText}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="border border-white/5 p-4 text-center">
                <span className="text-[#C5A059] text-2xl md:text-3xl font-bold block">6+</span>
                <span className="text-white/40 text-[10px] uppercase tracking-widest">سيارة متاحة</span>
              </div>
              <div className="border border-white/5 p-4 text-center">
                <span className="text-[#C5A059] text-2xl md:text-3xl font-bold block">50+</span>
                <span className="text-white/40 text-[10px] uppercase tracking-widest">عميل سعيد</span>
              </div>
              <div className="border border-white/5 p-4 text-center">
                <span className="text-[#C5A059] text-2xl md:text-3xl font-bold block">24/7</span>
                <span className="text-white/40 text-[10px] uppercase tracking-widest">دعم فني</span>
              </div>
              <div className="border border-white/5 p-4 text-center">
                <span className="text-[#C5A059] text-2xl md:text-3xl font-bold block">100%</span>
                <span className="text-white/40 text-[10px] uppercase tracking-widest">توصيل للمطار</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="w-full border-t border-white/5 pt-16 pb-8 mt-16">
        <div className="text-center mb-12">
          <span className="text-[#C5A059] text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">خدماتنا</span>
          <h3 className="text-3xl md:text-4xl font-serif text-white mb-4">خدمات إضافية مميزة</h3>
          <p className="text-white/50 text-sm max-w-xl mx-auto">نقدم لكم مجموعة من الخدمات الإضافية لجعل تجربتكم أكثر راحة وتميزاً</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Truck, title: "توصيل المطار", desc: "توصيل واستلام مجاني من وإلى مطار طنجة ابن بطوطة" },
            { icon: Users, title: "سائق إضافي", desc: "إمكانية إضافة سائق ثانٍ بتكلفة رمزية" },
            { icon: Baby, title: "كرسي أطفال", desc: "كراسي أطفال مجانية حسب التوفر" },
            { icon: Map, title: "GPS مدمج", desc: "نظام ملاحة GPS لترشدك في كل مكان" },
            { icon: Clock, title: "خدمة 24/7", desc: "فريق دعم متاح على مدار الساعة للطوارئ" },
            { icon: ShieldCheck, title: "سيارات معقمة", desc: "تعقيم شامل للسيارات قبل وبعد كل استئجار" },
          ].map((svc, idx) => (
            <div key={idx} className="bg-[#141414] border border-white/5 p-8 group hover:border-[#C5A059]/30 transition-all duration-500">
              <div className="w-14 h-14 border border-[#C5A059]/30 flex items-center justify-center mb-6 group-hover:bg-[#C5A059] group-hover:text-[#0A0A0A] transition-all">
                <svc.icon className="w-6 h-6 text-[#C5A059] group-hover:text-[#0A0A0A]" />
              </div>
              <h4 className="text-lg font-serif text-white mb-2">{svc.title}</h4>
              <p className="text-white/50 text-xs leading-relaxed">{svc.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Policies Section */}
      <div className="w-full border-t border-white/5 pt-16 pb-8 mt-16">
        <div className="text-center mb-12">
          <span className="text-[#C5A059] text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">السياسات والشروط</span>
          <h3 className="text-3xl md:text-4xl font-serif text-white mb-4">معلومات مهمة قبل الحجز</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#141414] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-[#C5A059]" />
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">التأمين</h4>
            </div>
            <p className="text-white/50 text-xs leading-relaxed whitespace-pre-line">{settings.insuranceText}</p>
          </div>
          <div className="bg-[#141414] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Fuel className="w-5 h-5 text-[#C5A059]" />
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">الوقود</h4>
            </div>
            <p className="text-white/50 text-xs leading-relaxed">{settings.fuelPolicy}</p>
          </div>
          <div className="bg-[#141414] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gauge className="w-5 h-5 text-[#C5A059]" />
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">الكيلومترات</h4>
            </div>
            <p className="text-white/50 text-xs leading-relaxed">{settings.mileagePolicy}</p>
          </div>
          <div className="bg-[#141414] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-[#C5A059]" />
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">طرق الدفع</h4>
            </div>
            <p className="text-white/50 text-xs leading-relaxed whitespace-pre-line">{settings.paymentMethods}</p>
          </div>
          <div className="bg-[#141414] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <HeadphonesIcon className="w-5 h-5 text-[#C5A059]" />
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">شروط السائق</h4>
            </div>
            <p className="text-white/50 text-xs leading-relaxed whitespace-pre-line">{settings.driverRequirements}</p>
          </div>
          <div className="bg-[#141414] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-[#C5A059]" />
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">الإلغاء</h4>
            </div>
            <p className="text-white/50 text-xs leading-relaxed whitespace-pre-line">{settings.cancellationPolicy}</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="w-full border-t border-white/5 pt-16 pb-8 mt-16">
        <div className="text-center mb-12">
          <span className="text-[#C5A059] text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">الأسئلة الشائعة</span>
          <h3 className="text-3xl md:text-4xl font-serif text-white mb-4">هل لديك استفسار؟</h3>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            { q: "ما هي المستندات المطلوبة لاستئجار سيارة؟", a: "تحتاج إلى رخصة سياقة سارية المفعول (رخصة دولية للسائحين)، بطاقة تعريف وطنية أو جواز سفر، وإيداع مبلغ التأمين (Caution) حسب فئة السيارة." },
            { q: "هل يمكنني استئجار سيارة وأنا أقل من 21 سنة؟", a: "عذراً، الحد الأدنى للسن هو 21 سنة. للسيارات الفاخرة، الحد الأدنى هو 25 سنة." },
            { q: "هل توجد رسوم إضافية للكيلومترات الإضافية؟", a: "لا، جميع سياراتنا بدون حدود للكيلومترات. يمكنك القيادة بحرية تامة." },
            { q: "كيف تتم عملية تسليم واستلام السيارة؟", a: "نوصل السيارة إليك أينما كنت في طنجة (مطار، فندق، منزل) مجاناً. ويتم الاستلام بنفس الطريقة." },
            { q: "ما هو مبلغ التأمين (Caution)؟", a: "يختلف حسب فئة السيارة ويتم إرجاعه كاملاً عند إعادة السيارة بحالة جيدة." },
            { q: "هل يمكنني تمديد مدة الإيجار؟", a: "نعم، يمكنك تمديد المدة حسب توفر السيارة. يُرجى الاتصال بنا قبل 24 ساعة من نهاية الإيجار." },
          ].map((faq, idx) => (
            <div key={idx} className="bg-[#141414] border border-white/5">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center p-5 text-right"
              >
                <span className="text-sm text-white font-medium">{faq.q}</span>
                {activeFaq === idx ? <ChevronUp className="w-4 h-4 text-[#C5A059] shrink-0 mr-4" /> : <ChevronDown className="w-4 h-4 text-[#C5A059] shrink-0 mr-4" />}
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5">
                  <p className="text-white/50 text-xs leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Terms & Conditions Section */}
      <div className="w-full border-t border-white/5 pt-16 pb-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-[#C5A059] text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">الشروط والأحكام</span>
            <h3 className="text-3xl font-serif text-white mb-4">شروط الإيجار العامة</h3>
          </div>
          <div className="bg-[#141414] border border-white/5 p-8">
            <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{settings.termsText}</p>
          </div>
        </div>
      </div>

      {/* Contact & Map Section */}
      <div className="w-full border-t border-white/5 pt-16 pb-8 mt-16" id="contact">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Contact Info */}
          <div className="w-full lg:w-1/3 flex flex-col gap-8">
            <div>
              <span className="text-[#C5A059] text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">تواصل معنا</span>
              <h3 className="text-3xl md:text-4xl font-serif text-white mb-4">نحن هنا لمساعدتك</h3>
              <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
                {settings.description}
              </p>
            </div>
            
            <div className="flex flex-col gap-6">
              <a href={`https://wa.me/${settings.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent('مرحباً، أود الاستفسار عن كراء السيارات')}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group cursor-pointer">
                <div className="w-12 h-12 border border-[#C5A059]/30 flex items-center justify-center shrink-0 text-[#C5A059] text-xl group-hover:bg-[#C5A059] group-hover:text-[#0A0A0A] transition-all">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center min-h-12 py-1">
                  <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">واتساب / اتصال</span>
                  <span className="text-sm text-white/90 font-mono tracking-widest group-hover:text-[#C5A059] transition-colors" dir="ltr">{settings.phoneNumber}</span>
                </div>
              </a>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 border border-[#C5A059]/30 flex items-center justify-center shrink-0 text-[#C5A059] text-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center min-h-12 py-1">
                  <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">العنوان</span>
                  <span className="text-sm text-white/90 whitespace-pre-line leading-relaxed">{settings.address}</span>
                </div>
              </div>

              <a href={`mailto:${settings.email}`} className="flex items-start gap-4 group cursor-pointer">
                <div className="w-12 h-12 border border-[#C5A059]/30 flex items-center justify-center shrink-0 text-[#C5A059] text-xl group-hover:bg-[#C5A059] group-hover:text-[#0A0A0A] transition-all">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center h-12">
                  <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">البريد الإلكتروني</span>
                  <span className="text-sm text-white/90 font-mono group-hover:text-[#C5A059] transition-colors">{settings.email}</span>
                </div>
              </a>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-4">
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-white/10 flex items-center justify-center text-white/40 hover:border-[#C5A059] hover:text-[#C5A059] transition-all" title="Instagram">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-white/10 flex items-center justify-center text-white/40 hover:border-[#C5A059] hover:text-[#C5A059] transition-all" title="Facebook">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {settings.tiktokUrl && (
                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-white/10 flex items-center justify-center text-white/40 hover:border-[#C5A059] hover:text-[#C5A059] transition-all" title="TikTok">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </a>
              )}
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
