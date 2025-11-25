import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { LipSync } from '../lib/LipSync'
import { AUDIO_CONFIG } from '../constants/audio'

export function useDistanceVolumeControl(
  lipSyncRef: React.RefObject<LipSync | null>,
  isPlaying: boolean,
  camera?: THREE.PerspectiveCamera,
  characterPosition?: THREE.Vector3
) {
  const animationFrameRef = useRef<number | null>(null)
  const lastDistanceRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)

  useEffect(() => {
    if (!isPlaying || !lipSyncRef.current || !camera || !characterPosition) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    // Optimized distance and spatial monitoring - only check every 3rd frame for performance
    const updateDistanceAndSpatial = () => {
      if (!isPlaying || !lipSyncRef.current || !camera || !characterPosition) {
        return
      }

      frameCountRef.current++

      // Only calculate distance and update spatial position every 3rd frame (20fps instead of 60fps)
      if (frameCountRef.current % 3 === 0) {
        // Calculate distance from head position (camera + forward offset) to character
        // Calculate distance from microphone position (camera + offset) to character
        const micOffset = new THREE.Vector3(
          AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.X,
          AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.Y,
          AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.Z
        )
        micOffset.applyQuaternion(camera.quaternion)

        const headPosition = camera.position.clone().add(micOffset)
        const distance = headPosition.distanceTo(characterPosition)

        // Only update volume if distance changed significantly (optimization)
        if (Math.abs(distance - lastDistanceRef.current) > 0.01) {
          lipSyncRef.current.setVolumeByDistance(distance)
          lastDistanceRef.current = distance
        }

        // Update 3D spatial position for panning
        lipSyncRef.current.updateSpatialPosition(camera, characterPosition)
      }

      animationFrameRef.current = requestAnimationFrame(updateDistanceAndSpatial)
    }

    updateDistanceAndSpatial()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [lipSyncRef, isPlaying, camera, characterPosition])
}