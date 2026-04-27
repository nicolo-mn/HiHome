import { AuthInboundPort } from "./application/ports/authInboundPort";
import { AuthFacade } from "./application/authFacade";
import { AuthService } from "./application/services/authService";
import { InMemoryUserRepository } from "./infrastructure/persistence/in-memory/inMemoryUserRepository";

export interface UserContext {
  authPort: AuthInboundPort;
  facade: AuthFacade;
}

export class UserContextFactory {
  static create(): UserContext {
    // TODO: decide which repository to use based on environment variable
    const repository = new InMemoryUserRepository();
    const service = new AuthService(repository);
    const facade = new AuthFacade(service);

    return {
      authPort: service,
      facade: facade,
    };
  }
}
