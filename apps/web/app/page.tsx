"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ThemeToggle } from "../components/theme-toggle";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
 
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
 
    let animId: number;
    let time = 0;
 
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
 
    // ── geometric shapes flying through the grid ──
    type Shape = {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      type: "triangle" | "circle" | "diamond" | "cross";
      opacity: number;
      rotation: number;
      rotSpeed: number;
    };
 
    const shapes: Shape[] = Array.from({ length: 18 }, () => {
      const type = (["triangle", "circle", "diamond", "cross"] as const)[
        Math.floor(Math.random() * 4)
      ] ?? "circle";
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 3.5, // Move fast!
        vy: (Math.random() - 0.5) * 3.5, // Move fast!
        size: 14 + Math.random() * 25,   // Slightly larger
        type,
        opacity: 0.35 + Math.random() * 0.35, // Higher opacity for boldness
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.08, // Spin fast!
      };
    });
 
    // ── flowing connecting lines between nearest shapes ──
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      time += 0.03; // Move fast!

      const isDark = document.documentElement.classList.contains("dark");
 
      // ── scrolling grid ──
      const gridSize = 60;
      const offsetX = (time * 30) % gridSize;
      const offsetY = (time * 18) % gridSize;
 
      ctx.strokeStyle = isDark ? "rgba(59,130,246,0.15)" : "rgba(0,0,0,0.12)"; // Bolder grid lines
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let x = -gridSize + offsetX; x < W + gridSize; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let y = -gridSize + offsetY; y < H + gridSize; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();
 
      // ── subtle diagonal accent lines ──
      ctx.strokeStyle = isDark ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1.0;
      const diagOff = (time * 24) % (gridSize * 2);
      ctx.beginPath();
      for (let d = -H + diagOff; d < W + H; d += gridSize * 2) {
        ctx.moveTo(d, 0);
        ctx.lineTo(d + H, H);
      }
      ctx.stroke();
 
      // ── update + draw shapes ──
      for (const s of shapes) {
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotSpeed;
        if (s.x < -60) s.x = W + 60;
        if (s.x > W + 60) s.x = -60;
        if (s.y < -60) s.y = H + 60;
        if (s.y > H + 60) s.y = -60;
 
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        // Bold dark black for light mode, glowing blue for dark mode
        ctx.strokeStyle = isDark ? `rgba(59,130,246,${s.opacity * 0.95})` : `rgba(0,0,0,${s.opacity * 0.95})`;
        ctx.lineWidth = 2.5; // Bold shape borders
        ctx.fillStyle = isDark ? `rgba(59,130,246,0.18)` : `rgba(0,0,0,0.12)`;
 
        ctx.beginPath();
        switch (s.type) {
          case "triangle":
            ctx.moveTo(0, -s.size);
            ctx.lineTo(s.size * 0.866, s.size * 0.5);
            ctx.lineTo(-s.size * 0.866, s.size * 0.5);
            ctx.closePath();
            break;
          case "circle":
            ctx.arc(0, 0, s.size, 0, Math.PI * 2);
            break;
          case "diamond":
            ctx.moveTo(0, -s.size);
            ctx.lineTo(s.size * 0.6, 0);
            ctx.lineTo(0, s.size);
            ctx.lineTo(-s.size * 0.6, 0);
            ctx.closePath();
            break;
          case "cross":
            ctx.moveTo(-s.size, 0); ctx.lineTo(s.size, 0);
            ctx.moveTo(0, -s.size); ctx.lineTo(0, s.size);
            break;
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
 
      // ── connecting lines between close shapes ──
      for (let i = 0; i < shapes.length; i++) {
        const s1 = shapes[i];
        if (!s1) continue;
        for (let j = i + 1; j < shapes.length; j++) {
          const s2 = shapes[j];
          if (!s2) continue;
          const dx = s1.x - s2.x;
          const dy = s1.y - s2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const alpha = (1 - dist / 200) * 0.25;
            ctx.strokeStyle = isDark ? `rgba(59,130,246,${alpha})` : `rgba(0,0,0,${alpha * 1.5})`;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
        }
      }
 
      animId = requestAnimationFrame(draw);
    };
 
    draw();
 
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
 
  return (
    <div className="relative min-h-screen w-full bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500 overflow-hidden flex items-center justify-center px-6 py-20 md:py-32">
      {/* Animated canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Theme Switcher Header */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>
 
      {/* Subtle radial spotlight behind content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.035) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
 
      {/* Main Content Layout (Horizontal Split Grid) */}
      <main className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        {/* Left Column: Branding and Call-to-Action */}
        <div className="lg:col-span-5 flex flex-col items-start gap-8">
          <div className="flex flex-col gap-3">
            <h1
              className="text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-500 dark:from-blue-400 dark:via-blue-350 dark:to-indigo-300 bg-clip-text text-transparent leading-none"
              style={{ letterSpacing: "-0.03em" }}
            >
              ProdTrack
            </h1>
            <p className="text-lg font-medium text-neutral-600 dark:text-neutral-400 max-w-md">
              Streamline your product lifecycle. Track metrics, manage sprints, and optimize workflows in one unified platform.
            </p>
          </div>
 
          <div className="flex gap-5 items-center">
            <Button
              asChild
              size="lg"
              className="font-semibold rounded-lg px-8 py-3.5 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-neutral-900 text-white hover:bg-neutral-850 dark:bg-white dark:text-black dark:hover:bg-white/90 border-none cursor-pointer"
            >
              <Link href="/Login">Sign In</Link>
            </Button>
            <a href="#features" className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors duration-200">
              Explore Features &rarr;
            </a>
          </div>
        </div>
 
      </main>
 
      {/* Absolute positioned Footer */}
      <footer
        className="absolute bottom-6 left-0 right-0 text-center text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-600"
      >
        &copy; {new Date().getFullYear()} ProdTrack. All rights reserved.
      </footer>
    </div>
  );
}