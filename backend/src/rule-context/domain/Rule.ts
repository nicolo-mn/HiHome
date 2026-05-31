import { ObservableCondition } from "../domain/Observables";
import { DeviceAction } from "../domain/Actions";
import { TimeWindow } from "../domain/TimeWindow";
// a rule that links triggers to actions
export type Rule = {
  id: string;
  homeId: string;
  name: string;
  order: number;
  condition: ObservableCondition;
  actions: DeviceAction[];
  timeWindow?: TimeWindow;
};
