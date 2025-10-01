import { useEffect, useRef, useCallback } from 'react';

const CELEBRATION_MUSIC_URL = 'https://edu-net.me/Cartoon%20Big%20Win.mp3';

export const useCelebrationMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // إنشاء عنصر الصوت
    const audio = new Audio(CELEBRATION_MUSIC_URL);
    audio.volume = 0.5; // حجم صوت متوسط
    audioRef.current = audio;

    // تشغيل الموسيقى
    const playMusic = async () => {
      try {
        await audio.play();
      } catch (error) {
        console.error('Failed to play celebration music:', error);
      }
    };

    playMusic();

    // تنظيف عند إزالة المكون
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { stopMusic };
};
