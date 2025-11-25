import React, { useState, useEffect } from 'react'
import { Theme, ThemeOption } from '../../types/settings'
import { Modal } from '../ui/Modal'
import { AudioFile } from '../../types/audio'
import { SettingsTabs, SettingsTab } from './SettingsTabs'
import { TabContent } from './TabContent'

interface SettingsProps {
  isOpen: boolean
  themes: ThemeOption[]
  currentTheme: Theme
  followCamera: boolean
  spatialAudio: boolean
  volume: number
  vrmFileName?: string
  isVRMLoading?: boolean
  audioFiles: AudioFile[]
  currentPlayingAudio?: string | null
  onClose: () => void
  onThemeChange: (theme: Theme) => void
  onFollowCameraChange: (value: boolean) => void
  showMicrophone: boolean
  onShowMicrophoneChange: (value: boolean) => void
  onSpatialAudioChange: (value: boolean) => void
  onVolumeChange: (value: number) => void
  onVRMFileChange: (file: File | null) => void
  onAudioFilesChange: (files: AudioFile[]) => void
  onPlayAudio: (audioFile: AudioFile) => void
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  themes,
  currentTheme,
  followCamera,
  spatialAudio,
  volume,
  vrmFileName,
  isVRMLoading,
  audioFiles,
  currentPlayingAudio,
  onClose,
  onThemeChange,
  onFollowCameraChange,
  showMicrophone,
  onShowMicrophoneChange,
  onSpatialAudioChange,
  onVolumeChange,
  onVRMFileChange,
  onAudioFilesChange,
  onPlayAudio
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('vrm')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="設定"
      size="xl"
    >
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: '600px',
        gap: '1rem'
      }}>
        {/* Mobile Tab Selector */}
        {isMobile && (
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(248, 250, 252, 0.95)',
            borderRadius: '12px 12px 0 0',
            padding: '8px',
            marginBottom: '0',
            overflowX: 'auto'
          }}>
            {(['vrm', 'audio', 'display', 'about'] as SettingsTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  backgroundColor: activeTab === tab ? '#805ad5' : 'transparent',
                  color: activeTab === tab ? 'white' : '#805ad5',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: activeTab === tab ? '600' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  margin: '0 2px',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab === 'vrm' ? 'VRM' : tab === 'audio' ? '音声' : tab === 'display' ? '表示' : '情報'}
              </button>
            ))}
          </div>
        )}

        {/* Desktop Left Sidebar Tabs */}
        {!isMobile && (
          <SettingsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Right Content Area */}
        <TabContent
          activeTab={activeTab}
          // VRM settings
          vrmFileName={vrmFileName}
          isVRMLoading={isVRMLoading}
          onVRMFileChange={onVRMFileChange}
          followCamera={followCamera}
          onFollowCameraChange={onFollowCameraChange}
          showMicrophone={showMicrophone}
          onShowMicrophoneChange={onShowMicrophoneChange}
          // Audio settings
          spatialAudio={spatialAudio}
          volume={volume}
          onSpatialAudioChange={onSpatialAudioChange}
          onVolumeChange={onVolumeChange}
          audioFiles={audioFiles}
          currentPlayingAudio={currentPlayingAudio}
          onAudioFilesChange={onAudioFilesChange}
          onPlayAudio={onPlayAudio}
          // Display settings
          themes={themes}
          currentTheme={currentTheme}
          onThemeChange={onThemeChange}
        />
      </div>
    </Modal>
  )
}