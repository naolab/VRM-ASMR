import { useState, useCallback, useRef } from 'react'
import { AudioFile } from '../types/audio'

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
  const [settings, setSettings] = useState<AudioSettings>(defaultAudioSettings)
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const changeSpatialAudio = useCallback((spatialAudio: boolean) => {
    setSettings(prev => ({ ...prev, spatialAudio }))
  }, [])

  const changeVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, volume }))
  }, [])

  const changeAudioFiles = useCallback((audioFiles: AudioFile[]) => {
    setSettings(prev => ({ ...prev, audioFiles }))
  }, [])

  const changeSelectedAudio = useCallback((selectedAudioId: string | null) => {
    setSettings(prev => ({ ...prev, selectedAudioId }))
  }, [])

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