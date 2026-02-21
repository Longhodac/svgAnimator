import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Folder } from 'lucide-react';

const FILES = [
    { id: '1', name: 'scene_01.svg', active: true },
    { id: '2', name: 'scene_02.svg', active: false },
    { id: '3', name: 'intro.svg', active: false },
    { id: '4', name: 'outro.svg', active: false },
];

export function FileSidebar() {
    const [activeId, setActiveId] = useState('1');

    return (
        <aside className="w-full flex-shrink-0 flex flex-col h-full font-mono text-sm text-white/90">
            <div className="p-6 border-b border-white/10 flex items-center justify-between text-white/40 tracking-widest text-[10px]">
                <span className="uppercase font-bold">Files</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                {FILES.map((file) => (
                    <button
                        key={file.id}
                        onClick={() => setActiveId(file.id)}
                        className={cn(
                            "w-full flex items-center gap-4 px-6 py-3.5 text-left transition-all duration-300 group relative",
                            activeId === file.id ? "bg-white/[0.04] text-white shadow-[inset_4px_0_0_rgba(59,130,246,1)]" : "text-white/50 hover:text-white/80 hover:bg-white/[0.02]"
                        )}
                    >
                        {/* Glow on active marker */}
                        {activeId === file.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                        )}

                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0)] transition-all duration-500 border",
                            file.active
                                ? "bg-blue-500 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                                : "bg-white/10 border-transparent group-hover:bg-white/30"
                        )} />

                        <span className="truncate tracking-wide">{file.name}</span>
                    </button>
                ))}

                <div className="mt-6 px-6 pt-4 border-t border-white/5">
                    <button className="flex items-center gap-3 w-full py-3 text-left text-white/40 hover:text-white/80 transition-colors group">
                        <Folder className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                        <span className="tracking-wide">assets/</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
