import { Injectable } from '@nestjs/common';

export interface RepositoryInfo {
  fullName: string;
  language: string | null;
  pushedAt: Date | null;
  stars: number;
  forks: number;
  openIssues: number;
}

export interface AllocationResult {
  allocations: Record<string, number>;
  totalAllocated: number;
  metrics: {
    totalRepos: number;
    reposWithAllocation: number;
    avgCommitsPerRepo: number;
  };
}

@Injectable()
export class RepoAllocatorService {
  /**
   * Computes smart allocation of commit analysis across repositories.
   * Prioritizes active repos (recent pushes) and popular repos (stars/forks).
   * Distributes maxCommits fairly using weighted scoring.
   */
  computeRepoAllocations(
    repos: RepositoryInfo[],
    maxCommits: number,
  ): AllocationResult {
    if (repos.length === 0) {
      return {
        allocations: {},
        totalAllocated: 0,
        metrics: {
          totalRepos: 0,
          reposWithAllocation: 0,
          avgCommitsPerRepo: 0,
        },
      };
    }

    const scores = repos.map((repo) => this.calculateRepoScore(repo));
    const totalScore = scores.reduce((sum, s) => sum + s, 0);

    const baseAlloc = scores.map((score) => {
      if (totalScore === 0) return Math.floor(maxCommits / repos.length);
      return Math.floor((score / totalScore) * maxCommits);
    });

    const fractional = scores
      .map((score, idx) => ({
        idx,
        frac: totalScore > 0 ? ((score / totalScore) * maxCommits) % 1 : 0,
      }))
      .sort((a, b) => b.frac - a.frac);

    const totalBase = baseAlloc.reduce((sum, b) => sum + b, 0);
    let remaining = maxCommits - totalBase;

    let i = 0;
    while (remaining > 0 && i < fractional.length) {
      const idx = fractional[i].idx;
      baseAlloc[idx] += 1;
      remaining -= 1;
      i += 1;
      if (i === fractional.length && remaining > 0) i = 0;
    }

    const result: Record<string, number> = {};
    for (let j = 0; j < repos.length; j++) {
      result[repos[j].fullName] = baseAlloc[j];
    }

    const totalAllocated = Object.values(result).reduce(
      (sum, val) => sum + val,
      0,
    );
    const reposWithAllocation = Object.values(result).filter(
      (val) => val > 0,
    ).length;

    return {
      allocations: result,
      totalAllocated,
      metrics: {
        totalRepos: repos.length,
        reposWithAllocation,
        avgCommitsPerRepo:
          reposWithAllocation > 0 ? totalAllocated / reposWithAllocation : 0,
      },
    };
  }

  /**
   * Calculates priority score for a repository.
   * Combines recency (pushedAt) and popularity (stars/forks).
   */
  private calculateRepoScore(repo: RepositoryInfo): number {
    let score = 0;

    if (repo.pushedAt) {
      const daysSincePush = Math.floor(
        (Date.now() - new Date(repo.pushedAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      score += Math.max(0, 100 - daysSincePush);
    }

    score += Math.min(50, repo.stars);

    score += Math.min(25, repo.forks);

    score += Math.min(10, repo.openIssues / 10);

    return Math.max(1, score);
  }

  /**
   * Filters repositories by activity window.
   * Only includes repos with recent activity.
   */
  filterActiveRepos(
    repos: RepositoryInfo[],
    windowDays: number,
  ): RepositoryInfo[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - windowDays);

    return repos.filter((repo) => {
      if (!repo.pushedAt) return false;
      return new Date(repo.pushedAt) >= cutoffDate;
    });
  }
}
