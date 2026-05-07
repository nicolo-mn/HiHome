// TODO: valuta uso di ACL o shared kernel
import { CapabilityCatalog } from "../../home-context/application/CapabilityRegistry";

export interface HomeServicePort {
  getCapabilityCatalog(homeId: string): Promise<CapabilityCatalog>;
}
