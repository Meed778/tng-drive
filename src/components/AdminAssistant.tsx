import React, { useState, useRef, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string;
  loading?: boolean;
};

export function AdminAssistant() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    text: 'مرحباً! أنا مساعدك الذكي. يمكنك إعطائي صورة لسيارة وسعر إيجارها، وسأقوم باستخراج بقية التفاصيل وإضافتها إلى قاعدة البيانات نيابة عنك.'
  }]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isProcessing) return;

    const userMessageText = input.trim();
    const currentFile = selectedFile;
    const currentPreviewUrl = previewUrl;

    // Reset input
    setInput('');
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userMessageText,
      image: currentPreviewUrl || undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsProcessing(true);

    const loadingMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: loadingMsgId, role: 'assistant', text: 'جاري المعالجة...', loading: true }]);

    try {
      let parts: any[] = [];
      let finalImageUrl = '';

      // Upload file to firebase first so we can save it in the DB later
      if (currentFile) {
        // Prepare base64 for Gemini
        const base64Data = await fileToBase64(currentFile);
        parts.push({
          inlineData: {
            mimeType: currentFile.type,
            data: base64Data
          }
        });

        // Upload to Firebase Storage
        setMessages(prev => prev.map(m => m.id === loadingMsgId ? { ...m, text: 'جاري رفع الصورة إلى التخزين...' } : m));
        const storageRef = ref(storage, `cars_ai/${Date.now()}_${currentFile.name}`);
        await uploadBytes(storageRef, currentFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      if (userMessageText) {
        parts.push({ text: userMessageText });
      }

      setMessages(prev => prev.map(m => m.id === loadingMsgId ? { ...m, text: 'جاري تحليل البيانات مع الذكاء الاصطناعي...' } : m));

      // Use Server API instead of direct SDK
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: parts,
          history: messages.filter(m => !m.loading).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }))
        })
      });

      if (!response.ok) throw new Error("Failed to communicate with AI server");
      
      const { text, functionCalls } = await response.json();
      
      let responseText = text || '';

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === "addCarToDatabase") {
            setMessages(prev => prev.map(m => m.id === loadingMsgId ? { ...m, text: 'جاري إضافة السيارة إلى قاعدة البيانات...' } : m));
            const args = call.args as any;
            
            const newCar = {
              brand: args.brand || "غير محدد",
              model: args.model || "غير محدد",
              year: args.year || new Date().getFullYear(),
              category: args.category || "Luxury المتميزة",
              pricePerDay: args.pricePerDay || 0,
              engine: args.engine || "غير محدد",
              transmission: args.transmission || "أوتوماتيكي",
              caution: args.caution || 0,
              description: args.description || "",
              imageUrl: finalImageUrl || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1200",
              images: finalImageUrl ? [finalImageUrl] : [],
              createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'cars'), newCar);
            responseText = `تم إضافة السيارة بنجاح! \nالماركة: ${newCar.brand} ${newCar.model} \nالسعر: ${newCar.pricePerDay} درهم/يوم. \nهل هناك شيء آخر يمكنني المساعدة به؟`;
          }
        }
      }

      setMessages(prev => prev.map(m => m.id === loadingMsgId ? { ...m, text: responseText, loading: false } : m));

    } catch (error: any) {
      console.error(error);
      setMessages(prev => prev.map(m => m.id === loadingMsgId ? { ...m, text: 'حدث خطأ أثناء المعالجة: ' + error.message, loading: false } : m));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-[#0A0A0A]">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#C5A059] text-black rounded-tr-none' : 'bg-[#1A1A1A] border border-white/5 text-[#E5E5E5] rounded-tl-none'}`}>
              <div className="flex items-center gap-2 mb-2 opacity-60">
                <span className="text-xs font-bold uppercase tracking-wider">{msg.role === 'user' ? 'أنت' : 'المساعد الذكي'}</span>
              </div>
              
              {msg.image && (
                <img src={msg.image} alt="User upload" className="rounded-xl mb-3 max-w-full h-auto max-h-48 object-cover" />
              )}
              
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.text}
                {msg.loading && <span className="inline-block w-4 h-4 ml-2 border-2 border-current border-t-transparent rounded-full animate-spin"></span>}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/5 bg-[#0A0A0A]">
        {previewUrl && (
          <div className="mb-4 relative inline-block">
            <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded border border-white/10" />
            <button 
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value=''; }}
              className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button 
            className="p-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-xl border border-white/5 text-[#C5A059] transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            title="إرفاق صورة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"/><path d="M16 16l-4-4-4 4"/></svg>
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا... (مثال: أضف هذه السيارة بسعر 3500 درهم في اليوم)"
            className="flex-1 bg-[#1A1A1A] border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-[#C5A059] outline-none text-white placeholder-white/30"
            disabled={isProcessing}
            dir="rtl"
          />
          <button 
            onClick={handleSend}
            disabled={isProcessing || (!input.trim() && !selectedFile)}
            className="p-4 bg-[#C5A059] hover:bg-[#D5B069] text-black rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
