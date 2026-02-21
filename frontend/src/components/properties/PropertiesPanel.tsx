import { CodeBracketIcon as Code2, ArrowDownTrayIcon as Download } from '@heroicons/react/24/outline';
import { Switch } from '@heroui/react';

export function PropertiesPanel() {
    return (
        <div className="w-full h-full flex flex-row bg-[#000] text-white p-6 gap-8 overflow-x-auto items-start">
            {/* Quick Actions */}
            <div className="flex flex-col min-w-[200px]">
                <div className="text-[10px] text-[#888] uppercase tracking-widest font-mono mb-4">Actions</div>
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-white text-black font-medium hover:bg-gray-200 transition-colors text-sm"
                    >
                        <Download className="w-4 h-4 flex-shrink-0" />
                        <span>Export SVG</span>
                    </button>
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md border border-[#333] text-[#ccc] hover:bg-[#111] hover:border-[#555] font-medium transition-colors text-sm"
                    >
                        <Code2 className="w-4 h-4 flex-shrink-0 text-[#888]" />
                        <span>Copy Code</span>
                    </button>
                </div>
            </div>

            <div className="w-px h-full bg-[#222] hidden md:block flex-shrink-0" />

            {/* Settings */}
            <div className="flex flex-col min-w-[200px]">
                <div className="text-[10px] text-[#888] uppercase tracking-widest font-mono mb-4">Settings</div>
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-[#ccc] font-sans">Auto-Play</span>
                        <Switch size="sm" color="default" defaultSelected />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-[#ccc] font-sans">Loop</span>
                        <Switch size="sm" color="default" defaultSelected />
                    </div>
                </div>
            </div>

            <div className="w-px h-full bg-[#222] hidden md:block flex-shrink-0" />

            {/* GSAP Properties Table */}
            <div className="flex flex-col flex-1 min-w-[300px]">
                <div className="text-[10px] text-[#888] uppercase tracking-widest font-mono mb-4">GSAP Config</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-[11px]">
                    <div className="flex justify-between items-center border-b border-[#111] pb-2">
                        <span className="text-[#666]">duration</span>
                        <span className="text-white">4.0s</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#111] pb-2">
                        <span className="text-[#666]">ease</span>
                        <span className="text-white">power2.inOut</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#111] pb-2">
                        <span className="text-[#666]">repeat</span>
                        <span className="text-white">-1</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#111] pb-2">
                        <span className="text-[#666]">yoyo</span>
                        <span className="text-white">true</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
