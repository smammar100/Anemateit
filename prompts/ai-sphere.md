# AI Sphere

> **Recreate this exact component.** Paste this entire prompt into any AI coding tool (Claude Code, Cursor, v0, Lovable, Bolt…) — it's self-contained, with the full source (including the GLSL shaders) included below. **Stack:** React 18 + TypeScript, styled with Tailwind CSS (swap the `className`s for inline styles if you're not using Tailwind). **Dependencies:** `npm i three`.

A true-3D "intelligence" orb: a real Three.js sphere — a glass fresnel shell wrapping volumetric FBM plasma gas — that **genuinely rotates in 3D** when you drag it, with a glowing **flower-bloom** anchored at its centre and 5 color states, on black. Drop it into a hero, a loader, or an assistant avatar.

It is built for a **dark** background.

Plasma sphere adapted from a [CodePen by sabosugi](https://codepen.io/sabosugi/pen/jErWrMe); the centre flower-bloom is the inner-bloom shape from a [CodePen by Reza Saboori Amleshi](https://codepen.io/Reza-Saboori-Amleshi/pen/bGXyLdo).

## Setup

```bash
npm i three
```

**`'use client';`** Keep it in Next.js App Router; delete the line in Vite / Lovable / Bolt / plain React.

## Compatibility

| Framework | Notes |
|-----------|-------|
| Next.js App Router | Default — keep `'use client';`. |
| Vite + React | Delete `'use client';`. |
| Lovable / Bolt / v0 | Same — drop `'use client';`. |
| Tailwind | Used for layout + the swatch row. Inline-style equivalents work just as well. |

The component fills its nearest positioned ancestor — give the wrapper an explicit height (`relative h-[600px]`, `fixed inset-0`, etc.) on a **dark** background.

## Usage

```tsx
import AISphere from '@/components/ai-sphere/AISphere';

// Full orb with the 5 state swatches + drag to spin in 3D
<div className="relative h-[600px] w-full bg-black">
  <AISphere showSwatches />
</div>

// Quiet preview that auto-cycles states (no swatches)
<div className="relative aspect-square w-full bg-black">
  <AISphere autoCycle compact />
</div>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showSwatches` | `boolean` | `false` | Render the 5 color-state swatches |
| `autoCycle` | `boolean` | `false` | Auto-cycle through the states every 3s |
| `compact` | `boolean` | `false` | Lower sphere tessellation + pixel ratio for small tiles |
| `className` | `string` | `''` | Extra classes on the root element |

## How it works

- **Real 3D geometry.** A `SphereGeometry` glass shell (front + back faces, fresnel, additive) wraps a slightly smaller `SphereGeometry` of plasma gas. Both live in a rotating `Group`, so dragging turns the *actual* sphere in 3D — not a faked 2D effect.
- **Volumetric gas.** The plasma fragment shader samples domain-warped 3-octave FBM (3D simplex noise) across the sphere surface, mapping density through `deep → mid → bright → white` and fading by view-facing angle for depth. Additive `DoubleSide` blending makes it read as glowing volume.
- **Centre flower-bloom.** The signature bloom is a camera-facing billboard (a `PlaneGeometry` in the scene, not the rotating group) running the "siri" inner-bloom shader — angular FBM warps the radial falloff into petals. Because it sits at the origin facing the camera, it stays pinned at the centre while the sphere spins around it.
- **States.** Each swatch writes a palette (`deep / mid / bright / shell`) into the live uniforms; the scene is never rebuilt.
- **Rotation.** A pointer drag adds yaw/pitch to the group with release inertia and a slow idle spin. ACES tone mapping keeps the additive glow from blowing out.

## Component source — `AISphere.tsx`

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type SphereState = { name: string; deep: number; mid: number; bright: number; shell: number; css: string };

const AI_SPHERE_STATES: SphereState[] = [
  { name: 'Amber',   deep: 0x2a0e00, mid: 0xff7a2f, bright: 0xffd27a, shell: 0xff6a00, css: '#ff7a2f' },
  { name: 'Azure',   deep: 0x001a33, mid: 0x3b82f6, bright: 0x9fd0ff, shell: 0x2e6bff, css: '#4d8dff' },
  { name: 'Crimson', deep: 0x2a0008, mid: 0xff3b3b, bright: 0xffb3a0, shell: 0xff2257, css: '#ff4340' },
  { name: 'Violet',  deep: 0x1a0033, mid: 0x9b5cff, bright: 0xddb8ff, shell: 0x7c3aed, css: '#a86bff' },
  { name: 'Emerald', deep: 0x002a16, mid: 0x22e08a, bright: 0xb6ffd0, shell: 0x00ff88, css: '#33ffa0' },
];

// 3D simplex noise + 3-octave FBM (Ashima / Stefan Gustavson) for the gas.
const NOISE_GLSL = `
  vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec4 mod289(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  float fbm(vec3 p){
    float total = 0.0, amplitude = 0.5, frequency = 1.0;
    for (int i = 0; i < 3; i++){ total += snoise(p * frequency) * amplitude; amplitude *= 0.5; frequency *= 2.0; }
    return total;
  }
`;

type Props = { showSwatches?: boolean; autoCycle?: boolean; compact?: boolean; className?: string };

type SceneRefs = { plasmaMat: THREE.ShaderMaterial; shellMat: THREE.ShaderMaterial; bloomMat: THREE.ShaderMaterial };

export default function AISphere({ showSwatches = false, autoCycle = false, compact = false, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneRefs | null>(null);
  const [state, setState] = useState(0);

  const applyState = useCallback((i: number) => {
    const s = sceneRef.current;
    if (!s) return;
    const p = AI_SPHERE_STATES[i];
    s.plasmaMat.uniforms.uColorDeep.value.set(p.deep);
    s.plasmaMat.uniforms.uColorMid.value.set(p.mid);
    s.plasmaMat.uniforms.uColorBright.value.set(p.bright);
    s.shellMat.uniforms.uColor.value.set(p.shell);
    s.bloomMat.uniforms.uColor.value.set(p.mid);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const SEG = compact ? 96 : 128;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
    camera.position.z = 2.5;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.setClearColor(0x05060c, 1);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Glass shell (fresnel, additive)
    const shellGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const shellVert = `
      varying vec3 vNormal; varying vec3 vView;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`;
    const shellFrag = `
      varying vec3 vNormal; varying vec3 vView;
      uniform vec3 uColor; uniform float uOpacity;
      void main(){
        float fres = pow(1.0 - dot(normalize(vNormal), normalize(vView)), 2.5);
        gl_FragColor = vec4(uColor, fres * uOpacity);
      }`;
    const shellBackMat = new THREE.ShaderMaterial({
      vertexShader: shellVert, fragmentShader: shellFrag,
      uniforms: { uColor: { value: new THREE.Color(0x001133) }, uOpacity: { value: 0.3 } },
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
    });
    const shellMat = new THREE.ShaderMaterial({
      vertexShader: shellVert, fragmentShader: shellFrag,
      uniforms: { uColor: { value: new THREE.Color(0x2e6bff) }, uOpacity: { value: 0.42 } },
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false,
    });
    mainGroup.add(new THREE.Mesh(shellGeo, shellBackMat));
    mainGroup.add(new THREE.Mesh(shellGeo, shellMat));

    // Volumetric plasma gas (FBM)
    const plasmaGeo = new THREE.SphereGeometry(0.985, SEG, SEG);
    const plasmaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uScale: { value: 0.22 }, uBrightness: { value: 1.5 }, uThreshold: { value: 0.08 },
        uColorDeep: { value: new THREE.Color(0x001a33) },
        uColorMid: { value: new THREE.Color(0x3b82f6) },
        uColorBright: { value: new THREE.Color(0x9fd0ff) },
      },
      vertexShader: `
        varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;
        void main(){
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform float uTime; uniform float uScale; uniform float uBrightness; uniform float uThreshold;
        uniform vec3 uColorDeep; uniform vec3 uColorMid; uniform vec3 uColorBright;
        varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;
        ${NOISE_GLSL}
        void main(){
          vec3 p = vPosition * uScale;
          vec3 q = vec3(
            fbm(p + vec3(0.0, uTime * 0.05, 0.0)),
            fbm(p + vec3(5.2, 1.3, 2.8) + uTime * 0.05),
            fbm(p + vec3(2.2, 8.4, 0.5) - uTime * 0.02)
          );
          float density = fbm(p + 2.0 * q);
          float t = (density + 0.4) * 0.8;
          float alpha = smoothstep(uThreshold, 0.7, t);
          vec3 color = mix(uColorDeep, uColorMid, smoothstep(uThreshold, 0.5, t));
          color = mix(color, uColorBright, smoothstep(0.5, 0.8, t));
          color = mix(color, vec3(1.0), smoothstep(0.82, 1.0, t));
          float facing = dot(normalize(vNormal), normalize(vView));
          float finalAlpha = alpha * (0.02 + 0.98 * ((facing + 1.0) * 0.5));
          gl_FragColor = vec4(color * uBrightness, finalAlpha);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    });
    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    mainGroup.add(plasmaMesh);

    // Centre flower-bloom: a camera-facing billboard pinned at the origin,
    // so it stays put while the sphere rotates around it.
    const bloomGeo = new THREE.PlaneGeometry(2.1, 2.1);
    const bloomMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x3b82f6) } },
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
        float rand(vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
        float noise(vec2 p){
          vec2 ip = floor(p); vec2 u = fract(p); u = u*u*(3.0-2.0*u);
          float res = mix(mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
                          mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
          return res*res;
        }
        float fbm(vec2 p, int octaves){
          float s=0.0, m=0.0, a=0.5;
          if(octaves>=1){ s+=a*noise(p); m+=a; a*=0.5; p*=2.0; }
          if(octaves>=2){ s+=a*noise(p); m+=a; a*=0.5; p*=2.0; }
          if(octaves>=3){ s+=a*noise(p); m+=a; a*=0.5; p*=2.0; }
          if(octaves>=4){ s+=a*noise(p); m+=a; a*=0.5; p*=2.0; }
          return s/m;
        }
        void main(){
          vec2 uv = (vUv - 0.5) * 2.5;
          float t = uTime;
          float l = dot(uv, uv);
          if (l > 1.5) discard;
          float sm = smoothstep(1.02, 0.98, l);
          float nx = fbm(uv*2.0 + t*0.4 + 25.69, 4);
          float ny = fbm(uv*2.0 + t*0.4 + 86.31, 4);
          float n  = fbm(uv*3.0 + 2.0*vec2(nx, ny), 3);
          vec3 col = vec3(n*0.5 + 0.25) * uColor * 2.0;
          vec3 cd = abs(col);
          float f = fbm(normalize(uv + 0.001)*2.0 + t, 2) + 0.1;
          vec2 iuv = uv * (f + 0.1) * 0.5;
          float il = dot(iuv, iuv);
          vec3 ins = normalize(cd) + 0.1;
          float ind = 0.2 + pow(smoothstep(0.0, 1.5, sqrt(il)) * 48.0, 0.25);
          ind *= ind*ind*ind; ind = 1.0/ind; ins *= ind;
          vec3 flower = ins*ins*sm*smoothstep(0.7, 1.0, ind) * 1.6;
          flower += vec3(1.0) * pow(max(0.0, 1.0 - sqrt(l) * 1.2), 5.0) * 0.9;
          gl_FragColor = vec4(flower, 1.0);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Mesh(bloomGeo, bloomMat));

    sceneRef.current = { plasmaMat, shellMat, bloomMat };
    applyState(state);

    const sizeToContainer = () => {
      const { width, height } = wrap.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    sizeToContainer();
    const ro = new ResizeObserver(sizeToContainer);
    ro.observe(wrap);

    // True 3D rotation: drag spins the whole sphere, with inertia + idle spin
    let dragging = false, lastX = 0, lastY = 0, velX = 0, velY = 0;
    const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; velX = 0; velY = 0; wrap.setPointerCapture?.(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      mainGroup.rotation.y += dx * 0.007;
      mainGroup.rotation.x += dy * 0.007;
      velY = dx * 0.007; velX = dy * 0.007;
    };
    const onUp = (e: PointerEvent) => { dragging = false; wrap.releasePointerCapture?.(e.pointerId); };
    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      plasmaMat.uniforms.uTime.value = t * 1.2;
      bloomMat.uniforms.uTime.value = t;
      plasmaMesh.rotation.y = t * 0.06;
      mainGroup.rotation.x += dragging ? 0 : velX;
      mainGroup.rotation.y += dragging ? 0 : 0.0016 + velY;
      velX *= 0.95; velY *= 0.95;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerup', onUp);
      wrap.removeEventListener('pointercancel', onUp);
      sceneRef.current = null;
      shellGeo.dispose(); plasmaGeo.dispose(); bloomGeo.dispose();
      shellBackMat.dispose(); shellMat.dispose(); plasmaMat.dispose(); bloomMat.dispose();
      renderer.dispose();
    };
  }, [compact, applyState]);

  useEffect(() => { applyState(state); }, [state, applyState]);

  useEffect(() => {
    if (!autoCycle) return;
    const id = window.setInterval(() => setState((i) => (i + 1) % AI_SPHERE_STATES.length), 3000);
    return () => window.clearInterval(id);
  }, [autoCycle]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ background: 'radial-gradient(circle at 50% 45%, #0b0b10 0%, #000000 72%)' }}>
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <div ref={wrapRef} className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none" />
      {showSwatches && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5">
          {AI_SPHERE_STATES.map((s, i) => (
            <button key={s.name} type="button" aria-label={s.name} title={s.name} onClick={() => setState(i)}
              className="h-5 w-5 rounded-full transition-transform hover:scale-110"
              style={{
                background: s.css,
                boxShadow: state === i
                  ? `0 0 0 2px rgba(255,255,255,0.9), 0 0 14px ${s.css}`
                  : `0 0 0 1px rgba(255,255,255,0.25), 0 0 8px ${s.css}80`,
                transform: state === i ? 'scale(1.18)' : undefined,
              }} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Customising

- **States / colors** — edit `AI_SPHERE_STATES`. `deep → mid → bright` are the gas gradient; `shell` is the rim; `css` is the swatch dot (and the bloom is tinted by `mid`).
- **Gas character** — `uScale` (texture scale), `uBrightness`, and `uThreshold` (void size) are plasma uniforms; expose them as props or sliders.
- **Bloom** — the `* 1.6` and `* 0.9` in the bloom shader set petal vs. core brightness; the `PlaneGeometry(2.1, 2.1)` and `* 2.5` uv scale set its size.
- **Spin** — `0.007` is drag sensitivity, `0.95` the release inertia, `0.0016` the idle auto-spin.
