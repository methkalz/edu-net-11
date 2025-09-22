import { useRef, useCallback } from 'react';
import backgroundMusicUrl from '@/assets/Quiz-Timer-Background-Loop.mp3';

export const useBackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  // تشغيل الموسيقى الخلفية مع تأثير fade-in
  const playBackgroundMusic = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(backgroundMusicUrl);
        audioRef.current.loop = true;
        audioRef.current.volume = 0; // البدء بصوت صفر للـ fade-in
      }

      if (!isPlayingRef.current) {
        audioRef.current.play().catch(console.error);
        isPlayingRef.current = true;
        
        // تأثير fade-in تدريجي إلى 25%
        let currentVolume = 0;
        const targetVolume = 0.25; // 25% volume
        const fadeInterval = setInterval(() => {
          currentVolume += 0.05;
          if (currentVolume >= targetVolume) {
            currentVolume = targetVolume;
            clearInterval(fadeInterval);
          }
          if (audioRef.current) {
            audioRef.current.volume = currentVolume;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error playing background music:', error);
    }
  }, []);

  // إيقاف الموسيقى الخلفية مع تأثير fade-out
  const stopBackgroundMusic = useCallback(() => {
    try {
      if (audioRef.current && isPlayingRef.current) {
        const currentVolume = audioRef.current.volume;
        
        // تأثير fade-out تدريجي
        let volume = currentVolume;
        const fadeInterval = setInterval(() => {
          volume -= 0.05;
          if (volume <= 0) {
            volume = 0;
            clearInterval(fadeInterval);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
          }
          if (audioRef.current) {
            audioRef.current.volume = volume;
          }
        }, 100);
        
        isPlayingRef.current = false;
      }
    } catch (error) {
      console.error('Error stopping background music:', error);
    }
  }, []);

  // تنظيف عند إلغاء تحميل المكون
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      isPlayingRef.current = false;
    }
  }, []);

  return {
    playBackgroundMusic,
    stopBackgroundMusic,
    cleanup,
    isPlaying: isPlayingRef.current
  };
};