export interface User {
  readonly id: string;
  readonly username: string;
  readonly houseId: string;
  password: string;
  readonly role: string;
}

export class StandardUser implements User {
  public readonly role = "StandardUser";
  constructor(
    public readonly id: string,
    public readonly houseId: string,
    public readonly username: string,
    public password: string,
  ) {}
}

export class Admin implements User {
  public readonly role = "Admin";
  constructor(
    public readonly id: string,
    public readonly houseId: string,
    public readonly username: string,
    public password: string,
  ) {}
}
