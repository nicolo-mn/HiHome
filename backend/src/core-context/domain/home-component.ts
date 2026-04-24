export interface LightStatus {
  on: boolean;
}

export interface WindowStatus {
  openDegree: number;
}

export interface ClimatizationStatus {
  mode: "cool" | "heat" | "off";
  targetTemp: number;
}

export type ComponentStatus = LightStatus | WindowStatus | ClimatizationStatus;

export type ComponentType = "light" | "window" | "climatization";

export class HomeComponent {
  constructor(
    public readonly id: string,
    public readonly homeId: string,
    public readonly name: string,
    public readonly type: ComponentType,
    public status: ComponentStatus,
  ) {}

  updateStatus(newStatus: ComponentStatus): void {
    this.status = newStatus;
  }
}
