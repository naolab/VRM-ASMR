import React from 'react'
import { Theme, ThemeOption } from '../../types/settings'
import { Button } from '../ui'
import { ToggleSwitch } from '../ui/ToggleSwitch'

interface ThemeSettingsProps {
  themes: ThemeOption[]
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
  showMicrophone: boolean
  onShowMicrophoneChange: (value: boolean) => void
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  themes,
  currentTheme,
  onThemeChange,
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
        テーマ設定
      </div>

      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
      }}>
        {themes.map((theme) => (
          <Button
            key={theme.value}
            onClick={() => onThemeChange(theme.value)}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: theme.color,
              border: currentTheme === theme.value ? '4px solid #333' : '2px solid rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: currentTheme === theme.value ? 'scale(1.1)' : 'scale(1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          >
            <></>
          </Button>
        ))}
      </div>

      <div style={{ marginTop: '32px' }}>
        <div style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '20px'
        }}>
          表示オプション
        </div>

        <ToggleSwitch
          checked={showMicrophone}
          onChange={onShowMicrophoneChange}
          label="マイク表示"
        />
      </div>
    </div>
  )
}