import { Component } from "./Component";
import { Home } from "./Home";

// Broadcasts component state changes to connected clients.
export interface ComponentUpdatePort {
  sendComponentUpdate(home: Home, component: Component): void;
}
