/**
 * Utility Functions Library
 * 
 * Core utility functions for the educational platform.
 * Provides essential helpers for styling, class management, and common operations.
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Class Name Utility Function
 * 
 * Combines clsx and tailwind-merge for intelligent CSS class management.
 * Handles conditional classes and resolves Tailwind CSS conflicts automatically.
 * 
 * @param inputs - Array of class values (strings, objects, arrays, etc.)
 * @returns Merged and optimized class string
 * 
 * @example
 * // Basic usage
 * cn('px-4 py-2', 'bg-blue-500')
 * // Returns: 'px-4 py-2 bg-blue-500'
 * 
 * // Conditional classes
 * cn('base-class', { 'active': isActive, 'disabled': !isEnabled })
 * 
 * // Resolves Tailwind conflicts (twMerge handles precedence)
 * cn('px-2 px-4') 
 * // Returns: 'px-4' (later class wins)
 * 
 * // Complex combinations
 * cn('btn', variant === 'primary' && 'btn-primary', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
