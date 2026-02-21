import { useState } from 'react';
import { FileSidebar } from '../sidebar/FileSidebar';
import { SvgCanvas } from '../canvas/SvgCanvas';
import { Timeline } from '../timeline/Timeline';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { TopNav } from '../navigation/TopNav';
import { VoiceInteractionModal } from '../voice/VoiceInteractionModal';

export function AppLayout() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="flex flex-col h-screen w-full relative overflow-hidden font-sans">
            {/* The absolute iridescent sweeping curves background (simulated via CSS for the layout) */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen filter blur-[100px] bg-gradient-to-tr from-blue-600/20 to-purple-600/20 animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[120px] bg-gradient-to-bl from-indigo-500/20 to-pink-500/10 animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
            </div>

            {/* Global Top Navigation */}
            <TopNav />

            {/* Main App Workspace */}
            <div className="flex flex-1 z-10 overflow-hidden pt-4 pb-6 px-6 gap-6">

                {/* Left Panel */}
                <div className="w-64 flex-shrink-0 flex flex-col relative rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <FileSidebar />
                </div>

                {/* Center Workspace */}
                <div className="flex flex-col flex-1 relative gap-6">
                    <div className="flex-1 relative rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Imagica specific headline watermark */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-10">
                            <h2 className="text-[10px] tracking-widest font-bold uppercase mb-4 text-white">BUILD A NO-CODE AI APP IN MINUTES</h2>
                            <h1 className="text-4xl font-medium tracking-tight text-center max-w-lg leading-tight text-white">A new way to think and create <br />with computers</h1>
                        </div>
                        <SvgCanvas isPlaying={isPlaying} setProgress={() => { }} />
                    </div>

                    <div className="h-64 flex-shrink-0 relative rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <Timeline isPlaying={isPlaying} onTogglePlay={togglePlay} progress={0} />
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-80 flex-shrink-0 flex flex-col relative rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <PropertiesPanel onActivateVoice={() => setIsVoiceActive(true)} />
                </div>
            </div>

            {/* Modals/Overlays */}
            <VoiceInteractionModal
                isOpen={isVoiceActive}
                onClose={() => setIsVoiceActive(false)}
            />
        </div>
    );
}
