export class VRMLookAtSmootherLoaderPlugin {
  // The parser is stored for potential future use
  private parser: any;

  constructor(parser: any) {
    this.parser = parser;
    // No additional initialization needed for now
  }

  get name(): string {
    return 'VRMLookAtSmootherLoaderPlugin';
  }

  // Required method for GLTFLoaderPlugin compatibility
  async afterRoot(gltf: any): Promise<void> {
    // Placeholder method – the real plugin would implement look‑at smoothing logic.
    // Keeping it empty ensures the import works without affecting current functionality.
    return Promise.resolve();
  }
}
