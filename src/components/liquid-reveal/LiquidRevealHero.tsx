'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Ported from the user-provided "liquid-reveal-shader" CodePen
// (https://codepen.io/daniel-mu-oz/pen/GgjPOmO). Two textured planes drawn
// to a WebGL canvas. The top plane (reveal) is gated by a brush-painted
// CanvasTexture mask whose edges are warped by a custom fragment shader to
// produce the "liquid" border, plus a moving diagonal wireframe sweep —
// that sweep is the shimmer.

type Props = {
  /** Bottom layer image (always visible). */
  portraitSrc: string;
  /** Top layer image (revealed inside the cursor brush). */
  revealSrc: string;
  /** Wordmark in the top-left. */
  firstName?: string;
  /** Wordmark in the bottom-right. */
  lastName?: string;
  /** Giant outlined number behind the subject. */
  backdrop?: string;
  /** Backwards-compat shim for the old SVG-goo version. Not used here. */
  blobSize?: number;
  /** Scale of the helmet (reveal) plane relative to the portrait. Default 1. */
  revealScale?: number;
};

export default function LiquidRevealHero({
  portraitSrc,
  revealSrc,
  firstName = 'LANDO',
  lastName = 'NORRIS',
  backdrop = '04',
  revealScale = 1,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    // ── scene & camera ────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const sizeToContainer = () => {
      const { width, height } = wrap.getBoundingClientRect();
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.left = -aspect;
      camera.right = aspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
    };

    // Contain (letterbox) rather than cover — both source images are near-square
    // and cover-cropping makes the helmet/portrait look like extreme zoom-ins.
    const fitContain = (plane: THREE.Mesh, tex: THREE.Texture) => {
      if (!tex.image) return;
      const { width, height } = wrap.getBoundingClientRect();
      const img = tex.image as { width: number; height: number };
      const imgAspect = img.width / img.height;
      const winAspect = width / height;
      if (imgAspect >= winAspect) {
        // image relatively wider → fit the width, letterbox top/bottom
        plane.scale.set(winAspect, winAspect / imgAspect, 1);
      } else {
        // image relatively taller → fit the height, letterbox left/right
        plane.scale.set(imgAspect, 1, 1);
      }
    };
    const fitCover = fitContain; // back-compat alias

    // ── paint mask (canvas-backed texture) ───────────────────────────────
    const MASK_SIZE = 1024;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = MASK_SIZE;
    maskCanvas.height = MASK_SIZE;
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, MASK_SIZE, MASK_SIZE);
    const maskTexture = new THREE.CanvasTexture(maskCanvas);

    const BRUSH_RADIUS = 120;
    const paintBrush = (x: number, y: number, dx = 0, dy = 0) => {
      const speed = Math.hypot(dx, dy);
      const angle = speed > 1 ? Math.atan2(dy, dx) : 0;
      const stretch = 1 + Math.min(speed / (BRUSH_RADIUS * 0.4), 3.0);
      maskCtx.save();
      maskCtx.translate(x, y);
      maskCtx.rotate(angle);
      maskCtx.scale(stretch, 1);
      const g = maskCtx.createRadialGradient(0, 0, 0, 0, 0, BRUSH_RADIUS);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.65, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.fillStyle = g;
      maskCtx.beginPath();
      maskCtx.arc(0, 0, BRUSH_RADIUS, 0, Math.PI * 2);
      maskCtx.fill();
      maskCtx.restore();
      maskTexture.needsUpdate = true;
    };

    // ── parallax state ───────────────────────────────────────────────────
    let mouseNormX = 0,
      mouseNormY = 0,
      smoothX = 0,
      smoothY = 0,
      smoothZ = 0;
    let prevMouse: { x: number; y: number } | null = null;
    let lastMouseTime = performance.now();

    const handleMove = (clientX: number, clientY: number) => {
      const r = wrap.getBoundingClientRect();
      if (
        clientX < r.left ||
        clientX > r.right ||
        clientY < r.top ||
        clientY > r.bottom
      ) {
        prevMouse = null;
        return;
      }
      lastMouseTime = performance.now();
      const localX = clientX - r.left;
      const localY = clientY - r.top;
      mouseNormX = (localX / r.width - 0.5) * 2;
      mouseNormY = -(localY / r.height - 0.5) * 2;
      const winAspect = r.width / r.height;
      const worldX = ((localX / r.width) * 2 - 1) * winAspect;
      const worldY = 1 - (localY / r.height) * 2;
      const scaleX = plane2.scale.x;
      const scaleY = plane2.scale.y;
      const cx = ((worldX + scaleX) / (2 * scaleX)) * MASK_SIZE;
      const cy = ((scaleY - worldY) / (2 * scaleY)) * MASK_SIZE;
      if (prevMouse) {
        const dx = cx - prevMouse.x;
        const dy = cy - prevMouse.y;
        const steps = Math.max(
          1,
          Math.floor(Math.hypot(dx, dy) / (BRUSH_RADIUS * 0.25)),
        );
        for (let i = 0; i <= steps; i++) {
          paintBrush(
            prevMouse.x + (dx * i) / steps,
            prevMouse.y + (dy * i) / steps,
            dx,
            dy,
          );
        }
      } else {
        paintBrush(cx, cy);
      }
      prevMouse = { x: cx, y: cy };
    };

    const onMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onLeave = () => {
      prevMouse = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchend', onLeave);

    // ── textures ─────────────────────────────────────────────────────────
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    // Base plane (portrait — always visible)
    const plane1Material = new THREE.MeshBasicMaterial({ transparent: true });
    const plane1 = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), plane1Material);
    plane1.position.z = 0;
    scene.add(plane1);
    textureLoader.load(portraitSrc, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      plane1Material.map = tex;
      plane1Material.needsUpdate = true;
      fitCover(plane1, tex);
    });

    // Reveal plane (helmet) — custom shader for liquid edge + wireframe shimmer
    const plane2Material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTexture: { value: null },
        uMask: { value: maskTexture },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTexture;
        uniform sampler2D uMask;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          // ---- LIQUID REVEAL ----
          vec2 wUv = vUv + vec2(
            sin(vUv.y * 5.0 + uTime * 0.9) * 0.02,
            cos(vUv.x * 5.0 + uTime * 0.7) * 0.02
          );
          vec2 d1 = vec2(
            sin(wUv.y * 4.0 + uTime * 1.4) * cos(wUv.x * 3.0 + uTime * 1.1),
            cos(wUv.x * 3.5 + uTime * 1.3) * sin(wUv.y * 2.5 + uTime * 0.9)
          ) * 0.045;
          vec2 d2 = vec2(
            sin(wUv.y * 11.0 - uTime * 2.6 + wUv.x * 5.0),
            cos(wUv.x * 9.0  + uTime * 2.9 - wUv.y * 6.0)
          ) * 0.022;
          vec2 distort = d1 + d2;

          float mask = texture2D(uMask, vUv + distort).r;

          float noise =
            sin(vUv.x * 18.0 + uTime * 2.0) * cos(vUv.y * 16.0 + uTime * 1.7) * 0.22
          + sin(vUv.x * 38.0 - uTime * 3.2) * cos(vUv.y * 33.0 + uTime * 2.6) * 0.11;

          float edgeMask = smoothstep(0.05, 0.35, mask) * (1.0 - smoothstep(0.35, 0.65, mask));
          float liquidMask = mask + noise * edgeMask * 1.8;
          float alpha = smoothstep(0.45, 0.55, liquidMask);

          vec4 imgColor = texture2D(uTexture, vUv);
          vec4 revealColor = vec4(imgColor.rgb, alpha);

          // ---- DIAGONAL WIREFRAME SWEEP (shimmer) ----
          float t = mod(uTime, 5.0) / 5.0;
          float target = t * 2.5 - 0.25;
          float dist = (vUv.x + vUv.y) - target;
          float sweepIntensity = max(0.0, 1.0 - abs(dist) / 0.1);

          vec2 grid = fract(vUv * 100.0);
          float thickness = 0.03;
          bool isLine = grid.x < thickness || grid.y < thickness || abs(grid.x - grid.y) < thickness;

          vec4 wireColor = vec4(0.0);
          if (sweepIntensity > 0.0) {
            float baseAlpha = sweepIntensity * 0.18;
            wireColor = vec4(imgColor.rgb, isLine ? sweepIntensity : baseAlpha);
          }

          gl_FragColor = mix(revealColor, wireColor, wireColor.a);
        }
      `,
    });
    const plane2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), plane2Material);
    plane2.position.z = 0.01;
    scene.add(plane2);
    textureLoader.load(revealSrc, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      plane2Material.uniforms.uTexture.value = tex;
      plane2Material.needsUpdate = true;
      fitCover(plane2, tex);
      plane2.scale.multiplyScalar(revealScale);
    });

    sizeToContainer();
    if (plane1Material.map) fitCover(plane1, plane1Material.map);

    const ro = new ResizeObserver(() => {
      sizeToContainer();
      if (plane1Material.map) fitCover(plane1, plane1Material.map);
      if (plane2Material.uniforms.uTexture.value) {
        fitCover(plane2, plane2Material.uniforms.uTexture.value);
        plane2.scale.multiplyScalar(revealScale);
      }
    });
    ro.observe(wrap);

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const elapsed = clock.getElapsedTime();
      plane2Material.uniforms.uTime.value = elapsed;

      const secondsSinceMouse = (performance.now() - lastMouseTime) / 1000;
      const targetX = mouseNormX;
      const targetY = mouseNormY;
      if (secondsSinceMouse > 2.0) {
        // Idle: Lissajous sweep so the shimmer keeps moving even without cursor
        const zigX = Math.sin(elapsed * 1.1);
        const zigY = Math.sin(elapsed * 0.7);
        const r = wrap.getBoundingClientRect();
        const winAspect = r.width / r.height;
        const worldX = zigX * winAspect;
        const worldY = zigY;
        const scaleX = plane2.scale.x;
        const scaleY = plane2.scale.y;
        const cx = ((worldX + scaleX) / (2 * scaleX)) * MASK_SIZE;
        const cy = ((scaleY - worldY) / (2 * scaleY)) * MASK_SIZE;
        paintBrush(cx, cy);
      }

      smoothX += (targetX - smoothX) * 0.06;
      smoothY += (targetY - smoothY) * 0.06;
      const distNorm = Math.hypot(targetX, targetY);
      smoothZ += (distNorm - smoothZ) * 0.06;

      plane1.position.x = smoothX * 0.012;
      plane1.position.y = smoothY * 0.012;
      plane1.position.z = -smoothZ * 0.03;
      plane2.position.x = smoothX * 0.02;
      plane2.position.y = smoothY * 0.02;
      plane2.position.z = 0.01 + smoothZ * 0.05;

      const lookTarget = new THREE.Vector3(smoothX * 0.3, smoothY * 0.3, 5);
      plane1.lookAt(lookTarget);
      plane2.lookAt(lookTarget);

      // Fade the brush trail every frame so the reveal collapses again
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.fillStyle = 'rgba(0,0,0,0.018)';
      maskCtx.fillRect(0, 0, MASK_SIZE, MASK_SIZE);
      maskTexture.needsUpdate = true;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchend', onLeave);
      plane1Material.map?.dispose();
      plane1Material.dispose();
      plane2Material.uniforms.uTexture.value?.dispose?.();
      plane2Material.dispose();
      maskTexture.dispose();
      plane1.geometry.dispose();
      plane2.geometry.dispose();
      renderer.dispose();
    };
  }, [portraitSrc, revealSrc, revealScale]);

  return (
    <section
      ref={wrapRef}
      className="relative w-full h-full overflow-hidden bg-black text-white cursor-crosshair"
    >
      <div className="absolute inset-0 grid place-items-center pointer-events-none select-none z-0">
        <span
          aria-hidden
          className="font-black italic leading-[0.85] tracking-[-0.05em] text-transparent"
          style={{
            WebkitTextStroke: '2.5px #d2ff00',
            fontSize: 'clamp(120px, 22vw, 420px)',
            filter:
              'drop-shadow(0 0 24px rgba(210,255,0,0.4)) drop-shadow(0 0 48px rgba(210,255,0,0.2))',
          }}
        >
          {backdrop}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 block"
      />

      <h1
        className="absolute m-0 font-black uppercase tracking-[-0.03em] text-white z-20 pointer-events-none"
        style={{
          top: 'clamp(20px, 3.5vw, 56px)',
          left: 'clamp(16px, 3vw, 40px)',
          fontSize: 'clamp(32px, 5vw, 82px)',
          lineHeight: 0.92,
        }}
      >
        {firstName}
      </h1>

      <h2
        className="absolute m-0 font-black uppercase tracking-[-0.03em] text-white z-20 pointer-events-none"
        style={{
          bottom: 'clamp(20px, 3.5vw, 56px)',
          right: 'clamp(16px, 3vw, 40px)',
          fontSize: 'clamp(32px, 5vw, 82px)',
          lineHeight: 0.92,
        }}
      >
        {lastName}
      </h2>

      <span
        className="absolute uppercase font-medium z-20 text-white/60 pointer-events-none"
        style={{
          left: 'clamp(16px, 3vw, 40px)',
          bottom: 'clamp(20px, 3vw, 40px)',
          fontSize: 11,
          letterSpacing: '0.22em',
        }}
      >
        Move to reveal
      </span>
    </section>
  );
}
