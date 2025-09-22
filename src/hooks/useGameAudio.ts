import { useState, useCallback, useRef, useEffect } from 'react';

interface AudioSettings {
  volume: number;
  isMuted: boolean;
}

interface GameAudio {
  correctMatch: string;
  incorrectMatch: string;
  gameStart: string;
  gameComplete: string;
}

const DEFAULT_SOUNDS: GameAudio = {
  correctMatch: 'http://edu-net.me/correct.mp3',
  incorrectMatch: 'http://edu-net.me/wrong.mp3', // صوت افتراضي للمطابقة الخاطئة
  gameStart: '', // صوت بداية اللعبة
  gameComplete: 'http://edu-net.me/gamewin.mp3' // صوت إنهاء اللعبة
};

const STORAGE_KEY = 'game-audio-settings';

export const useGameAudio = () => {
  // إعدادات الصوت
  const [settings, setSettings] = useState<AudioSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading audio settings:', error);
    }
    return { volume: 70, isMuted: false };
  });

  // مراجع ملفات الصوت المحملة
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  // حفظ الإعدادات في localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving audio settings:', error);
    }
  }, [settings]);

  // تحميل ملف صوتي مسبقاً
  const preloadAudio = useCallback(async (url: string): Promise<HTMLAudioElement | null> => {
    if (!url) return null;
    
    // التحقق من وجود الملف في الكاش
    if (audioCache.current.has(url)) {
      return audioCache.current.get(url)!;
    }

    try {
      const audio = new Audio(url);
      audio.volume = settings.volume / 100;
      audio.preload = 'auto';
      
      // إضافة الملف إلى الكاش
      audioCache.current.set(url, audio);
      
      return audio;
    } catch (error) {
      console.error('Error preloading audio:', url, error);
      return null;
    }
  }, [settings.volume]);

  // تشغيل صوت
  const playSound = useCallback(async (url: string) => {
    if (!url || settings.isMuted) return;

    try {
      let audio = audioCache.current.get(url);
      
      if (!audio) {
        audio = await preloadAudio(url);
      }
      
      if (audio) {
        audio.volume = settings.volume / 100;
        audio.currentTime = 0; // إعادة تعيين الصوت للبداية
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing sound:', url, error);
    }
  }, [settings.volume, settings.isMuted, preloadAudio]);

  // دوال تشغيل أصوات اللعبة
  const playCorrectMatch = useCallback(() => {
    playSound(DEFAULT_SOUNDS.correctMatch);
  }, [playSound]);

  const playIncorrectMatch = useCallback(() => {
    if (DEFAULT_SOUNDS.incorrectMatch) {
      playSound(DEFAULT_SOUNDS.incorrectMatch);
    }
  }, [playSound]);

  const playGameStart = useCallback(() => {
    if (DEFAULT_SOUNDS.gameStart) {
      playSound(DEFAULT_SOUNDS.gameStart);
    }
  }, [playSound]);

  const playGameComplete = useCallback(() => {
    if (DEFAULT_SOUNDS.gameComplete) {
      playSound(DEFAULT_SOUNDS.gameComplete);
    }
  }, [playSound]);

  // تحديث مستوى الصوت
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    setSettings(prev => ({ ...prev, volume: clampedVolume }));
    
    // تحديث مستوى الصوت في جميع الملفات المحملة
    audioCache.current.forEach(audio => {
      audio.volume = clampedVolume / 100;
    });
  }, []);

  // تبديل كتم الصوت
  const toggleMute = useCallback(() => {
    setSettings(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // تحديث إعدادات الصوت
  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // تنظيف الكاش
  const clearCache = useCallback(() => {
    audioCache.current.clear();
  }, []);

  // تحميل جميع الأصوات مسبقاً
  const preloadAllSounds = useCallback(async () => {
    const soundUrls = Object.values(DEFAULT_SOUNDS).filter(url => url);
    await Promise.all(soundUrls.map(url => preloadAudio(url)));
  }, [preloadAudio]);

  // تشغيل صوت اختبار
  const testSound = useCallback(() => {
    playCorrectMatch();
  }, [playCorrectMatch]);

  return {
    // الإعدادات
    settings,
    
    // دوال التحكم
    setVolume,
    toggleMute,
    updateSettings,
    
    // دوال تشغيل الأصوات
    playCorrectMatch,
    playIncorrectMatch,
    playGameStart,
    playGameComplete,
    playSound,
    
    // دوال المساعدة
    preloadAllSounds,
    clearCache,
    testSound
  };
};