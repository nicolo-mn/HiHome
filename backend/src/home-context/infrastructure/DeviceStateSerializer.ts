import {
  DeviceTypes,
  DeviceVisitor,
  Fan,
  Light,
  SmartLock,
  Thermostat,
  Window,
} from "../domain";
import { DeviceSerialization } from "../application/dtos/DeviceDTO";

export class DeviceStateSerializer implements DeviceVisitor<DeviceSerialization> {
  visitLight(light: Light): DeviceSerialization {
    return {
      id: light.id,
      name: light.name,
      roomId: light.roomId,
      type: DeviceTypes.LIGHT,
      isOn: light.isOn,
    };
  }

  visitWindow(window: Window): DeviceSerialization {
    return {
      id: window.id,
      name: window.name,
      roomId: window.roomId,
      type: DeviceTypes.WINDOW,
      isOpen: window.isOpen,
    };
  }

  visitThermostat(thermostat: Thermostat): DeviceSerialization {
    return {
      id: thermostat.id,
      name: thermostat.name,
      roomId: thermostat.roomId,
      type: DeviceTypes.THERMOSTAT,
      temperature: thermostat.temperature,
    };
  }

  visitLock(lock: SmartLock): DeviceSerialization {
    return {
      id: lock.id,
      name: lock.name,
      roomId: lock.roomId,
      type: DeviceTypes.LOCK,
      isLocked: lock.isLocked,
    };
  }

  visitFan(fan: Fan): DeviceSerialization {
    return {
      id: fan.id,
      name: fan.name,
      roomId: fan.roomId,
      type: DeviceTypes.FAN,
      mode: fan.mode,
    };
  }
}
