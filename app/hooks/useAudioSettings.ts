import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocalStorageSettings } from './useLocalStorage'
import { AudioFile } from '../types/audio'

const AUDIO_STORAGE_KEY = 'vrm-asmr-audio'

interface AudioSettings {
  spatialAudio: boolean
  volume: number
  audioFiles: AudioFile[]
  selectedAudioId: string | null
}

const defaultAudioSettings: AudioSettings = {
  spatialAudio: true,
  volume: 0.5,
  audioFiles: [],
  selectedAudioId: null
}

/**
 * 音声関連の設定を管理するフック
 */
export const useAudioSettings = () => {
  const [settings, updateSettings] = useLocalStorageSettings(AUDIO_STORAGE_KEY, defaultAudioSettings)
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Clear audio files on mount (blob URLs become invalid after page reload)
  useEffect(() => {
    if (settings.audioFiles.length > 0) {
      updateSettings({ audioFiles: [], selectedAudioId: null })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const changeSpatialAudio = useCallback((spatialAudio: boolean) => {
    updateSettings({ spatialAudio })
  }, [updateSettings])

  const changeVolume = useCallback((volume: number) => {
    updateSettings({ volume })
  }, [updateSettings])

  const changeAudioFiles = useCallback((audioFiles: AudioFile[]) => {
    updateSettings({ audioFiles })
  }, [updateSettings])

  const changeSelectedAudio = useCallback((selectedAudioId: string | null) => {
    updateSettings({ selectedAudioId })
  }, [updateSettings])

  const playAudio = useCallback((audioFile: AudioFile) => {
    // If clicking the same audio that's playing, stop it
    if (currentPlayingAudio === audioFile.id) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
      setCurrentPlayingAudio(null)
      return
    }

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    // Start new audio
    setCurrentPlayingAudio(audioFile.id)

    const audio = new Audio(audioFile.url)
    audioRef.current = audio

    audio.addEventListener('ended', () => {
      setCurrentPlayingAudio(null)
      audioRef.current = null
    })
    audio.addEventListener('error', () => {
      setCurrentPlayingAudio(null)
      audioRef.current = null
      alert('音声ファイルの再生に失敗しました')
    })

    audio.play().catch(() => {
      setCurrentPlayingAudio(null)
      audioRef.current = null
      alert('音声ファイルの再生に失敗しました')
    })
  }, [currentPlayingAudio])

  return {
    spatialAudio: settings.spatialAudio,
    volume: settings.volume,
    audioFiles: settings.audioFiles,
    selectedAudioId: settings.selectedAudioId,
    currentPlayingAudio,
    changeSpatialAudio,
    changeVolume,
    changeAudioFiles,
    changeSelectedAudio,
    playAudio
  }
}