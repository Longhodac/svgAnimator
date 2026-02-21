import { useState } from 'react';
import { cn } from '../../lib/utils';
import { FolderIcon as Folder } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const FILES = [
    { id: '1', name: 'scene_01.svg' },
    { id: '2', name: 'scene_02.svg' },
    { id: '3', name: 'intro.svg' },
    { id: '4', name: 'outro.svg' },
];

export function FileSidebar() {
    const [activeId, setActiveId] = useState('1');

    return (
        <aside className="w-full flex-shrink-0 flex flex-col h-full font-sans text-sm text-white bg-[#000]">
            <div className="p-4 border-b border-[#333] flex items-center justify-between text-[#888] tracking-widest text-[10px]">
                <span className="uppercase font-bold">Files</span>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {FILES.map((file) => {
                    const isActive = activeId === file.id;
                    return (
                        <button
                            key={file.id}
                            onClick={() => setActiveId(file.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors relative group",
                                isActive ? "text-white" : "text-[#888] hover:text-[#ccc]"
                            )}
                        >
                            {/* Animated Active Background */}
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-[#111] border-l-2 border-white z-0"
                                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                />
                            )}

                            <div className="relative z-10 flex items-center gap-3 w-full">
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-sm transition-colors duration-300",
                                    isActive ? "bg-white" : "bg-[#444] group-hover:bg-[#666]"
                                )} />
                                <span className="truncate tracking-wide font-mono text-xs">{file.name}</span>
                            </div>
                        </button>
                    )
                })}

                <div className="mt-4 px-4 pt-4 border-t border-[#333]">
                    <button className="flex items-center gap-3 w-full py-2 text-left text-[#666] hover:text-[#aaa] transition-colors group">
                        <Folder className="w-3.5 h-3.5" />
                        <span className="tracking-wide font-mono text-xs">assets/</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
