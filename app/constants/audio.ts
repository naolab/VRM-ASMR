export const AUDIO_CONFIG = {
  LIP_SYNC: {
    FFT_SIZE: 2048,
    SIGMOID: {
      MULTIPLIER: -35,
      OFFSET: 3.5,
      THRESHOLD: 0.02
    }
  },
  DISTANCE: {
    MAX_DISTANCE: 5,
    MIN_VOLUME: 0.05,
    MAX_VOLUME: 1.0,
    SMOOTHING_DURATION: 0.1,
    ATTENUATION_CURVE: 3  // Higher = faster decay (was 2 for square law)
  },
  SPATIAL: {
    ENABLED: true,      // Enable spatial audio by default
    PANNING_MODEL: 'HRTF' as const, // HRTF for realistic 3D audio
    DISTANCE_MODEL: 'exponential' as const, // Matches our volume control
    REF_DISTANCE: 1,    // Reference distance for sound attenuation
    MAX_DISTANCE: 10,   // Maximum distance for spatial audio
    ROLLOFF_FACTOR: 2,  // How quickly volume decreases with distance
    CONE_INNER_ANGLE: 360, // Inner cone angle (omnidirectional)
    CONE_OUTER_ANGLE: 360, // Outer cone angle (omnidirectional)
    CONE_OUTER_GAIN: 0,    // Volume outside cone
    POSITION_SMOOTHING: 0.1, // Smoothing for position updates
    MICROPHONE_POSITION: { X: 0, Y: -0.125, Z: -0.4 } // Microphone position relative to camera
  }
} as const
