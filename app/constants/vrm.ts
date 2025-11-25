// VRM viewer configuration constants
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const VRM_CONFIG = {
  CAMERA: {
    FOV: 30.0,
    NEAR: 0.1,
    FAR: 20.0,
    POSITION: {
      X: 0.0,
      Y: 1.3,
      Z: 1.4
    }
  },
  LIGHTING: {
    DIRECTIONAL: {
      INTENSITY: Math.PI * 0.8,
      POSITION: { X: 1.0, Y: 1.0, Z: 1.0 }
    },
    AMBIENT: {
      INTENSITY: Math.PI * 0.2
    }
  },
  DEFAULT_MODEL_PATH: `${basePath}/models/Noa.vrm`,
  MOUTH_EXPRESSION_CANDIDATES: ['aa', 'A', 'a', 'mouth_a', 'mouth_aa', 'Aa', 'oh', 'O', 'o']
} as const