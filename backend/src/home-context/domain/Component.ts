import { ComponentVisitor } from "./ComponentVisitor";

export interface Component {
  id: string;
  name: string;
  roomId?: string;
  accept<T>(visitor: ComponentVisitor<T>): T;
}
