import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Car } from '../services/carsData';
import { useSettings } from '../services/useSettings';
import { Trash2, TriangleAlert, X, Link, ImagePlus, Upload, CircleAlert, Sparkles, Pencil } from 'lucide-react';

const FALLBACK_IMG_SMALL = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20fill%3D%22%23333%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2255%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%20font-size%3D%2210%22%3E%D8%AE%D8%B7%D8%A3%3C%2Ftext%3E%3C%2Fsvg%3E';
const FALLBACK_IMG_THUMB = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%2060%22%3E%3Crect%20fill%3D%22%23333%22%20width%3D%22100%22%20height%3D%2260%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2235%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%20font-size%3D%228%22%3E%D9%84%D8%A7%20%D8%AA%D9%88%D8%AC%D8%AF%20%D8%B5%D9%88%D8%B1%D8%A9%3C%2Ftext%3E%3C%2Fsvg%3E';

// Helper to convert Local File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export function AdminCars() {
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // AI extraction state
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [aiError, setAiError] = useState('');

  // Edit mode tracking state
  const [editingCarId, setEditingCarId] = useState<string | null>(null);

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

  // AI Details extraction
  const extractCarDetails = async (file: File) => {
    setIsAiExtracting(true);
    setAiError('');
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || 'image/jpeg'
        })
      });

      if (!res.ok) {
        throw new Error('فشلت عملية معالجة وحفظ البيانات بالذكاء الاصطناعي');
      }

      const aiData = await res.json();
      if (aiData) {
        if (aiData.brand) setBrand(aiData.brand);
        if (aiData.model) setModel(aiData.model);
        if (aiData.year) setYear(String(aiData.year));
        if (aiData.category) setCategory(aiData.category);
        if (aiData.pricePerDay) setPricePerDay(String(aiData.pricePerDay));
        if (aiData.engine) setEngine(aiData.engine);
        if (aiData.transmission) setTransmission(aiData.transmission);
        if (aiData.caution) setCaution(String(aiData.caution));
        if (aiData.description) setDescription(aiData.description);
      }
    } catch (err: any) {
      console.error("AI parse error:", err);
      setAiError('فشلت محاولة تعبئة التفاصيل تلقائياً بالذكاء الاصطناعي، يرجى ملء الخانات يدوياً.');
    } finally {
      setIsAiExtracting(false);
    }
  };

  const cancelEditing = () => {
    setEditingCarId(null);
    setBrand(''); setModel(''); setYear(''); setCategory('');
    setPricePerDay(''); setEngine(''); setTransmission('');
    setCaution(''); setDescription(''); setImageUrls([]);
  };

  const startEditing = (car: Car) => {
    setEditingCarId(car.id);
    setBrand(car.brand);
    setModel(car.model || '');
    setYear(String(car.year || ''));
    setCategory(car.category || '');
    setPricePerDay(String(car.pricePerDay || ''));
    setEngine(car.engine || '');
    setTransmission(car.transmission || '');
    setCaution(String(car.caution || ''));
    setDescription(car.description || '');
    setImageUrls(car.images || (car.imageUrl ? [car.imageUrl] : []));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      if (imageUrls.length === 0) {
        alert("يرجى توفير رابط أو اختيار صورة واحدة على الأقل للسيارة");
        return;
      }

      const carData = {
        brand,
        model,
        year: parseInt(year) || 0,
        category, 
        pricePerDay: parseFloat(pricePerDay) || 0,
        engine,
        transmission, 
        caution: parseFloat(caution) || 0,
        description, 
        imageUrl: imageUrls[0], // First image is thumbnail
        images: imageUrls,
      };

      if (editingCarId) {
        // Mode: Update existing document
        const updatedDoc = {
          ...carData,
          updatedAt: serverTimestamp()
        };
        await updateDoc(doc(db, 'cars', editingCarId), updatedDoc);
        setCars(prevCars => prevCars.map(c => c.id === editingCarId ? { ...c, ...carData } as Car : c));
        cancelEditing();
      } else {
        // Mode: Create new document
        const newCar = {
          ...carData,
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'cars'), newCar);
        setCars(prevCars => [...prevCars, { id: docRef.id, ...newCar } as any]);
        cancelEditing();
      }
    } catch (err) {
      console.error("Error saving car", err);
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

    const firstFile = files[0];
    // Automatically extract details with AI concurrently!
    extractCarDetails(firstFile);

    const cloudName = settings.cloudinaryCloudName;
    const uploadPreset = settings.cloudinaryUploadPreset;

    if (!cloudName || !uploadPreset) {
      setUploadError('لم يتم إعداد Cloudinary بعد في الإعدادات لرفع الصور، ومع ذلك جاري تحليل الصورة بالذكاء الاصطناعي.');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      for (const file of Array.from(files) as File[]) {
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
          <p className="text-white/50 text-sm">إضافة وإزالة أو تعديل السيارات المتاحة للتأجير</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-[#0A0A0A] border border-[#C5A059]/30 p-6 mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-full flex flex-wrap justify-between items-center gap-2 mb-2">
          <h3 className="text-lg text-[#C5A059] font-serif">
            {editingCarId ? `تعديل تفاصيل السيارة: ${brand} ${model}` : 'إضافة سيارة جديدة'}
          </h3>
          {!editingCarId ? (
            <span className="flex items-center gap-1.5 text-[10px] text-white/40 bg-white/5 px-2.5 py-1 rounded">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059] animate-pulse" />
              تعبئة تلقائية بالذكاء الاصطناعي نشطة مسبقاً ✨
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-1 rounded border border-[#C5A059]/20">
              وضعية التعديل اليدوي نشطة ✏️
            </span>
          )}
        </div>
        
        {isAiExtracting && (
          <div className="col-span-full border border-[#C5A059]/30 bg-[#C5A059]/5 p-4 rounded-sm flex items-center gap-3 animate-pulse mb-2">
            <Sparkles className="text-[#C5A059] animate-spin shrink-0" size={18} />
            <p className="text-white text-xs">
              <strong>جاري قراءة وتحليل مواصفات السيارة تلقائياً بالذكاء الاصطناعي...</strong> يرجى الانتظار لحين تعبئة الخانات أدناه بالمعلومات (الماركة، المحرك، الفئة، إلخ).
            </p>
          </div>
        )}

        {aiError && (
          <div className="col-span-full border border-red-500/20 bg-red-950/20 p-4 rounded-sm flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <TriangleAlert className="text-red-400 shrink-0" size={18} />
              <p className="text-red-200 text-xs">{aiError}</p>
            </div>
            <button type="button" onClick={() => setAiError('')} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}
        
        <input required placeholder="الماركة (مثل: Range Rover)" value={brand} onChange={e => setBrand(e.target.value)} className={`bg-[#141414] border p-3 text-sm focus:border-[#C5A059] outline-none text-white transition-all ${isAiExtracting ? 'border-[#C5A059]/30 placeholder-[#C5A059]/30' : 'border-white/10'}`} />
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
                  <img src={url} alt={`Preview ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG_SMALL }} />
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
        
        <div className="col-span-full flex gap-3">
          {editingCarId && (
            <button 
              type="button" 
              onClick={cancelEditing} 
              className="flex-1 bg-white/10 text-white font-bold py-3 text-sm hover:bg-white/20 transition-all uppercase tracking-wider cursor-pointer border border-white/10"
            >
              إلغاء التعديل
            </button>
          )}
          <button 
            type="submit" 
            disabled={adding || isUploading} 
            className="flex-1 bg-[#C5A059] text-[#0A0A0A] font-bold py-3 hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {adding 
              ? (editingCarId ? 'جاري حفظ التعديلات...' : 'جاري إضافة السيارة...') 
              : (isUploading 
                  ? 'جاري رفع الصور...' 
                  : (editingCarId ? 'حفظ التعديلات' : 'حفظ السيارة في الأسطول')
                )
            }
            {(adding || isUploading) && <div className="w-4 h-4 border-2 border-[#0A0A0A]/20 border-t-[#0A0A0A] rounded-full animate-spin"></div>}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-white/50 animate-pulse">جاري جلب السيارات...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cars.map(c => (
            <div key={c.id} className="flex gap-4 border border-white/5 bg-[#0A0A0A] p-4 items-center">
              <img src={c.imageUrl} alt={c.model} loading="lazy" referrerPolicy="no-referrer" className="w-24 h-16 object-cover bg-white/5" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG_THUMB }} />
              <div className="flex-1">
                <h4 className="font-serif text-lg">{c.brand} {c.model}</h4>
                <p className="text-xs text-white/50">{c.category} • {c.pricePerDay} درهم/يوم</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => startEditing(c)}
                  className="w-10 h-10 border border-[#C5A059]/20 text-[#C5A059]/80 hover:bg-[#C5A059] hover:text-[#0A0A0A] hover:border-[#C5A059] flex items-center justify-center transition-all duration-300"
                  title="تعديل بيانات السيارة"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => confirmDelete(c)}
                  className="w-10 h-10 border border-red-500/20 text-red-400/60 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-all duration-300"
                  title="حذف السيارة"
                >
                  <Trash2 size={16} />
                </button>
              </div>
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
