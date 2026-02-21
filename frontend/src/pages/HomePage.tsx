import { motion } from 'framer-motion';
import { ArrowUpTrayIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';
import { TopNav } from '../components/navigation/TopNav';
import Spline from '@splinetool/react-spline';

interface HomePageProps {
    onStart: () => void;
}

export function HomePage({ onStart }: HomePageProps) {
    return (
        <div className="min-h-screen bg-[#020202] text-[#e5e5e5] flex flex-col font-sans overflow-x-hidden selection:bg-[#d4af37]/30">
            {/* Top Navigation */}
            <TopNav />

            {/* Main Layout - Studio Vibe */}
            <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row relative">
                
                {/* Left Content Column: Story & Tools */}
                <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-24 z-10 lg:max-w-xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full"
                    >
                        {/* Wordmark / Tagline */}
                        <h1 className="text-4xl lg:text-5xl font-serif tracking-tight leading-tight mb-6 text-white font-medium">
                            An AI-powered scene animation editor.
                        </h1>
                        
                        {/* Product Description */}
                        <div className="space-y-6 text-base lg:text-lg text-[#888] font-sans leading-relaxed mb-12">
                            <p>
                                Aurelian orchestrates a pipeline of agents — a code agent that writes GSAP animations, and a visual evaluation agent that reviews the output and loops back if something looks off. 
                            </p>
                            <p>
                                The end result is a polished, exported SVG animation. We built this for developers and motion designers who want to generate and refine animated scenes without doing everything by hand.
                            </p>
                        </div>

                        {/* Creative Studio Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-16">
                            <motion.button 
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onStart}
                                className="group relative flex items-center justify-between px-6 py-4 rounded-lg border border-white/10 hover:border-[#d4af37]/40 bg-[#0a0a0a] transition-all text-left overflow-hidden w-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37]/5 to-[#d4af37]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div>
                                    <span className="block text-sm font-medium text-white mb-0.5">Upload static SVG</span>
                                    <span className="block text-xs font-serif italic text-[#888]">Bring pre-existing vectors to life.</span>
                                </div>
                                <ArrowUpTrayIcon className="w-5 h-5 text-white/50 group-hover:text-[#d4af37] transition-colors" />
                            </motion.button>

                            <motion.button 
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onStart}
                                className="group flex items-center justify-between px-6 py-4 rounded-lg border border-white/5 hover:border-white/20 bg-transparent transition-all text-left w-full"
                            >
                                <div>
                                    <span className="block text-sm font-medium text-white mb-0.5">Start fresh</span>
                                    <span className="block text-xs font-serif italic text-[#888]">Blank canvas approach.</span>
                                </div>
                                <DocumentPlusIcon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                            </motion.button>
                        </div>

                        {/* Emperor Bio (Quiet nod to history) */}
                        <div className="pt-8 border-t border-white/5">
                            <span className="block text-[10px] font-mono tracking-widest uppercase text-[#555] mb-3">
                                Origin / 270–275 AD
                            </span>
                            <p className="text-sm font-serif italic text-[#777] leading-relaxed max-w-md">
                                Aurelian was a Roman emperor who inherited a collapsing empire and reunited it. He was a builder, a fixer, and a relentless executor — not flashy, just effective.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Right Visual / Spline Column */}
                <div className="flex-1 relative min-h-[500px] lg:min-h-screen flex items-center justify-center p-12">
                    {/* Minimalist Studio Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

                    {/* Subtle Warm Gold Ambient Glow */}
                    <div className="absolute w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-[#d4af37]/[0.03] rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
                    
                    {/* Spline Integration Container */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 0.4 }}
                        className="relative w-full aspect-square max-w-[500px] flex items-center justify-center"
                    >
                        {/* Example Spline Component (Uncomment/Modify when ready) */}
                        {/* <Spline scene="YOUR_SPLINE_URL_HERE" /> */}
                        
                        {/* Refined Placeholder: Minimalist floating geometry */}
                        <div className="relative w-full h-full border border-white/5 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-sm flex items-center justify-center shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden">
                            {/* Inner architectural lines */}
                            <div className="absolute top-0 bottom-0 left-1/3 border-l border-white/[0.03]" />
                            <div className="absolute top-1/3 left-0 right-0 border-t border-white/[0.03]" />
                            
                            <div className="w-24 h-24 border border-[#d4af37]/30 rounded-full flex items-center justify-center animate-[spin_20s_linear_infinite]">
                                <div className="w-12 h-12 border border-white/20 rounded animate-[spin_10s_linear_infinite_reverse]" />
                            </div>
                            
                            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                                <span className="font-mono text-[9px] tracking-widest text-[#555] uppercase">
                                    Canvas_01.spline
                                </span>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 bg-[#d4af37]/60 rounded-full" />
                                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}