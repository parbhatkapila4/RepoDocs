"use client";

import React, { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

uniform sampler2D u_image;
uniform sampler2D u_noise;
uniform float u_time;
varying vec2 v_texCoord;

// Two decorrelated tiling noise fields, packed into the texture's red and
// green channels.
float noiseR(vec2 p) { return texture2D(u_noise, p).r; }
float noiseG(vec2 p) { return texture2D(u_noise, p).g; }

float fbmR(vec2 p) {
  return 0.66 * noiseR(p) + 0.34 * noiseR(p * 2.03);
}

float fbmG(vec2 p) {
  return 0.66 * noiseG(p) + 0.34 * noiseG(p * 2.03);
}

vec2 twist(vec2 uv, float strength) {
  vec2 center = vec2(0.5, 0.5);
  vec2 offset = uv - center;
  float angle = length(offset) * strength;
  float s = sin(angle);
  float c = cos(angle);
  return center + mat2(c, -s, s, c) * offset;
}

void main() {
  vec2 uv = v_texCoord;

  // Under one noise tile across the whole frame, so the folds are broad sheets
  // rather than detail. The field drifts so they never settle.
  vec2 p = uv * 0.35 + vec2(u_time * 0.008, -u_time * 0.0056);

  // First fold: where the field is sampled.
  vec2 q = vec2(
    fbmR(p + vec2(0.00, 0.13)),
    fbmG(p + vec2(0.52, 0.47))
  );

  // Second fold: the first fold sampled again, which is what turns smooth
  // noise into curling, marbled sheets.
  vec2 r = vec2(
    fbmR(p + 0.85 * q + vec2(0.17, 0.92) + u_time * 0.0128),
    fbmG(p + 0.85 * q + vec2(0.83, 0.28) - u_time * 0.0096)
  );

  uv += 1.05 * (r - 0.5) + 0.36 * (q - 0.5);

  // A long, shallow breath so the whole sheet rocks rather than scrolls.
  uv = twist(uv, 0.26 * sin(u_time * 0.045) - 0.06);
  uv.y += 0.03 * sin(uv.x * 2.2 + u_time * 0.06);

  gl_FragColor = texture2D(u_image, uv);
}
`;

const TEXTURE_W = 1024;
const TEXTURE_H = 640;

const NOISE_SIZE = 256;
const NOISE_CELLS = 8;

const STILL_TIME = 12;

type Stop = [number, string];

interface Blob {
  cx: number;
  cy: number;
  r: number;
  stops: Stop[];
}

const BASE = "#03040A";
const BLOBS: Blob[] = [
  {
    cx: 0.9,
    cy: 0.12,
    r: 0.95,
    stops: [
      [0, "rgba(216,236,246,1)"],
      [0.3, "rgba(178,214,234,1)"],
      [0.58, "rgba(110,158,196,0.8)"],
      [0.82, "rgba(58,94,138,0.28)"],
      [1, "rgba(58,94,138,0)"],
    ],
  },

  {
    cx: 0.55,
    cy: 0.52,
    r: 0.62,
    stops: [
      [0, "rgba(59,114,232,1)"],
      [0.42, "rgba(42,92,205,0.98)"],
      [0.7, "rgba(26,60,150,0.75)"],
      [0.88, "rgba(14,34,92,0.3)"],
      [1, "rgba(14,34,92,0)"],
    ],
  },
  {
    cx: 0.62,
    cy: 0.92,
    r: 0.4,
    stops: [
      [0, "rgba(18,165,148,0.95)"],
      [0.45, "rgba(14,120,124,0.6)"],
      [1, "rgba(14,120,124,0)"],
    ],
  },

  {
    cx: 0.8,
    cy: 0.7,
    r: 0.24,
    stops: [
      [0, "rgba(30,196,176,0.55)"],
      [0.5, "rgba(18,140,150,0.3)"],
      [1, "rgba(18,140,150,0)"],
    ],
  },
  {
    cx: 1.0,
    cy: 1.02,
    r: 0.38,
    stops: [
      [0, "rgba(2,8,22,1)"],
      [0.55, "rgba(3,12,32,0.85)"],
      [1, "rgba(3,12,32,0)"],
    ],
  },

  {
    cx: 0.02,
    cy: 0.06,
    r: 0.62,
    stops: [
      [0, "rgba(0,0,0,1)"],
      [0.55, "rgba(0,0,0,0.95)"],
      [0.84, "rgba(0,0,0,0.45)"],
      [1, "rgba(0,0,0,0)"],
    ],
  },
  {
    cx: 0.03,
    cy: 1.02,
    r: 0.5,
    stops: [
      [0, "rgba(0,0,0,1)"],
      [0.5, "rgba(1,4,12,0.92)"],
      [0.82, "rgba(1,4,12,0.4)"],
      [1, "rgba(1,4,12,0)"],
    ],
  },
];
const CSS_GRADIENT = [...BLOBS]
  .reverse()
  .map((b) => {
    const stops = b.stops
      .map(([offset, color]) => `${color} ${(offset * 100).toFixed(1)}%`)
      .join(", ");
    return `radial-gradient(ellipse ${(b.r * 100).toFixed(1)}% ${(
      (b.r * TEXTURE_W * 100) /
      TEXTURE_H
    ).toFixed(1)}% at ${(b.cx * 100).toFixed(1)}% ${(b.cy * 100).toFixed(
      1,
    )}%, ${stops})`;
  })
  .join(", ");

function paintGradient(): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_W;
  canvas.height = TEXTURE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = BASE;
  ctx.fillRect(0, 0, TEXTURE_W, TEXTURE_H);

  for (const { cx, cy, r, stops } of BLOBS) {
    const g = ctx.createRadialGradient(
      cx * TEXTURE_W,
      cy * TEXTURE_H,
      0,
      cx * TEXTURE_W,
      cy * TEXTURE_H,
      r * TEXTURE_W,
    );
    for (const [offset, color] of stops) g.addColorStop(offset, color);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TEXTURE_W, TEXTURE_H);
  }

  return canvas;
}
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function lattice(seed: number): number[] {
  const rand = lcg(seed);
  const values: number[] = [];
  for (let i = 0; i < NOISE_CELLS * NOISE_CELLS; i++) values.push(rand());
  return values;
}

function paintNoise(): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = NOISE_SIZE;
  canvas.height = NOISE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const fields = [lattice(0x9e3779b9), lattice(0x85ebca6b)];
  const image = ctx.createImageData(NOISE_SIZE, NOISE_SIZE);
  const ease = (t: number) => t * t * (3 - 2 * t);

  for (let y = 0; y < NOISE_SIZE; y++) {
    for (let x = 0; x < NOISE_SIZE; x++) {
      const fx = (x / NOISE_SIZE) * NOISE_CELLS;
      const fy = (y / NOISE_SIZE) * NOISE_CELLS;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const x1 = (x0 + 1) % NOISE_CELLS;
      const y1 = (y0 + 1) % NOISE_CELLS;
      const tx = ease(fx - x0);
      const ty = ease(fy - y0);
      const i = (y * NOISE_SIZE + x) * 4;

      for (let f = 0; f < 2; f++) {
        const v = fields[f];
        const a = v[y0 * NOISE_CELLS + x0];
        const b = v[y0 * NOISE_CELLS + x1];
        const c = v[y1 * NOISE_CELLS + x0];
        const d = v[y1 * NOISE_CELLS + x1];
        const top = a + (b - a) * tx;
        const bottom = c + (d - c) * tx;
        image.data[i + f] = Math.round((top + (bottom - top) * ty) * 255);
      }
      image.data[i + 2] = 0;
      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
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

interface Renderer {
  draw: (time: number) => void;
  dispose: () => void;
}

function bindTexture(
  gl: WebGLRenderingContext,
  unit: number,
  source: HTMLCanvasElement,
  repeat: boolean,
): WebGLTexture | null {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

function createRenderer(
  gl: WebGLRenderingContext,
  gradient: HTMLCanvasElement,
  noise: HTMLCanvasElement,
): Renderer | null {
  const vert = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!vert || !frag || !program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);

  const positions = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positions);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const aPosition = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const texCoords = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoords);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
    gl.STATIC_DRAW,
  );
  const aTexCoord = gl.getAttribLocation(program, "a_texCoord");
  gl.enableVertexAttribArray(aTexCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

  const image = bindTexture(gl, 0, gradient, false);
  const noiseTexture = bindTexture(gl, 1, noise, true);
  gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "u_noise"), 1);

  const uTime = gl.getUniformLocation(program, "u_time");

  return {
    draw(time) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    dispose() {
      gl.deleteTexture(image);
      gl.deleteTexture(noiseTexture);
      gl.deleteBuffer(positions);
      gl.deleteBuffer(texCoords);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    },
  };
}

interface HeroCanvasProps {
  active: boolean;
  still: boolean;
}

export function HeroCanvas({ active, still }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const frameRef = useRef(0);
  const runningRef = useRef(false);
  const stillRef = useRef(still);
  const startRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    const gradient = gl ? paintGradient() : null;
    const noise = gl ? paintNoise() : null;
    if (!gl || !gradient || !noise) {
      canvas.style.display = "none";
      return;
    }

    startRef.current = performance.now();

    const drawOnce = () => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      const t = stillRef.current
        ? STILL_TIME
        : (performance.now() - startRef.current) * 0.001;
      renderer.draw(t);
    };

    const stop = () => {
      runningRef.current = false;
      cancelAnimationFrame(frameRef.current);
    };

    const loop = () => {
      if (!runningRef.current) return;
      drawOnce();
      frameRef.current = requestAnimationFrame(loop);
    };

    const setup = () => {
      rendererRef.current = createRenderer(gl, gradient, noise);
      if (!rendererRef.current) canvas.style.display = "none";
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(parent.clientWidth * dpr));
      const h = Math.max(1, Math.round(parent.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      if (!runningRef.current) drawOnce();
    };

    const onLost = (e: Event) => {
      e.preventDefault();
      stop();
      rendererRef.current = null;
    };
    const onRestored = () => {
      setup();
      resize();
      if (canvas.dataset.active === "true" && !stillRef.current) {
        runningRef.current = true;
        loop();
      } else {
        drawOnce();
      }
    };

    canvas.addEventListener("webglcontextlost", onLost, false);
    canvas.addEventListener("webglcontextrestored", onRestored, false);

    setup();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    return () => {
      stop();
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      rendererRef.current?.dispose();
      rendererRef.current = null;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    stillRef.current = still;
    canvas.dataset.active = String(active);

    const renderer = rendererRef.current;
    if (!renderer) return;

    if (active && !still) {
      if (runningRef.current) return;
      runningRef.current = true;
      const loop = () => {
        if (!runningRef.current) return;
        renderer.draw((performance.now() - startRef.current) * 0.001);
        frameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } else {
      runningRef.current = false;
      cancelAnimationFrame(frameRef.current);
      if (still) renderer.draw(STILL_TIME);
    }
  }, [active, still]);

  return (
    <div
      className="relative h-full w-full"
      style={{
        backgroundColor: BASE,
        backgroundImage: CSS_GRADIENT,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 block h-full w-full"
      />
    </div>
  );
}
