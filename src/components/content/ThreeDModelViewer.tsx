import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, ZoomIn, ZoomOut, Move3D, Loader2, Palette } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ThreeDModelViewerProps {
  modelUrl: string;
  modelType: 'glb' | 'obj';
  title?: string;
  showControls?: boolean;
  autoRotate?: boolean;
  className?: string;
  preserveOriginalColors?: boolean;
}

// Component for GLB models
function GLBModel({ url, autoRotate, onLoaded }: { url: string; autoRotate: boolean; onLoaded: () => void }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);
  
  // Call onLoaded when the model is ready
  React.useEffect(() => {
    if (scene) {
      onLoaded();
    }
  }, [scene, onLoaded]);
  
  useFrame((state, delta) => {
    if (autoRotate && group.current) {
      group.current.rotation.y += delta * 0.5;
    }
  });

  // Create a copy that preserves original materials
  const modelCopy = React.useMemo(() => {
    if (!scene) return null;
    const copy = scene.clone();
    
    // Ensure materials are properly preserved
    copy.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Clone materials to avoid sharing between instances
        if (Array.isArray(child.material)) {
          child.material = child.material.map(mat => mat.clone());
        } else {
          child.material = child.material.clone();
        }
      }
    });
    
    return copy;
  }, [scene]);

  return (
    <group ref={group} scale={[0.5, 0.5, 0.5]}>
      {modelCopy && <primitive object={modelCopy} />}
    </group>
  );
}

// Component for OBJ models
function OBJModel({ url, autoRotate, onLoaded, preserveOriginalColors = false }: { 
  url: string; 
  autoRotate: boolean; 
  onLoaded: () => void;
  preserveOriginalColors?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const obj = useLoader(OBJLoader, url);
  
  // Call onLoaded when the model is ready
  React.useEffect(() => {
    if (obj) {
      onLoaded();
    }
  }, [obj, onLoaded]);
  
  useFrame((state, delta) => {
    if (autoRotate && group.current) {
      group.current.rotation.y += delta * 0.5;
    }
  });

  // Enhanced material handling for OBJ models
  const processedObj = React.useMemo(() => {
    if (!obj) return null;
    
    const objCopy = obj.clone();
    objCopy.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (preserveOriginalColors) {
          // Keep original materials completely unchanged
          if (child.material) {
            child.material = child.material.clone();
          }
        } else {
          // Check if material has actual color information
          let hasValidColor = false;
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              hasValidColor = child.material.some(mat => mat && (mat as any).color && 
                (mat as any).color.getHex && (mat as any).color.getHex() !== 0x000000);
            } else {
              const material = child.material as any;
              hasValidColor = material.color && material.color.getHex && 
                material.color.getHex() !== 0x000000 && material.color.getHex() !== 0xffffff;
            }
          }
          
          if (!hasValidColor || !child.material) {
            // Apply colorful default materials with variety
            const colors = [0x4f46e5, 0x0ea5e9, 0x10b981, 0xf59e0b, 0xef4444, 0x8b5cf6];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            child.material = new THREE.MeshStandardMaterial({
              color: randomColor,
              metalness: 0.3,
              roughness: 0.4,
              envMapIntensity: 1.0,
            });
          } else {
            // Clone and enhance existing material
            child.material = child.material.clone();
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.envMapIntensity = 1.0;
              child.material.needsUpdate = true;
            } else if (child.material instanceof THREE.MeshBasicMaterial) {
              // Convert MeshBasicMaterial to MeshStandardMaterial for better lighting
              const color = (child.material as any).color;
              child.material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.1,
                roughness: 0.6,
                envMapIntensity: 0.8,
              });
            }
          }
        }
      }
    });
    
    return objCopy;
  }, [obj, preserveOriginalColors]);

  return (
    <group ref={group} scale={[0.5, 0.5, 0.5]}>
      {processedObj && <primitive object={processedObj} />}
    </group>
  );
}

export const ThreeDModelViewer: React.FC<ThreeDModelViewerProps> = ({
  modelUrl,
  modelType,
  title,
  showControls = true,
  autoRotate = false,
  className = "",
  preserveOriginalColors = false
}) => {
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preserveColors, setPreserveColors] = useState(preserveOriginalColors);
  const controlsRef = useRef<any>(null);

  const handleLoaded = () => {
    setIsLoading(false);
  };

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      toast({
        title: "تم إعادة تعيين العرض",
        description: "تم إعادة النموذج إلى الوضع الافتراضي",
      });
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(0.9);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(1.1);
      controlsRef.current.update();
    }
  };

  const toggleAutoRotate = () => {
    setIsAutoRotating(!isAutoRotating);
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !isAutoRotating;
    }
  };

  const toggleColorPreservation = () => {
    setPreserveColors(!preserveColors);
    toast({
      title: preserveColors ? "تم تطبيق الألوان الافتراضية" : "تم الحفاظ على الألوان الأصلية",
      description: preserveColors ? "سيتم استخدام ألوان محسنة" : "سيتم عرض الألوان الأصلية",
    });
  };

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center text-destructive">
          <p>خطأ في تحميل النموذج ثلاثي الأبعاد</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative bg-background border rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className="p-3 border-b bg-muted/50">
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
      )}
      
      <div className="relative" style={{ height: '400px' }}>
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">جارٍ تحميل النموذج ثلاثي الأبعاد...</span>
            </div>
          </div>
        )}

        <Canvas
          camera={{ position: [0, 0, 8], fov: 35 }}
          style={{ background: 'transparent' }}
          onError={(error) => {
            console.error('Canvas error:', error);
            setError('فشل في تهيئة العارض ثلاثي الأبعاد');
            setIsLoading(false);
          }}
        >
          {/* Enhanced lighting setup for better color visibility */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-10, -10, -10]} intensity={0.8} />
          <pointLight position={[5, 5, 5]} intensity={0.6} />
          <pointLight position={[-5, -5, 5]} intensity={0.4} />
          
          <Suspense fallback={null}>
            <Environment preset="studio" />
            
            {modelType === 'glb' ? (
              <GLBModel url={modelUrl} autoRotate={isAutoRotating} onLoaded={handleLoaded} />
            ) : (
              <OBJModel url={modelUrl} autoRotate={isAutoRotating} onLoaded={handleLoaded} preserveOriginalColors={preserveColors} />
            )}
            
            <ContactShadows 
              position={[0, -2, 0]} 
              opacity={0.4} 
              scale={8} 
              blur={1.5} 
              far={4.5} 
            />
          </Suspense>
          
          <OrbitControls
            ref={controlsRef}
            autoRotate={isAutoRotating}
            autoRotateSpeed={2}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={15}
          />
        </Canvas>

        {showControls && !isLoading && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReset}
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant={isAutoRotating ? "default" : "secondary"}
              onClick={toggleAutoRotate}
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <Move3D className="h-4 w-4" />
            </Button>
            
            {modelType === 'obj' && (
              <Button
                size="sm"
                variant={preserveColors ? "default" : "secondary"}
                onClick={toggleColorPreservation}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                title={preserveColors ? "استخدام ألوان افتراضية" : "الحفاظ على الألوان الأصلية"}
              >
                <Palette className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {!isLoading && (
          <div className="absolute top-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
            <p>اسحب للدوران • عجلة الفأرة للتكبير</p>
          </div>
        )}
      </div>
    </div>
  );
};