export class AccountCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
  ) {}
}
