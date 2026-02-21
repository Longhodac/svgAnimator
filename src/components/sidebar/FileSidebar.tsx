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
        <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-[#050505] border-r border-[#ffffff0a] font-mono text-sm">
            <div className="p-4 border-b border-[#ffffff0a] flex items-center justify-between text-[#888] tracking-widest text-xs">
                <span className="uppercase">Files</span>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {FILES.map((file) => (
                    <button
                        key={file.id}
                        onClick={() => setActiveId(file.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-2 text-left transition-all duration-200 group relative",
                            activeId === file.id ? "bg-[#ffffff08] text-white" : "text-[#777] hover:text-[#bbb] hover:bg-[#ffffff03]"
                        )}
                    >
                        {activeId === file.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#7c3aed]" />
                        )}
                        <div className={cn(
                            "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(124,58,237,0)] transition-all duration-300",
                            file.active
                                ? "bg-[#7c3aed] shadow-[0_0_8px_rgba(124,58,237,0.6)]"
                                : "bg-[#333]"
                        )} />
                        <span className="truncate">{file.name}</span>
                    </button>
                ))}

                <div className="mt-4 px-4">
                    <button className="flex items-center gap-3 w-full py-2 text-left text-[#555] hover:text-[#888] transition-colors">
                        <Folder className="w-4 h-4" />
                        <span>assets/</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
