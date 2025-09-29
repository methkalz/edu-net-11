import { useState, useCallback } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Download } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";

const WhiteboardPage = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("لوح جديد");
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!excalidrawAPI || !userProfile) return;

    setIsSaving(true);
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();

      const canvasData = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemStrokeColor: appState.currentItemStrokeColor,
          currentItemBackgroundColor: appState.currentItemBackgroundColor,
        },
      };

      const { error } = await supabase.from("whiteboards").insert({
        user_id: userProfile.user_id,
        school_id: userProfile.school_id!,
        title,
        canvas_data: canvasData,
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
    } finally {
      setIsSaving(false);
    }
  }, [excalidrawAPI, userProfile, title, toast]);

  const handleExport = useCallback(() => {
    if (!excalidrawAPI) return;

    const elements = excalidrawAPI.getSceneElements();
    const dataUrl = excalidrawAPI.getSceneElementsIncludingDeleted();

    // Create a download link
    const link = document.createElement("a");
    link.download = `${title}.excalidraw`;
    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(
      JSON.stringify({ elements: dataUrl })
    )}`;
    link.click();

    toast({
      title: "تم التصدير",
      description: "تم تصدير اللوح بنجاح",
    });
  }, [excalidrawAPI, title, toast]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader />
      
      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-center gap-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان اللوح"
            className="max-w-md"
          />
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="ml-2 h-4 w-4" />
            حفظ
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
        </div>

        <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden" dir="ltr">
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            initialData={{
              elements: [],
              appState: {
                viewBackgroundColor: "#ffffff",
              },
            }}
          >
            <WelcomeScreen>
              <WelcomeScreen.Hints.MenuHint />
              <WelcomeScreen.Hints.ToolbarHint />
              <WelcomeScreen.Center>
                <WelcomeScreen.Center.Heading>
                  مرحباً باللوح الرقمي!
                </WelcomeScreen.Center.Heading>
                <WelcomeScreen.Center.Menu>
                  <WelcomeScreen.Center.MenuItemLoadScene />
                  <WelcomeScreen.Center.MenuItemHelp />
                </WelcomeScreen.Center.Menu>
              </WelcomeScreen.Center>
            </WelcomeScreen>
            <MainMenu>
              <MainMenu.DefaultItems.LoadScene />
              <MainMenu.DefaultItems.Export />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.Help />
              <MainMenu.DefaultItems.ClearCanvas />
            </MainMenu>
          </Excalidraw>
        </div>
      </div>
    </div>
  );
};

export default WhiteboardPage;
