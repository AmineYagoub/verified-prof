'use client';

import { useEffect, useRef } from 'react';

interface SpectrumAnalyzerProps {
  audioAnalyser: AnalyserNode | null;
}

const SpectrumAnalyzer = ({ audioAnalyser }: SpectrumAnalyzerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let frequencyData: Uint8Array | null = null;
    if (audioAnalyser) {
      frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
    }

    let animationId: number;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (audioAnalyser && frequencyData) {
        audioAnalyser.getByteFrequencyData(
          frequencyData as Uint8Array<ArrayBuffer>,
        );

        const barWidth = width / 256;
        let x = 0;

        for (let i = 0; i < 256; i++) {
          const barHeight = (frequencyData[i] / 255) * height * 0.1;
          const hue = 140 + (i / 256) * 30;
          ctx.fillStyle = `hsla(${hue}, 70%, 45%, 0.3)`;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }

        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const y = height * (i / 4);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        for (let i = 0; i < 9; i++) {
          const gridX = width * (i / 8);
          ctx.beginPath();
          ctx.moveTo(gridX, 0);
          ctx.lineTo(gridX, height);
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [audioAnalyser]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default SpectrumAnalyzer;
