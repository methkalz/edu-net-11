import { useEffect, useRef, useCallback } from 'react';

const CELEBRATION_MUSIC_URL = 'https://edu-net.me/medal.mp3';

export const useCelebrationMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // إنشاء عنصر الصوت
    const audio = new Audio(CELEBRATION_MUSIC_URL);
    audio.volume = 0; // البدء بصوت صامت
    audioRef.current = audio;

    // تشغيل الموسيقى مع fade in
    const playMusic = async () => {
      try {
        await audio.play();
        
        // Fade in سريع خلال 300ms
        const fadeInDuration = 300;
        const targetVolume = 0.5;
        const steps = 20;
        const stepDuration = fadeInDuration / steps;
        const volumeIncrement = targetVolume / steps;
        
        let currentStep = 0;
        const fadeInInterval = setInterval(() => {
          if (currentStep < steps && audioRef.current) {
            audioRef.current.volume = Math.min(volumeIncrement * (currentStep + 1), targetVolume);
            currentStep++;
          } else {
            clearInterval(fadeInInterval);
          }
        }, stepDuration);
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
