// NOTE: Inbound ports should be void and cause a side effect
export interface AuthInboundPort {
  login(houseId: string, username: string, password: string): Promise<string>;
}
