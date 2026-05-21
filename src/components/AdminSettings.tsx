import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useSettings, SiteSettings } from '../services/useSettings';

export function AdminSettings() {
  const { settings } = useSettings();
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'settings', 'general'), { ...formData }, { merge: true });
      setMessage('تم حفظ الإعدادات بنجاح!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage(`خطأ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#141414] border border-white/10 p-6 md:p-12 mb-12 fade-in">
      <div className="mb-12">
        <h2 className="text-3xl font-serif text-[#C5A059] mb-2">إعدادات الموقع</h2>
        <p className="text-white/50 text-sm">تعديل معلومات وتفاصيل الموقع بسهولة</p>
      </div>

      {message && (
        <div className={`p-4 mb-8 text-sm ${message.includes('خطأ') ? 'bg-red-900/50 text-red-200 border border-red-500/50' : 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-[#0A0A0A] border border-white/5 p-6 space-y-6">
          <h3 className="text-xl font-serif text-white mb-4 border-b border-white/5 pb-4">المعلومات الأساسية</h3>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">اسم الموقع / الشركة</label>
            <input 
              type="text" 
              name="siteName" 
              value={formData.siteName} 
              onChange={handleChange}
              required
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none" 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">عنوان الواجهة (Hero Title)</label>
            <input 
              type="text" 
              name="heroTitle" 
              value={formData.heroTitle} 
              onChange={handleChange}
              required
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none" 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">نص الواجهة الفرعي (Hero Subtitle)</label>
            <input 
              type="text" 
              name="heroSubtitle" 
              value={formData.heroSubtitle} 
              onChange={handleChange}
              required
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none" 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">وصف صفحة التواصل</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              required
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-24 resize-none" 
            />
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 p-6 space-y-6">
          <h3 className="text-xl font-serif text-white mb-4 border-b border-white/5 pb-4">معلومات التواصل</h3>
          
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">رقم الهاتف / واتساب</label>
            <input 
              type="text" 
              name="phoneNumber" 
              value={formData.phoneNumber} 
              onChange={handleChange}
              required dir="ltr"
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white text-left font-mono focus:border-[#C5A059] outline-none" 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">البريد الإلكتروني</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              required dir="ltr"
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white text-left font-mono focus:border-[#C5A059] outline-none" 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">العنوان</label>
            <textarea 
              name="address" 
              value={formData.address} 
              onChange={handleChange}
              required
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-24 resize-none" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">رابط انستغرام</label>
              <input 
                type="url" 
                name="instagramUrl" 
                value={formData.instagramUrl} 
                onChange={handleChange}
                required dir="ltr"
                className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white font-mono focus:border-[#C5A059] outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">اسم حساب انستغرام (Handle)</label>
              <input 
                type="text" 
                name="instagramHandle" 
                value={formData.instagramHandle} 
                onChange={handleChange}
                required dir="ltr"
                className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white font-mono focus:border-[#C5A059] outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">رابط فيسبوك (Facebook)</label>
              <input 
                type="url" 
                name="facebookUrl" 
                value={formData.facebookUrl} 
                onChange={handleChange}
                dir="ltr"
                className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white font-mono focus:border-[#C5A059] outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">رابط تيك توك (TikTok)</label>
              <input 
                type="url" 
                name="tiktokUrl" 
                value={formData.tiktokUrl} 
                onChange={handleChange}
                dir="ltr"
                className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white font-mono focus:border-[#C5A059] outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">رابط يوتيوب (YouTube)</label>
              <input 
                type="url" 
                name="youtubeUrl" 
                value={formData.youtubeUrl} 
                onChange={handleChange}
                dir="ltr"
                className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white font-mono focus:border-[#C5A059] outline-none" 
              />
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 p-6 space-y-6">
          <h3 className="text-xl font-serif text-white mb-4 border-b border-white/5 pb-4">قسم من نحن</h3>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">العنوان</label>
            <input 
              type="text" 
              name="aboutTitle" 
              value={formData.aboutTitle} 
              onChange={handleChange}
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">النص</label>
            <textarea 
              name="aboutText" 
              value={formData.aboutText} 
              onChange={handleChange}
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-24 resize-none" 
            />
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 p-6 space-y-6">
          <h3 className="text-xl font-serif text-white mb-4 border-b border-white/5 pb-4">الشروط والسياسات</h3>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">شروط الإلغاء (Cancellation Policy)</label>
            <textarea 
              name="cancellationPolicy" 
              value={formData.cancellationPolicy} 
              onChange={handleChange}
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-24 resize-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">سياسة التأمين (Insurance)</label>
            <textarea 
              name="insuranceText" 
              value={formData.insuranceText} 
              onChange={handleChange}
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-24 resize-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">سياسة الوقود (Fuel Policy)</label>
            <textarea 
              name="fuelPolicy" 
              value={formData.fuelPolicy} 
              onChange={handleChange}
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-24 resize-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">الحد الأقصى للكيلومترات (Mileage)</label>
            <textarea 
              name="mileagePolicy" 
              value={formData.mileagePolicy} 
              onChange={handleChange}
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-24 resize-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">شروط السائق (Driver Requirements)</label>
            <textarea 
              name="driverRequirements" 
              value={formData.driverRequirements} 
              onChange={handleChange}
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-24 resize-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">طرق الدفع (Payment Methods)</label>
            <textarea 
              name="paymentMethods" 
              value={formData.paymentMethods} 
              onChange={handleChange}
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-24 resize-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">الخدمات الإضافية (Additional Services)</label>
            <textarea 
              name="additionalServices" 
              value={formData.additionalServices} 
              onChange={handleChange}
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-24 resize-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 tracking-wider">شروط عامة (Terms & Conditions)</label>
            <textarea 
              name="termsText" 
              value={formData.termsText} 
              onChange={handleChange}
              className="w-full bg-[#141414] border border-white/10 p-3 text-sm text-white focus:border-[#C5A059] outline-none h-32 resize-none" 
            />
          </div>
        </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full bg-[#C5A059] text-[#0A0A0A] font-bold py-4 text-sm hover:bg-white transition-colors disabled:opacity-50 mt-4 cursor-pointer"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </form>
    </div>
  );
}
