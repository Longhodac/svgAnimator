import { PlayIcon } from '@heroicons/react/24/solid';

export function TopNav() {
    return (
        <nav className="w-full h-24 px-8 md:px-12 flex items-center justify-between z-20 relative border-b border-white/[0.05]">
            {/* Logo Area - Creative Studio Vibe (Serif Wordmark) */}
            <div className="flex items-center gap-1 group cursor-pointer">
                <span className="text-white font-serif text-2xl tracking-wide font-medium italic group-hover:text-[#d4af37] transition-colors duration-500">
                    Aurelian
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-3 opacity-80" />
            </div>

            {/* Center Links - Casual, Independent Studio Energy */}
            <div className="hidden md:flex items-center gap-10">
                <a href="#" className="text-sm font-sans text-white/60 hover:text-[#d4af37] transition-colors">Manifesto</a>
                <a href="#" className="text-sm font-sans text-white/60 hover:text-[#d4af37] transition-colors">Studio</a>
                <a href="#" className="text-sm font-sans text-white/60 hover:text-[#d4af37] transition-colors">Engine</a>
                <a href="#" className="text-sm font-sans text-white/60 hover:text-[#d4af37] transition-colors">Log</a>
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-6">
                <a href="#" className="text-sm font-sans text-white/50 hover:text-white transition-colors">
                    Sign in
                </a>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded border border-white/10 hover:border-[#d4af37]/50 bg-black text-white text-sm font-medium hover:bg-[#d4af37]/10 transition-all duration-300">
                    <span>Open Editor</span>
                </button>
            </div>
        </nav>
    );
}
