import { useState } from 'react';
import { FileSidebar } from '../sidebar/FileSidebar';
import { SvgCanvas } from '../canvas/SvgCanvas';
import { Timeline } from '../timeline/Timeline';
import { PropertiesPanel } from '../properties/PropertiesPanel';

export function AppLayout() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="flex h-screen w-full bg-[#050505] text-[#e5e5e5] overflow-hidden">
            <FileSidebar />
            <div className="flex flex-col flex-1 h-full relative">
                <SvgCanvas isPlaying={isPlaying} setProgress={setProgress} />
                <Timeline isPlaying={isPlaying} onTogglePlay={togglePlay} progress={progress} />
            </div>
            <PropertiesPanel />
        </div>
    );
}
