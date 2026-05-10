import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  onExplore: () => void;
  siteName: string;
}

export function Hero({ onExplore, siteName }: HeroProps) {
  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-sports-car-driving-on-a-highway-at-night-34503-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <span className="text-[#C5A059] text-xs md:text-sm uppercase tracking-[0.4em] font-bold block mb-4">
            التميز والفخامة في طنجة
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-serif text-white mb-8 tracking-tight">
            {siteName}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-white/60 text-sm md:text-lg max-w-lg mb-12 leading-relaxed font-sans"
        >
          نقدم لكم أحدث وأفخم السيارات لتجربة قيادة استثنائية في شمال المغرب. اختر سيارتك الآن وانطلق في رحلتك.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <button 
            onClick={onExplore}
            className="group relative px-12 py-5 bg-[#C5A059] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.2em] overflow-hidden transition-all hover:bg-white cursor-pointer"
          >
            <span className="relative z-10">استكشف الأسطول</span>
            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 cursor-pointer flex flex-col items-center gap-2"
        onClick={onExplore}
      >
        <span className="text-[8px] uppercase tracking-[0.3em]">انزل للأسفل</span>
        <ChevronDown size={16} />
      </motion.div>
    </div>
  );
}
