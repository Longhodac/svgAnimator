import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowPathIcon as Refresh } from '@heroicons/react/24/outline';

interface SvgCanvasProps {
    isPlaying: boolean;
    setProgress: (p: number) => void;
}

const ANIMATION_URL = '/animation/';
const POLL_INTERVAL_MS = 2000;

export function SvgCanvas({ isPlaying: _isPlaying, setProgress: _setProgress }: SvgCanvasProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [refreshKey, setRefreshKey] = useState(Date.now());
    const [isLoading, setIsLoading] = useState(true);

    // Poll for file changes so the backend coding agent's edits auto-refresh
    useEffect(() => {
        let lastModified = '';
        const interval = setInterval(async () => {
            try {
                const resHtml = await fetch(ANIMATION_URL + 'index.html', { method: 'HEAD', cache: 'no-store' });
                const modHtml = resHtml.headers.get('last-modified') || resHtml.headers.get('etag') || '';
                
                const resJs = await fetch(ANIMATION_URL + 'animation.js', { method: 'HEAD', cache: 'no-store' });
                const modJs = resJs.headers.get('last-modified') || resJs.headers.get('etag') || '';
                
                const combinedMod = modHtml + '|' + modJs;

                if (lastModified && combinedMod !== lastModified) {
                    setRefreshKey(Date.now());
                }
                lastModified = combinedMod;
            } catch {
                // Server might be restarting — ignore
            }
        }, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = useCallback(() => {
        setIsLoading(true);
        setRefreshKey(Date.now());
    }, []);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
    }, []);

    return (
        <div className="flex-1 relative overflow-hidden flex flex-col w-full h-full bg-[#000]">
            {/* Header Bar */}
            <div className="h-8 flex-shrink-0 flex items-center justify-between px-4 border-b border-[#222]">
                <div className="font-mono text-[9px] text-[#888] tracking-widest uppercase flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    LIVE PREVIEW
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-1 text-[#666] hover:text-white transition-colors"
                    title="Refresh animation"
                >
                    <Refresh className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Iframe Renderer */}
            <div className="flex-1 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#000]">
                        <div className="text-[10px] text-[#666] font-mono tracking-widest uppercase animate-pulse">
                            Loading animation...
                        </div>
                    </div>
                )}
                <iframe
                    ref={iframeRef}
                    key={refreshKey}
                    src={`${ANIMATION_URL}?t=${refreshKey}`}
                    onLoad={handleLoad}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="Animation Preview"
                    style={{
                        backgroundColor: '#0a0a1a',
                    }}
                />
            </div>
        </div>
    );
}
