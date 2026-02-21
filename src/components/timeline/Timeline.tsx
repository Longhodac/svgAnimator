import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TimelineProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    progress: number;
}

export function Timeline({ isPlaying, onTogglePlay, progress }: TimelineProps) {
    // A mock representation of tracks. We will manually scrub the GSAP timeline using `progress`.
    const tracks = [
        { name: 'circle', color: 'bg-indigo-500/40 border-indigo-500/50', start: 0, width: '40%' },
        { name: 'rect', color: 'bg-rose-500/40 border-rose-500/50', start: '20%', width: '30%' },
        { name: 'path', color: 'bg-emerald-500/40 border-emerald-500/50', start: '40%', width: '45%' },
    ];

    return (
        <div className="h-64 flex-shrink-0 bg-[#070707] border-t border-[#ffffff0a] font-mono text-xs flex flex-col">
            {/* Header / Playback Controls */}
            <div className="h-10 border-b border-[#ffffff0a] flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onTogglePlay}
                        className="w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center text-white hover:bg-[#8b5cf6] transition-colors shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                    >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                    </button>

                    <div className="flex items-center gap-2 text-[#666]">
                        <button className="hover:text-white transition-colors"><Rewind className="w-3.5 h-3.5" /></button>
                        <button className="hover:text-white transition-colors"><FastForward className="w-3.5 h-3.5" /></button>
                    </div>

                    <span className="text-[#888] tracking-widest pl-2 border-l border-[#ffffff0a]">TIMELINE</span>
                </div>

                <div className="text-[#7c3aed] tabular-nums font-bold">
                    {(progress * 4).toFixed(2)}s
                </div>
            </div>

            {/* Ruler */}
            <div className="h-6 border-b border-[#ffffff0a] relative ml-24 mr-4 text-[9px] text-[#444] flex items-end pb-1">
                {[0, 1, 2, 3, 4].map((sec) => (
                    <div key={sec} className="absolute flex flex-col items-center" style={{ left: `${sec * 25}%`, transform: 'translateX(-50%)' }}>
                        <span className="mb-1">{sec}s</span>
                        <div className="w-[1px] h-1 bg-[#444]" />
                    </div>
                ))}
                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-[-184px] w-[1px] bg-red-500/80 z-20 pointer-events-none transition-all duration-75"
                    style={{ left: `${progress * 100}%` }}
                >
                    <div className="w-2 h-2 rounded-full bg-red-500 absolute -top-1 -translate-x-[3.5px] shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                </div>
            </div>

            {/* Tracks */}
            <div className="flex-1 overflow-y-auto py-2">
                {tracks.map((track, i) => (
                    <div key={i} className="flex h-8 items-center group mb-1 hover:bg-[#ffffff03]">
                        <div className="w-24 px-4 text-[#777] font-sans text-xs flex items-center gap-2 border-r border-[#ffffff0a]">
                            <div className="w-1 h-1 rounded-full bg-[#444] group-hover:bg-[#888]" />
                            {track.name}
                        </div>

                        <div className="flex-1 relative h-full ml-4 mr-4 flex items-center">
                            {/* Background grid marker */}
                            <div className="absolute inset-0 border-l border-[#ffffff02]" />

                            {/* Track Block */}
                            <div
                                className={cn(
                                    "h-4 rounded-sm border backdrop-blur-sm relative",
                                    track.color
                                )}
                                style={{ marginLeft: track.start, width: track.width }}
                            >
                                {/* Keyframe Nodes */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/80" />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/80" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
