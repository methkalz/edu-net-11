import { useEffect, useState } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  start?: number;
  decimals?: number;
}

export const useCountUp = ({ 
  end, 
  duration = 1500, 
  start = 0,
  decimals = 0 
}: UseCountUpOptions) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // تأثير ease-out: يبدأ سريعاً وينتهي ببطء
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentCount = start + (end - start) * easeOut;
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, start]);

  return decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count);
};
