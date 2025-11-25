import { AUDIO_CONFIG } from '../constants/audio'
import { LIP_SYNC_CONFIG } from '../constants/lipSync'
import * as THREE from 'three'

export class LipSync {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Float32Array | null = null
  private gainNode: GainNode | null = null
  private pannerNode: PannerNode | null = null
  private spatialEnabled: boolean = AUDIO_CONFIG.SPATIAL.ENABLED
  private masterVolume: number = LIP_SYNC_CONFIG.DEFAULT_MASTER_VOLUME

  public async startAnalysis(audioUrl: string): Promise<AudioBufferSourceNode | null> {
    try {
      this.audioContext = new AudioContext()

      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = AUDIO_CONFIG.LIP_SYNC.FFT_SIZE
      this.dataArray = new Float32Array(this.analyser.fftSize)

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = this.masterVolume

      // Create panner node for 3D spatial audio
      this.pannerNode = this.audioContext.createPanner()
      this.pannerNode.panningModel = AUDIO_CONFIG.SPATIAL.PANNING_MODEL
      this.pannerNode.distanceModel = AUDIO_CONFIG.SPATIAL.DISTANCE_MODEL
      this.pannerNode.refDistance = AUDIO_CONFIG.SPATIAL.REF_DISTANCE
      this.pannerNode.maxDistance = AUDIO_CONFIG.SPATIAL.MAX_DISTANCE
      this.pannerNode.rolloffFactor = AUDIO_CONFIG.SPATIAL.ROLLOFF_FACTOR
      this.pannerNode.coneInnerAngle = AUDIO_CONFIG.SPATIAL.CONE_INNER_ANGLE
      this.pannerNode.coneOuterAngle = AUDIO_CONFIG.SPATIAL.CONE_OUTER_ANGLE
      this.pannerNode.coneOuterGain = AUDIO_CONFIG.SPATIAL.CONE_OUTER_GAIN


      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer

      // Connect: source -> gainNode -> pannerNode -> destination
      // Also connect source -> analyser for volume analysis
      source.connect(this.gainNode)

      if (this.spatialEnabled && this.pannerNode) {
        this.gainNode.connect(this.pannerNode)
        this.pannerNode.connect(this.audioContext.destination)
      } else {
        this.gainNode.connect(this.audioContext.destination)
      }

      source.connect(this.analyser)

      return source
    } catch (error) {
      console.error('Audio analysis failed:', error)
      return null
    }
  }

  public getVolume(): number {
    if (!this.analyser || !this.dataArray) return 0

    // @ts-ignore
    this.analyser.getFloatTimeDomainData(this.dataArray)

    let volume = 0.0
    for (let i = 0; i < this.dataArray.length; i++) {
      volume = Math.max(volume, Math.abs(this.dataArray[i]))
    }

    // ChatVRM's sigmoid function
    volume = 1 / (1 + Math.exp(AUDIO_CONFIG.LIP_SYNC.SIGMOID.MULTIPLIER * volume + AUDIO_CONFIG.LIP_SYNC.SIGMOID.OFFSET))
    if (volume < AUDIO_CONFIG.LIP_SYNC.SIGMOID.THRESHOLD) volume = 0

    return volume
  }

  public setVolumeByDistance(distance: number): void {
    if (!this.gainNode || !this.audioContext) return

    // Distance-based volume calculation
    // Closer = louder, farther = quieter
    const { MAX_DISTANCE, MIN_VOLUME, MAX_VOLUME, SMOOTHING_DURATION, ATTENUATION_CURVE } = AUDIO_CONFIG.DISTANCE

    // Enhanced attenuation: steep near-field decay, gentle far-field decay
    const normalizedDistance = Math.min(distance / MAX_DISTANCE, 1)

    // Use exponential decay for steep near-field and gentle far-field response
    // exp(-k*x) where k controls steepness
    const decayFactor = 4 // Higher = steeper near-field decay
    const exponentialDecay = Math.exp(-decayFactor * normalizedDistance)
    const baseVolume = Math.max(MIN_VOLUME, MIN_VOLUME + (MAX_VOLUME - MIN_VOLUME) * exponentialDecay)

    // Apply master volume
    const volume = baseVolume * this.masterVolume

    // Smooth volume transition
    const currentTime = this.audioContext.currentTime
    this.gainNode.gain.cancelScheduledValues(currentTime)
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime)
    this.gainNode.gain.linearRampToValueAtTime(volume, currentTime + SMOOTHING_DURATION)
  }

  public updateSpatialPosition(
    camera: THREE.PerspectiveCamera,
    characterPosition: THREE.Vector3
  ): void {
    if (!this.pannerNode || !this.audioContext || !this.spatialEnabled) return

    const listener = this.audioContext.listener

    // Update listener position (head position - camera position + forward offset)
    // Update listener position (microphone position)
    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyQuaternion(camera.quaternion)
    forward.normalize()

    const micOffset = new THREE.Vector3(
      AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.X,
      AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.Y,
      AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.Z
    )
    micOffset.applyQuaternion(camera.quaternion)

    const listenerPos = camera.position.clone().add(micOffset)
    if (listener.positionX) {
      // Use new API if available
      const currentTime = this.audioContext.currentTime
      const smoothingTime = currentTime + AUDIO_CONFIG.SPATIAL.POSITION_SMOOTHING

      listener.positionX.linearRampToValueAtTime(listenerPos.x, smoothingTime)
      listener.positionY.linearRampToValueAtTime(listenerPos.y, smoothingTime)
      listener.positionZ.linearRampToValueAtTime(listenerPos.z, smoothingTime)

      // Update listener orientation (where the camera is looking)
      // Reuse the forward vector already calculated above
      const up = new THREE.Vector3(0, 1, 0)
      up.applyQuaternion(camera.quaternion)

      listener.forwardX.linearRampToValueAtTime(forward.x, smoothingTime)
      listener.forwardY.linearRampToValueAtTime(forward.y, smoothingTime)
      listener.forwardZ.linearRampToValueAtTime(forward.z, smoothingTime)
      listener.upX.linearRampToValueAtTime(up.x, smoothingTime)
      listener.upY.linearRampToValueAtTime(up.y, smoothingTime)
      listener.upZ.linearRampToValueAtTime(up.z, smoothingTime)
    } else {
      // Fallback for older browsers
      listener.setPosition(listenerPos.x, listenerPos.y, listenerPos.z)

      // Reuse the forward vector and create up vector for fallback
      const up = new THREE.Vector3(0, 1, 0)
      up.applyQuaternion(camera.quaternion)

      listener.setOrientation(
        forward.x, forward.y, forward.z,
        up.x, up.y, up.z
      )
    }

    // Update sound source position (character position)
    if (this.pannerNode.positionX) {
      // Use new API if available
      const currentTime = this.audioContext.currentTime
      const smoothingTime = currentTime + AUDIO_CONFIG.SPATIAL.POSITION_SMOOTHING

      this.pannerNode.positionX.linearRampToValueAtTime(characterPosition.x, smoothingTime)
      this.pannerNode.positionY.linearRampToValueAtTime(characterPosition.y, smoothingTime)
      this.pannerNode.positionZ.linearRampToValueAtTime(characterPosition.z, smoothingTime)
    } else {
      // Fallback for older browsers
      this.pannerNode.setPosition(
        characterPosition.x,
        characterPosition.y,
        characterPosition.z
      )
    }
  }

  public setSpatialEnabled(enabled: boolean): void {
    this.spatialEnabled = enabled

    // Reconnect audio nodes based on spatial audio setting
    if (this.gainNode && this.pannerNode && this.audioContext) {
      this.gainNode.disconnect()

      if (enabled) {
        this.gainNode.connect(this.pannerNode)
        this.pannerNode.connect(this.audioContext.destination)
      } else {
        this.gainNode.connect(this.audioContext.destination)
      }
    }
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))

    // If spatial audio is not enabled, update volume directly
    if (!this.spatialEnabled && this.gainNode && this.audioContext) {
      const currentTime = this.audioContext.currentTime
      this.gainNode.gain.cancelScheduledValues(currentTime)
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime)
      this.gainNode.gain.linearRampToValueAtTime(this.masterVolume, currentTime + LIP_SYNC_CONFIG.VOLUME_TRANSITION_TIME)
    }
    // If spatial audio is enabled, the volume will be updated through setVolumeByDistance
  }
}