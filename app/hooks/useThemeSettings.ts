import { useCallback, useState } from 'react'
import { Theme, ThemeOption } from '../types/settings'

/**
 * テーマ関連の設定を管理するフック
 */
export const useThemeSettings = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('blue')

  const themes: ThemeOption[] = [
    { value: 'blue', color: '#3B82F6' },
    { value: 'green', color: '#10B981' },
    { value: 'orange', color: '#F59E0B' },
    { value: 'pink', color: '#EC4899' },
    { value: 'purple', color: '#8B5CF6' }
  ]

  const getBackgroundStyle = useCallback((theme: Theme) => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return {
      backgroundImage: `url(${basePath}/textures/${theme}.png)`,
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