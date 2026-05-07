import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

interface Booking {
  id: string;
  carId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice?: number;
}

interface Car {
  id: string;
  brand: string;
  model: string;
  pricePerDay: number;
}

export function AdminAnalytics() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Record<string, Car>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch Cars
        const carsSnap = await getDocs(collection(db, 'cars'));
        const carsData: Record<string, Car> = {};
        carsSnap.docs.forEach(doc => {
          carsData[doc.id] = { id: doc.id, ...doc.data() } as Car;
        });
        setCars(carsData);

        // Fetch Bookings
        const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        const bookingsSnap = await getDocs(q);
        const bookingsData = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setBookings(bookingsData);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let confirmedCount = 0;
    
    // Revenue over time
    const monthlyRevenueMap: Record<string, number> = {};
    const carPopularityMap: Record<string, number> = {};

    bookings.forEach(b => {
      // Popularity by Car (all bookings including pending to see interest)
      carPopularityMap[b.carId] = (carPopularityMap[b.carId] || 0) + 1;

      if (b.status === 'confirmed') {
        confirmedCount++;
        
        // Calculate price if not stored
        let price = b.totalPrice;
        if (!price && cars[b.carId]) {
          const start = new Date(b.startDate).getTime();
          const end = new Date(b.endDate).getTime();
          const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
          price = days * cars[b.carId].pricePerDay;
        }
        
        if (price) {
          totalRevenue += price;
          
          // Add to monthly map based on start date
          try {
            const startMonth = format(startOfMonth(parseISO(b.startDate)), 'MMM yyyy', { locale: ar });
            monthlyRevenueMap[startMonth] = (monthlyRevenueMap[startMonth] || 0) + price;
          } catch(e) {
            // ignore parse error logs
          }
        }
      }
    });

    const monthlyRevenueData = Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({
      month,
      revenue
    })).reverse(); // Assuming it came sorted desc, reverse to asc for chart

    const popularCarsData = Object.entries(carPopularityMap)
      .map(([carId, count]) => ({
        name: cars[carId] ? `${cars[carId].brand} ${cars[carId].model}` : 'Unknown Car',
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    return {
      totalBookings: bookings.length,
      confirmedCount,
      totalRevenue,
      monthlyRevenueData,
      popularCarsData
    };
  }, [bookings, cars]);

  if (loading) {
    return <div className="text-white/50 text-center py-24 animate-pulse">جاري تحميل البيانات الإحصائية...</div>;
  }

  return (
    <div className="w-full bg-[#141414] border border-white/10 p-6 md:p-12 mb-12 fade-in">
      <div className="mb-12">
        <h2 className="text-3xl font-serif text-[#C5A059] mb-2">لوحة الإحصائيات</h2>
        <p className="text-white/50 text-sm">نظرة عامة على أداء الحجوزات والعائدات</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-[#0A0A0A] border border-[#C5A059]/20 p-6">
          <span className="text-[10px] uppercase tracking-widest text-white/50 block mb-2">إجمالي الحجوزات المؤكدة</span>
          <span className="text-4xl font-serif text-white">{stats.confirmedCount}</span>
          <span className="text-xs text-white/30 mr-2">من أصل {stats.totalBookings} طلب</span>
        </div>
        <div className="bg-[#0A0A0A] border border-[#C5A059]/20 p-6">
          <span className="text-[10px] uppercase tracking-widest text-white/50 block mb-2">العائدات الإجمالية (مقدرة)</span>
          <span className="text-4xl font-serif text-[#C5A059]">{stats.totalRevenue.toLocaleString()} <span className="text-sm font-sans">درهم</span></span>
        </div>
        <div className="bg-[#0A0A0A] border border-[#C5A059]/20 p-6">
          <span className="text-[10px] uppercase tracking-widest text-white/50 block mb-2">السيارة الأكثر طلباً</span>
          <span className="text-2xl font-serif text-white truncate block">
            {stats.popularCarsData.length > 0 ? stats.popularCarsData[0].name : '-'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Revenue Chart */}
        <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-sm">
          <h3 className="text-lg font-serif text-white mb-6">العائدات خلال الأشهر (للحجوزات المؤكدة)</h3>
          <div className="h-64 w-full" dir="ltr">
            {stats.monthlyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="month" stroke="#666" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value} MAD`} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', borderColor: '#C5A059', borderRadius: '4px' }}
                    itemStyle={{ color: '#C5A059' }}
                  />
                  <Line type="monotone" dataKey="revenue" name="العائد" stroke="#C5A059" strokeWidth={2} dot={{ r: 4, fill: '#C5A059' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex bg-[#141414]/50 h-full w-full items-center justify-center text-white/30 text-sm">
                  لا توجد بيانات كافية بعد.
                </div>
            )}
          </div>
        </div>

        {/* Popularity Chart */}
        <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-sm">
          <h3 className="text-lg font-serif text-white mb-6">أكثر السيارات طلباً (جميع الحالات)</h3>
          <div className="h-64 w-full" dir="ltr">
            {stats.popularCarsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.popularCarsData} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#666" fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#999" fontSize={11} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '4px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{fill: '#222'}}
                  />
                  <Bar dataKey="count" name="عدد الطلبات" fill="#ffffff" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex bg-[#141414]/50 h-full w-full items-center justify-center text-white/30 text-sm">
                  لا توجد بيانات كافية بعد.
                </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
