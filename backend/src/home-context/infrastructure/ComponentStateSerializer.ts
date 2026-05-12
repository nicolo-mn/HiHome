import {
  ComponentTypes,
  ComponentVisitor,
  Light,
  Thermostat,
  Window,
} from "../domain";
import { ComponentSerialization } from "../application/dtos/ComponentDTO";

export class ComponentStateSerializer implements ComponentVisitor<ComponentSerialization> {
  visitLight(light: Light): ComponentSerialization {
    return {
      id: light.id,
      name: light.name,
      roomId: light.roomId,
      type: ComponentTypes.LIGHT,
      isOn: light.isOn,
    };
  }

  visitWindow(window: Window): ComponentSerialization {
    return {
      id: window.id,
      name: window.name,
      roomId: window.roomId,
      type: ComponentTypes.WINDOW,
      isOpen: window.isOpen,
    };
  }

  visitThermostat(thermostat: Thermostat): ComponentSerialization {
    return {
      id: thermostat.id,
      name: thermostat.name,
      roomId: thermostat.roomId,
      type: ComponentTypes.THERMOSTAT,
      temperature: thermostat.temperature,
    };
  }
}
