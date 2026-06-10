export interface HomeUser {
  username: string;
  role: string;
}

export interface HomeUsersPort {
  listUsersOfHome(homeId: string): Promise<HomeUser[]>;
}
