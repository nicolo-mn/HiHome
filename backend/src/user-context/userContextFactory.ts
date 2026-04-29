import { AuthInboundPort } from "./application/authInboundPort";
import { AuthFacade } from "./application/authFacade";
import { AuthService } from "./application/authService";
import { InMemoryUserRepository } from "./infrastructure/inMemoryUserRepository";

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
