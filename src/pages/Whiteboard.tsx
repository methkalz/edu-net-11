import { useState, useCallback, useEffect } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { WhiteboardCanvas } from "@/components/whiteboard/WhiteboardCanvas";
import { WhiteboardToolbar } from "@/components/whiteboard/WhiteboardToolbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Whiteboard() {
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [currentTool, setCurrentTool] = useState("pen");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const { toast } = useToast();

  // حفظ الحالة في التاريخ
  const saveHistory = useCallback(() => {
    if (!canvas) return;
    
    const json = JSON.stringify(canvas.toJSON());
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(json);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [canvas, history, historyStep]);

  // الاستماع للتغييرات على Canvas
  useEffect(() => {
    if (!canvas) return;

    const handleModified = () => {
      saveHistory();
    };

    canvas.on("object:added", handleModified);
    canvas.on("object:modified", handleModified);
    canvas.on("object:removed", handleModified);

    return () => {
      canvas.off("object:added", handleModified);
      canvas.off("object:modified", handleModified);
      canvas.off("object:removed", handleModified);
    };
  }, [canvas, saveHistory]);

  const handleToolChange = (tool: string) => {
    setCurrentTool(tool);
    if (tool === "eraser" && canvas) {
      canvas.isDrawingMode = false;
      canvas.selection = true;
    }
  };

  const handleUndo = useCallback(() => {
    if (historyStep > 0 && canvas) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      canvas.loadFromJSON(history[prevStep], () => {
        canvas.renderAll();
      });
    }
  }, [canvas, history, historyStep]);

  const handleRedo = useCallback(() => {
    if (historyStep < history.length - 1 && canvas) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      canvas.loadFromJSON(history[nextStep], () => {
        canvas.renderAll();
      });
    }
  }, [canvas, history, historyStep]);

  const handleClear = useCallback(() => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
      saveHistory();
      toast({
        title: "تم المسح",
        description: "تم مسح اللوح بنجاح",
      });
    }
  }, [canvas, saveHistory, toast]);

  const handleSave = useCallback(async () => {
    if (!canvas) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive",
        });
        return;
      }

      // Get profile for school_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.school_id) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على معلومات المدرسة",
          variant: "destructive",
        });
        return;
      }

      const canvasData = canvas.toJSON();
      const thumbnail = canvas.toDataURL({ format: "png", quality: 0.5, multiplier: 1 });

      const { error } = await supabase.from("whiteboards").insert({
        user_id: user.id,
        school_id: profile.school_id,
        canvas_data: canvasData,
        thumbnail,
        title: `لوح ${new Date().toLocaleDateString("ar-EG")}`,
      });

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: "تم حفظ اللوح بنجاح",
      });
    } catch (error) {
      console.error("Error saving whiteboard:", error);
      toast({
        title: "خطأ",
        description: "فشل حفظ اللوح",
        variant: "destructive",
      });
    }
  }, [canvas, toast]);

  const handleExport = useCallback(() => {
    if (!canvas) return;

    const dataURL = canvas.toDataURL({ format: "png", quality: 1, multiplier: 1 });
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    toast({
      title: "تم التصدير",
      description: "تم تصدير اللوح كصورة",
    });
  }, [canvas, toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">اللوح الرقمي</h1>
        
        <WhiteboardToolbar
          currentTool={currentTool}
          onToolChange={handleToolChange}
          currentColor={currentColor}
          onColorChange={setCurrentColor}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onSave={handleSave}
          onExport={handleExport}
          canUndo={historyStep > 0}
          canRedo={historyStep < history.length - 1}
        />

        <div className="mt-4">
          <WhiteboardCanvas
            currentTool={currentTool}
            currentColor={currentColor}
            brushSize={brushSize}
            onCanvasReady={setCanvas}
          />
        </div>
      </div>
    </div>
  );
}