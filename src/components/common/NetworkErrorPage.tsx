import { WifiOff, AlertTriangle } from 'lucide-react';

export default function NetworkErrorPage() {
  return (
    <div className="fixed inset-0 z-[9999] bg-brand-black text-brand-white font-sans flex flex-col items-center justify-center overflow-hidden">
      {/* Abstract Architectural Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="absolute top-[20%] left-0 w-full border-t border-dashed border-brand-white" />
          <div className="absolute top-[50%] left-0 w-full border-t border-dashed border-brand-white" />
          <div className="absolute top-[80%] left-0 w-full border-t border-dashed border-brand-white" />
          <div className="absolute left-[20%] top-0 h-full border-l border-dashed border-brand-white" />
          <div className="absolute left-[50%] top-0 h-full border-l border-dashed border-brand-white" />
          <div className="absolute left-[80%] top-0 h-full border-l border-dashed border-brand-white" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Warning Icon Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
            <WifiOff className="w-[40rem] h-[40rem] text-brand-orange" />
        </div>

        {/* Massive Error Text */}
        <h1 className="text-[6rem] md:text-[10rem] font-black italic text-brand-orange leading-none tracking-tighter mix-blend-screen drop-shadow-[0_0_80px_rgba(255,91,0,0.2)] relative z-10">
          OFFLINE
          <div className="absolute inset-0 text-brand-orange opacity-40 blur-2xl">OFFLINE</div>
        </h1>
        
        {/* Tactical Error Messaging */}
        <div className="mt-8 space-y-4 max-w-lg mx-auto relative z-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF5B00]/10 border border-[#FF5B00]/30 rounded-full animate-pulse">
                <AlertTriangle className="w-3 h-3 text-[#FF5B00]" />
                <span className="text-[10px] font-black italic tracking-[0.3em] text-[#FF5B00] uppercase">
                    NO SIGNAL DETECTED
                </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-widest text-brand-white">
                SATELLITE UPLINK LOST
            </h2>
            <p className="text-neutral-500 font-medium text-xs md:text-sm px-6 leading-relaxed uppercase tracking-widest">
                Critical connection failure. Platform telemetry has been suspended. Please verify your local network array to re-establish the command link.
            </p>
        </div>

        {/* Retry Indicator */}
        <div className="mt-16 relative z-20">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(255,91,0,0.8)] animate-ping" />
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest animate-pulse">ATTEMPTING RECONNECT...</span>
            </div>
        </div>
      </div>
    </div>
  );
}
