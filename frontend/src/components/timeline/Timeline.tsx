import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TimelineProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    progress: number;
}

export function Timeline({ isPlaying, onTogglePlay, progress }: TimelineProps) {
    const tracks = [
        { name: 'circle', color: 'bg-fuchsia-500/30 border-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.3)]', start: 0, width: '40%' },
        { name: 'rect', color: 'bg-sky-500/30 border-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.3)]', start: '20%', width: '30%' },
        { name: 'path', color: 'bg-blue-500/30 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]', start: '40%', width: '45%' },
    ];

    return (
        <div className="h-full flex-shrink-0 flex flex-col relative text-white/90">
            {/* Header / Playback Controls */}
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
                <div className="flex items-center gap-5">
                    <button
                        onClick={onTogglePlay}
                        className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div className="flex items-center gap-3 text-white/50">
                        <button className="hover:text-white transition-colors"><Rewind className="w-4 h-4" /></button>
                        <button className="hover:text-white transition-colors"><FastForward className="w-4 h-4" /></button>
                    </div>

                    <span className="text-white/40 tracking-widest text-[10px] uppercase font-mono pl-4 border-l border-white/10">TIMELINE</span>
                </div>

                <div className="text-blue-400 tabular-nums font-mono text-sm tracking-wide">
                    {(progress * 4).toFixed(2)}s
                </div>
            </div>

            {/* Ruler */}
            <div className="h-8 border-b border-white/5 relative ml-[120px] mr-6 text-[10px] text-white/30 font-mono flex items-end pb-1 px-4">
                {[0, 1, 2, 3, 4].map((sec) => (
                    <div key={sec} className="absolute flex flex-col items-center" style={{ left: `${sec * 25}%`, transform: 'translateX(-50%)' }}>
                        <span className="mb-1">{sec}s</span>
                        <div className="w-[1px] h-1.5 bg-white/20" />
                    </div>
                ))}
                {/* Playhead Marker */}
                <div
                    className="absolute top-0 bottom-[-184px] w-[1px] bg-blue-500/70 z-20 pointer-events-none shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    style={{ left: `${progress * 100}%` }}
                >
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 absolute -top-1 -translate-x-[4.5px] shadow-[0_0_10px_rgba(59,130,246,0.8)] border border-blue-300/50" />
                </div>
            </div>

            {/* Tracks */}
            <div className="flex-1 overflow-y-auto py-3 px-2">
                {tracks.map((track, i) => (
                    <div key={i} className="flex h-10 items-center group mb-2 hover:bg-white/[0.03] rounded-lg transition-colors">
                        <div className="w-[110px] px-4 text-white/60 font-sans text-xs flex items-center gap-2.5 border-r border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />
                            {track.name}
                        </div>

                        <div className="flex-1 relative h-full mx-4 flex items-center">
                            {/* Background grid marker */}
                            <div className="absolute inset-0 border-l border-white/5" />

                            {/* Track Block */}
                            <div
                                className={cn(
                                    "h-5 rounded-md border backdrop-blur-md relative",
                                    track.color
                                )}
                                style={{ marginLeft: track.start, width: track.width }}
                            >
                                {/* Keyframe Nodes */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white border border-white/20 shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-white border border-white/20 shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
