'use client';

import { useEffect, useRef } from 'react';

const LoadingCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 180;
    canvas.height = 180;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let time = 0;
    let lastTime = 0;
    const maxRadius = 80;
    const circleCount = 5;
    const dotCount = 24;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
      ctx.fill();

      for (let c = 0; c < circleCount; c++) {
        const circlePhase = (time * 0.3 + c / circleCount) % 1;
        const radius = circlePhase * maxRadius;
        const opacity = 1 - circlePhase;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          const size = 2 * (1 - circlePhase * 0.5);

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.1})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${opacity * 0.9})`;
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#12100f] z-50">
      <canvas ref={canvasRef} width={180} height={180} />
      <div className="mt-5 text-[#3b82f6] tracking-[2px] text-sm uppercase">
        INITIALIZING VOICE TWIN
      </div>
    </div>
  );
};

export default LoadingCanvas;
