import { Mic, Type, Code2, Download } from 'lucide-react';

export function PropertiesPanel() {
    return (
        <aside className="w-80 flex-shrink-0 bg-[#050505] border-l border-[#ffffff0a] flex flex-col h-full overflow-y-auto">

            {/* AI / Voice Command Bento Box */}
            <div className="p-4 border-b border-[#ffffff0a]">
                <div className="text-[10px] text-[#555] uppercase tracking-widest font-mono mb-3">Assistant</div>

                <div className="bg-[#0a0a0a] rounded-xl border border-[#ffffff0f] p-4 group hover:border-[#ffffff1a] transition-colors relative overflow-hidden">
                    {/* Subtle gradient glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-sm text-[#888]">Voice Command</span>
                        <button className="w-10 h-10 rounded-full bg-[#111] border border-[#ffffff1a] flex items-center justify-center text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white transition-all shadow-[0_0_15px_rgba(124,58,237,0.15)] group-hover:shadow-[0_0_20px_rgba(124,58,237,0.25)]">
                            <Mic className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative z-10 flex items-center bg-[#111] rounded-lg border border-[#ffffff0f] px-3 py-2">
                        <Type className="w-3.5 h-3.5 text-[#555] mr-2" />
                        <input
                            type="text"
                            placeholder="Or type a prompt..."
                            className="bg-transparent text-sm text-[#ddd] placeholder:text-[#444] outline-none w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Export Bento Box */}
            <div className="p-4 border-b border-[#ffffff0a]">
                <div className="text-[10px] text-[#555] uppercase tracking-widest font-mono mb-3">Export</div>

                <div className="bg-[#0a0a0a] rounded-xl border border-[#ffffff0f] overflow-hidden group">
                    <div className="h-24 bg-[#111] border-b border-[#ffffff0a] flex items-center justify-center relative">
                        <div className="text-[10px] text-[#444] font-mono">live preview</div>
                        {/* Mock mini preview */}
                        <div className="absolute inset-x-8 inset-y-6 border border-[#ffffff05] rounded-[4px] bg-[#000]" />
                    </div>

                    <div className="p-3 grid grid-cols-2 gap-2">
                        <button className="flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-sm py-2 rounded-lg transition-colors font-medium">
                            <Download className="w-3.5 h-3.5" />
                            SVG
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-[#111] hover:bg-[#222] border border-[#ffffff1a] text-[#ccc] text-sm py-2 rounded-lg transition-colors">
                            <Code2 className="w-3.5 h-3.5" />
                            Code
                        </button>
                    </div>
                </div>
            </div>

            {/* Properties List */}
            <div className="p-4 font-mono text-xs">
                <div className="text-[10px] text-[#555] uppercase tracking-widest mb-4">Properties</div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center group">
                        <span className="text-[#666]">duration</span>
                        <span className="text-[#eee] bg-[#ffffff05] px-2 py-1 rounded group-hover:bg-[#ffffff0a] transition-colors cursor-text">4.0s</span>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-[#666]">ease</span>
                        <span className="text-[#eee] bg-[#ffffff05] px-2 py-1 rounded group-hover:bg-[#ffffff0a] transition-colors cursor-text">power2.inOut</span>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-[#666]">repeat</span>
                        <span className="text-[#eee] bg-[#ffffff05] px-2 py-1 rounded group-hover:bg-[#ffffff0a] transition-colors cursor-text">-1</span>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-[#666]">yoyo</span>
                        <span className="text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-1 rounded group-hover:bg-[#7c3aed]/20 transition-colors cursor-pointer">true</span>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-[#666]">fps</span>
                        <span className="text-[#eee] bg-[#ffffff05] px-2 py-1 rounded group-hover:bg-[#ffffff0a] transition-colors cursor-text">60</span>
                    </div>
                </div>
            </div>

        </aside>
    );
}
