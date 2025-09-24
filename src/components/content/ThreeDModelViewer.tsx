import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, ZoomIn, ZoomOut, Move3D, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ThreeDModelViewerProps {
  modelUrl: string;
  modelType: 'glb' | 'obj';
  title?: string;
  showControls?: boolean;
  autoRotate?: boolean;
  className?: string;
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

  return (
    <group ref={group}>
      <primitive object={scene.clone()} />
    </group>
  );
}

// Component for OBJ models
function OBJModel({ url, autoRotate, onLoaded }: { url: string; autoRotate: boolean; onLoaded: () => void }) {
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

  // Apply basic material to OBJ
  React.useEffect(() => {
    if (obj) {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x606060,
            metalness: 0.1,
            roughness: 0.7,
          });
        }
      });
    }
  }, [obj]);

  return (
    <group ref={group}>
      <primitive object={obj.clone()} />
    </group>
  );
}

export const ThreeDModelViewer: React.FC<ThreeDModelViewerProps> = ({
  modelUrl,
  modelType,
  title,
  showControls = true,
  autoRotate = false,
  className = ""
}) => {
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'transparent' }}
          onError={(error) => {
            console.error('Canvas error:', error);
            setError('فشل في تهيئة العارض ثلاثي الأبعاد');
            setIsLoading(false);
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Suspense fallback={null}>
            <Environment preset="studio" />
            
            {modelType === 'glb' ? (
              <GLBModel url={modelUrl} autoRotate={isAutoRotating} onLoaded={handleLoaded} />
            ) : (
              <OBJModel url={modelUrl} autoRotate={isAutoRotating} onLoaded={handleLoaded} />
            )}
            
            <ContactShadows 
              position={[0, -1.4, 0]} 
              opacity={0.4} 
              scale={10} 
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
            minDistance={2}
            maxDistance={20}
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