// src/components/common/DotGridWaveBackground.jsx
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 v_uv;

uniform vec2 u_res;
uniform float u_dpr;
uniform float u_time;
uniform float u_cellPx;
uniform float u_dotSize;
uniform float u_waveScale;
uniform float u_waveSpeed;
uniform float u_angle;
uniform float u_falloff;
uniform float u_mouseStr;
uniform vec2 u_mouse;
uniform float u_mouseAct;
uniform vec3 u_c0;
uniform vec3 u_c1;

void main() {
  vec2 px = v_uv * (u_res / max(u_dpr, 1.0));
  vec2 resCss = u_res / max(u_dpr, 1.0);
  float minSide = max(min(resCss.x, resCss.y), 1.0);

  vec2 grid = px / u_cellPx;
  vec2 cell = floor(grid);
  vec2 f = fract(grid);
  vec2 centerUv = ((cell + 0.5) * u_cellPx) / minSide;

  float rad = radians(u_angle);
  vec2 dir = vec2(cos(rad), sin(rad));
  float phase = dot(centerUv, dir) * 6.28318 * u_waveScale - u_time * u_waveSpeed * 2.0;
  float wave = 0.5 + 0.5 * sin(phase);
  wave = pow(wave, 1.0 / max(u_falloff, 0.1));

  vec2 mousePos = vec2(u_mouse.x * (resCss.x / minSide), u_mouse.y * (resCss.y / minSide));
  float gate = u_mouseStr * u_mouseAct;
  float md = distance(centerUv, mousePos);
  float lens = exp(-md * md * 8.0) * gate;
  float ripple = (0.5 + 0.5 * sin(md * 18.0 - u_time * 4.5)) * exp(-md * 3.0) * gate * 0.32;
  float lift = min(lens + ripple, 1.0);

  float r = u_dotSize * 0.5 * (0.45 + 0.55 * wave);
  r *= 1.0 + 0.85 * lens + 0.25 * ripple;
  float d = distance(f, vec2(0.5));
  float dotMask = smoothstep(r, r * 0.48, d);

  vec3 c = mix(u_c1, u_c0, clamp(wave + 0.5 * lift, 0.0, 1.0));
  float bright = 0.3 + 0.7 * wave + 0.8 * lift * (1.0 - 0.3 * wave);
  vec3 col = c * bright + lens * lens * 0.22 * vec3(1.0);

  float alpha = clamp(dotMask * min(0.35 + 0.65 * wave + lift, 1.0), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

function hexToVec3(hex) {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function DotGridWaveBackground({
  spacing = 0.23,
  dotSize = 0.18,
  waveScale = 0.42,
  waveSpeed = 0.48,
  angle = 45,
  falloff = 0.55,
  mouse = 1.0,
}) {
  const hostRef = useRef(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeRef = useRef(isLight);
  themeRef.current = isLight;

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return undefined;

    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
    container.appendChild(canvas);

    const gl =
      canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false }) ||
      canvas.getContext('experimental-webgl', { alpha: true });

    let rafId = 0;
    let isVisible = true;
    let contextLost = false;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let mouseTargetX = 0.5;
    let mouseTargetY = 0.5;
    let mouseSmoothX = 0.5;
    let mouseSmoothY = 0.5;
    let mouseAct = 0;
    let lastMoveTime = -1e9;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      mouseTargetX = (e.clientX - rect.left) / rect.width;
      mouseTargetY = 1 - (e.clientY - rect.top) / rect.height;
      lastMoveTime = performance.now();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // WebGL shader path
    let program = null;
    let uniforms = null;
    let buffer = null;

    if (gl) {
      const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (vs && fs) {
        program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vs);
          gl.attachShader(program, fs);
          gl.linkProgram(program);
          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
            buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
            const posLoc = gl.getAttribLocation(program, 'a_pos');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            uniforms = {
              res: gl.getUniformLocation(program, 'u_res'),
              dpr: gl.getUniformLocation(program, 'u_dpr'),
              time: gl.getUniformLocation(program, 'u_time'),
              cellPx: gl.getUniformLocation(program, 'u_cellPx'),
              dotSize: gl.getUniformLocation(program, 'u_dotSize'),
              waveScale: gl.getUniformLocation(program, 'u_waveScale'),
              waveSpeed: gl.getUniformLocation(program, 'u_waveSpeed'),
              angle: gl.getUniformLocation(program, 'u_angle'),
              falloff: gl.getUniformLocation(program, 'u_falloff'),
              mouseStr: gl.getUniformLocation(program, 'u_mouseStr'),
              mouse: gl.getUniformLocation(program, 'u_mouse'),
              mouseAct: gl.getUniformLocation(program, 'u_mouseAct'),
              c0: gl.getUniformLocation(program, 'u_c0'),
              c1: gl.getUniformLocation(program, 'u_c1'),
            };
          } else {
            gl.deleteProgram(program);
            program = null;
          }
        }
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    }

    const cellPx = 18 + spacing * 34; // spacing=0.23 -> ~25.8px crisp architectural grid

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(container.clientWidth * dpr));
      const h = Math.max(1, Math.round(container.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      if (gl && uniforms) {
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uniforms.res, w, h);
        gl.uniform1f(uniforms.dpr, dpr);
      }
    };

    const handleContextLost = (e) => {
      e.preventDefault();
      contextLost = true;
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    const resizeObserver =
      typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(container);

    const io =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            const nextVisible = entries.some((entry) => entry.isIntersecting);
            if (nextVisible && !isVisible) {
              isVisible = true;
              if (!prefersReducedMotion) rafId = requestAnimationFrame(render);
            } else if (!nextVisible && isVisible) {
              isVisible = false;
              cancelAnimationFrame(rafId);
            }
          })
        : null;
    io?.observe(container);

    const startTime = performance.now();

    const render2D = (ctx, elapsed) => {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const step = cellPx * dpr;
      const rad = (angle * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const minSide = Math.max(Math.min(w, h), 1);

      ctx.clearRect(0, 0, w, h);
      const rgb = themeRef.current ? '37, 99, 235' : '59, 130, 246';

      for (let y = step * 0.5; y < h; y += step) {
        for (let x = step * 0.5; x < w; x += step) {
          const u = x / minSide;
          const v = y / minSide;
          const phase = (u * dx + v * dy) * Math.PI * 2 * waveScale - elapsed * waveSpeed * 2;
          const wave = Math.pow(0.5 + 0.5 * Math.sin(phase), 1 / Math.max(falloff, 0.1));
          const radius = dotSize * 0.5 * step * (0.45 + 0.55 * wave);
          ctx.fillStyle = `rgba(${rgb}, ${(0.22 + 0.65 * wave).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const ctx2d = !gl || !program ? canvas.getContext('2d') : null;

    const render = (now) => {
      if (contextLost || !isVisible) return;
      const elapsed = (now - startTime) / 1000;

      mouseSmoothX += (mouseTargetX - mouseSmoothX) * 0.08;
      mouseSmoothY += (mouseTargetY - mouseSmoothY) * 0.08;
      const activeTarget = now - lastMoveTime < 2200 ? 1 : 0;
      mouseAct += (activeTarget - mouseAct) * 0.05;

      if (gl && uniforms) {
        const [r0, g0, b0] = hexToVec3(themeRef.current ? '#2563eb' : '#3b82f6');
        const [r1, g1, b1] = hexToVec3(themeRef.current ? '#64748b' : '#475569');

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uniforms.time, elapsed);
        gl.uniform1f(uniforms.cellPx, cellPx);
        gl.uniform1f(uniforms.dotSize, dotSize);
        gl.uniform1f(uniforms.waveScale, waveScale);
        gl.uniform1f(uniforms.waveSpeed, waveSpeed);
        gl.uniform1f(uniforms.angle, angle);
        gl.uniform1f(uniforms.falloff, falloff);
        gl.uniform1f(uniforms.mouseStr, mouse);
        gl.uniform2f(uniforms.mouse, mouseSmoothX, mouseSmoothY);
        gl.uniform1f(uniforms.mouseAct, mouseAct);
        gl.uniform3f(uniforms.c0, r0, g0, b0);
        gl.uniform3f(uniforms.c1, r1, g1, b1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else if (ctx2d) {
        render2D(ctx2d, elapsed);
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    resize();
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      resizeObserver?.disconnect();
      io?.disconnect();
      if (gl) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        try {
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        } catch {
          // ignore cleanup when context already lost
        }
      }
      canvas.remove();
    };
  }, [spacing, dotSize, waveScale, waveSpeed, angle, falloff, mouse]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden transition-opacity duration-300 ${
        isLight ? 'opacity-40' : 'opacity-65'
      }`}
    />
  );
}
