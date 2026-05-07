import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { Car } from '../services/carsData';
import { Trash2, AlertTriangle, X, Sparkles } from 'lucide-react';
import { extractCarDataFromImage } from '../services/geminiService';

export function AdminCars() {
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
  const [imageUrl, setImageUrl] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

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
      if (!imageUrl) {
        alert("يرجى توفير رابط أو اختيار صورة للسيارة");
        return;
      }

      const newCar = {
        brand, model, year: parseInt(year), category, 
        pricePerDay: parseFloat(pricePerDay), engine, transmission, 
        caution: parseFloat(caution), description, imageUrl,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'cars'), newCar);
      setCars([...cars, { id: docRef.id, ...newCar } as any]);
      
      // Reset
      setBrand(''); setModel(''); setYear(''); setCategory('');
      setPricePerDay(''); setEngine(''); setTransmission('');
      setCaution(''); setDescription(''); setImageUrl('');
    } catch (err) {
      console.error("Error adding car", err);
    } finally {
      setAdding(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `cars/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      
      // Auto-extract logic
      if (confirm("هل تريد استخراج بيانات السيارة من هذه الصورة باستخدام الذكاء الاصطناعي؟")) {
        handleAiExtract(file);
      }
    } catch (err) {
      console.error("Error uploading file", err);
      alert("فشل رفع الصورة، يرجى المحاولة مرة أخرى");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAiExtract = async (file: File) => {
    setIsAiLoading(true);
    try {
      const data = await extractCarDataFromImage(file);
      if (data) {
        setBrand(data.brand || '');
        setModel(data.model || '');
        setYear(data.year?.toString() || '');
        setCategory(data.category || '');
        setPricePerDay(data.pricePerDay?.toString() || '');
        setEngine(data.engine || '');
        setTransmission(data.transmission || '');
        setCaution(data.caution?.toString() || '');
        setDescription(data.description || '');
      }
    } catch (err) {
      console.error("AI Extraction failed", err);
      alert("فشل استخراج البيانات. يرجى ملء الحقول يدوياً.");
    } finally {
      setIsAiLoading(false);
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
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={() => document.getElementById('ai-assistant-tab-trigger')?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#0A0A0A] transition-all rounded-full"
          >
            <Sparkles size={14} />
            استعن بالمساعد الذكي
          </button>
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
        <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 border border-white/5 p-4 rounded bg-[#141414]/50">
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-white/40 tracking-wider mb-2">رابط صورة السيارة</label>
              <div className="flex gap-4">
                <input 
                  placeholder="https://..." 
                  value={imageUrl} 
                  onChange={e => setImageUrl(e.target.value)} 
                  className="flex-1 bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white text-left" 
                  dir="ltr" 
                />
                {imageUrl && (
                  <div className="w-12 h-12 border border-[#C5A059]/30 rounded overflow-hidden flex-shrink-0 bg-white/5">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col justify-center items-center py-4 border-t border-white/5">
              <span className="text-white/30 text-xs mb-4">- أو رفع ملف مباشرة -</span>
              <div className="relative w-full">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange} 
                  disabled={isUploading}
                  className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-[#C5A059]/30 file:text-xs file:font-bold file:bg-[#C5A059]/10 file:text-[#C5A059] hover:file:bg-[#C5A059] hover:file:text-[#0A0A0A] file:transition-all cursor-pointer disabled:opacity-50" 
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-[#0A0A0A]/50 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">سيتم الرفع تلقائياً وتحديث الرابط</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center justify-center border-l border-white/5 pl-4">
            {imageUrl ? (
              <div className="w-full aspect-video border border-white/10 overflow-hidden relative group">
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] uppercase tracking-widest text-white">معاينة مباشرة</span>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video border border-dashed border-white/10 flex items-center justify-center text-white/20">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-widest">لا توجد صورة</p>
                  <p className="text-[10px] mt-1">أضف رابطاً أو ارفع ملفاً</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <textarea required placeholder="وصف للسيارة ومميزاتها..." value={description} onChange={e => setDescription(e.target.value)} className="col-span-full bg-[#141414] border border-white/10 p-3 text-sm focus:border-[#C5A059] outline-none text-white h-24 resize-none" />
        
        <button type="submit" disabled={adding || isAiLoading} className="col-span-full bg-[#C5A059] text-[#0A0A0A] font-bold py-3 hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {adding ? 'جاري الإضافة...' : (isAiLoading ? 'جاري تحليل الصورة بالذكاء الاصطناعي...' : 'حفظ السيارة في الأسطول')}
          {isAiLoading && <div className="w-4 h-4 border-2 border-[#0A0A0A]/20 border-t-[#0A0A0A] rounded-full animate-spin"></div>}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-white/50 animate-pulse">جاري جلب السيارات...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cars.map(c => (
            <div key={c.id} className="flex gap-4 border border-white/5 bg-[#0A0A0A] p-4 items-center">
              <img src={c.imageUrl} alt={c.model} className="w-24 h-16 object-cover bg-white/5" />
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
                <AlertTriangle className="text-red-500" size={32} />
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