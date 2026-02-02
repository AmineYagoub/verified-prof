'use client';

import {
  SiTypescript,
  SiPython,
  SiGo,
  SiRust,
} from '@icons-pack/react-simple-icons';
import Image from 'next/image';

interface SpecializationBadgeProps {
  specialization: string;
  velocityPercentile: number;
  className?: string;
}

const getTechIcon = (spec: string) => {
  const lower = spec.toLowerCase();
  if (lower.includes('typescript'))
    return <SiTypescript className="w-5 h-5" style={{ color: '#3178C6' }} />;
  if (lower.includes('python'))
    return <SiPython className="w-5 h-5" style={{ color: '#3776AB' }} />;
  if (lower.includes('go'))
    return <SiGo className="w-5 h-5" style={{ color: '#00ADD8' }} />;
  if (lower.includes('rust'))
    return <SiRust className="w-5 h-5" style={{ color: '#CE422B' }} />;
  return null;
};

export const SpecializationBadge = ({
  specialization,
  velocityPercentile,
  className = '',
}: SpecializationBadgeProps) => {
  const icon = getTechIcon(specialization);

  return (
    <div
      className={`stat bg-base-200 flex flex-col glass justify-center items-center ${className} h-48 gap-2`}
    >
      <h2 className="card-title text-2xl">{specialization}</h2>
      <div className="flex justify-center items-center gap-2">
        <Image
          src="/icons/s-tier-badge.png"
          alt="S-Tier Badge"
          width={64}
          height={64}
          className="w-16 h-16"
        />
        <h3 className="text-7xl text-green-600 font-bold ">
          {Number(velocityPercentile.toFixed(0))}%
        </h3>
      </div>
      <p className="text-sm text-base-content/60 mt-2 flex items-center gap-1">
        Ranking among top peers {icon && <span className="ml-2">{icon}</span>}
      </p>
    </div>
  );
};
