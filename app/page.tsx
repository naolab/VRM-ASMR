'use client'

import { useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useThemeSettings } from './hooks/useThemeSettings'
import { useAudioSettings } from './hooks/useAudioSettings'
import { useVRMSettings } from './hooks/useVRMSettings'
import { useUISettings } from './hooks/useUISettings'
import { Menu } from './components/Menu'
import { Settings } from './components/settings'
import { ErrorBoundary } from './components/ErrorBoundary'
import { VRMViewer } from './components/VRMViewer'
import { AudioPlayer } from './components/AudioPlayer'

export default function Home() {
  // 細分化されたフックを使用
  const { currentTheme, themes, getBackgroundStyle, changeTheme } = useThemeSettings()
  const {
    spatialAudio,
    volume,
    audioFiles,
    selectedAudioId,
    currentPlayingAudio,
    changeSpatialAudio,
    changeVolume,
    changeAudioFiles,
    changeSelectedAudio,
    playAudio
  } = useAudioSettings()
  const {
    followCamera,
    customVRMUrl,
    vrmFileName,
    isVRMLoading,
    changeFollowCamera,
    changeVRMFile,
    setVRMLoading
  } = useVRMSettings()
  const { showSettings, openSettings, closeSettings, showMicrophone, changeShowMicrophone } = useUISettings()
  const [lipSyncVolume, setLipSyncVolume] = useState(0)
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null)
  const [characterPosition, setCharacterPosition] = useState<THREE.Vector3 | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // コールバック関数をメモ化
  const handleCameraUpdate = useCallback((camera: THREE.PerspectiveCamera) => {
    setCamera(camera)
  }, [])

  const handleCharacterPositionUpdate = useCallback((position: THREE.Vector3) => {
    setCharacterPosition(position)
  }, [])

  const handleVRMLoadingStateChange = useCallback((loading: boolean) => {
    setVRMLoading(loading)
  }, [setVRMLoading])

  const handleVolumeChange = useCallback((volume: number) => {
    setLipSyncVolume(volume)
  }, [])

  return (
    <>
      <main style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        ...(isClient ? getBackgroundStyle(currentTheme) : {})
      }}>
        <ErrorBoundary
          fallback={
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#dc2626'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️</div>
              <div>VRMキャラクターの読み込みに失敗しました</div>
            </div>
          }
        >
          <VRMViewer
            modelPath={customVRMUrl || undefined}
            followCamera={followCamera}
            lipSyncVolume={lipSyncVolume}
            showMicrophone={showMicrophone}
            onCameraUpdate={handleCameraUpdate}
            onCharacterPositionUpdate={handleCharacterPositionUpdate}
            onLoadingStateChange={handleVRMLoadingStateChange}
          />
        </ErrorBoundary>
        <AudioPlayer
          onVolumeChange={handleVolumeChange}
          camera={camera || undefined}
          characterPosition={characterPosition || undefined}
          spatialAudio={spatialAudio}
          masterVolume={volume}
          audioFiles={audioFiles}
          selectedAudioId={selectedAudioId}
          onAudioSelect={changeSelectedAudio}
        />
        <Menu onOpenSettings={openSettings} />
      </main>

      <Settings
        isOpen={showSettings}
        themes={themes}
        currentTheme={currentTheme}
        followCamera={followCamera}
        spatialAudio={spatialAudio}
        volume={volume}
        vrmFileName={vrmFileName || undefined}
        isVRMLoading={isVRMLoading}
        audioFiles={audioFiles}
        currentPlayingAudio={currentPlayingAudio}
        onClose={closeSettings}
        onThemeChange={changeTheme}
        onFollowCameraChange={changeFollowCamera}
        showMicrophone={showMicrophone}
        onShowMicrophoneChange={changeShowMicrophone}
        onSpatialAudioChange={changeSpatialAudio}
        onVolumeChange={changeVolume}
        onVRMFileChange={changeVRMFile}
        onAudioFilesChange={changeAudioFiles}
        onPlayAudio={playAudio}
      />
    </>
  )
}