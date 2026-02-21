import { XMarkIcon as X } from '@heroicons/react/24/outline';
import Spline from '@splinetool/react-spline';

interface VoiceInteractionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VoiceInteractionModal({ isOpen, onClose }: VoiceInteractionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-8 pointer-events-none">
            {/* Background overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Container - Anchored to right */}
            <div className="relative w-full max-w-md h-[calc(100vh-4rem)] rounded-3xl border border-white/10 bg-black/80 overflow-hidden shadow-[-20px_0_100px_rgba(0,0,0,0.5)] pointer-events-auto animate-in slide-in-from-right duration-500">

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
                    <div className="px-6 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                        <span className="text-white/80 font-mono tracking-widest uppercase text-xs animate-pulse">
                            Listening for command...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
