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
                        className="relative w-full aspect-square max-w-[600px] flex items-center justify-center"
                    >
                        {/* The interactive Spline landing animation */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden mix-blend-screen shadow-[0_0_80px_rgba(212,175,55,0.05)]">
                            <Spline 
                                scene="/glass_donut.spline" 
                                className="w-full h-full"
                            />
                        </div>
                        
                        {/* Decorative corner accents to frame the Spline scene */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20 rounded-tl-3xl pointer-events-none" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/20 rounded-tr-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/20 rounded-bl-3xl pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/20 rounded-br-3xl pointer-events-none" />
                    </motion.div>
                </div>
            </main>
        </div>
    );
}