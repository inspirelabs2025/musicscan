// GrowthBook stub - install @growthbook/growthbook-react for full functionality
class GrowthBookStub {
  ready = false;
  setAttributes(_attrs: Record<string, any>) {}
  getFeatureValue(_key: string, fallback: any) { return fallback; }
  loadFeatures() { return Promise.resolve(); }
}

export const GrowthBook = GrowthBookStub;
export const growthbook = new GrowthBookStub();
