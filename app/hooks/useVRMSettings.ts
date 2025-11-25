import { useState, useCallback, useEffect } from 'react'
import { useLocalStorageSettings } from './useLocalStorage'

const VRM_STORAGE_KEY = 'vrm-asmr-vrm'

interface VRMSettings {
  followCamera: boolean
  customVRMUrl?: string
}

const defaultVRMSettings: VRMSettings = {
  followCamera: false
}

/**
 * VRM関連の設定を管理するフック
 */
export const useVRMSettings = () => {
  const [settings, updateSettings] = useLocalStorageSettings(VRM_STORAGE_KEY, defaultVRMSettings)
  const [vrmFileName, setVrmFileName] = useState<string | null>(null)
  const [isVRMLoading, setIsVRMLoading] = useState(false)

  // Clear custom VRM URL on mount (blob URLs become invalid after page reload)
  useEffect(() => {
    if (settings.customVRMUrl) {
      updateSettings({ customVRMUrl: undefined })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const changeFollowCamera = useCallback((followCamera: boolean) => {
    updateSettings({ followCamera })
  }, [updateSettings])

  const changeVRMFile = useCallback((file: File | null) => {
    setIsVRMLoading(true)

    if (!file) {
      // Reset to default VRM
      updateSettings({ customVRMUrl: undefined })
      setVrmFileName(null)
      setIsVRMLoading(false)
      return
    }

    // Create object URL for the file
    const url = URL.createObjectURL(file)
    updateSettings({ customVRMUrl: url })
    setVrmFileName(file.name)

    // Note: isVRMLoading will be set to false by the VRMViewer component
    // when the model is successfully loaded
  }, [updateSettings])

  const setVRMLoading = useCallback((loading: boolean) => {
    setIsVRMLoading(loading)
  }, [])

  return {
    followCamera: settings.followCamera,
    customVRMUrl: settings.customVRMUrl || null,
    vrmFileName,
    isVRMLoading,
    changeFollowCamera,
    changeVRMFile,
    setVRMLoading
  }
}