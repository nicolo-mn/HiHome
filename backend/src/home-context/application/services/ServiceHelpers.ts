import {
  Component,
  ComponentUpdatePort,
  Home,
  HomeRepository,
} from "../../domain";

export async function ensureHomeExists(
  homeRepo: HomeRepository,
  homeId: string,
): Promise<Home> {
  const home = await homeRepo.getHome(homeId);
  if (!home) throw new Error(`Home ${homeId} not found`);
  return home;
}

export async function persistAndBroadcast(
  homeRepo: HomeRepository,
  home: Home,
  component: Component,
  componentUpdatePort?: ComponentUpdatePort,
): Promise<void> {
  await homeRepo.saveHome(home);
  componentUpdatePort?.sendComponentUpdate(home, component);
}
