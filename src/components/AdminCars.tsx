import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Car } from '../services/carsData';
import { useSettings } from '../services/useSettings';
import { Trash2, TriangleAlert, X, Link, ImagePlus, Upload, CircleAlert } from 'lucide-react';

export function AdminCars() {
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [engine, setEngine] = useState('');
  const [transmission, setTransmission] = useState('');
  const [caution, setCaution] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');

  const fetchCars = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'cars'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Car));
      setCars(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      if (imageUrls.length === 0) {
        alert("يرجى توفير رابط أو اختيار صورة واحدة على الأقل للسيارة");
        return;
      }

      const newCar = {
        brand, model, year: parseInt(year), category, 
        pricePerDay: parseFloat(pricePerDay), engine, transmission, 
        caution: parseFloat(caution), description, 
        imageUrl: imageUrls[0], // First image is thumbnail
        images: imageUrls,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'cars'), newCar);
      setCars([...cars, { id: docRef.id, ...newCar } as any]);
      
      // Reset
      setBrand(''); setModel(''); setYear(''); setCategory('');
      setPricePerDay(''); setEngine(''); setTransmission('');
      setCaution(''); setDescription(''); setImageUrls([]);
    } catch (err) {
      console.error("Error adding car", err);
    } finally {
      setAdding(false);
    }
  };

  const [uploadError, setUploadError] = useState('');

  const addImageUrl = () => {
    const val = newUrlInput.trim();
    if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
      setImageUrls([...imageUrls, val]);
      setNewUrlInput('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError('');
    setIsUploading(true);

    const cloudName = settings.cloudinaryCloudName;
    const uploadPreset = settings.cloudinaryUploadPreset;

    if (!cloudName || !uploadPreset) {
      setUploadError('لم يتم إعداد Cloudinary بعد. اذهب إلى الإعدادات وأضف Cloud Name و Upload Preset.');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`الصورة "${file.name}" كبيرة جداً (${Math.round(file.size/1024/1024)}MB). الحد الأقصى 10MB.`);
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) {
          setImageUrls(prev => [...prev, data.secure_url]);
        } else {
          throw new Error(data.error?.message || 'فشل الرفع');
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(`فشل رفع الصورة: ${err.message}. استخدم خيار الرابط المباشر كبديل.`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!carToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'cars', carToDelete.id));
      setCars(cars.filter(c => c.id !== carToDelete.id));
      setShowDeleteModal(false);
      setCarToDelete(null);
    } catch (err) {
      console.error("Error deleting car", err);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (car: Car) => {
    setCarToDelete(car);
    setShowDeleteModal(true);
  };

  return (
    <div className="w-full bg-[#141414] border border-white/10 p-6 md:p-12 mb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-serif text-[#C5A059] mb-2">إدارة أسطول السيارات</h2>
          <p className="text-white/50 text-sm">إضافة وإزالة السيارات المتاحة للتأجير</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-[#0A0A0A] border border-[#C5A059]/30 p-6 mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <h3 className="col-span-full text-lgtext-[#C5A059] mb-2">إضافة سيارة جديدة</h3>
        
        <input required placeholder="الماركة (مثل: Range Rover)" value={brand} onChange={e => setBrand(e.target.value)} className="bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white" />
        <input required placeholder="الموديل (مثل: Velar)" value={model} onChange={e => setModel(e.target.value)} className="bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white" />
        <input required type="number" placeholder="سنة الصنع (مثل: 2024)" value={year} onChange={e => setYear(e.target.value)} className="bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white" />
        <input required placeholder="الفئة (مثل: الاقتصادية، SUV)" value={category} onChange={e => setCategory(e.target.value)} className="bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white" />
        <input required type="number" placeholder="السعر اليومي (درهم)" value={pricePerDay} onChange={e => setPricePerDay(e.target.value)} className="bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white" />
        <input required type="number" placeholder="مبلغ الضمان Caution (درهم)" value={caution} onChange={e => setCaution(e.target.value)} className="bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white" />
        <input required placeholder="المحرك (مثل: V6 ديزل)" value={engine} onChange={e => setEngine(e.target.value)} className="bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white" />
        <input required placeholder="ناقل الحركة (أوتوماتيك / يدوي)" value={transmission} onChange={e => setTransmission(e.target.value)} className="bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white" />
            <div className="col-span-full border border-white/5 p-4 rounded bg-[#141414]/50">
          <div className="mb-6">
            <h4 className="text-[#C5A059] text-sm mb-4">صور السيارة (يمكنك إضافة عدة صور)</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {imageUrls.length === 0 && (
                <div className="col-span-full flex items-center gap-2 text-white/30 text-xs py-4">
                  <ImagePlus className="w-4 h-4" />
                  <span>لم تضف أي صور بعد.</span>
                </div>
              )}
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-video border border-white/10 rounded overflow-hidden group">
                  <img src={url} alt={`Preview ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="10">خطأ</text></svg>' }} />
                  <button 
                    type="button"
                    onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                    className="absolute top-1 left-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} className="text-white" />
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 right-0 left-0 bg-[#C5A059] text-[#0A0A0A] text-[8px] font-bold text-center py-0.5 uppercase">
                      الصورة الرئيسية
                    </div>
                  )}
                </div>
              ))}

              {/* Upload from computer */}
              <label className="aspect-video border-2 border-dashed border-white/10 rounded flex flex-col items-center justify-center cursor-pointer hover:border-[#C5A059]/50 transition-colors">
                <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" disabled={isUploading} />
                <Upload className={`w-6 h-6 ${isUploading ? 'text-[#C5A059] animate-bounce' : 'text-white/30'}`} />
                <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest">
                  {isUploading ? 'جاري الرفع...' : 'رفع صور'}
                </p>
              </label>
            </div>

            {uploadError && (
              <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 p-3 mb-4 rounded">
                <CircleAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs">{uploadError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <input 
                value={newUrlInput}
                onChange={(e) => setNewUrlInput(e.target.value)}
                placeholder="أو أضف رابط صورة مباشرة: https://..." 
                className="flex-1 bg-[#0A0A0A] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white text-left font-mono text-xs" 
                dir="ltr" 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
              />
              <button type="button" onClick={addImageUrl} className="bg-[#C5A059] text-[#0A0A0A] px-4 text-sm font-bold hover:bg-white transition-colors whitespace-nowrap">
                <Link className="w-4 h-4 inline" /> إضافة
              </button>
            </div>
            <p className="text-[10px] text-white/30 mt-2">اختر صوراً من جهازك أو ألصق رابط صورة مباشر.</p>
          </div>
        </div>
        
        <textarea required placeholder="وصف للسيارة ومميزاتها..." value={description} onChange={e => setDescription(e.target.value)} className="col-span-full bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white h-24 resize-none" />
        
        <button type="submit" disabled={adding || isUploading} className="col-span-full bg-[#C5A059] text-[#0A0A0A] font-bold py-3 hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {adding ? 'جاري الإضافة...' : (isUploading ? 'جاري رفع الصور...' : 'حفظ السيارة في الأسطول')}
          {(adding || isUploading) && <div className="w-4 h-4 border-2 border-[#0A0A0A]/20 border-t-[#0A0A0A] rounded-full animate-spin"></div>}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-white/50 animate-pulse">جاري جلب السيارات...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cars.map(c => (
            <div key={c.id} className="flex gap-4 border border-white/5 bg-[#0A0A0A] p-4 items-center">
              <img src={c.imageUrl} alt={c.model} loading="lazy" referrerPolicy="no-referrer" className="w-24 h-16 object-cover bg-white/5" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><rect fill="%23333" width="100" height="60"/><text x="50" y="35" text-anchor="middle" fill="%23666" font-size="8">لا توجد صورة</text></svg>' }} />
              <div className="flex-1">
                <h4 className="font-serif text-lg">{c.brand} {c.model}</h4>
                <p className="text-xs text-white/50">{c.category} • {c.pricePerDay} درهم/يوم</p>
              </div>
              <button 
                onClick={() => confirmDelete(c)}
                className="w-10 h-10 border border-red-500/20 text-red-400/60 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-all duration-300"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !deleting && setShowDeleteModal(false)}></div>
          
          <div className="relative bg-[#141414] border border-white/5 w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="absolute top-4 left-4 p-2 text-white/30 hover:text-white transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <TriangleAlert className="text-red-500" size={32} />
              </div>
              
              <h3 className="text-2xl font-serif text-white mb-4">تأكيد الحذف</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                هل أنت متأكد من رغبتك في حذف <span className="text-white font-bold">{carToDelete?.brand} {carToDelete?.model}</span> من الأسطول؟ 
                <br />
                هذا الإجراء لا يمكن التراجع عنه.
              </p>

              <div className="flex w-full gap-4">
                <button 
                  disabled={deleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 border border-white/10 text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button 
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : 'تأكيد الحذف'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}