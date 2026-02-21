import { Aperture } from 'lucide-react';

export function TopNav() {
    return (
        <nav className="w-full h-20 px-8 flex items-center justify-between z-20 relative">
            {/* Logo Area */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <Aperture className="w-5 h-5 text-black" />
                </div>
                <span className="text-white font-medium text-lg tracking-wide">Imagica</span>
            </div>

            {/* Center Links with glassy pill background */}
            <div className="hidden md:flex items-center gap-8 px-8 py-3 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
                <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Product</a>
                <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">How it works</a>
                <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Features</a>
                <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Mission</a>
                <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Company</a>
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-4">
                <button className="px-5 py-2 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all">
                    Enterprice
                </button>
                <button className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    Login
                </button>
            </div>
        </nav>
    );
}
