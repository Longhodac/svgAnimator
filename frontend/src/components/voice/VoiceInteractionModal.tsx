import { useEffect, useRef } from 'react';
import { XMarkIcon as X } from '@heroicons/react/24/outline';
import Spline from '@splinetool/react-spline';
import { useVoiceListener } from '../../voice/useVoiceListener';

interface VoiceInteractionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VoiceInteractionModal({ isOpen, onClose }: VoiceInteractionModalProps) {
    const {
        startListening,
        stopListening,
        status,
        error,
        errorCode,
        interim,
        finalText,
        diagnostics,
    } = useVoiceListener({ onStopped: undefined });

    // ★ Use refs so the effect only depends on `isOpen`
    const startRef = useRef(startListening);
    const stopRef = useRef(stopListening);
    startRef.current = startListening;
    stopRef.current = stopListening;

    useEffect(() => {
        if (isOpen) {
            // Small delay to let the modal mount before requesting mic
            const timer = setTimeout(() => {
                startRef.current();
            }, 100);
            return () => {
                clearTimeout(timer);
                stopRef.current();
            };
        }
    }, [isOpen]);

    const handleClose = () => {
        stopListening();
        onClose();
    };

    if (!isOpen) return null;

    const statusLabel =
        status === "Connecting"
            ? "Connecting..."
            : status === "Listening"
                ? "Listening — speak now"
                : status === "Stopping" || status === "Stopped"
                    ? "Stopped"
                    : status === "Error"
                        ? "Error"
                        : "Ready";
    const displayText = error
        ? error
        : (interim || finalText)
            ? (finalText ? `${finalText}${interim ? ` ${interim}` : ""}` : interim)
            : statusLabel;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-8 pointer-events-none">
            {/* Background overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
                onClick={handleClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md h-[calc(100vh-4rem)] rounded-3xl border border-white/10 bg-black/80 overflow-hidden shadow-[-20px_0_100px_rgba(0,0,0,0.5)] pointer-events-auto">

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
                >
                    <X className="w-5 h-5 pointer-events-none" />
                </button>

                {/* Spline Area */}
                <div className="absolute inset-0 w-full h-full">
                    <Spline scene="/voice_interaction_animation.spline" />
                </div>

                {/* Voice Status */}
                <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20 pointer-events-none">
                    <div className="px-6 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] max-w-[90%]">
                        <span className={`block font-mono tracking-widest uppercase text-xs ${error ? "text-red-400" : status === "Listening" ? "text-green-400 animate-pulse" : "text-white/80"}`}>
                            {displayText}
                        </span>
                        <span className="block mt-1 text-[10px] font-mono text-white/40 tracking-wide uppercase truncate">
                            stage:{diagnostics.stage} key:{diagnostics.keyConfigured ? "yes" : "no"} code:{errorCode}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
