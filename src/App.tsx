import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImagePreview } from './components/ImagePreview';
import { ImageControls } from './components/ImageControls';
import { ImageCropper } from './components/ImageCropper';
import { getImageDimensions, convertToWebP } from './utils/imageProcessing';

export default function App() {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [borderRadius, setBorderRadius] = useState(0);
  const [isCircle, setIsCircle] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [enableCropping, setEnableCropping] = useState(false);
  const [croppedImage, setCroppedImage] = useState<File | null>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, sube un archivo de imagen');
      return;
    }
    setOriginalImage(file);
    setCroppedImage(null);
    
    const dims = await getImageDimensions(file);
    setDimensions(dims);
    
    const { url, size } = await convertToWebP(file, dims.width, dims.height, isCircle, borderRadius);
    setConvertedUrl(url);
    setConvertedSize(size);
  }, [isCircle, borderRadius]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const resetState = () => {
    setOriginalImage(null);
    setCroppedImage(null);
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
      setConvertedUrl(null);
    }
    setConvertedSize(0);
    setDimensions({ width: 0, height: 0 });
    setBorderRadius(0);
    setIsCircle(false);
    setShowCropper(false);
    setEnableCropping(false);
  };

  const handleResizeChange = async (width: number, height: number) => {
    if (!originalImage || width <= 0 || height <= 0) return;
    
    setDimensions({ width, height });
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }
    
    const sourceImage = croppedImage || originalImage;
    const { url, size } = await convertToWebP(sourceImage, width, height, isCircle, borderRadius);
    setConvertedUrl(url);
    setConvertedSize(size);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setShowCropper(false);
    setCroppedImage(croppedFile);
    
    const dims = await getImageDimensions(croppedFile);
    setDimensions(dims);
    
    const { url, size } = await convertToWebP(croppedFile, dims.width, dims.height, isCircle, borderRadius);
    setConvertedUrl(url);
    setConvertedSize(size);
  };

  const handleStyleChange = async () => {
    if (!originalImage) return;
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }
    const sourceImage = croppedImage || originalImage;
    const { url, size } = await convertToWebP(
      sourceImage,
      dimensions.width,
      dimensions.height,
      isCircle,
      borderRadius
    );
    setConvertedUrl(url);
    setConvertedSize(size);
  };

  React.useEffect(() => {
    handleStyleChange();
  }, [isCircle, borderRadius]);

  return (
    <div className="min-h-screen bg-[#666] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Sharpen.Studio WebP Converter</h1>
          <p className="text-gray-200">Convierte tus imágenes al formato WebP para un mejor rendimiento web</p>
        </div>

        {!originalImage ? (
          <ImageUploader
            isDragging={isDragging}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onFileSelect={handleImageUpload}
          />
        ) : (
          <div className="space-y-6">
            <ImageControls
              dimensions={dimensions}
              lockRatio={lockAspectRatio}
              borderRadius={borderRadius}
              isCircle={isCircle}
              enableCropping={enableCropping}
              onLockRatioChange={() => setLockAspectRatio(!lockAspectRatio)}
              onDimensionsChange={handleResizeChange}
              onBorderRadiusChange={setBorderRadius}
              onCircleChange={setIsCircle}
              onCroppingChange={setEnableCropping}
              onStartCropping={() => setShowCropper(true)}
            />
            <ImagePreview
              originalImage={originalImage}
              croppedImage={croppedImage}
              convertedUrl={convertedUrl}
              convertedSize={convertedSize}
              onReset={resetState}
              onDownload={() => {
                if (convertedUrl) {
                  const link = document.createElement('a');
                  link.href = convertedUrl;
                  link.download = `${originalImage.name.split('.')[0]}.webp`;
                  link.click();
                }
              }}
              dimensions={dimensions}
              onNewImage={handleImageUpload}
              borderRadius={borderRadius}
              isCircle={isCircle}
              enableCropping={enableCropping}
              onStartCropping={() => setShowCropper(true)}
            />
          </div>
        )}

        {showCropper && originalImage && (
          <ImageCropper
            imageUrl={URL.createObjectURL(originalImage)}
            onCropComplete={handleCropComplete}
            onCancel={() => setShowCropper(false)}
            aspectRatio={isCircle ? 1 : undefined}
          />
        )}

        <div className="text-center mt-8 text-sm text-gray-300">
          Creado por Sharpen.Studio - © {new Date().getFullYear()} Sharpen.Studio - Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}