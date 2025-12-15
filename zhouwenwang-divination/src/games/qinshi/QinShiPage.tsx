/**
 * 古风头像生成页面
 * 支持图像上传、风格选择和AI生成功能
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Sparkles, Image as ImageIcon, Loader, Palette } from 'lucide-react';
import { useUI } from '../../core/store';
import { ErrorToast } from '../../components/common';
import { getImageGeneration, convertImageToBase64 } from '../../masters/service';
import { 
  RENDER_STYLES,
  validateImageFile, 
  convertFileToBase64, 
  type RenderStyle,
  type ImageData,
  type QinShiData 
} from './logic';
import { buildCompletePrompt } from './prompts';

const QinShiPage: React.FC = () => {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [selectedRenderStyle, setSelectedRenderStyle] = useState<RenderStyle>(RENDER_STYLES[1]); // 默认水墨国画风格
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { error, setError } = useUI();

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    try {
      setError(null);
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const base64 = await convertFileToBase64(file);
      const preview = URL.createObjectURL(file);

      setImageData({
        file,
        base64,
        mimeType: file.type,
        preview
      });

      setGeneratedImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件处理失败');
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (imageData?.preview) {
        URL.revokeObjectURL(imageData.preview);
      }
      handleFileSelect(files[0]);
    }
  };

  // 拖拽处理
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  // 开始生成
  const handleGenerate = async () => {
    if (!imageData) {
      setError('请先上传人像图片');
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedImage(null);

      const prompt = buildCompletePrompt(selectedRenderStyle.id);
      
      // 临时调试：显示完整提示词
      console.log('🔍 完整提示词:', prompt);
      
      // 使用统一的图像生成服务
      const generatedImageUrl = await getImageGeneration(
        imageData.base64,
        imageData.mimeType,
        prompt
      );
      
      setGeneratedImage(generatedImageUrl);

      // 图片生成不保存到历史记录（避免localStorage配额超出）
      console.log('✅ 图片生成成功，风格:', selectedRenderStyle.name);

    } catch (error) {
      console.error('图像生成失败:', error);
      setError(error instanceof Error ? error.message : '图像生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `古风头像_${selectedRenderStyle.name}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      className="min-h-screen bg-black text-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 页面标题 */}
        <motion.div 
          className="text-center mb-8"
          variants={itemVariants}
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🎨 中国古风头像生成
          </h1>
          <p className="text-gray-300 text-lg">
            保留你的原样特征，体验传统古风魅力
          </p>
        </motion.div>

        <div className="grid grid-cols-1
         lg:grid-cols-2 gap-8">
          {/* 左侧：图片上传和风格选择 */}
          <div className="space-y-6">
            {/* 图片上传区域 */}
            <motion.div 
              className="bg-[#111111] border border-[#333333] rounded-xl p-6 shadow-lg"
              variants={itemVariants}
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Upload className="mr-2 text-[#FF9900]" size={20} />
                上传你的照片
              </h3>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-[#FF9900] bg-[#FF9900]/10' : 'border-gray-400 hover:border-[#FF9900] hover:bg-gray-900/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadAreaClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {imageData?.preview ? (
                  <div className="space-y-4">
                    <img
                      src={imageData.preview}
                      alt="上传的照片"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-md border border-gray-600"
                    />
                    <div className="text-sm text-gray-300">
                      <p className="font-medium">照片已上传</p>
                      <p>点击或拖拽新照片来替换</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Upload className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="text-gray-300">
                      <p className="text-lg font-medium mb-2">拖拽或点击上传照片</p>
                      <p className="text-sm text-gray-400">
                        支持 JPG、PNG 格式，最大 10MB
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        建议使用正面清晰的人像照片以获得最佳效果
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 渲染风格选择 */}
            <motion.div 
              className="bg-[#111111] border border-[#333333] rounded-xl p-6 shadow-lg"
              variants={itemVariants}
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Palette className="mr-2 text-[#FF9900]" size={20} />
                选择渲染风格
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {RENDER_STYLES.map((style) => (
                  <div
                    key={style.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRenderStyle.id === style.id
                        ? 'border-[#FF9900] bg-[#FF9900]/10'
                        : 'border-[#333333] hover:border-gray-400 hover:bg-gray-900/50'
                    }`}
                    onClick={() => setSelectedRenderStyle(style)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedRenderStyle.id === style.id 
                            ? 'bg-[#FF9900] text-black' 
                            : 'bg-[#333333] text-[#FF9900]'
                        }`}>
                          {style.id === 'chibi' && '🧸'}
                          {style.id === 'shuimo' && '🎨'}
                          {style.id === 'cyberpunk' && '🌃'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-white">
                          {style.name}
                        </div>
                        <div className="text-sm text-gray-300">
                          {style.description}
                        </div>
                      </div>
                      {selectedRenderStyle.id === style.id && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-[#FF9900] rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-black rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 生成按钮 */}
            <motion.div variants={itemVariants}>
              <button
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all shadow-lg ${
                  imageData && !isGenerating
                    ? 'bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black hover:from-[#E68A00] hover:to-[#CC7700] hover:shadow-xl hover:shadow-[#FF9900]/30'
                    : 'bg-[#444444] text-[#888888] cursor-not-allowed'
                }`}
                disabled={!imageData || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <Loader className="animate-spin mr-2" size={20} />
                    生成古风头像中...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Sparkles className="mr-2" size={20} />
                    生成 {selectedRenderStyle.name} 头像
                  </div>
                )}
              </button>
            </motion.div>
          </div>

          {/* 右侧：生成结果 */}
          <div className="space-y-6">
            <motion.div 
              className="bg-[#111111] border border-[#333333] rounded-xl p-6 shadow-lg"
              variants={itemVariants}
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <ImageIcon className="mr-2 text-[#FF9900]" size={20} />
                生成结果
              </h3>

              {isGenerating ? (
                // 生成中的加载动画
                <div className="text-center py-12">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {/* 外圈旋转动画 */}
                      <motion.div
                        className="w-16 h-16 border-4 border-[#FF9900] border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      {/* 内圈反向旋转 */}
                      <motion.div
                        className="absolute inset-2 border-2 border-gray-400 border-b-transparent rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                      {/* 中心图标 */}
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="text-[#FF9900] w-6 h-6" />
                      </motion.div>
                    </div>
                  </div>
                  
                  <motion.h3 
                    className="text-xl font-semibold text-white mb-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    正在生成 {selectedRenderStyle.name} 风格头像...
                  </motion.h3>
                  
                  <p className="text-gray-300 text-sm">
                    AI正在保持你的原样特征，添加古风渲染效果，请稍候
                  </p>
                </div>
              ) : generatedImage ? (
                <div className="space-y-4">
                  <img
                    src={generatedImage}
                    alt="生成的古风头像"
                    className="w-full rounded-lg shadow-md border border-gray-600"
                  />
                  
                  <div className="flex justify-center">
                    <button
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black rounded-lg font-semibold hover:from-[#E68A00] hover:to-[#CC7700] transition-all shadow-lg hover:shadow-xl hover:shadow-[#FF9900]/30"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2" size={20} />
                      下载图片
                    </button>
                  </div>

                  <div className="text-center text-sm text-gray-300">
                    🎉 {selectedRenderStyle.name} 风格头像生成完成！
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-[#222222] rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-500" />
                    </div>
                  </div>
                  <p className="text-gray-400">
                    上传照片并选择渲染风格后，点击生成按钮开始创作
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* 错误提示 */}
        <ErrorToast 
          isVisible={!!error}
          message={error || ''}
          onClose={() => setError(null)}
        />
      </div>
    </motion.div>
  );
};

export default QinShiPage; 