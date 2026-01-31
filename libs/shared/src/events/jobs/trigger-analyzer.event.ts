export class AnalysisTriggeredEvent {
  constructor(
    public readonly plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE',
    public readonly userId: string,
  ) {}
}
