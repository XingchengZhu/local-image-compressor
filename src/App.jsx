import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Upload, Download, Zap, ShieldCheck, Github, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageItem from './components/ImageItem';

function App() {
  const [files, setFiles] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [quality, setQuality] = useState(0.8);

  // 1. 处理文件拖入
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      originalSize: file.size,
      compressedSize: null,
      compressed: null,
      preview: URL.createObjectURL(file),
      status: 'idle' // idle, processing, done
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }
  });

  // 2. 核心压缩逻辑
  const handleCompress = async () => {
    setIsCompressing(true);
    
    const processedFiles = [...files];
    
    // 逐个压缩
    for (let i = 0; i < processedFiles.length; i++) {
      if (processedFiles[i].status === 'done') continue;

      // 更新状态为处理中
      processedFiles[i].status = 'processing';
      setFiles([...processedFiles]);

      try {
        const options = {
          // maxSizeMB: 1, // ❌ 已移除：不再强制限制 1MB
          // ✅ 现在完全由 quality 控制，让用户自己决定压缩力度
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: quality,
        };
        
        const compressedBlob = await imageCompression(processedFiles[i].file, options);
        
        processedFiles[i].compressed = compressedBlob;
        processedFiles[i].compressedSize = compressedBlob.size;
        processedFiles[i].status = 'done';
      } catch (error) {
        console.error(error);
        processedFiles[i].status = 'error';
      }
      
      // 更新状态
      setFiles([...processedFiles]);
    }
    
    setIsCompressing(false);
  };

  // 3. 打包下载
  const handleDownloadAll = async () => {
    const zip = new JSZip();
    let count = 0;

    files.forEach(f => {
      if (f.status === 'done' && f.compressed) {
        zip.file(`min_${f.name}`, f.compressed);
        count++;
      }
    });

    if (count === 0) return;

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'images-compressed.zip');
  };

  // 4. 移除文件
  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // 🆕 5. 清除所有文件
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all files?')) {
      setFiles([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 font-sans">
      
      {/* 头部 */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4 border border-blue-500/20">
          <ShieldCheck size={14} />
          100% Local Privacy
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Privacy-First Compressor
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto text-lg">
          Compress your images securely in your browser. No server uploads, no data leaks.
        </p>
      </header>

      {/* 控制栏 */}
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* 质量滑块 */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <span className="text-sm font-medium text-slate-400">Quality</span>
            <input 
              type="range" 
              min="0.1" max="1" step="0.1" 
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-32 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-sm font-mono text-blue-400">{Math.round(quality * 100)}%</span>
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3 w-full md:w-auto">
            {/* 🆕 清除所有按钮 (仅当有文件时显示) */}
            {files.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl font-medium transition-all border border-red-500/20 active:scale-95"
                title="Clear All Files"
              >
                <Trash2 size={18} />
              </button>
            )}

            <button 
              onClick={handleCompress}
              disabled={isCompressing || files.length === 0}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 active:scale-95"
            >
              {isCompressing ? <Zap className="animate-spin" size={18}/> : <Zap size={18}/>}
              {isCompressing ? 'Compressing...' : 'Compress All'}
            </button>
            
            {files.some(f => f.status === 'done') && (
              <button 
                onClick={handleDownloadAll}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                <Download size={18} />
                Download Zip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 拖拽区域 */}
      <div 
        {...getRootProps()} 
        className={`
          border-3 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300
          flex flex-col items-center justify-center gap-4 min-h-[200px]
          ${isDragActive 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
            : 'border-slate-800 hover:border-slate-600 hover:bg-slate-900/50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
          <Upload className="text-slate-400" size={32} />
        </div>
        <div>
          <p className="text-xl font-medium text-slate-200">Drag & drop images here</p>
          <p className="text-slate-500 mt-2">or click to select files (JPG, PNG, WebP)</p>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="mt-8 grid gap-3 grid-cols-1 md:grid-cols-2">
        <AnimatePresence>
          {files.map(file => (
            <ImageItem key={file.id} file={file} onRemove={removeFile} />
          ))}
        </AnimatePresence>
      </div>

      <footer className="mt-16 text-center text-slate-600 text-sm flex items-center justify-center gap-6">
        <span>Runs locally via WebAssembly</span>
        <a href="https://github.com/yourusername" className="hover:text-slate-400 transition-colors flex items-center gap-2">
          <Github size={16} /> GitHub
        </a>
      </footer>
    </div>
  );
}

export default App;