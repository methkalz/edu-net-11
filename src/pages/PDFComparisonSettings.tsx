import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernHeader from '@/components/shared/ModernHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { usePDFComparisonSettings } from '@/hooks/usePDFComparisonSettings';
import { ArrowRight, Save, RotateCcw, Plus, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
const PDFComparisonSettings = () => {
  const navigate = useNavigate();
  const {
    userProfile
  } = useAuth();
  const {
    settings,
    loading,
    updateSettings,
    addWhitelistWord,
    removeWhitelistWord,
    applyPreset
  } = usePDFComparisonSettings();
  const [newWord, setNewWord] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<'strict' | 'balanced' | 'lenient' | null>(null);

  // Detect current preset based on settings
  useEffect(() => {
    if (!settings) return;

    const presets = {
      strict: {
        thresholds: { internal_display: 0, repository_display: 50, single_file_display: 40, flagged_threshold: 60, warning_threshold: 30 },
        algorithm_weights: { cosine_weight: 0.6, jaccard_weight: 0.35, length_weight: 0.05 },
      },
      balanced: {
        thresholds: { internal_display: 0, repository_display: 35, single_file_display: 30, flagged_threshold: 70, warning_threshold: 40 },
        algorithm_weights: { cosine_weight: 0.5, jaccard_weight: 0.4, length_weight: 0.1 },
      },
      lenient: {
        thresholds: { internal_display: 0, repository_display: 25, single_file_display: 20, flagged_threshold: 80, warning_threshold: 50 },
        algorithm_weights: { cosine_weight: 0.4, jaccard_weight: 0.45, length_weight: 0.15 },
      },
    };

    // Check which preset matches current settings
    for (const [presetName, presetValues] of Object.entries(presets)) {
      const thresholdsMatch = 
        settings.thresholds.internal_display === presetValues.thresholds.internal_display &&
        settings.thresholds.repository_display === presetValues.thresholds.repository_display &&
        settings.thresholds.single_file_display === presetValues.thresholds.single_file_display &&
        settings.thresholds.flagged_threshold === presetValues.thresholds.flagged_threshold &&
        settings.thresholds.warning_threshold === presetValues.thresholds.warning_threshold;

      const weightsMatch =
        settings.algorithm_weights.cosine_weight === presetValues.algorithm_weights.cosine_weight &&
        settings.algorithm_weights.jaccard_weight === presetValues.algorithm_weights.jaccard_weight &&
        settings.algorithm_weights.length_weight === presetValues.algorithm_weights.length_weight;

      if (thresholdsMatch && weightsMatch) {
        setCurrentPreset(presetName as 'strict' | 'balanced' | 'lenient');
        return;
      }
    }

    // If no preset matches, it's custom settings
    setCurrentPreset(null);
  }, [settings]);

  // Redirect if not superadmin
  if (!userProfile || userProfile.role !== 'superadmin') {
    navigate('/dashboard');
    return null;
  }
  if (loading || !settings) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <ModernHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل الإعدادات...</p>
            </div>
          </div>
        </div>
      </div>;
  }
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        thresholds: settings.thresholds,
        algorithm_weights: settings.algorithm_weights
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handlePreset = async (preset: 'strict' | 'balanced' | 'lenient') => {
    setIsSaving(true);
    try {
      await applyPreset(preset);
      setCurrentPreset(preset);
    } finally {
      setIsSaving(false);
    }
  };
  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    await addWhitelistWord(newWord);
    setNewWord('');
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <ModernHeader />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/superadmin-dashboard')} className="hover:bg-primary/10">
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                إعدادات مقارنة PDF
              </h1>
              <p className="text-muted-foreground mt-1">
                تخصيص حساسية الكشف عن التشابه والأوزان الخوارزمية
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-primary to-primary/80">
              <Save className="h-4 w-4 ml-2" />
              حفظ التغييرات
            </Button>
          </div>
        </div>

        {/* Presets */}
        <Card className="p-6 glass-effect border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">الإعدادات المسبقة</h2>
            </div>
            {currentPreset && (
              <Badge variant="outline" className="text-sm bg-primary/10 border-primary/30">
                الإعداد الحالي: {currentPreset === 'strict' ? 'صارم' : currentPreset === 'balanced' ? 'متوازن' : 'متساهل'}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={() => handlePreset('strict')} disabled={isSaving} className="h-auto flex-col items-start p-4 hover:border-primary hover:bg-primary/5">
              <span className="font-bold text-lg mb-2">صارم</span>
              <span className="text-sm text-muted-foreground text-right">
                حساسية عالية للكشف عن التشابه
              </span>
            </Button>
            <Button variant="outline" onClick={() => handlePreset('balanced')} disabled={isSaving} className="h-auto flex-col items-start p-4 hover:border-primary hover:bg-primary/5 border-primary/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-lg">متوازن</span>
                <Badge variant="secondary" className="text-xs bg-emerald-500">افتراضي</Badge>
              </div>
              <span className="text-sm text-muted-foreground text-right">
                توازن بين الدقة والمرونة
              </span>
            </Button>
            <Button variant="outline" onClick={() => handlePreset('lenient')} disabled={isSaving} className="h-auto flex-col items-start p-4 hover:border-primary hover:bg-primary/5">
              <span className="font-bold text-lg mb-2">متساهل</span>
              <span className="text-sm text-muted-foreground text-right">
                حساسية منخفضة، تركيز على التشابه الواضح
              </span>
            </Button>
          </div>
        </Card>

        {/* Thresholds */}
        <Card className="p-6 glass-effect border-primary/20">
          <h2 className="text-xl font-bold mb-6">عتبات العرض والتنبيه</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>عتبة عرض المستودع (%)</Label>
                  <Badge variant="outline">{settings.thresholds.repository_display}</Badge>
                </div>
                <Slider value={[settings.thresholds.repository_display]} onValueChange={([value]) => {
                settings.thresholds.repository_display = value;
                updateSettings({
                  thresholds: settings.thresholds
                });
              }} min={10} max={80} step={5} className="my-4" />
                <p className="text-sm text-muted-foreground">
                  الحد الأدنى للتشابه لعرض النتائج من المستودع
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>عتبة الملف الواحد (%)</Label>
                  <Badge variant="outline">{settings.thresholds.single_file_display}</Badge>
                </div>
                <Slider value={[settings.thresholds.single_file_display]} onValueChange={([value]) => {
                settings.thresholds.single_file_display = value;
                updateSettings({
                  thresholds: settings.thresholds
                });
              }} min={10} max={70} step={5} className="my-4" />
                <p className="text-sm text-muted-foreground">
                  الحد الأدنى للتشابه عند مقارنة ملف واحد
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>عتبة الإشارة الحمراء (%)</Label>
                  <Badge variant="destructive">{settings.thresholds.flagged_threshold}</Badge>
                </div>
                <Slider value={[settings.thresholds.flagged_threshold]} onValueChange={([value]) => {
                settings.thresholds.flagged_threshold = value;
                updateSettings({
                  thresholds: settings.thresholds
                });
              }} min={50} max={90} step={5} className="my-4" />
                <p className="text-sm text-muted-foreground">
                  نسبة التشابه التي تُعتبر تطابق كامل (أحمر)
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>عتبة التحذير (%)</Label>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                    {settings.thresholds.warning_threshold}
                  </Badge>
                </div>
                <Slider value={[settings.thresholds.warning_threshold]} onValueChange={([value]) => {
                settings.thresholds.warning_threshold = value;
                updateSettings({
                  thresholds: settings.thresholds
                });
              }} min={20} max={70} step={5} className="my-4" />
                <p className="text-sm text-muted-foreground">
                  نسبة التشابه التي تستدعي التحذير (برتقالي)
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Algorithm Weights */}
        <Card className="p-6 glass-effect border-primary/20">
          <h2 className="text-xl font-bold mb-6">أوزان الخوارزميات</h2>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              يجب أن يكون مجموع الأوزان = 100% (1.0). التوزيع الحالي: {(settings.algorithm_weights.cosine_weight + settings.algorithm_weights.jaccard_weight + settings.algorithm_weights.length_weight).toFixed(2)}
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>وزن التشابه التجميعي (Cosine)</Label>
                <Badge variant="outline">{(settings.algorithm_weights.cosine_weight * 100).toFixed(0)}%</Badge>
              </div>
              <Slider value={[settings.algorithm_weights.cosine_weight * 100]} onValueChange={([value]) => {
              settings.algorithm_weights.cosine_weight = value / 100;
              updateSettings({
                algorithm_weights: settings.algorithm_weights
              });
            }} min={0} max={100} step={5} className="my-4" />
              <p className="text-sm text-muted-foreground">
                المعاني الدلالية للكلمات والسياق
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>وزن التطابق الكلمي (Jaccard)</Label>
                <Badge variant="outline">{(settings.algorithm_weights.jaccard_weight * 100).toFixed(0)}%</Badge>
              </div>
              <Slider value={[settings.algorithm_weights.jaccard_weight * 100]} onValueChange={([value]) => {
              settings.algorithm_weights.jaccard_weight = value / 100;
              updateSettings({
                algorithm_weights: settings.algorithm_weights
              });
            }} min={0} max={100} step={5} className="my-4" />
              <p className="text-sm text-muted-foreground">
                الكلمات المشتركة الفريدة
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>وزن التشابه الطولي</Label>
                <Badge variant="outline">{(settings.algorithm_weights.length_weight * 100).toFixed(0)}%</Badge>
              </div>
              <Slider value={[settings.algorithm_weights.length_weight * 100]} onValueChange={([value]) => {
              settings.algorithm_weights.length_weight = value / 100;
              updateSettings({
                algorithm_weights: settings.algorithm_weights
              });
            }} min={0} max={100} step={5} className="my-4" />
              <p className="text-sm text-muted-foreground">
                تشابه عدد الكلمات والصفحات
              </p>
            </div>
          </div>
        </Card>

        {/* Whitelist */}
        <Card className="p-6 glass-effect border-primary/20">
          <h2 className="text-xl font-bold mb-2">القائمة البيضاء (كلمات مستثناة)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            كلمات شائعة يتم تجاهلها في حسابات التشابه لتحسين الدقة
          </p>

          <div className="flex gap-2 mb-4">
            <Input value={newWord} onChange={e => setNewWord(e.target.value)} placeholder="أضف كلمة جديدة..." onKeyDown={e => {
            if (e.key === 'Enter') {
              handleAddWord();
            }
          }} className="flex-1" />
            <Button onClick={handleAddWord} size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {settings.custom_whitelist.map(word => <Badge key={word} variant="secondary" onClick={() => removeWhitelistWord(word)} className="pl-2 pr-3 py-1.5 hover:text-destructive cursor-pointer transition-colors bg-blue-400">
                {word}
                <X className="h-3 w-3 mr-1" />
              </Badge>)}
          </div>
        </Card>
      </div>
    </div>;
};
export default PDFComparisonSettings;