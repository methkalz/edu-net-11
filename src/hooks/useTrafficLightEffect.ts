import { useState, useEffect } from 'react';

export const useTrafficLightEffect = () => {
  const [activeBox, setActiveBox] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let currentBox = 0;

    const updateBox = () => {
      setActiveBox(currentBox);
      currentBox = currentBox < 3 ? currentBox + 1 : 0;
    };

    // Start immediately
    updateBox();
    
    // Continue with regular interval
    intervalId = setInterval(updateBox, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return activeBox;
};