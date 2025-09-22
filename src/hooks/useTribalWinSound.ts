import { useRef, useCallback } from 'react';
import tribalWinMusicUrl from '@/assets/Tribal-Win.mp3';

export const useTribalWinSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  // تشغيل صوت الفوز القبلي مع تأثيرات fade-in وfade-out
  const playTribalWinSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(tribalWinMusicUrl);
        audioRef.current.loop = false; // بدون لوب
        audioRef.current.volume = 0; // البدء بصوت صفر للـ fade-in
      }

      if (!isPlayingRef.current) {
        audioRef.current.currentTime = 0; // إعادة تعيين الموضع للبداية
        audioRef.current.play().catch(console.error);
        isPlayingRef.current = true;
        
        // تأثير fade-in تدريجي إلى 50%
        let currentVolume = 0;
        const targetVolume = 0.5; // 50% volume
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

        // إضافة مستمع لنهاية الصوت لتطبيق fade-out
        const handleEnded = () => {
          isPlayingRef.current = false;
          if (audioRef.current) {
            audioRef.current.removeEventListener('ended', handleEnded);
          }
        };

        // إضافة مستمع لتطبيق fade-out قبل النهاية بثانيتين
        const handleTimeUpdate = () => {
          if (audioRef.current && audioRef.current.duration > 0) {
            const timeRemaining = audioRef.current.duration - audioRef.current.currentTime;
            if (timeRemaining <= 2 && timeRemaining > 0) {
              // بدء fade-out
              const fadeOutInterval = setInterval(() => {
                if (audioRef.current) {
                  audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.05);
                  if (audioRef.current.volume <= 0) {
                    clearInterval(fadeOutInterval);
                  }
                }
              }, 100);
              audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
            }
          }
        };

        audioRef.current.addEventListener('ended', handleEnded);
        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      }
    } catch (error) {
      console.error('Error playing tribal win sound:', error);
    }
  }, []);

  // إيقاف صوت الفوز القبلي مع تأثير fade-out فوري
  const stopTribalWinSound = useCallback(() => {
    try {
      if (audioRef.current && isPlayingRef.current) {
        const currentVolume = audioRef.current.volume;
        
        // تأثير fade-out سريع
        let volume = currentVolume;
        const fadeInterval = setInterval(() => {
          volume -= 0.1;
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
        }, 50);
        
        isPlayingRef.current = false;
      }
    } catch (error) {
      console.error('Error stopping tribal win sound:', error);
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
    playTribalWinSound,
    stopTribalWinSound,
    cleanup,
    isPlaying: isPlayingRef.current
  };
};