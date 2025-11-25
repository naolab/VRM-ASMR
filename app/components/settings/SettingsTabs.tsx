import React from 'react'
import { VRMIcon, AudioIcon, DisplayIcon, SettingsIcon } from '../ui/icons'

export type SettingsTab = 'vrm' | 'audio' | 'display' | 'about'

interface SettingsTabInfo {
  id: SettingsTab
  label: string
  icon: React.ComponentType<{ size?: number; color?: string }>
}

const TAB_CONFIG: SettingsTabInfo[] = [
  { id: 'vrm', label: 'VRM設定', icon: VRMIcon },
  { id: 'audio', label: '音声設定', icon: AudioIcon },
  { id: 'display', label: '表示設定', icon: DisplayIcon },
  { id: 'about', label: '情報', icon: SettingsIcon }
]

interface SettingsTabsProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div style={{
      width: 'clamp(200px, 25%, 240px)',
      minWidth: '200px',
      backgroundColor: 'rgba(248, 250, 252, 0.95)',
      borderRight: '1px solid rgba(128, 90, 213, 0.2)',
      borderRadius: '12px 0 0 12px',
      padding: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      flexShrink: 0
    }}>
      {TAB_CONFIG.map((tab) => {
        const IconComponent = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '16px 20px',
              backgroundColor: isActive ? 'rgba(128, 90, 213, 0.2)' : 'transparent',
              border: 'none',
              borderLeft: isActive ? '4px solid #805ad5' : '4px solid transparent',
              color: isActive ? '#805ad5' : 'rgba(0, 0, 0, 0.8)',
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              fontWeight: isActive ? '600' : 'normal',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 2vw, 12px)',
              transition: 'all 0.2s ease',
              margin: '0',
              borderRadius: '0',
              minHeight: '48px'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'rgba(128, 90, 213, 0.1)'
                e.currentTarget.style.color = '#805ad5'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'rgba(0, 0, 0, 0.8)'
              }
            }}
          >
            <IconComponent size={20} color={isActive ? '#805ad5' : 'rgba(0, 0, 0, 0.6)'} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}