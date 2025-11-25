import React, { useState, useRef, useEffect } from 'react'
import { AudioFile } from '../../types/audio'

interface AudioSelectorProps {
  audioFiles: AudioFile[]
  selectedAudioId?: string | null
  onAudioSelect: (audioId: string | null) => void
  disabled?: boolean
}

export const AudioSelector: React.FC<AudioSelectorProps> = ({
  audioFiles,
  selectedAudioId,
  onAudioSelect,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedAudio = audioFiles.find(audio => audio.id === selectedAudioId)
  const hasAudioFiles = audioFiles.length > 0

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (audioId: string | null) => {
    onAudioSelect(audioId)
    setIsOpen(false)
  }

  const truncateFileName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength - 3) + '...'
  }

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        display: 'inline-block'
      }}
    >
      {/* Dropdown button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          padding: '8px 32px 8px 12px',
          backgroundColor: 'rgba(64, 64, 64, 0.9)',
          border: '1px solid rgba(128, 128, 128, 0.5)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          minWidth: '180px', // Increased width
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          textAlign: 'left'
        }}>
          {selectedAudio ? truncateFileName(selectedAudio.name) : 'サンプル音声 (test.mp3)'}
        </span>
        <span style={{
          position: 'absolute',
          right: '8px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          marginTop: '4px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {/* Default option */}
          <div
            onClick={() => handleSelect(null)}
            style={{
              padding: '8px 12px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: !selectedAudioId ? 'rgba(0, 122, 255, 0.3)' : 'transparent',
              borderBottom: hasAudioFiles ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!selectedAudioId) return
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              if (!selectedAudioId) return
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            サンプル音声 (test.mp3)
          </div>

          {/* Audio file options */}
          {audioFiles.map((audio) => (
            <div
              key={audio.id}
              onClick={() => handleSelect(audio.id)}
              style={{
                padding: '8px 12px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: selectedAudioId === audio.id ? 'rgba(0, 122, 255, 0.3)' : 'transparent',
                borderBottom: audioFiles[audioFiles.length - 1].id !== audio.id ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                if (selectedAudioId === audio.id) return
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                if (selectedAudioId === audio.id) return
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}>
                {audio.name}
              </span>
              <span style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginLeft: '8px'
              }}>
                🎵
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}