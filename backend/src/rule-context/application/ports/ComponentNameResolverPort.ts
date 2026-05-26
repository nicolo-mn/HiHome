export interface ComponentNameResolverPort {
  getComponentName(componentId: string): Promise<string>;
}
