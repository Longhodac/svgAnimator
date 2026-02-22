import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { FolderIcon as Folder, ArrowUpTrayIcon as Upload } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface AnimationFile {
    name: string;
}

export function FileSidebar() {
    const [files, setFiles] = useState<AnimationFile[]>([]);
    const [activeFile, setActiveFile] = useState<string>('index.html');
    const [isLoading, setIsLoading] = useState(true);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadFiles = async () => {
        try {
            const res = await fetch('/api/animation-files');
            const data = await res.json() as { files: string[] };
            setFiles(data.files.map(name => ({ name })));
        } catch {
            setFiles([
                { name: 'index.html' },
                { name: 'animation.js' },
                { name: 'index.js' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
        const interval = setInterval(loadFiles, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadStatus('Uploading...');
        try {
            const content = await file.text();
            const res = await fetch('/api/upload-svg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, content }),
            });
            const data = await res.json() as { ok?: boolean; filename?: string; error?: string };
            if (data.ok) {
                setUploadStatus(`✓ ${data.filename}`);
                await loadFiles();
                setTimeout(() => setUploadStatus(null), 2000);
            } else {
                setUploadStatus(`✗ ${data.error}`);
                setTimeout(() => setUploadStatus(null), 3000);
            }
        } catch (err) {
            setUploadStatus(`✗ ${String(err)}`);
            setTimeout(() => setUploadStatus(null), 3000);
        }
        // Reset input so the same file can be re-uploaded
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getFileIcon = (name: string) => {
        const ext = name.split('.').pop() || '';
        if (['html', 'svg'].includes(ext)) return '◇';
        if (['js', 'ts'].includes(ext)) return '⬡';
        if (ext === 'css') return '◈';
        return '·';
    };

    return (
        <aside className="w-full flex-shrink-0 flex flex-col h-full font-sans text-sm text-white bg-[#000]">
            <div className="p-4 border-b border-[#333] flex items-center justify-between text-[#888] tracking-widest text-[10px]">
                <span className="uppercase font-bold">Animation</span>
                <span className="text-[#555]">{files.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {isLoading ? (
                    <div className="px-4 py-3 text-[#666] font-mono text-[10px] animate-pulse">
                        Loading...
                    </div>
                ) : (
                    files.map((file) => {
                        const isActive = activeFile === file.name;
                        return (
                            <button
                                key={file.name}
                                onClick={() => setActiveFile(file.name)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors relative group",
                                    isActive ? "text-white" : "text-[#888] hover:text-[#ccc]"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-[#111] border-l-2 border-white z-0"
                                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                    />
                                )}
                                <div className="relative z-10 flex items-center gap-3 w-full">
                                    <span className={cn(
                                        "text-[10px] font-mono transition-colors shrink-0",
                                        isActive ? "text-white" : "text-[#555]"
                                    )}>
                                        {getFileIcon(file.name)}
                                    </span>
                                    <span className="truncate tracking-wide font-mono text-xs">{file.name}</span>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Upload SVG */}
            <div className="p-3 border-t border-[#333]">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".svg,.html,.js,.css"
                    className="hidden"
                    onChange={handleUpload}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-md border border-dashed border-[#444] text-[#888] hover:text-white hover:border-[#666] transition-all text-xs font-mono"
                >
                    <Upload className="w-3.5 h-3.5" />
                    Upload SVG
                </button>
                {uploadStatus && (
                    <div className="mt-2 text-[10px] font-mono text-[#888] text-center">
                        {uploadStatus}
                    </div>
                )}
            </div>

            <div className="px-4 py-2 border-t border-[#333] flex items-center gap-3 text-[#666]">
                <Folder className="w-3.5 h-3.5" />
                <span className="tracking-wide font-mono text-xs">../animation/</span>
            </div>
        </aside>
    );
}
