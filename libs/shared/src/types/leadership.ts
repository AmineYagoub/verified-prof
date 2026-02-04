export interface EngineeringLeadershipScore {
  architecturalLayers: ArchitecturalLayer[];
  effortDistribution: EffortDistribution[];
}

export interface ArchitecturalLayer {
  layer: string;
  description: string;
  fileCount: number;
  stabilityRate: number;
  involvement: number;
}

export interface EffortDistribution {
  weekStart: string;
  categories: {
    features: number;
    fixes: number;
    refactors: number;
    tests: number;
    documentation: number;
    infrastructure: number;
    performance: number;
    security: number;
  };
}
