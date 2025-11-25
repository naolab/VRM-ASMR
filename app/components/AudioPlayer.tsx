'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { LipSync } from '../lib/LipSync'
import { UI_STYLES } from '../constants/ui'
import { useDistanceVolumeControl } from '../hooks/useDistanceVolumeControl'
import { AudioSelector } from './ui/AudioSelector'
import { AudioFile } from '../types/audio'

interface AudioPlayerProps {
  onVolumeChange?: (volume: number) => void
  camera?: THREE.PerspectiveCamera
  characterPosition?: THREE.Vector3
  spatialAudio?: boolean
  masterVolume?: number
  audioFiles?: AudioFile[]
  selectedAudioId?: string | null
  onAudioSelect?: (audioId: string | null) => void
}

export const AudioPlayer = React.memo<AudioPlayerProps>(({
  onVolumeChange,
  camera,
  characterPosition,
  spatialAudio = true,
  masterVolume = 0.5,
  audioFiles = [],
  selectedAudioId,
  onAudioSelect
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const lipSyncRef = useRef<LipSync | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)

  // Use optimized distance-based volume control
  useDistanceVolumeControl(lipSyncRef, isPlaying, camera, characterPosition)

  // Update spatial audio setting when it changes
  useEffect(() => {
    if (lipSyncRef.current) {
      lipSyncRef.current.setSpatialEnabled(spatialAudio)
    }
  }, [spatialAudio])

  // Update master volume when it changes
  useEffect(() => {
    if (lipSyncRef.current) {
      lipSyncRef.current.setMasterVolume(masterVolume)
    }
  }, [masterVolume])

  const play = useCallback(async () => {
    try {
      if (!lipSyncRef.current) {
        lipSyncRef.current = new LipSync()
      }

      // Set spatial audio state and master volume
      lipSyncRef.current.setSpatialEnabled(spatialAudio)
      lipSyncRef.current.setMasterVolume(masterVolume)

      // Determine which audio to play
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      let audioUrl = `${basePath}/audio/test.mp3` // Default audio
      if (selectedAudioId) {
        const selectedAudio = audioFiles.find(audio => audio.id === selectedAudioId)
        if (selectedAudio) {
          audioUrl = selectedAudio.url
        }
      }

      const source = await lipSyncRef.current.startAnalysis(audioUrl)
      if (!source) return

      sourceRef.current = source
      source.start()
      setIsPlaying(true)

      // Volume monitoring loop
      const updateVolume = () => {
        if (lipSyncRef.current && sourceRef.current) {
          const volume = lipSyncRef.current.getVolume()
          onVolumeChange?.(volume)
          animationRef.current = requestAnimationFrame(updateVolume)
        }
      }
      updateVolume()

      source.onended = () => {
        setIsPlaying(false)
        sourceRef.current = null
        onVolumeChange?.(0)
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
      }
    } catch (error) {
      setIsPlaying(false)
    }
  }, [spatialAudio, masterVolume, onVolumeChange, selectedAudioId, audioFiles])

  const stop = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop()
    }
    setIsPlaying(false)
    onVolumeChange?.(0)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [onVolumeChange])

  return (
    <div style={{
      ...UI_STYLES.POSITION.AUDIO_PLAYER,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      {/* Audio selector dropdown */}
      <AudioSelector
        audioFiles={audioFiles}
        selectedAudioId={selectedAudioId}
        onAudioSelect={onAudioSelect || (() => {})}
        disabled={isPlaying}
      />

      {/* Play/pause button */}
      <button
        onClick={isPlaying ? stop : play}
        style={{
          ...UI_STYLES.BUTTON.BASE,
          ...UI_STYLES.BUTTON.AUDIO_PLAYER,
          position: 'static' // Override absolute positioning
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  )
})