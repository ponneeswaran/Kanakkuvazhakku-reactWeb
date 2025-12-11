
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Minus, Plus } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCancel: () => void;
  onCrop: (croppedImage: string) => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCancel, onCrop }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInteracted = useRef(false);

  // Crop Area Dimensions
  const CROP_SIZE = 280;

  // Monitor Container Size to fix initial alignment issues
  useEffect(() => {
      if (!containerRef.current) return;
      
      const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
              const { width, height } = entry.contentRect;
              setContainerSize(prev => {
                  if (prev.width === width && prev.height === height) return prev;
                  return { width, height };
              });
          }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
  }, []);

  const centerImage = () => {
      // Don't auto-center if user has already moved the image manually
      if (hasInteracted.current) return;
      
      if (!imgRef.current || containerSize.width === 0 || containerSize.height === 0) return;
      
      const imgW = imgRef.current.naturalWidth;
      const imgH = imgRef.current.naturalHeight;
      if (imgW === 0 || imgH === 0) return;

      // Calculate default zoom to fit the image nicely (cover crop area)
      const scale = Math.max(CROP_SIZE / imgW, CROP_SIZE / imgH); 
      const initialZoom = scale * 1.2; // Slightly larger to ensure coverage

      // Center the image within the container (assuming (0,0) is top-left of container)
      const initialX = (containerSize.width - imgW * initialZoom) / 2;
      const initialY = (containerSize.height - imgH * initialZoom) / 2;
      
      setZoom(initialZoom);
      setOffset({ x: initialX, y: initialY });
  };

  // Recalculate center when container resizes
  useEffect(() => {
      centerImage();
  }, [containerSize]);

  const onImageLoad = () => {
      centerImage();
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    hasInteracted.current = true;
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!imgRef.current || !containerRef.current || containerSize.width === 0) return;

    const canvas = document.createElement('canvas');
    const OUTPUT_SIZE = 400; 
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Fill white background (handles transparent PNGs becoming black in JPEG)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const containerW = containerSize.width;
    const containerH = containerSize.height;
    
    const cropBoxLeft = (containerW - CROP_SIZE) / 2;
    const cropBoxTop = (containerH - CROP_SIZE) / 2;

    // Map Top-Left of Crop Box to Image Space
    const sourceX = (cropBoxLeft - offset.x) / zoom;
    const sourceY = (cropBoxTop - offset.y) / zoom;
    
    const sourceW = CROP_SIZE / zoom;
    const sourceH = CROP_SIZE / zoom;

    try {
        ctx.drawImage(
            imgRef.current,
            sourceX, sourceY, sourceW, sourceH, // Source (Image Coords)
            0, 0, OUTPUT_SIZE, OUTPUT_SIZE // Destination (Canvas Coords)
        );
        onCrop(canvas.toDataURL('image/jpeg', 0.9));
    } catch (e) {
        console.error("Crop failed", e);
        alert("Failed to crop image.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in touch-none">
       {/* Header */}
       <div className="flex justify-between items-center p-4 text-white z-10 bg-black/50 backdrop-blur-md">
           <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/10 transition-colors">
               <X />
           </button>
           <h3 className="font-bold">Adjust Photo</h3>
           <button onClick={handleCrop} className="p-2 rounded-full bg-teal-600 hover:bg-teal-500 text-white transition-colors">
               <Check />
           </button>
       </div>

       {/* Workspace */}
       <div 
         className="flex-1 relative overflow-hidden bg-black"
         ref={containerRef}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
         onTouchStart={handleMouseDown}
         onTouchMove={handleMouseMove}
         onTouchEnd={handleMouseUp}
       >
           {/* Image Layer */}
           <img 
             ref={imgRef}
             src={imageSrc}
             alt="Crop target"
             onLoad={onImageLoad}
             className="absolute top-0 left-0 origin-top-left max-w-none select-none pointer-events-none"
             style={{
                 transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                 imageRendering: 'auto' 
             }}
             draggable={false}
           />

           {/* Overlay Layer */}
           <div className="absolute inset-0 pointer-events-none z-10">
               <div className="w-full h-full bg-black/60 relative overflow-hidden">
                    <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                        style={{ width: CROP_SIZE, height: CROP_SIZE }}
                    ></div>
               </div>
           </div>
       </div>

       {/* Controls */}
       <div className="p-6 bg-gray-900 text-white space-y-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
           <div className="flex items-center space-x-4">
               <Minus size={20} className="text-gray-400" />
               <input 
                 type="range" 
                 min="0.1" 
                 max="3" 
                 step="0.05" 
                 value={zoom} 
                 onChange={(e) => {
                     hasInteracted.current = true;
                     setZoom(parseFloat(e.target.value));
                 }}
                 className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
               />
               <Plus size={20} className="text-gray-400" />
           </div>
           <p className="text-center text-xs text-gray-500 font-medium">Drag to move • Pinch/Slide to zoom</p>
       </div>
    </div>
  );
}

export default ImageCropper;
