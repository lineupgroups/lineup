import PageTitle from '../common/PageTitle';

export default function CreatorEarningsPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-brand-black text-brand-white font-sans relative overflow-hidden">
      <PageTitle title="Restricted" description="Error Code 5565" />
      
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
        {/* Massive 5565 Error Code */}
        <h1 className="text-[12rem] md:text-[20rem] font-black italic text-brand-acid leading-none tracking-tighter mix-blend-screen drop-shadow-[0_0_80px_rgba(204,255,0,0.15)] relative">
          5565
          <div className="absolute inset-0 text-brand-acid opacity-30 blur-2xl">5565</div>
        </h1>
        
        {/* Tactical Error Messaging */}
        <div className="mt-2 md:mt-4 space-y-4 max-w-lg mx-auto relative z-20">
            <div className="inline-block px-4 py-1.5 bg-[#FF5B00]/10 border border-[#FF5B00]/30 rounded-full">
                <span className="text-[10px] font-black italic tracking-[0.3em] text-[#FF5B00] uppercase">
                    SYSTEM EXCEPTION
                </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-widest text-brand-white">
                FINANCIAL ROUTING OFFLINE
            </h2>
            <p className="text-neutral-500 font-medium text-xs md:text-sm px-6 leading-relaxed uppercase tracking-widest">
                The payout gateway is currently restricted. Establish a secure connection or contact platform command to resolve protocol 5565.
            </p>
        </div>
      </div>
    </div>
  );
}
