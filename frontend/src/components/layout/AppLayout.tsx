import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon as PanelBottomClose, ChevronUpIcon as PanelBottomOpen, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FileSidebar } from '../sidebar/FileSidebar';
import { SvgCanvas } from '../canvas/SvgCanvas';
import { Timeline } from '../timeline/Timeline';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { VoiceInteractionPanel } from '../voice/VoiceInteractionPanel';

interface AppLayoutProps {
    onBack: () => void;
}

export function AppLayout({ onBack }: AppLayoutProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="flex flex-col h-screen w-full bg-[#000] text-white overflow-hidden font-sans">

            {/* Main Application Flex Container */}
            <div className="flex flex-1 w-full min-h-0 p-2 gap-2 relative">

                {/* Left Panel: Files */}
                <div className="w-64 flex-shrink-0 flex flex-col relative rounded-lg border border-white/10 bg-[#050505] overflow-hidden">
                    {/* Back to Home Button */}
                    <div className="p-3 border-b border-[#333]">
                        <button 
                            onClick={onBack}
                            className="flex items-center gap-2 px-3 py-1.5 w-full rounded-md bg-white/5 hover:bg-white/10 text-[#aaa] hover:text-white transition-all text-xs font-medium"
                        >
                            <ArrowLeftIcon className="w-3.5 h-3.5" />
                            Back to Home
                        </button>
                    </div>
                    <FileSidebar />
                </div>

                {/* Center Column: Editor & Timeline */}
                <div className="flex flex-col flex-1 relative gap-2 min-w-0 min-h-0">
                    {/* SVG Editing Canvas */}
                    <div className="flex-1 relative rounded-lg border border-white/10 bg-[#050505] overflow-hidden flex flex-col min-h-0">
                        <SvgCanvas isPlaying={isPlaying} setProgress={() => { }} />
                    </div>

                    {/* Animation Timeline */}
                    <div className="h-64 flex-shrink-0 relative rounded-lg border border-white/10 bg-[#050505] overflow-hidden">
                        <Timeline isPlaying={isPlaying} onTogglePlay={togglePlay} progress={0} />
                    </div>
                </div>

                {/* Right Column: Voice Experience */}
                <div className="w-80 flex-shrink-0 relative rounded-lg border border-white/10 bg-[#050505] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(255,255,255,0.03)] selection:bg-white/20 min-h-0">
                    <VoiceInteractionPanel />
                </div>
            </div>

            {/* Bottom Toggle Button */}
            <div className="flex justify-center -mt-4 z-20 relative h-0">
                <button
                    type="button"
                    onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
                    className="flex items-center justify-center gap-2 px-4 h-8 rounded-t-lg border-t border-l border-r border-white/10 bg-[#050505] text-white/80 hover:bg-white/5 hover:text-white transition-all transform -translate-y-full"
                    title={isPropertiesOpen ? 'Close properties' : 'Open properties'}
                >
                    <span className="text-xs font-mono tracking-widest uppercase">Properties</span>
                    {isPropertiesOpen ? <PanelBottomClose className="w-4 h-4" /> : <PanelBottomOpen className="w-4 h-4" />}
                </button>
            </div>

            {/* Bottom Properties Panel */}
            <AnimatePresence initial={false}>
                {isPropertiesOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 200, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className="w-full flex-shrink-0 border-t border-white/10 bg-[#050505] overflow-hidden z-10"
                    >
                        <PropertiesPanel />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
