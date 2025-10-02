import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, Line, IText } from 'fabric';
import { DrawingTool } from './DrawingToolbar';

interface DrawingCanvasProps {
  activeTool: DrawingTool;
  color: string;
  brushSize: number;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  clearTrigger: number;
  undoTrigger: number;
  redoTrigger: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  activeTool,
  color,
  brushSize,
  onHistoryChange,
  clearTrigger,
  undoTrigger,
  redoTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyStepRef = useRef<number>(0);

  // تهيئة الـ Canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 'transparent',
      isDrawingMode: false,
      selection: activeTool === 'select',
    });

    fabricCanvasRef.current = canvas;

    // حفظ الحالة الأولية
    saveHistory(canvas);

    // معالجة تغيير الحجم
    const handleResize = () => {
      if (canvas && !canvas.disposed) {
        canvas.setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        canvas.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);

    // حفظ في التاريخ بعد كل تغيير
    const handleObjectAdded = () => {
      if (canvas && !canvas.disposed) saveHistory(canvas);
    };
    const handleObjectModified = () => {
      if (canvas && !canvas.disposed) saveHistory(canvas);
    };
    const handleObjectRemoved = () => {
      if (canvas && !canvas.disposed) saveHistory(canvas);
    };

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectRemoved);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas && !canvas.disposed) {
        canvas.off('object:added', handleObjectAdded);
        canvas.off('object:modified', handleObjectModified);
        canvas.off('object:removed', handleObjectRemoved);
        canvas.dispose();
      }
      fabricCanvasRef.current = null;
    };
  }, []);

  // حفظ الحالة في التاريخ
  const saveHistory = (canvas: FabricCanvas) => {
    const json = JSON.stringify(canvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    historyRef.current.push(json);
    historyStepRef.current = historyRef.current.length - 1;
    
    onHistoryChange(
      historyStepRef.current > 0,
      historyStepRef.current < historyRef.current.length - 1
    );
  };

  // تحديث الأداة النشطة
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = false;

    switch (activeTool) {
      case 'pen':
        canvas.isDrawingMode = true;
        const pencilBrush = new PencilBrush(canvas);
        pencilBrush.color = color;
        pencilBrush.width = brushSize;
        canvas.freeDrawingBrush = pencilBrush;
        break;

      case 'eraser':
        canvas.isDrawingMode = true;
        const eraserBrush = new PencilBrush(canvas);
        eraserBrush.width = brushSize * 3;
        eraserBrush.color = 'rgba(0,0,0,0)';
        canvas.freeDrawingBrush = eraserBrush;
        // استخدام وضع المسح
        canvas.contextTop!.globalCompositeOperation = 'destination-out';
        break;

      case 'circle':
      case 'rectangle':
      case 'line':
      case 'text':
        let isDown = false;
        let startX = 0;
        let startY = 0;
        let shape: Circle | Rect | Line | IText | null = null;

        const onMouseDown = (e: any) => {
          isDown = true;
          const pointer = canvas.getPointer(e.e);
          startX = pointer.x;
          startY = pointer.y;

          if (activeTool === 'circle') {
            shape = new Circle({
              left: startX,
              top: startY,
              radius: 1,
              fill: 'transparent',
              stroke: color,
              strokeWidth: brushSize,
            });
          } else if (activeTool === 'rectangle') {
            shape = new Rect({
              left: startX,
              top: startY,
              width: 1,
              height: 1,
              fill: 'transparent',
              stroke: color,
              strokeWidth: brushSize,
            });
          } else if (activeTool === 'line') {
            shape = new Line([startX, startY, startX, startY], {
              stroke: color,
              strokeWidth: brushSize,
            });
          } else if (activeTool === 'text') {
            shape = new IText('اكتب هنا', {
              left: startX,
              top: startY,
              fill: color,
              fontSize: brushSize * 5,
              fontFamily: 'Cairo, sans-serif',
            });
            canvas.add(shape);
            canvas.setActiveObject(shape);
            shape.enterEditing();
            isDown = false;
            return;
          }

          if (shape) {
            canvas.add(shape);
          }
        };

        const onMouseMove = (e: any) => {
          if (!isDown || !shape) return;
          const pointer = canvas.getPointer(e.e);

          if (activeTool === 'circle') {
            const radius = Math.sqrt(
              Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
            ) / 2;
            (shape as Circle).set({ radius });
          } else if (activeTool === 'rectangle') {
            (shape as Rect).set({
              width: Math.abs(pointer.x - startX),
              height: Math.abs(pointer.y - startY),
            });
            if (pointer.x < startX) {
              (shape as Rect).set({ left: pointer.x });
            }
            if (pointer.y < startY) {
              (shape as Rect).set({ top: pointer.y });
            }
          } else if (activeTool === 'line') {
            (shape as Line).set({ x2: pointer.x, y2: pointer.y });
          }

          canvas.renderAll();
        };

        const onMouseUp = () => {
          isDown = false;
          shape = null;
        };

        canvas.on('mouse:down', onMouseDown);
        canvas.on('mouse:move', onMouseMove);
        canvas.on('mouse:up', onMouseUp);

        return () => {
          canvas.off('mouse:down', onMouseDown);
          canvas.off('mouse:move', onMouseMove);
          canvas.off('mouse:up', onMouseUp);
        };

      case 'select':
        canvas.selection = true;
        break;
    }
  }, [activeTool, color, brushSize]);

  // مسح الكل
  useEffect(() => {
    if (clearTrigger === 0) return;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = 'transparent';
    historyRef.current = [];
    historyStepRef.current = 0;
    saveHistory(canvas);
  }, [clearTrigger]);

  // تراجع
  useEffect(() => {
    if (undoTrigger === 0) return;
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyStepRef.current <= 0) return;

    historyStepRef.current--;
    const state = historyRef.current[historyStepRef.current];
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      onHistoryChange(
        historyStepRef.current > 0,
        historyStepRef.current < historyRef.current.length - 1
      );
    });
  }, [undoTrigger]);

  // إعادة
  useEffect(() => {
    if (redoTrigger === 0) return;
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyStepRef.current >= historyRef.current.length - 1) return;

    historyStepRef.current++;
    const state = historyRef.current[historyStepRef.current];
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      onHistoryChange(
        historyStepRef.current > 0,
        historyStepRef.current < historyRef.current.length - 1
      );
    });
  }, [redoTrigger]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-40 pointer-events-auto"
      style={{ touchAction: 'none' }}
    />
  );
};
