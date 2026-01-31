export class JobProgressEvent {
  constructor(
    public readonly userId: string,
    public readonly progress: number,
    public readonly processedCommits: number,
    public readonly totalCommits: number,
  ) {}
}
