import bcrypt from "bcryptjs";
import { PasswordHasherPort } from "../../application/ports/PasswordHasherPort";

const SALT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasherPort {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  static hashSync(plain: string): string {
    return bcrypt.hashSync(plain, SALT_ROUNDS);
  }
}
