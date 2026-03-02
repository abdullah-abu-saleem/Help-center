import React, { useEffect, useRef, useState } from 'react';

/**
 * NeuroNetworkCanvas — animated node-link network background.
 *
 * Fixes applied (vs original StringLogin version):
 *  1. DPR: ctx.setTransform(1,0,0,1,0,0) before ctx.scale(dpr, dpr) on every
 *     resize, preventing accumulated transforms.
 *  2. clearRect uses CSS-pixel dimensions (w, h) after the DPR scale.
 *  3. Canvas element has pointer-events-none so it never blocks clicks.
 *  4. prefers-reduced-motion: returns null (static grid + noise only).
 */
export const NeuroNetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // ── Reduced-motion guard ──
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onMotionChange);

    if (mq.matches) {
      return () => mq.removeEventListener('change', onMotionChange);
    }

    // ── Canvas setup ──
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;

      // Set physical size
      canvas.width = w * dpr;
      canvas.height = h * dpr;

      // Reset transform then apply DPR scale (prevents accumulation)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();

    // ── Node class ──
    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;

      constructor() {
        const parent = canvas!.parentElement;
        const w = parent ? parent.clientWidth : window.innerWidth;
        const h = parent ? parent.clientHeight : window.innerHeight;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.12;
        this.vy = (Math.random() - 0.5) * 0.12;
        this.radius = Math.random() * 1.5 + 1;
        this.color =
          Math.random() > 0.4
            ? 'rgba(8, 184, 251, 0.4)'
            : 'rgba(237, 59, 145, 0.4)';
      }

      update(w: number, h: number) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;

        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 200) {
          const force = (200 - distance) / 200;
          this.vx -= (dx / distance) * force * 0.05;
          this.vy -= (dy / distance) * force * 0.05;
        }
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.fillStyle = this.color;
        ctx!.fill();
      }
    }

    const nodes = Array.from({ length: 65 }, () => new Node());

    const animate = () => {
      const parent = canvas!.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;

      // clearRect in CSS pixels (DPR scale is already applied)
      ctx.clearRect(0, 0, w, h);

      nodes.forEach((node, i) => {
        node.update(w, h);
        node.draw();
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(104, 130, 169, ${0.1 * (1 - dist / 150)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Mouse tracking (on window since canvas is pointer-events-none)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      mq.removeEventListener('change', onMotionChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
