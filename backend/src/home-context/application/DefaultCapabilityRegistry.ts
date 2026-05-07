import { Light } from "../domain/Light";
import { CapabilityHandler, CapabilityRegistry } from "./CapabilityRegistry";

const switchableHandler: CapabilityHandler = {
  capabilityId: "switchable",
  label: "Power",
  supports: (component) => component instanceof Light,
  commands: {
    turnOn: {
      label: "Turn On",
      handler: (component) => (component as Light).turnOn(),
    },
    turnOff: {
      label: "Turn Off",
      handler: (component) => (component as Light).turnOff(),
    },
  },
};

// registry factory to create a registry with all capabilities
export function createDefaultCapabilityRegistry(): CapabilityRegistry {
  return new CapabilityRegistry([switchableHandler]);
}
