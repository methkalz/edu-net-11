import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Square, RotateCcw, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

const TextToSpeechTestBlock: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textLengthRef = useRef(0);

  // Sample texts
  const sampleTexts = {
    arabic: 'مرحباً بكم في نظام قراءة النصوص بالصوت. هذا النص مكتوب باللغة العربية لاختبار جودة النطق والقراءة. يمكنكم تجربة سرعات مختلفة ودرجات صوت متنوعة للحصول على أفضل تجربة استماع.',
    english: 'Welcome to the Text-to-Speech testing system. This text is written in English to test pronunciation and reading quality. You can try different speeds and pitch levels.',
    hebrew: 'שלום וברוכים הבאים למערכת קריאת טקסט בקול. זהו טקסט לבדיקת איכות ההגייה והקריאה.',
    mixed: 'هذا نص يحتوي على كلمات من لغات مختلفة مثل Computer و Internet وأيضاً מחשב و אינטרנט لاختبار القدرة على التعامل مع نصوص متعددة اللغات.'
  };

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // اختيار أفضل صوت عربي تلقائياً
      if (availableVoices.length > 0 && !selectedVoice) {
        const arabicVoice = getBestArabicVoice(availableVoices);
        if (arabicVoice) {
          setSelectedVoice(arabicVoice.name);
        }
      }
    };

    loadVoices();
    
    // بعض المتصفحات تحتاج لتحميل الأصوات بشكل متأخر
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // التحقق من دعم المتصفح
    if (!('speechSynthesis' in window)) {
      toast.error('غير مدعوم', {
        description: 'متصفحك لا يدعم ميزة قراءة النصوص. يرجى استخدام Chrome أو Edge'
      });
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // اختيار أفضل صوت عربي
  const getBestArabicVoice = (availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    const priorities = ['Microsoft Hoda', 'Google Arabic', 'ar-SA', 'ar-EG', 'ar'];
    
    for (const priority of priorities) {
      const voice = availableVoices.find(v => 
        v.name.includes(priority) || v.lang.includes(priority)
      );
      if (voice) return voice;
    }
    
    return availableVoices.find(v => v.lang.startsWith('ar'));
  };

  // اكتشاف اللغة من النص
  const detectLanguage = (inputText: string): string => {
    const arabicRegex = /[\u0600-\u06FF]/;
    const hebrewRegex = /[\u0590-\u05FF]/;
    
    if (arabicRegex.test(inputText)) return 'ar-SA';
    if (hebrewRegex.test(inputText)) return 'he-IL';
    return 'en-US';
  };

  // تشغيل القراءة
  const handlePlay = () => {
    if (!text.trim()) {
      toast.warning('لا يوجد نص', {
        description: 'يرجى كتابة أو لصق نص للقراءة'
      });
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // إيقاف أي قراءة سابقة
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    textLengthRef.current = text.length;

    // إعدادات الصوت
    utterance.rate = rate;
    utterance.pitch = pitch;

    // اختيار الصوت
    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
    } else {
      utterance.lang = detectLanguage(text);
    }

    // متابعة التقدم
    utterance.onboundary = (event) => {
      setCurrentWord(event.charIndex);
      const progressPercent = (event.charIndex / textLengthRef.current) * 100;
      setProgress(progressPercent);
    };

    // عند الانتهاء
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      toast.success('تم الانتهاء من القراءة');
    };

    // معالجة الأخطاء
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      toast.error('خطأ في القراءة', {
        description: 'حدث خطأ أثناء قراءة النص. يرجى المحاولة مرة أخرى'
      });
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setProgress(0);
  };

  // إيقاف مؤقت
  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  // إيقاف كامل
  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentWord(0);
  };

  // إعادة القراءة
  const handleReset = () => {
    handleStop();
    setTimeout(() => handlePlay(), 100);
  };

  // تحميل نص تجريبي
  const loadSampleText = (type: keyof typeof sampleTexts) => {
    setText(sampleTexts[type]);
    handleStop();
    toast.success('تم تحميل النص التجريبي');
  };

  return (
    <div className="space-y-6">
      {/* منطقة النص */}
      <div>
        <label className="block text-sm font-medium mb-2 text-right">
          النص المراد قراءته
        </label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب أو الصق النص هنا..."
          className="min-h-[200px] text-right resize-none"
          dir="auto"
        />
      </div>

      {/* أزرار التحكم */}
      <div className="flex gap-2 flex-wrap justify-center">
        <Button
          onClick={handlePlay}
          disabled={isPlaying || !text.trim()}
          variant="default"
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          {isPaused ? 'استئناف' : 'تشغيل'}
        </Button>
        
        <Button
          onClick={handlePause}
          disabled={!isPlaying}
          variant="outline"
          className="gap-2"
        >
          <Pause className="h-4 w-4" />
          إيقاف مؤقت
        </Button>
        
        <Button
          onClick={handleStop}
          disabled={!isPlaying && !isPaused}
          variant="outline"
          className="gap-2"
        >
          <Square className="h-4 w-4" />
          إيقاف
        </Button>
        
        <Button
          onClick={handleReset}
          disabled={!text.trim()}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة
        </Button>
      </div>

      {/* مؤشر التقدم */}
      {(isPlaying || isPaused || progress > 0) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {Math.round(progress)}%
            </span>
            <span className="text-muted-foreground">التقدم</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* الإعدادات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg">
        {/* السرعة */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-right">
            السرعة: {rate.toFixed(1)}x
          </label>
          <Slider
            value={[rate]}
            onValueChange={(value) => setRate(value[0])}
            min={0.5}
            max={2}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>2.0x</span>
            <span>0.5x</span>
          </div>
        </div>

        {/* درجة الصوت */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-right">
            درجة الصوت: {pitch.toFixed(1)}
          </label>
          <Slider
            value={[pitch]}
            onValueChange={(value) => setPitch(value[0])}
            min={0.5}
            max={2}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>2.0</span>
            <span>0.5</span>
          </div>
        </div>

        {/* اختيار الصوت */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-right">
            الصوت
          </label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger>
              <SelectValue placeholder="اختر صوت..." />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* عدد الأصوات المتاحة */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Volume2 className="h-4 w-4" />
          <span>{voices.length} صوت متاح</span>
        </div>
      </div>

      {/* نصوص تجريبية */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-right">
          نصوص تجريبية
        </label>
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            onClick={() => loadSampleText('arabic')}
            variant="outline"
            size="sm"
          >
            نص عربي
          </Button>
          <Button
            onClick={() => loadSampleText('english')}
            variant="outline"
            size="sm"
          >
            English Text
          </Button>
          <Button
            onClick={() => loadSampleText('hebrew')}
            variant="outline"
            size="sm"
          >
            טקסט עברי
          </Button>
          <Button
            onClick={() => loadSampleText('mixed')}
            variant="outline"
            size="sm"
          >
            نص مختلط
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeechTestBlock;
