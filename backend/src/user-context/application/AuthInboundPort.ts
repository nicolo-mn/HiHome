// NOTE: Inbound ports should be void and cause a side effect
export interface AuthInboundPort {
  login(homeId: string, username: string, password: string): Promise<string>;
}
