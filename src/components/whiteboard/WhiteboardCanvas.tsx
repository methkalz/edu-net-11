import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, Line, FabricText, FabricImage } from "fabric";

interface WhiteboardCanvasProps {
  currentTool: string;
  currentColor: string;
  brushSize: number;
  onCanvasReady: (canvas: FabricCanvas) => void;
}

export const WhiteboardCanvas = ({ 
  currentTool, 
  currentColor, 
  brushSize,
  onCanvasReady 
}: WhiteboardCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth - 100,
      height: window.innerHeight - 150,
      backgroundColor: "#ffffff",
      isDrawingMode: false,
    });

    setFabricCanvas(canvas);
    onCanvasReady(canvas);

    return () => {
      canvas.dispose();
    };
  }, [onCanvasReady]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = currentTool === "pen";

    if (currentTool === "pen" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.color = currentColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }

    if (currentTool === "select") {
      fabricCanvas.isDrawingMode = false;
    }
  }, [currentTool, currentColor, brushSize, fabricCanvas]);

  // Handle shape tools
  useEffect(() => {
    if (!fabricCanvas || currentTool === "pen" || currentTool === "select" || currentTool === "eraser") return;

    let isDown = false;
    let shape: Circle | Rect | Line | null = null;
    let startX = 0;
    let startY = 0;

    const handleMouseDown = (options: any) => {
      isDown = true;
      const pointer = fabricCanvas.getPointer(options.e);
      startX = pointer.x;
      startY = pointer.y;

      if (currentTool === "circle") {
        shape = new Circle({
          left: startX,
          top: startY,
          radius: 1,
          fill: "transparent",
          stroke: currentColor,
          strokeWidth: brushSize,
        });
      } else if (currentTool === "rectangle") {
        shape = new Rect({
          left: startX,
          top: startY,
          width: 1,
          height: 1,
          fill: "transparent",
          stroke: currentColor,
          strokeWidth: brushSize,
        });
      } else if (currentTool === "line") {
        shape = new Line([startX, startY, startX, startY], {
          stroke: currentColor,
          strokeWidth: brushSize,
        });
      }

      if (shape) {
        fabricCanvas.add(shape);
      }
    };

    const handleMouseMove = (options: any) => {
      if (!isDown || !shape) return;
      const pointer = fabricCanvas.getPointer(options.e);

      if (currentTool === "circle" && shape instanceof Circle) {
        const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)) / 2;
        shape.set({ radius });
      } else if (currentTool === "rectangle" && shape instanceof Rect) {
        shape.set({
          width: Math.abs(pointer.x - startX),
          height: Math.abs(pointer.y - startY),
        });
      } else if (currentTool === "line" && shape instanceof Line) {
        shape.set({ x2: pointer.x, y2: pointer.y });
      }

      fabricCanvas.renderAll();
    };

    const handleMouseUp = () => {
      isDown = false;
      shape = null;
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
    };
  }, [fabricCanvas, currentTool, currentColor, brushSize]);

  return (
    <div className="border border-border rounded-lg overflow-hidden shadow-lg bg-background">
      <canvas ref={canvasRef} />
    </div>
  );
};