import { Mic, Type, Code2, Download } from 'lucide-react';

interface PropertiesPanelProps {
    onActivateVoice: () => void;
}

export function PropertiesPanel({ onActivateVoice }: PropertiesPanelProps) {
    return (
        <aside className="w-full flex flex-col h-full overflow-y-auto text-white/90">
            {/* AI / Voice Command Bento Box */}
            <div className="p-6 border-b border-white/10">
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono mb-4">Assistant</div>

                <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/10 p-5 group hover:border-white/20 hover:bg-white/[0.05] transition-all relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                    {/* Subtle holographic glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="flex items-center justify-between mb-5 relative z-10">
                        <span className="text-sm font-medium text-white/80">Voice Command</span>
                        <button
                            onClick={onActivateVoice}
                            className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        >
                            <Mic className="w-5 h-5 pointer-events-none" />
                        </button>
                    </div>

                    <div className="relative z-10 flex items-center bg-black/40 rounded-xl border border-white/5 px-4 py-3">
                        <Type className="w-4 h-4 text-white/40 mr-3" />
                        <input
                            type="text"
                            placeholder="Or type a prompt..."
                            className="bg-transparent text-sm text-white placeholder:text-white/30 outline-none w-full font-sans tracking-wide"
                        />
                    </div>
                </div>
            </div>

            {/* Export Bento Box */}
            <div className="p-6 border-b border-white/10">
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono mb-4">Export</div>

                <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                    <div className="h-28 bg-black/40 border-b border-white/5 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-30" />
                        <div className="text-[10px] text-white/30 font-mono tracking-widest uppercase relative z-10">live preview</div>
                        {/* Mock mini preview */}
                        <div className="absolute inset-x-10 inset-y-8 border border-white/10 rounded-lg bg-black/50 shadow-inner" />
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(37,99,235,0.4)] font-medium">
                            <Download className="w-4 h-4" />
                            SVG
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm py-2.5 rounded-xl transition-all font-medium">
                            <Code2 className="w-4 h-4" />
                            Code
                        </button>
                    </div>
                </div>
            </div>

            {/* Properties List */}
            <div className="p-6 font-mono text-xs">
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-5">Properties</div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center group">
                        <span className="text-white/50">duration</span>
                        <span className="text-white/90 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 group-hover:bg-white/10 transition-colors">4.0s</span>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-white/50">ease</span>
                        <span className="text-white/90 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 group-hover:bg-white/10 transition-colors">power2.inOut</span>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-white/50">repeat</span>
                        <span className="text-white/90 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 group-hover:bg-white/10 transition-colors">-1</span>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-white/50">yoyo</span>
                        <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md group-hover:bg-blue-500/20 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.1)]">true</span>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-white/50">fps</span>
                        <span className="text-white/90 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 group-hover:bg-white/10 transition-colors">60</span>
                    </div>
                </div>
            </div>

        </aside>
    );
}
