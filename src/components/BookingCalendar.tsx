import React, { useState, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, eachDayOfInterval, isWithinInterval, startOfDay } from 'date-fns';
import 'react-day-picker/style.css';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/useAuth';
import { useSettings } from '../services/useSettings';

// Use a CSS module or inline styles, but importing 'style.css' handles the base

interface BookingCalendarProps {
  carId: string;
  pricePerDay: number;
  carName: string;
}

export function BookingCalendar({ carId, pricePerDay, carName }: BookingCalendarProps) {
  const { user, login } = useAuth();
  const { settings } = useSettings();
  const [date, setDate] = useState<DateRange | undefined>();
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (user && user.email) {
      setCustomerEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    async function fetchBookings() {
      // Fetch bookings for this car
      const q = query(collection(db, 'bookings'), where('carId', '==', carId));
      const snap = await getDocs(q);
      let blockedDates: Date[] = [];
      
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.status !== 'cancelled') {
          const start = new Date(data.startDate);
          const end = new Date(data.endDate);
          // Get all days in this range
          const days = eachDayOfInterval({ start, end });
          blockedDates = [...blockedDates, ...days];
        }
      });
      setDisabledDates(blockedDates);
    }
    fetchBookings();
  }, [carId]);

  const handleBook = async () => {
    if (!date?.from || !date?.to) return;
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setMessage('يرجى إدخال الاسم ورقم الهاتف والبريد الإلكتروني.');
      return;
    }

    // Check if selected range overlaps with disabled dates
    const selectedDays = eachDayOfInterval({ start: date.from, end: date.to });
    const hasOverlap = selectedDays.some(day => 
      disabledDates.some(blocked => blocked.getTime() === day.getTime())
    );

    if (hasOverlap) {
      setMessage('العذر، بعض الأيام المحددة محجوزة بالفعل.');
      return;
    }

    setLoading(true);
    setMessage('جاري الحجز...');

    try {
      await addDoc(collection(db, 'bookings'), {
        carId,
        carName,
        customerName,
        customerPhone,
        customerEmail,
        startDate: date.from.toISOString(),
        endDate: date.to.toISOString(),
        userId: user ? user.uid : 'anonymous',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setMessage('تم الحجز! سيتم تحويلك لواتساب...');
      setDisabledDates([...disabledDates, ...selectedDays]);
      
      const totalPrice = daysDifference * pricePerDay;

      // Notify admin in background
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          carName,
          startDate: format(date.from, 'yyyy-MM-dd'),
          endDate: format(date.to, 'yyyy-MM-dd'),
          totalPrice
        })
      }).catch(e => console.error("Admin notification failed", e));
      
      const text = `مرحباً، أود تأكيد حجز السيارة ${carName}\nالاسم: ${customerName}\nالهاتف: ${customerPhone}\nمن تاريخ ${format(date.from, 'yyyy-MM-dd')} إلى ${format(date.to, 'yyyy-MM-dd')}\nالسعر الإجمالي: ${totalPrice} درهم.`;
      const cleanedPhone = settings.phoneNumber.replace(/\D/g, '') || '212709497098';
      const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`;
      
      setDate(undefined);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      
      // Open immediately without timeout to prevent browser popup blockers
      window.open(whatsappUrl, '_blank');

    } catch (err: any) {
      console.error(err);
      setMessage(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const daysDifference = date?.from && date?.to 
    ? Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 3600 * 24)) + 1 
    : 0;

  return (
    <div className="bg-[#141414] border border-white/5 p-6 md:p-8 flex flex-col items-center group">
      <h3 className="text-xl font-serif text-[#C5A059] mb-4 text-center">حجز موعد الاستلام</h3>
      
      {/* Custom styles to force dark mode support into react-day-picker if needed */}
      <style>{`
        .rdp {
          --rdp-cell-size: 40px;
          @media (min-width: 768px) {
            --rdp-cell-size: 44px;
          }
          margin: 0;
          --rdp-accent-color: #C5A059;
          --rdp-background-color: #1a1a1a;
          --rdp-accent-color-dark: #C5A059;
          --rdp-background-color-dark: #1a1a1a;
          --rdp-outline: 2px solid #C5A059;
          --rdp-outline-selected: 2px solid #C5A059;
        }
        .rdp-day {
          border-radius: 2px !important;
        }
        .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
          background-color: #C5A059 !important;
          color: #0A0A0A !important;
          font-weight: bold;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: rgba(197, 160, 89, 0.2);
        }
        .rdp-day_disabled {
          opacity: 0.15;
          text-decoration: line-through;
        }
        .rdp-head_cell {
          font-size: 11px;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
        }
      `}</style>

      <DayPicker
        mode="range"
        selected={date}
        onSelect={(d) => {
          setDate(d);
          if (!d?.from || !d?.to) setShowSummary(false);
        }}
        disabled={[
          { before: startOfDay(new Date()) }, // Cannot book in the past
          ...disabledDates
        ]}
        className="text-sm font-sans mb-6 w-full flex justify-center"
      />

      <div className="w-full flex flex-col gap-4">
        {date?.from && date?.to && !showSummary && (
          <button 
            onClick={() => setShowSummary(true)}
            className="w-full bg-[#C5A059] text-[#0A0A0A] font-bold py-4 text-sm uppercase tracking-widest hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>احجز الآن</span>
            <span className="text-lg">→</span>
          </button>
        )}

        {showSummary && (
          <div className="w-full flex flex-col gap-6 fade-in pt-4 border-t border-white/10">
            <div className="bg-white/5 p-4 rounded-sm border border-white/5">
              <h4 className="text-[#C5A059] text-[10px] uppercase tracking-widest font-bold mb-4">ملخص الحجز</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">السيارة:</span>
                  <span className="text-white font-serif">{carName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">الفترة:</span>
                  <span className="text-white text-xs">{format(date.from, 'yyyy/MM/dd')} - {format(date.to, 'yyyy/MM/dd')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">المدة:</span>
                  <span className="text-white">{Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 3600 * 24)) + 1} أيام</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-white/40">التكلفة الإجمالية:</span>
                  <span className="text-[#C5A059] font-bold text-lg">{ (Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 3600 * 24)) + 1) * pricePerDay } درهم</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">الاسم الكامل</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none" 
                  placeholder="أدخل اسمك الكريم..."
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">رقم الهاتف / واتساب</label>
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  dir="ltr"
                  className="w-full bg-[#0A0A0A] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none text-left" 
                  placeholder="+212 600 00 00 00"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  dir="ltr"
                  className="w-full bg-[#0A0A0A] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none text-left" 
                  placeholder="example@mail.com"
                />
              </div>
            </div>

            <button 
              onClick={handleBook}
              disabled={loading}
              className="group flex justify-center items-center gap-4 bg-[#C5A059] px-8 py-4 hover:bg-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full border border-[#C5A059]"
            >
              <span className="text-[12px] font-bold text-[#0A0A0A] uppercase tracking-[0.2em] transition-colors">
                {loading ? 'جاري تأكيد الحجز...' : 'تأكيد الحجز النهائي'}
              </span>
            </button>

            <button 
              onClick={() => setShowSummary(false)}
              className="text-[10px] text-white/30 uppercase tracking-widest hover:text-[#C5A059] transition-colors"
            >
              تعديل المواعيد
            </button>
          </div>
        )}

        {message && (
          <p className="text-center text-sm mt-4 text-white/70 bg-white/5 py-3 rounded border border-white/5">{message}</p>
        )}
      </div>
    </div>
  );
}
