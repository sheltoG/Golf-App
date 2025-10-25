import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.frameworkReady) {
        window.frameworkReady();
      }
    } catch (error) {
      // Safely handle any errors during framework initialization
      if (typeof console !== 'undefined' && console.error) {
        console.error('Framework ready error:', error);
      }
    }
  })
}