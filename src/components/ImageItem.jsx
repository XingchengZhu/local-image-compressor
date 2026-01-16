import { motion } from 'framer-motion';
import { Check, Trash2, ArrowRight } from 'lucide-react';

export default function ImageItem({ file, onRemove }) {
  // 计算节省了多少体积
  const saved = file.compressed 
    ? ((file.originalSize - file.compressedSize) / 1024).toFixed(1) 
    : 0;
  const percent = file.compressed 
    ? Math.round((1 - file.compressedSize / file.originalSize) * 100) 
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 group relative overflow-hidden"
    >
      {/* 预览图 */}
      <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
        <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
      </div>

      {/* 信息区 */}
      <div className="flex-1 min-w-0 z-10">
        <h4 className="font-medium text-slate-200 truncate">{file.name}</h4>
        
        <div className="flex items-center gap-2 text-sm mt-1">
          <span className="text-slate-500">{(file.originalSize / 1024).toFixed(1)} KB</span>
          
          {file.status === 'done' && (
            <>
              <ArrowRight size={14} className="text-slate-600" />
              <span className="text-green-400 font-bold">{(file.compressedSize / 1024).toFixed(1)} KB</span>
              <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full ml-1">
                -{percent}%
              </span>
            </>
          )}

          {file.status === 'processing' && (
            <span className="text-blue-400 animate-pulse">Processing...</span>
          )}
        </div>
      </div>

      {/* 删除按钮 */}
      <button 
        onClick={() => onRemove(file.id)}
        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors z-10"
      >
        <Trash2 size={18} />
      </button>

      {/* 进度条背景 */}
      {file.status === 'processing' && (
        <motion.div 
          className="absolute bottom-0 left-0 h-1 bg-blue-500/50"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1 }} // 模拟进度
        />
      )}
    </motion.div>
  );
}