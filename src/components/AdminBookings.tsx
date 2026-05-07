import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { format } from 'date-fns';
import { useSettings } from '../services/useSettings';

interface Booking {
  id: string;
  carId: string;
  carName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice?: number;
  createdAt: any;
}

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetch specifically pending bookings
      const q = query(
        collection(db, 'bookings'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      const ref = doc(db, 'bookings', id);
      await updateDoc(ref, { status: newStatus });
      
      const booking = bookings.find(b => b.id === id);

      if (newStatus === 'confirmed' && booking && booking.customerEmail) {
        // Send confirmation email via our API
        try {
          await fetch('/api/send-confirmation-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerEmail: booking.customerEmail,
              customerName: booking.customerName || 'عميلنا العزيز',
              carName: booking.carName || 'السيارة المختارة',
              startDate: format(new Date(booking.startDate), 'yyyy-MM-dd'),
              endDate: format(new Date(booking.endDate), 'yyyy-MM-dd'),
              bookingId: booking.id
            })
          });
          console.log("Confirmation email sent successfully");
        } catch (emailErr) {
          console.error("Failed to send confirmation email", emailErr);
        }
      }

      setBookings(bookings.filter(b => b.id !== id));
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  return (
    <div className="w-full bg-[#141414] border border-white/10 p-6 md:p-12 mb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-serif text-[#C5A059] mb-2">لوحة تحكم الإدارة</h2>
          <p className="text-white/50 text-sm">مراجعة وتأكيد طلبات الحجز الجديدة</p>
        </div>
        <button onClick={fetchBookings} className="text-xs font-sans tracking-tight opacity-50 hover:opacity-100 uppercase border border-white/20 px-4 py-2 hover:bg-white/5">تحديث</button>
      </div>

      {loading ? (
        <p className="text-sm text-white/50 animate-pulse">جاري جلب البيانات...</p>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 border border-white/5 bg-[#0A0A0A]">
          <p className="text-sm text-white/50">لا توجد طلبات حجز معلقة حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map(booking => {
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

            return (
              <div key={booking.id} className="border border-white/5 p-6 bg-[#0A0A0A] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                    <span className="text-[10px] bg-[#C5A059]/20 text-[#C5A059] px-2 py-1 uppercase tracking-widest">طلب جديد</span>
                    <span className="text-xs font-mono text-white/30"># {booking.id.slice(0,8)}</span>
                  </div>
                  
                  <div className="space-y-3 mb-6 font-sans">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">السيارة:</span>
                      <span className="text-[#C5A059] font-bold">{booking.carName || booking.carId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">الاسم:</span>
                      <span className="text-white font-bold">{booking.customerName || 'غير متوفر'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">الهاتف:</span>
                      <span className="text-white font-mono" dir="ltr">{booking.customerPhone || 'غير متوفر'}</span>
                    </div>
                    {booking.customerEmail && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">الإيميل:</span>
                        <span className="text-white text-xs font-mono">{booking.customerEmail}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-white/5 mt-2">
                      <span className="text-white/50">من تاريخ:</span>
                      <span className="text-white">{format(start, 'yyyy-MM-dd')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">إلى تاريخ:</span>
                      <span className="text-white">{format(end, 'yyyy-MM-dd')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">المدة:</span>
                      <span className="text-[#C5A059]">{duration} أيام</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                      <span className="text-white/50">رقم العميل (UID):</span>
                      <span className="text-xs text-white/30 font-mono">{booking.userId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                  {/* WhatsApp Notification for Admin */}
                  <a 
                    href={`https://wa.me/${settings.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `*TNG Drive - تنبيه حجز جديد*\n\n` +
                      `هناك حجز جديد معلق للسيارة: *${booking.carName || booking.carId}*\n` +
                      `العميل: ${booking.customerName || 'غير معروف'}\n` +
                      `الهاتف: ${booking.customerPhone || 'غير متوفر'}\n` +
                      `الفترة: من ${format(start, 'yyyy-MM-dd')} إلى ${format(end, 'yyyy-MM-dd')}\n` +
                      `السعر الإجمالي: ${booking.totalPrice || 'غير محدد'} درهم\n` +
                      `رقم الحجز: ${booking.id.slice(0,8)}`
                    )}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full text-center bg-[#C5A059]/10 hover:bg-[#C5A059] text-[#C5A059] hover:text-[#0A0A0A] border border-[#C5A059]/20 hover:border-[#C5A059] px-4 py-3 text-[10px] uppercase tracking-[0.1em] font-bold transition-all mb-2 flex items-center justify-center gap-2"
                  >
                    تنبيه المسؤول (واتساب)
                  </a>

                  {booking.customerPhone && (
                    <a 
                      href={`https://wa.me/${booking.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `*TNG Drive - تأكيد حجز*\n\n` +
                        `مرحباً ${booking.customerName || 'عميلنا العزيز'}،\n` +
                        `نحن سعداء بإبلاغك أنه تم تأكيد حجزك للسيارة: *${booking.carName || booking.carId}*\n` +
                        `الفترة: من ${format(start, 'yyyy-MM-dd')} إلى ${format(end, 'yyyy-MM-dd')}\n` +
                        `المدة: ${duration} أيام\n\n` +
                        `نتطلع لرؤيتك قريباً!`
                      )}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full text-center bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-[#0A0A0A] border border-[#25D366]/20 hover:border-[#25D366] px-4 py-3 text-[10px] uppercase tracking-[0.1em] font-bold transition-all mb-2 flex items-center justify-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      تأكيد عبر واتساب
                    </a>
                  )}
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                      className="flex-1 bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-[#0A0A0A] border border-[#25D366]/30 px-4 py-3 text-sm font-bold transition-colors"
                    >
                      تأكيد الحجز
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                      className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-4 py-3 text-sm transition-colors"
                    >
                      إلغاء / رفض
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
