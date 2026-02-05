'use client';

import { useEffect, useRef } from 'react';

interface CircularVisualizerProps {
  audioAnalyser: AnalyserNode | null;
}

const CircularVisualizer = ({ audioAnalyser }: CircularVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 450;
    const height = 450;
    const centerX = width / 2;
    const centerY = height / 2;

    canvas.width = width;
    canvas.height = height;

    let frequencyData: Uint8Array | null = null;
    if (audioAnalyser) {
      frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
    }

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const rings = 3;
      const baseRadius = 60;

      if (audioAnalyser && frequencyData) {
        audioAnalyser.getByteFrequencyData(
          frequencyData as Uint8Array<ArrayBuffer>,
        );

        for (let ring = 0; ring < rings; ring++) {
          const points = 64;
          const freqStep = Math.floor(frequencyData.length / points);
          const offset = ring * Math.floor(frequencyData.length / 3);

          ctx.beginPath();

          for (let i = 0; i <= points; i++) {
            const index = (offset + i * freqStep) % frequencyData.length;
            const amplitude = frequencyData[index] / 255;
            const radius = baseRadius + ring * 40 + amplitude * 50;
            const angle = (i / points) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.closePath();

          const gradient = ctx.createLinearGradient(0, 0, width, height);
          const alpha = 0.3 + ring * 0.2;
          gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(30, 64, 175, ${alpha})`);
          gradient.addColorStop(1, `rgba(96, 165, 250, ${alpha})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else {
        for (let ring = 0; ring < 3; ring++) {
          const radius = baseRadius + ring * 40;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 + ring * 0.1})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [audioAnalyser]);

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
      <canvas ref={canvasRef} className="w-[450px] h-[450px]" />
    </div>
  );
};

export default CircularVisualizer;
