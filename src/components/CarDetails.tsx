import React, { useState, useEffect } from 'react';
import { BookingCalendar } from './BookingCalendar';
import { Car } from '../services/carsData';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/useAuth';
import { format } from 'date-fns';

interface CarDetailsProps {
  car: Car;
  originalPrice?: number;
  onBack: () => void;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export function CarDetails({ car, onBack }: CarDetailsProps) {
  const { user, login } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Dynamic SEO Title
    document.title = `${car.brand} ${car.model} | TNG Drive`;
    return () => { document.title = "TNG Drive | كراء السيارات في طنجة"; }
  }, [car]);

  useEffect(() => {
    async function fetchReviews() {
      const q = query(collection(db, 'reviews'), where('carId', '==', car.id));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    }
    fetchReviews();
  }, [car.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return login();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const newReview = {
        carId: car.id,
        userId: user.uid,
        userName: user.email?.split('@')[0] || 'ضيف',
        rating,
        comment,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'reviews'), newReview);
      setReviews([...reviews, { id: docRef.id, ...newReview } as any]);
      setComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 'جديد';

  return (
    <div className="flex flex-col gap-16 w-full fade-in">
      {/* Top Section: Details & Booking */}
      <div className="flex flex-col lg:flex-row gap-16 w-full">
        {/* Car Details Area */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between h-full min-h-[400px]">
          <div className="space-y-8 mt-4 lg:mt-0">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-[#C5A059] text-[10px] uppercase tracking-[0.2em] font-medium border border-white/20 px-4 py-2 hover:bg-[#C5A059] hover:text-[#0A0A0A] transition-colors ml-4 cursor-pointer">
                ← عودة للأسطول
              </button>
              <span className="h-px w-8 bg-[#C5A059]"></span>
              <span className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-medium">
                متاح للتسليم الفوري
              </span>
            </div>
            
            <div className="relative w-full h-[300px] bg-white/5 rounded-sm overflow-hidden border border-white/5 mt-8 hidden md:block">
              <img src={car.imageUrl} alt={car.model} className="object-cover w-full h-full opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent"></div>
            </div>

            <h1 className="text-5xl md:text-[72px] font-serif leading-[1] text-white tracking-tight mt-4">
              {car.brand}<br />
              <span className="italic font-light opacity-80 text-4xl md:text-[56px]">{car.model} {car.year}</span>
            </h1>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[#C5A059] text-xl">★ {averageRating}</span>
              <span className="text-white/40 text-xs">({reviews.length} تقييمات)</span>
            </div>

            <p className="text-sm text-white/60 leading-relaxed max-w-md font-light">
              {car.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-8 md:gap-16 items-end pb-2 mt-12 pt-8 border-t border-white/5">
            <div>
              <span className="block text-[10px] tracking-[0.1em] text-white/30 mb-2 font-bold">المحرك / الوقود</span>
              <span className="text-sm font-sans tracking-wide text-white/80">{car.engine}</span>
            </div>
            <div>
              <span className="block text-[10px] tracking-[0.1em] text-white/30 mb-2 font-bold">ناقل الحركة</span>
              <span className="text-sm font-sans tracking-wide text-white/80">{car.transmission}</span>
            </div>
            <div>
              <span className="block text-[10px] tracking-[0.1em] text-white/30 mb-2 font-bold">الضمان (Caution)</span>
              <span className="text-sm font-sans tracking-wide text-white/80">{car.caution.toLocaleString()} درهم</span>
            </div>
          </div>
        </div>

        {/* Booking Calendar Area */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end pb-8 lg:pb-0">
          <div className="w-full max-w-md">
            <BookingCalendar carId={car.id} pricePerDay={car.pricePerDay} carName={`${car.brand} ${car.model}`} />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="w-full border-t border-white/5 pt-12 mt-8">
        <h3 className="text-2xl font-serif text-[#C5A059] mb-8">آراء العملاء</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-white/40 text-sm italic">لا توجد تقييمات لهذه السيارة بعد. كُن أول من يقيّمها!</p>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="bg-[#141414] border border-white/5 p-6 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="block font-bold text-white text-sm mb-1">{r.userName}</span>
                      <span className="text-[10px] text-white/30 font-mono">
                        {r.createdAt ? format(new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt), 'yyyy-MM-dd') : 'الآن'}
                      </span>
                    </div>
                    <div className="flex text-[#C5A059] text-sm">
                      {Array.from({length: 5}).map((_, i) => (
                        <span key={i} className={i < r.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">"{r.comment}"</p>
                </div>
              ))
            )}
          </div>

          {/* Add Review Form */}
          <div className="bg-[#0A0A0A] border border-white/10 p-6 md:p-8 h-fit fade-in">
            <h4 className="text-lg font-serif text-white mb-6">أضف تقييمك</h4>
            {!user ? (
               <div className="text-center py-8">
                 <p className="text-white/50 text-sm mb-4">يجب تسجيل الدخول لإضافة تقييم للسيارة.</p>
                 <button onClick={login} className="border border-[#C5A059] text-[#C5A059] px-6 py-2 text-sm hover:bg-[#C5A059] hover:text-[#0A0A0A] transition-colors">
                   تسجيل الدخول
                 </button>
               </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">التقييم من 5</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button 
                        key={num} 
                        type="button"
                        onClick={() => setRating(num)}
                        className={`text-2xl transition-colors ${rating >= num ? 'text-[#C5A059]' : 'text-white/20 hover:text-white/50'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">تعليقك (تجربتك مع السيارة)</label>
                  <textarea 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    required
                    className="w-full bg-[#141414] border border-white/10 p-4 text-sm text-white resize-none h-24 focus:border-[#C5A059] outline-none transition-colors"
                    placeholder="كيف كانت قيادة السيارة؟..."
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submitting || !comment.trim()}
                  className="bg-[#C5A059] text-[#0A0A0A] font-bold py-3 text-sm hover:bg-white transition-colors disabled:opacity-50 mt-2"
                >
                  {submitting ? 'جاري الإرسال...' : 'نشر التقييم'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}