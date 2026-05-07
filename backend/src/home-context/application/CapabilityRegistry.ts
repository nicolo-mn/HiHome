import { Component } from "../domain/Component";

export type Operator = "gt" | "lt" | "gte" | "lte" | "eq" | "is";

export type CommandParamSchema = {
  type: "number";
  unit?: string;
  min?: number;
  max?: number;
};

export type CapabilityCommandDescriptor = {
  commandId: string;
  label: string;
  params?: Record<string, CommandParamSchema>;
};

export type CapabilityDescriptor = {
  capabilityId: string;
  label: string;
  commands: CapabilityCommandDescriptor[];
};

export type ComponentDescriptor = {
  componentId: string;
  label: string;
  capabilities: CapabilityDescriptor[];
};

export type ObservableDescriptor = {
  observableId: string;
  capabilityId: string;
  label: string;
  unit?: string;
  operators: Operator[];
  enumValues?: string[];
};

export type CapabilityCatalog = {
  observables: ObservableDescriptor[];
  components: ComponentDescriptor[];
};

export type ActionCommand = {
  componentId: string;
  capabilityId: string;
  commandId: string;
  params?: Record<string, unknown>;
};

export type CommandHandler = (
  component: Component,
  params?: Record<string, unknown>,
) => void;

// define what each capability can do
export type CapabilityHandler = {
  capabilityId: string;
  label: string;
  supports: (component: Component) => boolean;
  commands: Record<
    string,
    {
      label: string;
      params?: Record<string, CommandParamSchema>;
      handler: CommandHandler;
    }
  >;
};

// registry that holds all capability handlers and provides methods to get capabilities for components and execute commands
export class CapabilityRegistry {
  constructor(private handlers: CapabilityHandler[]) {}

  getComponentCapabilities(component: Component): CapabilityDescriptor[] {
    return this.handlers
      .filter((handler) => handler.supports(component))
      .map((handler) => ({
        capabilityId: handler.capabilityId,
        label: handler.label,
        commands: Object.entries(handler.commands).map(
          ([commandId, command]) => ({
            commandId,
            label: command.label,
            params: command.params,
          }),
        ),
      }));
  }
}
