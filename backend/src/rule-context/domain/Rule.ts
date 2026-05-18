import { ObservableCondition } from "../domain/Observables";
import { ComponentAction } from "../domain/Actions";
// a rule that links triggers to actions
export type Rule = {
  id: string;
  homeId: string;
  name: string;
  order: number;
  condition: ObservableCondition;
  actions: ComponentAction[];
};
