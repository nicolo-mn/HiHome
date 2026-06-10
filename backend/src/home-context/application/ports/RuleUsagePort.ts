// Used to prevent deleting a device that is still referenced by automation rules.
export interface RuleUsagePort {
  getRuleNamesUsingDevice(homeId: string, deviceId: string): Promise<string[]>;
}
