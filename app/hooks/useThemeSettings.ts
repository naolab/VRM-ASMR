import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { Theme, ThemeOption } from '../types/settings'

const THEME_STORAGE_KEY = 'vrm-asmr-theme'

/**
 * テーマ関連の設定を管理するフック
 */
export const useThemeSettings = () => {
  const [currentTheme, setCurrentTheme] = useLocalStorage<Theme>(THEME_STORAGE_KEY, 'blue')

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

  const changeTheme = useCallback((theme: Theme) => {
    setCurrentTheme(theme)
  }, [setCurrentTheme])

  return {
    currentTheme,
    themes,
    getBackgroundStyle,
    changeTheme
  }
}