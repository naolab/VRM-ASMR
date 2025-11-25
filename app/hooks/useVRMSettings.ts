import { useState, useCallback } from 'react'

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
  const [settings, setSettings] = useState<VRMSettings>(defaultVRMSettings)
  const [vrmFileName, setVrmFileName] = useState<string | null>(null)
  const [isVRMLoading, setIsVRMLoading] = useState(false)

  const changeFollowCamera = useCallback((followCamera: boolean) => {
    setSettings(prev => ({ ...prev, followCamera }))
  }, [])

  const changeVRMFile = useCallback((file: File | null) => {
    setIsVRMLoading(true)

    if (!file) {
      // Reset to default VRM
      setSettings(prev => ({ ...prev, customVRMUrl: undefined }))
      setVrmFileName(null)
      setIsVRMLoading(false)
      return
    }

    // Create object URL for the file
    const url = URL.createObjectURL(file)
    setSettings(prev => ({ ...prev, customVRMUrl: url }))
    setVrmFileName(file.name)

    // Note: isVRMLoading will be set to false by the VRMViewer component
    // when the model is successfully loaded
  }, [])

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