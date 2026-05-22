import { AuthInboundPort } from "./application/AuthInboundPort";
import { AuthFacade } from "./application/AuthFacade";
import { AuthService } from "./application/AuthService";
import { PreferencesRepository } from "./domain/PreferencesRepository";
import { InMemoryUserRepository } from "./infrastructure/InMemoryUserRepository";
import { MongoUserRepository } from "./infrastructure/MongoUserRepository";

export interface UserContext {
  authPort: AuthInboundPort;
  facade: AuthFacade;
  preferencesRepository: PreferencesRepository;
}

export class UserContextFactory {
  static create(): UserContext {
    const repository =
      process.env.NODE_ENV === "test"
        ? new InMemoryUserRepository()
        : new MongoUserRepository();
    const service = new AuthService(repository);
    const facade = new AuthFacade(service);

    return {
      authPort: service,
      facade: facade,
      preferencesRepository: repository,
    };
  }
}
