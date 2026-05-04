import { AuthService } from "./AuthService";

export class AuthFacade {
  constructor(private readonly authService: AuthService) {}
}
