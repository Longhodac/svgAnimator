import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface SvgCanvasProps {
    isPlaying: boolean;
    setProgress: (p: number) => void;
}

export function SvgCanvas({ isPlaying, setProgress }: SvgCanvasProps) {
    const tl = useRef<gsap.core.Timeline | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const circleRef = useRef<SVGCircleElement>(null);
    const rectRef = useRef<SVGRectElement>(null);
    const pathRef = useRef<SVGPathElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            tl.current = gsap.timeline({
                paused: true,
                onUpdate: function () {
                    setProgress(this.progress());
                },
            });

            tl.current.to(circleRef.current, {
                rotation: 360,
                scale: 1.5,
                duration: 1.6,
                ease: 'power2.inOut',
                transformOrigin: 'center center'
            }, 0);

            tl.current.to(rectRef.current, {
                x: -150,
                rotation: 90,
                rx: 50,
                duration: 1.2,
                ease: 'back.out(1.7)'
            }, 0.8);

            if (pathRef.current) {
                const length = pathRef.current.getTotalLength();
                gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length });
                tl.current.to(pathRef.current, {
                    strokeDashoffset: 0,
                    duration: 1.8,
                    ease: 'power1.inOut'
                }, 1.6);
            }
        }, containerRef);

        return () => ctx.revert();
    }, [setProgress]);

    useEffect(() => {
        if (!tl.current) return;
        if (isPlaying) {
            if (tl.current.progress() === 1) {
                tl.current.restart();
            } else {
                tl.current.play();
            }
        } else {
            tl.current.pause();
        }
    }, [isPlaying]);

    return (
        <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center p-8 z-10 w-full h-full">
            {/* Soft inner glow gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            <div className="absolute top-6 left-6 font-mono text-[10px] text-white/40 tracking-widest uppercase z-10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                Canvas
            </div>

            <div className="relative z-10 w-full max-w-[700px] h-[500px]">
                <svg viewBox="0 0 600 400" className="w-full h-full overflow-visible drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <path
                        ref={pathRef}
                        d="M 50,200 Q 150,50 300,200 T 550,200"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-60"
                        filter="drop-shadow(0px 0px 4px rgba(59, 130, 246, 0.4))"
                    />

                    <g transform="translate(200, 200)">
                        <circle
                            ref={circleRef}
                            cx="0" cy="0" r="40"
                            fill="none"
                            stroke="#e879f9"
                            strokeWidth="2"
                            filter="drop-shadow(0px 0px 8px rgba(232, 121, 249, 0.5))"
                        />
                        <circle
                            cx="0" cy="0" r="60"
                            fill="none"
                            stroke="#e879f9"
                            strokeWidth="1"
                            className="opacity-20"
                            strokeDasharray="4 8"
                        />
                    </g>

                    <rect
                        ref={rectRef}
                        x="350" y="150"
                        width="100" height="100"
                        rx="12"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        className="opacity-70"
                        filter="drop-shadow(0px 0px 6px rgba(56, 189, 248, 0.4))"
                    />
                </svg>
            </div>
        </div>
    );
}
