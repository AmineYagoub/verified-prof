export interface TagDetail {
  name: string;
  start?: number;
  end?: number;
}

export interface TagSummary {
  filePath: string;
  imports: string[];
  functions: TagDetail[];
  classes: TagDetail[];
  todoCount: number;
  complexity: number;
  contentHash: string;
  sizeBytes: number;
  metadata: {
    decorators: string[];
    language: string;
    isSierCandidate: boolean;
  };
}
