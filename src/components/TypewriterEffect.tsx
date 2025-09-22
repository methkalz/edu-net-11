/**
 * Typewriter Effect Component
 * 
 * A React component that creates an animated typewriter effect, cycling through
 * an array of texts with customizable typing, deleting, and pause durations.
 * Perfect for hero sections, loading screens, and engaging text displays.
 * 
 * Features:
 * - Configurable typing and deleting speeds
 * - Customizable pause duration between texts
 * - Animated cursor with CSS animation
 * - Seamless text cycling
 * - Responsive design support
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';

/**
 * Props interface for the TypewriterEffect component
 */
interface TypewriterEffectProps {
  texts: string[];              // Array of texts to cycle through
  className?: string;           // Additional CSS classes
  typeSpeed?: number;           // Speed of typing animation (ms per character)
  deleteSpeed?: number;         // Speed of deleting animation (ms per character)
  pauseDuration?: number;       // Pause duration after completing each text (ms)
}

/**
 * TypewriterEffect Component
 * 
 * Creates an animated typewriter effect that cycles through provided texts.
 * The component manages its own state for text display, deletion, and cycling.
 * 
 * @param texts - Array of strings to display in sequence
 * @param className - Optional CSS classes for styling
 * @param typeSpeed - Milliseconds between each character when typing (default: 100)
 * @param deleteSpeed - Milliseconds between each character when deleting (default: 50)
 * @param pauseDuration - Milliseconds to pause after completing text (default: 2000)
 */
const TypewriterEffect = ({ 
  texts, 
  className = "", 
  typeSpeed = 100, 
  deleteSpeed = 50, 
  pauseDuration = 2000 
}: TypewriterEffectProps) => {
  // State management for the typewriter effect
  const [displayText, setDisplayText] = useState('');     // Currently displayed text
  const [textIndex, setTextIndex] = useState(0);          // Index of current text in array
  const [isDeleting, setIsDeleting] = useState(false);    // Whether currently deleting
  const [isPaused, setIsPaused] = useState(false);        // Whether paused after completing text

  /**
   * Main effect hook that manages the typewriter animation logic
   * 
   * This effect handles:
   * - Pausing after text completion
   * - Character-by-character typing animation
   * - Character-by-character deletion animation
   * - Cycling to the next text in the array
   * 
   * The effect runs whenever displayText, textIndex, isDeleting, or isPaused changes.
   */
  useEffect(() => {
    const currentText = texts[textIndex];
    
    // Handle pause state after completing text
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);  // Start deleting after pause
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    // Main animation timer
    const timer = setTimeout(() => {
      if (isDeleting) {
        // Deleting animation: remove one character at a time
        setDisplayText(prev => prev.slice(0, -1));
        
        // When deletion is complete, move to next text
        if (displayText === '') {
          setIsDeleting(false);
          setTextIndex(prev => (prev + 1) % texts.length);  // Cycle through texts
        }
      } else {
        // Typing animation: add one character at a time
        setDisplayText(prev => currentText.slice(0, prev.length + 1));
        
        // When typing is complete, start pause
        if (displayText === currentText) {
          setIsPaused(true);
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed);  // Use different speeds for typing vs deleting

    return () => clearTimeout(timer);
  }, [displayText, textIndex, isDeleting, isPaused, texts, typeSpeed, deleteSpeed, pauseDuration]);

  /**
   * Render the typewriter effect
   * 
   * Returns a div container with fixed height containing the current display text and an animated cursor.
   * The fixed height prevents layout shifts when text length changes.
   */
  return (
    <div className={`text-center min-h-[120px] flex items-center justify-center ${className}`}>
      <span className="leading-relaxed">
        {displayText}
        <span className="cursor-blink text-primary">|</span>
      </span>
    </div>
  );
};

export default TypewriterEffect;