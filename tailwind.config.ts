/**
 * Tailwind CSS Configuration
 * 
 * This file configures Tailwind CSS for the Arabic Educational Platform.
 * It defines the design system including colors, typography, animations,
 * and responsive breakpoints that maintain consistency across the application.
 * 
 * Features:
 * - HSL-based color system with CSS custom properties
 * - Arabic font families (Cairo, Tajawal, Amiri)
 * - Extended color palette with semantic naming
 * - Custom animations and keyframes
 * - Responsive container configurations
 * - Dark mode support via class strategy
 * 
 * Design Principles:
 * - All colors use HSL format for better manipulation
 * - Semantic color names for consistent theming
 * - RTL-friendly layout utilities
 * - Performance-optimized animations
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import type { Config } from "tailwindcss";

export default {
	// Dark mode strategy - uses class-based toggling
	darkMode: ["class"],
	
	// Content paths for Tailwind to scan for classes
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	
	// No prefix for utility classes
	prefix: "",
	
	theme: {
		// Container configuration for responsive layouts
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'  // Maximum container width
			}
		},
		
		extend: {
			// Color system based on CSS custom properties
			// All colors use HSL format for better theming support
			colors: {
				// Base system colors
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				// Primary brand colors
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
					dark: 'hsl(var(--primary-dark))'
				},
				
				// Secondary brand colors
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					light: 'hsl(var(--secondary-light))',
					dark: 'hsl(var(--secondary-dark))'
				},
				
				// Extended color palette for rich visual experiences
				blue: {
					electric: 'hsl(var(--blue-electric))',
					cyber: 'hsl(var(--blue-cyber))',
					ocean: 'hsl(var(--blue-ocean))'
				},
				orange: {
					fire: 'hsl(var(--orange-fire))',
					sunset: 'hsl(var(--orange-sunset))'
				},
				purple: {
					mystic: 'hsl(var(--purple-mystic))',
					neon: 'hsl(var(--purple-neon))'
				},
				magenta: {
					glow: 'hsl(var(--magenta-glow))'
				},
				pink: {
					vibrant: 'hsl(var(--pink-vibrant))'
				},
				green: {
					emerald: 'hsl(var(--green-emerald))',
					neon: 'hsl(var(--green-neon))'
				},
				teal: {
					bright: 'hsl(var(--teal-bright))'
				},
				cyan: {
					electric: 'hsl(var(--cyan-electric))'
				},
				yellow: {
					bright: 'hsl(var(--yellow-bright))',
					electric: 'hsl(var(--yellow-electric))'
				},
				gold: {
					premium: 'hsl(var(--gold-premium))'
				},
				
				// System utility colors
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				
				// Sidebar component colors
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			
			// Arabic typography system
			fontFamily: {
				cairo: ['Cairo', 'sans-serif'],    // Modern Arabic sans-serif
				tajawal: ['Tajawal', 'sans-serif'], // Clean Arabic UI font
				amiri: ['Amiri', 'serif'],          // Traditional Arabic serif
			},
			
			// Border radius system based on CSS custom property
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			
			// Custom keyframe animations
			keyframes: {
				// Accordion animations for collapsible content
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				
				// Entrance animations
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.3)', opacity: '0' },
					'50%': { transform: 'scale(1.05)' },
					'70%': { transform: 'scale(0.9)' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				
				// Utility animations
				'cursor-blink': {
					'0%, 50%': { opacity: '1' },
					'51%, 100%': { opacity: '0' }
				},
				
				// Wiggle animation for horizontal movement
				'wiggle': {
					'0%, 100%': { transform: 'translateX(0px)' },
					'25%': { transform: 'translateX(4px)' },
					'75%': { transform: 'translateX(-4px)' }
				}
			},
			
			// Animation utilities combining keyframes with timing
			animation: {
				// Component-specific animations
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'cursor-blink': 'cursor-blink 1s infinite',
				
				// Entrance animations
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-up': 'slide-up 0.6s ease-out',
				'scale-in': 'scale-in 0.4s ease-out',
				'bounce-in': 'bounce-in 0.6s ease-out',
				
				// Continuous animations for visual effects
				'float': 'float 6s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
				'wiggle': 'wiggle 1s ease-in-out infinite',
				'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
				'rotate-slow': 'rotate-slow 10s linear infinite',
				'rainbow-flow': 'rainbow-flow 8s ease infinite',
				'particle-float': 'particle-float 20s ease-in-out infinite'
			}
		}
	},
	
	// Required plugins for extended functionality
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
