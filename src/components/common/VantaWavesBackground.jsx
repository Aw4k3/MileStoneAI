// src/components/common/VantaWavesBackground.jsx
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

let vantaScriptPromise = null;

function loadVantaWavesScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window unavailable'));
  }
  if (window.VANTA && typeof window.VANTA.WAVES === 'function') {
    return Promise.resolve();
  }
  if (!vantaScriptPromise) {
    vantaScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/vendor/vanta.waves.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (err) => {
        vantaScriptPromise = null;
        reject(err);
      };
      document.head.appendChild(script);
    });
  }
  return vantaScriptPromise;
}

function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export default function VantaWavesBackground() {
  const containerRef = useRef(null);
  const effectRef = useRef(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    let cancelled = false;

    async function initVanta() {
      const el = containerRef.current;
      if (!el || !isWebGLSupported()) return;

      try {
        const THREE = await import('three');
        if (cancelled) return;
        window.THREE = THREE;

        await loadVantaWavesScript();
        if (cancelled || !containerRef.current || !window.VANTA?.WAVES) return;

        if (effectRef.current) {
          effectRef.current.destroy();
          effectRef.current = null;
        }

        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

        effectRef.current = window.VANTA.WAVES({
          el: containerRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: isLight ? 0xcfd9e6 : 0x0,
          backgroundColor: isLight ? 0xf5f7fa : 0x0b0d14,
          backgroundAlpha: 1,
          shininess: isLight ? 20 : 30,
          waveHeight: 15,
          waveSpeed: prefersReducedMotion ? 0.05 : 1.0,
          zoom: 1,
        });
      } catch (err) {
        console.warn('Vanta background fallback:', err?.message || err);
      }
    }

    initVanta();

    return () => {
      cancelled = true;
      if (effectRef.current) {
        try {
          effectRef.current.destroy();
        } catch {
          // ignore cleanup errors if WebGL context already lost
        }
        effectRef.current = null;
      }
    };
    // Theme changes are handled smoothly via setOptions below without rebuilding WebGL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!effectRef.current) return;
    try {
      effectRef.current.setOptions({
        color: isLight ? 0xcfd9e6 : 0x0,
        backgroundColor: isLight ? 0xf5f7fa : 0x0b0d14,
        shininess: isLight ? 20 : 30,
      });
    } catch {
      // ignore if effect is tearing down
    }
  }, [isLight]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 z-0 pointer-events-none select-none overflow-hidden transition-opacity duration-300 ${
        isLight ? 'opacity-70' : 'opacity-90'
      }`}
    />
  );
}
