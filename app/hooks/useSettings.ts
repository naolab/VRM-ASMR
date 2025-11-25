import { useState, useCallback, useEffect } from 'react'
import { Theme, ThemeOption } from '../types/settings'
import { AudioFile } from '../types/audio'

const STORAGE_KEY = 'vrm-asmr-settings'

const loadSettings = (): { theme: Theme; followCamera: boolean; spatialAudio: boolean; volume: number; customVRMUrl?: string; audioFiles?: AudioFile[]; selectedAudioId?: string | null } => {
  if (typeof window === 'undefined') return { theme: 'blue', followCamera: false, spatialAudio: true, volume: 0.5, audioFiles: [], selectedAudioId: null }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        theme: parsed.theme || 'blue',
        followCamera: parsed.followCamera || false,
        spatialAudio: parsed.spatialAudio !== undefined ? parsed.spatialAudio : true,
        volume: parsed.volume !== undefined ? parsed.volume : 0.5,
        customVRMUrl: parsed.customVRMUrl,
        audioFiles: parsed.audioFiles || [],
        selectedAudioId: parsed.selectedAudioId || null
      }
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error)
  }

  return { theme: 'blue', followCamera: false, spatialAudio: true, volume: 0.5, audioFiles: [], selectedAudioId: null }
}

const saveSettings = (theme: Theme, followCamera: boolean, spatialAudio: boolean, volume: number, customVRMUrl?: string, audioFiles?: AudioFile[], selectedAudioId?: string | null): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, followCamera, spatialAudio, volume, customVRMUrl, audioFiles, selectedAudioId }))
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error)
  }
}

export const useSettings = () => {
  const [showSettings, setShowSettings] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<Theme>('blue')
  const [followCamera, setFollowCamera] = useState(false)
  const [spatialAudio, setSpatialAudio] = useState(true)
  const [volume, setVolume] = useState(0.5)
  const [customVRMUrl, setCustomVRMUrl] = useState<string | null>(null)
  const [vrmFileName, setVrmFileName] = useState<string | null>(null)
  const [isVRMLoading, setIsVRMLoading] = useState(false)
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<string | null>(null)
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null)

  // Load settings on mount
  useEffect(() => {
    const settings = loadSettings()
    setCurrentTheme(settings.theme)
    // Always set followCamera to false on reload
    setFollowCamera(false)
    setSpatialAudio(settings.spatialAudio)
    setVolume(settings.volume)
    setCustomVRMUrl(settings.customVRMUrl || null)
    setAudioFiles(settings.audioFiles || [])
    setSelectedAudioId(settings.selectedAudioId || null)
  }, [])

  const themes: ThemeOption[] = [
    { value: 'blue', color: '#3B82F6' },
    { value: 'green', color: '#10B981' },
    { value: 'orange', color: '#F59E0B' },
    { value: 'pink', color: '#EC4899' },
    { value: 'purple', color: '#8B5CF6' }
  ]

  const getBackgroundStyle = useCallback((theme: Theme) => {
    return {
      backgroundImage: `url(/textures/${theme}.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }, [])

  const openSettings = useCallback(() => {
    setShowSettings(true)
  }, [])

  const closeSettings = useCallback(() => {
    setShowSettings(false)
  }, [])

  const changeTheme = useCallback((theme: Theme) => {
    setCurrentTheme(theme)
    saveSettings(theme, followCamera, spatialAudio, volume, customVRMUrl || undefined, audioFiles, selectedAudioId)
  }, [followCamera, spatialAudio, volume, customVRMUrl, audioFiles, selectedAudioId])

  const changeFollowCamera = useCallback((newFollowCamera: boolean) => {
    setFollowCamera(newFollowCamera)
    saveSettings(currentTheme, newFollowCamera, spatialAudio, volume, customVRMUrl || undefined, audioFiles, selectedAudioId)
  }, [currentTheme, spatialAudio, volume, customVRMUrl, audioFiles, selectedAudioId])

  const changeSpatialAudio = useCallback((newSpatialAudio: boolean) => {
    setSpatialAudio(newSpatialAudio)
    saveSettings(currentTheme, followCamera, newSpatialAudio, volume, customVRMUrl || undefined, audioFiles, selectedAudioId)
  }, [currentTheme, followCamera, volume, customVRMUrl, audioFiles, selectedAudioId])

  const changeVolume = useCallback((newVolume: number) => {
    setVolume(newVolume)
    saveSettings(currentTheme, followCamera, spatialAudio, newVolume, customVRMUrl || undefined, audioFiles, selectedAudioId)
  }, [currentTheme, followCamera, spatialAudio, customVRMUrl, audioFiles, selectedAudioId])

  const changeVRMFile = useCallback((file: File | null) => {
    setIsVRMLoading(true)

    if (!file) {
      // Reset to default VRM
      setCustomVRMUrl(null)
      setVrmFileName(null)
      saveSettings(currentTheme, followCamera, spatialAudio, volume, undefined, audioFiles, selectedAudioId)
      setIsVRMLoading(false)
      return
    }

    // Create object URL for the file
    const url = URL.createObjectURL(file)
    setCustomVRMUrl(url)
    setVrmFileName(file.name)
    saveSettings(currentTheme, followCamera, spatialAudio, volume, url, audioFiles, selectedAudioId)

    // Note: isVRMLoading will be set to false by the VRMViewer component
    // when the model is successfully loaded
  }, [currentTheme, followCamera, spatialAudio, volume, audioFiles, selectedAudioId])

  const setVRMLoading = useCallback((loading: boolean) => {
    setIsVRMLoading(loading)
  }, [])

  const changeAudioFiles = useCallback((newAudioFiles: AudioFile[]) => {
    setAudioFiles(newAudioFiles)
    saveSettings(currentTheme, followCamera, spatialAudio, volume, customVRMUrl || undefined, newAudioFiles, selectedAudioId)
  }, [currentTheme, followCamera, spatialAudio, volume, customVRMUrl, selectedAudioId])

  const changeSelectedAudio = useCallback((audioId: string | null) => {
    setSelectedAudioId(audioId)
    saveSettings(currentTheme, followCamera, spatialAudio, volume, customVRMUrl || undefined, audioFiles, audioId)
  }, [currentTheme, followCamera, spatialAudio, volume, customVRMUrl, audioFiles])

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
    showSettings,
    currentTheme,
    followCamera,
    spatialAudio,
    volume,
    customVRMUrl,
    vrmFileName,
    isVRMLoading,
    audioFiles,
    currentPlayingAudio,
    selectedAudioId,
    themes,
    getBackgroundStyle,
    openSettings,
    closeSettings,
    changeTheme,
    changeFollowCamera,
    changeSpatialAudio,
    changeVolume,
    changeVRMFile,
    setVRMLoading,
    changeAudioFiles,
    changeSelectedAudio,
    playAudio
  }
}