import React from 'react'
import { ToggleSwitch } from '../ui/ToggleSwitch'

interface CameraSettingsProps {
  followCamera: boolean
  onFollowCameraChange: (value: boolean) => void
  showMicrophone: boolean
  onShowMicrophoneChange: (value: boolean) => void
}

export const CameraSettings: React.FC<CameraSettingsProps> = ({
  followCamera,
  onFollowCameraChange,
  showMicrophone,
  onShowMicrophoneChange
}) => {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '20px'
      }}>
        カメラ設定
      </div>

      <ToggleSwitch
        checked={followCamera}
        onChange={onFollowCameraChange}
        label="カメラ追従"
      />

      <ToggleSwitch
        checked={showMicrophone}
        onChange={onShowMicrophoneChange}
        label="マイク表示"
      />
    </div>
  )
}