interface MapSimProps {
    type?: 'cashout' | 'deposit';
}

const MapSim = ({ type = 'cashout' }: MapSimProps) => {
    return (
        <div className="relative w-full h-64 bg-surface-container-low rounded-[32px] overflow-hidden border border-outline-variant/30 shadow-inner group">
            {/* Real Map Background */}
            <div className="absolute inset-0 opacity-80 group-hover:scale-105 transition-transform duration-[20s] ease-linear">
                <img 
                    src="/map_bg.png" 
                    alt="Mexico City Map" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback if image fails (safety for demo)
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent"></div>
            </div>

            {/* Simulated Street Glow Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(255,255,255,0.1)_100%)] pointer-events-none"></div>

            {/* User Location Pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 bg-primary/20 rounded-full animate-ping absolute"></div>
                <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-[0_0_15px_rgba(0,105,76,0.5)] relative z-10"></div>
            </div>
            
            {/* Agent Pins with Mushroom Avatars */}
            {type === 'cashout' ? (
                <>
                    {/* Pin 1: Farmacia Guadalupe (Red Mushroom) */}
                    <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce-slow" style={{ animationDelay: '0s' }}>
                        <div className="relative w-14 h-14 cursor-pointer hover:scale-110 transition-transform">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse"></div>
                            <img src="/mushroom_red.png" alt="Honguito Rojo" className="w-full h-full object-contain relative z-10 drop-shadow-lg" />
                        </div>
                        <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full mt-1 shadow-md border border-outline-variant/20">
                            <p className="text-[9px] font-bold text-on-surface whitespace-nowrap">Farmacia Guadalupe</p>
                        </div>
                    </div>

                    {/* Pin 2: Carlos_g (Green Mushroom) */}
                    <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce-slow" style={{ animationDelay: '0.4s' }}>
                        <div className="relative w-14 h-14 cursor-pointer hover:scale-110 transition-transform">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse"></div>
                            <img src="/mushroom_green.png" alt="Honguito Verde" className="w-full h-full object-contain relative z-10 drop-shadow-lg" />
                        </div>
                        <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full mt-1 shadow-md border border-outline-variant/20">
                            <p className="text-[9px] font-bold text-on-surface whitespace-nowrap">@carlos_g</p>
                        </div>
                    </div>

                    {/* Pin 3: Lavandería (Gold Mushroom) */}
                    <div className="absolute top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce-slow" style={{ animationDelay: '0.8s' }}>
                        <div className="relative w-14 h-14 cursor-pointer hover:scale-110 transition-transform">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse"></div>
                            <img src="/mushroom_gold.png" alt="Honguito Oro" className="w-full h-full object-contain relative z-10 drop-shadow-lg" />
                        </div>
                        <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full mt-1 shadow-md border border-outline-variant/20">
                            <p className="text-[9px] font-bold text-on-surface whitespace-nowrap">Centro Lavado</p>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Deposit Pins (Using Green for all) */}
                    <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce-slow">
                        <div className="w-12 h-12 relative">
                             <img src="/mushroom_green.png" alt="Honguito" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <div className="bg-white/95 px-3 py-1 rounded-full mt-1 shadow-md">
                            <p className="text-[9px] font-bold text-on-surface">Don Pepe</p>
                        </div>
                    </div>
                </>
            )}

            {/* Location Label Floating */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-outline-variant/10 flex items-center gap-2 shadow-lg z-20">
                <span className="material-symbols-outlined text-primary text-sm font-bold">location_on</span>
                <p className="text-[10px] font-bold text-on-surface uppercase tracking-widest">CDMX · ZONA CENTRO</p>
            </div>
            
            {/* Live Indicator */}
            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 z-20">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></div>
                <p className="text-[9px] font-bold text-white uppercase tracking-tighter">Buscando Agentes Live</p>
            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default MapSim;
