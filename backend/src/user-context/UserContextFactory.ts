import { AuthInboundPort } from "./application/AuthInboundPort";
import { AuthFacade } from "./application/AuthFacade";
import { AuthService } from "./application/AuthService";
import { InMemoryUserRepository } from "./infrastructure/InMemoryUserRepository";

export interface UserContext {
  authPort: AuthInboundPort;
  facade: AuthFacade;
}

export class UserContextFactory {
  static create(): UserContext {
    // TODO: implement MongoDB
    const repository = new InMemoryUserRepository();
    const service = new AuthService(repository);
    const facade = new AuthFacade(service);

    return {
      authPort: service,
      facade: facade,
    };
  }
}
