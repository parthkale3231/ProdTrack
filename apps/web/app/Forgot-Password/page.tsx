"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, ShieldCheck, Lock, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { ThemeToggle } from "../../components/theme-toggle";

export default function ForgotPasswordPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a valid username.");
      return;
    }
    setError("");
    setInfoMessage("OTP sent successfully! Use simulated code: 123456");
    setStep(2);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "123456") {
      setError("Invalid OTP code. Please enter simulated code: 123456");
      return;
    }
    setError("");
    setInfoMessage("");
    setStep(3);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setInfoMessage("");
    setStep(4);
  };

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

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      time += 0.03; // Move fast!

      const isDark = document.documentElement.classList.contains("dark");

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

      ctx.strokeStyle = isDark ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1.0;
      const diagOff = (time * 24) % (gridSize * 2);
      ctx.beginPath();
      for (let d = -H + diagOff; d < W + H; d += gridSize * 2) {
        ctx.moveTo(d, 0);
        ctx.lineTo(d + H, H);
      }
      ctx.stroke();

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
    <div className="relative min-h-screen w-full bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500 overflow-hidden flex items-center justify-center px-4 py-16">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <main
        className="relative z-10 w-full max-w-md flex flex-col gap-8 px-8 py-10 rounded-[20px] backdrop-blur-xl bg-white/70 border border-neutral-200/50 dark:bg-neutral-950/40 dark:border-neutral-900/60 shadow-xl dark:shadow-neutral-950/80 transition-colors duration-500"
      >
        <div className="flex flex-col gap-2 items-center text-center">
          <h1
            className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-500 dark:from-blue-400 dark:via-blue-350 dark:to-indigo-300 bg-clip-text text-transparent leading-none"
            style={{ letterSpacing: "-0.02em" }}
          >
            ProdTrack
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-450 mt-1">
            Password Recovery Console
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs font-semibold rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 animate-fade-in">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 text-xs font-semibold rounded bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 animate-fade-in">
            {infoMessage}
          </div>
        )}

        {/* Form Recoveries */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username" className="text-neutral-850 dark:text-neutral-200">Username / Email</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="name@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-9 bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-850 text-neutral-900 dark:text-white"
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold rounded-lg py-2.5 transition-all duration-200 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-white/90 border-none cursor-pointer"
            >
              Request OTP
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="otp" className="text-neutral-850 dark:text-neutral-200">OTP Code</Label>
              <div className="relative">
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter simulated 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="pl-9 bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-850 text-neutral-900 dark:text-white"
                />
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="w-1/3 text-xs border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-white/90 border-none cursor-pointer"
              >
                Verify Code
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword" className="text-neutral-850 dark:text-neutral-200">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pl-9 pr-10 bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-850 text-neutral-900 dark:text-white"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-350 focus:outline-none transition-colors duration-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword" className="text-neutral-850 dark:text-neutral-200">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-9 bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-850 text-neutral-900 dark:text-white"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold rounded-lg py-2.5 transition-all duration-200 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-white/90 border-none cursor-pointer"
            >
              Reset Password
            </Button>
          </form>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6 text-center py-4 items-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            <div className="flex flex-col gap-2">
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Password Reset Successfully</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 px-6">
                Your new password has been saved. You can now log in to the operations portal using your new credentials.
              </p>
            </div>
            <Button
              asChild
              className="w-full mt-2 font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-white/90 border-none cursor-pointer"
            >
              <Link href="/Login">Go to Login</Link>
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-4 text-center">
          <div className="h-[0.5px] bg-neutral-200 dark:bg-neutral-850" />
          <Link
            href="/Login"
            className="flex items-center gap-1.5 justify-center text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-450 dark:hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </Link>
        </div>
      </main>

      <footer
        className="absolute bottom-6 left-0 right-0 text-center text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-600"
      >
        &copy; {new Date().getFullYear()} ProdTrack. All rights reserved.
      </footer>
    </div>
  );
}
