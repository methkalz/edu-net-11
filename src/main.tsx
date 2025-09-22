/**
 * Application Entry Point
 * 
 * This is the main entry point for the Arabic Educational Platform.
 * It initializes the React application with Strict Mode enabled for 
 * development-time checks and warnings.
 * 
 * Features:
 * - React 18 createRoot API for improved performance
 * - Strict Mode for development warnings and checks
 * - Global CSS imports for styling system
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalChunkErrorHandler } from './utils/chunkRetry'

// Setup global chunk error handling before app initialization
setupGlobalChunkErrorHandler();

// Create root element using React 18 API
const root = createRoot(document.getElementById("root")!);

// Render the application with Strict Mode for better development experience
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
