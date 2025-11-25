import React from 'react'
import { Theme, ThemeOption } from '../../types/settings'
import { AudioFile } from '../../types/audio'
import { VRMSettings } from './VRMSettings'
import { CameraSettings } from './CameraSettings'
import { AudioSettings } from './AudioSettings'
import { AudioFileSettings } from './AudioFileSettings'
import { ThemeSettings } from './ThemeSettings'
import { SettingsTab } from './SettingsTabs'

interface TabContentProps {
  activeTab: SettingsTab
  // VRM settings
  vrmFileName?: string
  isVRMLoading?: boolean
  onVRMFileChange: (file: File | null) => void
  followCamera: boolean
  onFollowCameraChange: (value: boolean) => void
  showMicrophone: boolean
  onShowMicrophoneChange: (value: boolean) => void
  // Audio settings
  spatialAudio: boolean
  volume: number
  onSpatialAudioChange: (value: boolean) => void
  onVolumeChange: (value: number) => void
  audioFiles: AudioFile[]
  currentPlayingAudio?: string | null
  onAudioFilesChange: (files: AudioFile[]) => void
  onPlayAudio: (audioFile: AudioFile) => void
  // Display settings
  themes: ThemeOption[]
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
}

export const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  // VRM props
  vrmFileName,
  isVRMLoading,
  onVRMFileChange,
  followCamera,
  onFollowCameraChange,
  showMicrophone,
  onShowMicrophoneChange,
  // Audio props
  spatialAudio,
  volume,
  onSpatialAudioChange,
  onVolumeChange,
  audioFiles,
  currentPlayingAudio,
  onAudioFilesChange,
  onPlayAudio,
  // Display props
  themes,
  currentTheme,
  onThemeChange
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'vrm':
        return (
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '24px'
            }}>
              VRM設定
            </h2>

            <VRMSettings
              onVRMFileChange={onVRMFileChange}
              currentVRMName={vrmFileName}
              isLoading={isVRMLoading}
            />

            <CameraSettings
              followCamera={followCamera}
              onFollowCameraChange={onFollowCameraChange}
              showMicrophone={showMicrophone}
              onShowMicrophoneChange={onShowMicrophoneChange}
            />
          </div>
        )

      case 'audio':
        return (
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '24px'
            }}>
              音声設定
            </h2>

            <AudioSettings
              spatialAudio={spatialAudio}
              volume={volume}
              onSpatialAudioChange={onSpatialAudioChange}
              onVolumeChange={onVolumeChange}
            />

            <AudioFileSettings
              audioFiles={audioFiles}
              maxFiles={10}
              onAudioFilesChange={onAudioFilesChange}
              onPlayAudio={onPlayAudio}
              isPlaying={currentPlayingAudio}
            />
          </div>
        )

      case 'display':
        return (
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '24px'
            }}>
              表示設定
            </h2>

            <ThemeSettings
              themes={themes}
              currentTheme={currentTheme}
              onThemeChange={onThemeChange}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{
      flex: 1,
      padding: window.innerWidth < 768 ? '24px 20px' : '32px 40px',
      overflowY: 'auto',
      maxHeight: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: window.innerWidth < 768 ? '0 0 12px 12px' : '0 12px 12px 0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      minWidth: 0
    }}>
      {renderContent()}
    </div>
  )
}