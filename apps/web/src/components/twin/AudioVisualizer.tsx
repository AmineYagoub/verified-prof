import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
}

const AudioVisualizer = ({ isActive }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 40;
    const barWidth = canvas.width / bars;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bars; i++) {
        const height = Math.random() * canvas.height * (isActive ? 0.8 : 0.2);
        const x = i * barWidth;
        const y = (canvas.height - height) / 2;

        ctx.fillStyle = isActive ? `hsl(${210 + i * 3}, 70%, 50%)` : '#e5e7eb';
        ctx.fillRect(x, y, barWidth - 2, height);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={100}
        className="w-full h-24"
      />
    </div>
  );
};

export default AudioVisualizer;
