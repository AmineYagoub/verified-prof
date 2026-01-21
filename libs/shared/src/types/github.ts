export interface GithubPR {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  created_at: string;
  merged_at: string | null;
  closed_at: string | null;
  html_url: string;
  additions: number;
  deletions: number;
  changed_files: number;
  commits: number;
  user: {
    login: string;
  };
  base: {
    repo: {
      name: string;
      full_name: string;
      description: string | null;
      private: boolean;
    };
  };
  head: {
    ref: string;
    sha: string;
  };
  labels?: {
    name: string;
  }[];
  files?: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch: string;
  }[];
}

export interface GithubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
}

export interface GithubReview {
  id: number;
  user: {
    login: string;
  };
  state: string;
  submitted_at: string;
  body: string | null;
  pull_request_url: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
}

export interface GithubActivity {
  prs: GithubPR[];
  commits: GithubCommit[];
  reviews: GithubReview[];
  repos: GithubRepo[];
  username: string;
  dateRange: {
    first: Date;
    last: Date;
  };
}

export interface ActivitySummary {
  fileExtensions: Record<string, number>;
  directoryPatterns: Record<string, number>;
  packageDependencies: string[];
  prTitles: string[];
  totalPRs: number;
  totalCommits: number;
  dateRange: { first: Date; last: Date };
}
