import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface SvgCanvasProps {
    isPlaying: boolean;
    setProgress: (p: number) => void;
}

export function SvgCanvas({ isPlaying, setProgress }: SvgCanvasProps) {
    const tl = useRef<gsap.core.Timeline>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const circleRef = useRef<SVGCircleElement>(null);
    const rectRef = useRef<SVGRectElement>(null);
    const pathRef = useRef<SVGPathElement>(null);

    useEffect(() => {
        // Initialize standard GSAP timeline synced with progress
        const ctx = gsap.context(() => {
            tl.current = gsap.timeline({
                paused: true,
                onUpdate: function () {
                    // Sync GSAP progress up to React state
                    setProgress(this.progress());
                },
            });

            // Sample Animations matching the tracks in Timeline component
            // Circle rotates and scales
            tl.current.to(circleRef.current, {
                rotation: 360,
                scale: 1.5,
                duration: 1.6,
                ease: 'power2.inOut',
                transformOrigin: 'center center'
            }, 0);

            // Rect moves across and rounds
            tl.current.to(rectRef.current, {
                x: -150,
                rotation: 90,
                rx: 50,
                duration: 1.2,
                ease: 'back.out(1.7)'
            }, 0.8); // Starts at 20% (0.8s)

            // Path dash offset
            if (pathRef.current) {
                const length = pathRef.current.getTotalLength();
                gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length });
                tl.current.to(pathRef.current, {
                    strokeDashoffset: 0,
                    duration: 1.8,
                    ease: 'power1.inOut'
                }, 1.6); // Starts at 40% (1.6s)
            }
        }, containerRef);

        return () => ctx.revert();
    }, [setProgress]);

    // Handle Play/Pause
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
        <div ref={containerRef} className="flex-1 relative bg-[#030303] overflow-hidden flex items-center justify-center border-b border-[#ffffff0a]">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Crosshairs */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#ffffff0a] pointer-events-none" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#ffffff0a] pointer-events-none" />

            <div className="absolute top-4 left-4 font-mono text-[10px] text-[#555] tracking-widest uppercase z-10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                SVG Canvas
            </div>

            <div className="relative z-10 w-[600px] h-[400px]">
                <svg viewBox="0 0 600 400" className="w-full h-full overflow-visible">
                    {/* A cool animating path */}
                    <path
                        ref={pathRef}
                        d="M 50,200 Q 150,50 300,200 T 550,200"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="opacity-70"
                    />

                    <g transform="translate(200, 200)">
                        <circle
                            ref={circleRef}
                            cx="0" cy="0" r="40"
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth="3"
                        />
                        <circle
                            cx="0" cy="0" r="60"
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth="1"
                            className="opacity-30"
                            strokeDasharray="4 8"
                        />
                    </g>

                    <rect
                        ref={rectRef}
                        x="350" y="150"
                        width="100" height="100"
                        rx="12"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3"
                        className="opacity-80"
                    />
                </svg>
            </div>
        </div>
    );
}
