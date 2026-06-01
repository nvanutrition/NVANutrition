'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MarqueeConfig {
  message: string;
  isActive: boolean;
  speed?: number; // pixels per second, default 60
  bgColor?: string;
  textColor?: string;
}

export function MarqueeTicker() {
  const [config, setConfig] = useState<MarqueeConfig | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'marquee'));
        if (snap.exists()) setConfig(snap.data() as MarqueeConfig);
      } catch (e) {
        // silently fail
      }
    })();
  }, []);

  if (!config?.isActive || !config?.message) return null;

  const speed = config.speed || 60;
  const duration = Math.max(10, Math.round(config.message.length / speed * 60));

  return (
    <div
      className="w-full overflow-hidden flex items-center py-2 z-40 relative"
      style={{ backgroundColor: config.bgColor || '#00C853', color: config.textColor || '#000000' }}
    >
      <div
        className="flex whitespace-nowrap"
        style={{ animation: `marquee ${duration}s linear infinite` }}
      >
        {/* Duplicate for seamless loop */}
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="text-sm font-bold px-16 tracking-wide">
            {config.message} &nbsp;★&nbsp;
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
