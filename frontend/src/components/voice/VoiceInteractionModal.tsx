import { X } from 'lucide-react';
import Spline from '@splinetool/react-spline';

interface VoiceInteractionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VoiceInteractionModal({ isOpen, onClose }: VoiceInteractionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 animate-in fade-in duration-300">
            {/* Extremely heavy dark glassy overlay to focus entirely on the voice spline */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl aspect-[16/9] rounded-3xl border border-white/10 bg-black/40 overflow-hidden shadow-[0_0_100px_rgba(59,130,246,0.2)] animate-in zoom-in-95 duration-500">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
                >
                    <X className="w-5 h-5 pointer-events-none" />
                </button>

                {/* Spline Area */}
                <div className="absolute inset-0 w-full h-full">
                    <Spline scene="/voice_interaction_animation.spline" />
                </div>

                {/* Voice Status Text */}
                <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20 pointer-events-none">
                    <div className="px-6 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <span className="text-white/80 font-mono tracking-widest uppercase text-sm animate-pulse">
                            Listening for command...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
