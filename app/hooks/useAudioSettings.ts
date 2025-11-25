import { useState, useCallback, useEffect } from 'react'
import { useLocalStorageSettings } from './useLocalStorage'
import { AudioFile } from '../types/audio'

const AUDIO_STORAGE_KEY = 'vrm-soundscape-audio'

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
    // Stop current audio if playing
    if (currentPlayingAudio) {
      setCurrentPlayingAudio(null)
    }

    // If clicking the same audio that's playing, just stop it
    if (currentPlayingAudio === audioFile.id) {
      return
    }

    // Start new audio
    setCurrentPlayingAudio(audioFile.id)

    const audio = new Audio(audioFile.url)
    audio.addEventListener('ended', () => {
      setCurrentPlayingAudio(null)
    })
    audio.addEventListener('error', () => {
      setCurrentPlayingAudio(null)
      alert('音声ファイルの再生に失敗しました')
    })

    audio.play().catch(() => {
      setCurrentPlayingAudio(null)
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