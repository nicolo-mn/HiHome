import { Component, Home } from ".";

export interface HomeRepository {
  getHome(id: string): Promise<Home | null>;
  getComponentById(id: string): Promise<Component | null>;
  saveHome(home: Home): Promise<void>;
}
