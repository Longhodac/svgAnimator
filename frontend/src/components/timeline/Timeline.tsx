import { PlayIcon as Play, PauseIcon as Pause, ForwardIcon as FastForward, BackwardIcon as Rewind } from '@heroicons/react/24/solid';
import { cn } from '../../lib/utils';
import { Button } from '@heroui/react';

interface TimelineProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    progress: number;
}

export function Timeline({ isPlaying, onTogglePlay, progress }: TimelineProps) {
    const tracks = [
        { name: 'circle', color: 'bg-white border-white scale-y-75', start: 0, width: '40%' },
        { name: 'rect', color: 'bg-[#555] border-[#555] scale-y-75', start: '20%', width: '30%' },
        { name: 'path', color: 'bg-[#333] border-[#333] scale-y-75', start: '40%', width: '45%' },
    ];

    return (
        <div className="h-full flex-shrink-0 flex flex-col relative text-white bg-[#000]">
            {/* Header / Playback Controls */}
            <div className="h-10 border-b border-[#333] flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Button
                        isIconOnly
                        size="sm"
                        radius="none"
                        onPress={onTogglePlay}
                        className="bg-white text-black hover:bg-gray-200"
                    >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </Button>

                    <div className="flex items-center gap-2 text-[#777]">
                        <button className="hover:text-white transition-colors"><Rewind className="w-3.5 h-3.5" /></button>
                        <button className="hover:text-white transition-colors"><FastForward className="w-3.5 h-3.5" /></button>
                    </div>

                    <span className="text-[#666] tracking-widest text-[9px] uppercase font-mono pl-4 border-l border-[#333]">TIMELINE</span>
                </div>

                <div className="text-white tabular-nums font-mono text-[11px] tracking-wide">
                    {(progress * 4).toFixed(2)}s
                </div>
            </div>

            {/* Ruler */}
            <div className="h-6 border-b border-[#333] relative ml-[100px] text-[9px] text-[#666] font-mono flex items-end pb-1 px-4">
                {[0, 1, 2, 3, 4].map((sec) => (
                    <div key={sec} className="absolute flex flex-col items-center" style={{ left: `${sec * 25}%`, transform: 'translateX(-50%)' }}>
                        <span className="mb-0.5">{sec}s</span>
                        <div className="w-[1px] h-1 bg-[#444]" />
                    </div>
                ))}
                {/* Playhead Marker */}
                <div
                    className="absolute top-0 bottom-[-184px] w-[1px] bg-white z-20 pointer-events-none"
                    style={{ left: `${progress * 100}%` }}
                >
                    <div className="w-2 h-2 bg-white absolute -top-0.5 -translate-x-[3.5px]" />
                </div>
            </div>

            {/* Tracks */}
            <div className="flex-1 overflow-y-auto py-2">
                {tracks.map((track, i) => (
                    <div key={i} className="flex h-8 items-center group hover:bg-[#111] transition-colors">
                        <div className="w-[100px] px-4 text-[#888] font-mono text-[10px] flex items-center justify-between border-r border-[#333]">
                            {track.name}
                            <div className="w-1 h-1 bg-[#333] group-hover:bg-[#fff] transition-colors" />
                        </div>

                        <div className="flex-1 relative h-full flex items-center group-hover:bg-[#0a0a0a]">
                            {/* Background grid marker */}
                            <div className="absolute inset-0 border-l border-[#111]" />

                            {/* Track Block */}
                            <div
                                className={cn(
                                    "h-4 border relative",
                                    track.color
                                )}
                                style={{ marginLeft: track.start, width: track.width }}
                            >
                                {/* Keyframe Nodes */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#444] border border-[#000]" />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1.5 h-1.5 bg-[#444] border border-[#000]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
