export interface User {
  readonly id: string;
  readonly username: string;
  readonly houseId: string;
  password: string;
}

export class StandardUser implements User {
  constructor(
    public readonly id: string,
    public readonly houseId: string,
    public readonly username: string,
    public password: string,
  ) {}
}

export class Admin implements User {
  constructor(
    public readonly id: string,
    public readonly houseId: string,
    public readonly username: string,
    public password: string,
  ) {}
}
