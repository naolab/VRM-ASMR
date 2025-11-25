'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { VRM_CONFIG } from '../constants/vrm'
import { LIP_SYNC_CONFIG } from '../constants/lipSync'
import { AUDIO_CONFIG } from '../constants/audio'
import { AutoBlink } from '../features/animation/AutoBlink'
import { VRMModel, VRMLoadResult } from '../types/vrm'
import { setupVRMModel, hasExpressionManager } from '../utils/vrmSetup'
import { loadVRMAnimation } from '../lib/VRMAnimation/loadVRMAnimation'
import { AutoLookAt } from '../features/animation/AutoLookAt'
import { CameraFollower } from '../features/camera/CameraFollower'
import { createMicrophone } from '../utils/createMicrophone'

interface VRMViewerProps {
  modelPath?: string
  followCamera?: boolean
  lipSyncVolume?: number
  showMicrophone?: boolean
  onCameraUpdate?: (camera: THREE.PerspectiveCamera) => void
  onCharacterPositionUpdate?: (position: THREE.Vector3) => void
  onLoadingStateChange?: (loading: boolean) => void
}

export const VRMViewer: React.FC<VRMViewerProps> = React.memo(({
  modelPath = VRM_CONFIG.DEFAULT_MODEL_PATH,
  followCamera = false,
  lipSyncVolume = 0,
  showMicrophone = true,
  onCameraUpdate,
  onCharacterPositionUpdate,
  onLoadingStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const lipSyncVolumeRef = useRef(0)
  const followCameraRef = useRef(followCamera)
  const prevFollowCameraRef = useRef(followCamera)
  const showMicrophoneRef = useRef(showMicrophone)
  const isLoadingRef = useRef(false)
  const animationFrameRef = useRef<number | null>(null)

  // Keep latest values available inside animation loop
  useEffect(() => {
    lipSyncVolumeRef.current = lipSyncVolume ?? 0
  }, [lipSyncVolume])

  useEffect(() => {
    followCameraRef.current = followCamera
  }, [followCamera])

  // Update microphone visibility when prop changes
  useEffect(() => {
    showMicrophoneRef.current = showMicrophone
  }, [showMicrophone])

  // Memoize camera update callback to prevent unnecessary re-renders
  const handleCameraUpdate = useCallback((camera: THREE.PerspectiveCamera) => {
    onCameraUpdate?.(camera)
  }, [onCameraUpdate])

  const handleCharacterPositionUpdate = useCallback((position: THREE.Vector3) => {
    onCharacterPositionUpdate?.(position)
  }, [onCharacterPositionUpdate])

  useEffect(() => {
    setIsMounted(true)
    if (typeof window === 'undefined') return

    let mounted = true
    let scene: THREE.Scene | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let renderer: THREE.WebGLRenderer | null = null
    let cameraControls: any | null = null // OrbitControls type is dynamic
    let vrm: VRMModel | null = null
    let mixer: THREE.AnimationMixer | null = null
    let microphone: THREE.Group | null = null
    let animationFrameId: number | null = null
    let autoBlink: AutoBlink | null = null
    let autoLookAt: AutoLookAt | null = null
    let cameraFollower: CameraFollower | null = null
    let mouthExpressionName: string | null = null
    let clock: THREE.Clock | null = null

    const handleResize = () => {
      if (!camera || !renderer) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      if (cameraControls) cameraControls.update()
    }

    const initVRM = async () => {
      if (!canvasRef.current || isLoadingRef.current) {
        return
      }

      try {
        isLoadingRef.current = true
        setIsLoaded(false)
        setError(null)

        // Dynamic imports
        const [THREE, { VRMLoaderPlugin }, { GLTFLoader }, { OrbitControls }] = await Promise.all([
          import('three'),
          import('@pixiv/three-vrm'),
          // @ts-ignore
          import('three/examples/jsm/loaders/GLTFLoader'),
          // @ts-ignore
          import('three/examples/jsm/controls/OrbitControls')
        ])

        if (!mounted) return

        // Three.js setup
        scene = new THREE.Scene()

        // Camera setup
        camera = new THREE.PerspectiveCamera(
          VRM_CONFIG.CAMERA.FOV,
          window.innerWidth / window.innerHeight,
          VRM_CONFIG.CAMERA.NEAR,
          VRM_CONFIG.CAMERA.FAR
        )
        camera.position.set(
          VRM_CONFIG.CAMERA.POSITION.X,
          VRM_CONFIG.CAMERA.POSITION.Y,
          VRM_CONFIG.CAMERA.POSITION.Z
        )

        // Renderer setup with performance optimizations
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: window.devicePixelRatio <= 1,
          powerPreference: 'high-performance'
        })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.autoClear = true

        // Lights
        const directionalLight = new THREE.DirectionalLight(0xffffff, VRM_CONFIG.LIGHTING.DIRECTIONAL.INTENSITY)
        directionalLight.position.set(
          VRM_CONFIG.LIGHTING.DIRECTIONAL.POSITION.X,
          VRM_CONFIG.LIGHTING.DIRECTIONAL.POSITION.Y,
          VRM_CONFIG.LIGHTING.DIRECTIONAL.POSITION.Z
        ).normalize()
        directionalLight.castShadow = true
        scene.add(directionalLight)

        const ambientLight = new THREE.AmbientLight(0xffffff, VRM_CONFIG.LIGHTING.AMBIENT.INTENSITY)
        scene.add(ambientLight)

        // Add camera to scene
        scene.add(camera)

        // Add Microphone
        microphone = createMicrophone()
        microphone.position.set(
          AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.X,
          AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.Y,
          AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.Z
        )
        camera.add(microphone)
        microphone.visible = showMicrophone

        // Camera controls setup
        cameraControls = new OrbitControls(camera, renderer.domElement)
        cameraControls.screenSpacePanning = true
        cameraControls.target.set(0, VRM_CONFIG.CAMERA.POSITION.Y, 0)
        cameraControls.update()
        cameraControls.minDistance = 0.5

        const updateControlsState = (isFollowing: boolean) => {
          if (cameraControls) {
            cameraControls.enableRotate = !isFollowing
          }
        }

        // Notify parent about initial camera state
        handleCameraUpdate(camera)

        // Load VRM with LookAtSmoother plugin
        if (!mounted) return

        const loader = new GLTFLoader()
        loader.register((parser: any) => new VRMLoaderPlugin(parser))

        clock = new THREE.Clock()

        // Start loading
        onLoadingStateChange?.(true)

        loader.load(
          modelPath,
          async (gltf: VRMLoadResult) => {
            if (!mounted) return

            vrm = gltf.userData.vrm
            if (!vrm) return

            // Setup VRM model
            setupVRMModel(vrm)

            // Initialize auto blink and find mouth expression
            if (hasExpressionManager(vrm)) {
              autoBlink = new AutoBlink(vrm.expressionManager)

              const em = vrm.expressionManager
              const tryNames: string[] = [
                ...VRM_CONFIG.MOUTH_EXPRESSION_CANDIDATES,
                ...((em as any).mouthExpressionNames ?? [])
              ]
              for (const name of tryNames) {
                if (typeof em.getExpression === 'function' && em.getExpression(name)) {
                  mouthExpressionName = name
                  break
                }
              }

              if (!mouthExpressionName && typeof em.getExpression === 'function' && em.getExpression('aa')) {
                mouthExpressionName = 'aa'
              }
            }

            // Initialize auto look-at system
            autoLookAt = new AutoLookAt(vrm, camera!)

            // Initialize camera follower
            cameraFollower = new CameraFollower(vrm, camera!)
            cameraFollower.setEnabled(followCameraRef.current)

            // Initialize animation mixer
            mixer = new THREE.AnimationMixer(vrm.scene)

            scene!.add(vrm.scene)

            // Notify parent about character position
            handleCharacterPositionUpdate(vrm.scene.position)

            // Load idle animation
            try {
              const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
              const idleAnimation = await loadVRMAnimation(`${basePath}/idle_loop.vrma`)
              if (idleAnimation && mounted) {
                const clip = idleAnimation.createAnimationClip(vrm)
                const action = mixer!.clipAction(clip)
                action.setLoop(THREE.LoopRepeat, Infinity)
                action.play()
              }
            } catch (error) {
              // Idle animation is optional
            }

            if (!mounted) return

            setIsLoaded(true)
            isLoadingRef.current = false
            onLoadingStateChange?.(false)
          },
          undefined,
          (error: unknown) => {
            if (!mounted) return
            console.error('VRM load error:', error)
            setError('VRMファイルの読み込みに失敗しました')
            isLoadingRef.current = false
            onLoadingStateChange?.(false)
          }
        )

        // Animation loop
        let lastFrameTime = 0
        const targetFPS = 60
        const frameInterval = 1000 / targetFPS

        const animate = (currentTime = 0) => {
          if (!mounted) return

          animationFrameId = requestAnimationFrame(animate)

          if (currentTime - lastFrameTime < frameInterval) {
            return
          }
          lastFrameTime = currentTime

          const deltaTime = clock!.getDelta()

          if (mixer) {
            mixer.update(deltaTime)
          }

          if (cameraControls) {
            cameraControls.update()
          }

          if (camera) {
            handleCameraUpdate(camera)
          }

          // Camera reset logic
          const currentFollowCamera = followCameraRef.current
          const prevFollowCamera = prevFollowCameraRef.current

          if (!prevFollowCamera && currentFollowCamera && camera && cameraControls) {

            camera.position.set(
              VRM_CONFIG.CAMERA.POSITION.X,
              VRM_CONFIG.CAMERA.POSITION.Y,
              VRM_CONFIG.CAMERA.POSITION.Z
            )
            cameraControls.target.set(0, VRM_CONFIG.CAMERA.POSITION.Y, 0)
            cameraControls.update()

          }

          if (cameraFollower) {
            cameraFollower.setEnabled(currentFollowCamera)
            cameraFollower.update()
          }

          updateControlsState(currentFollowCamera)
          prevFollowCameraRef.current = currentFollowCamera

          // Update microphone visibility
          if (microphone) {
            microphone.visible = showMicrophoneRef.current
          }

          // Lip sync update
          if (vrm && vrm.expressionManager && mouthExpressionName) {
            const target = Math.max(0, Math.min(1, lipSyncVolumeRef.current * LIP_SYNC_CONFIG.VOLUME_MULTIPLIER))
            const prev = (vrm.expressionManager as any).__mouthPrev ?? 0
            const smoothed = prev + (target - prev) * LIP_SYNC_CONFIG.SMOOTHING_FACTOR
              ; (vrm.expressionManager as any).__mouthPrev = smoothed
            vrm.expressionManager.setValue(mouthExpressionName, smoothed)
          }

          if (vrm) {
            vrm.update(deltaTime)
          }

          if (autoBlink) {
            autoBlink.update(deltaTime)
          }

          // Manual tilt for mic
          const head = vrm?.humanoid?.getNormalizedBoneNode('head')
          const neck = vrm?.humanoid?.getNormalizedBoneNode('neck')
          const leftEye = vrm?.humanoid?.getNormalizedBoneNode('leftEye')
          const rightEye = vrm?.humanoid?.getNormalizedBoneNode('rightEye')

          const originalHeadRot = head?.rotation.clone()
          const originalNeckRot = neck?.rotation.clone()
          const originalLeftEyeRot = leftEye?.rotation.clone()
          const originalRightEyeRot = rightEye?.rotation.clone()

          const tiltAmount = 0.15
          const neckTiltAmount = 0.05

          if (head) head.rotation.x += tiltAmount
          if (neck) neck.rotation.x += neckTiltAmount

          const totalTilt = tiltAmount + neckTiltAmount
          if (leftEye) leftEye.rotation.x -= totalTilt
          if (rightEye) rightEye.rotation.x -= totalTilt

          if (renderer && scene && camera) {
            renderer.render(scene, camera)
          }

          if (head && originalHeadRot) head.rotation.copy(originalHeadRot)
          if (neck && originalNeckRot) neck.rotation.copy(originalNeckRot)
          if (leftEye && originalLeftEyeRot) leftEye.rotation.copy(originalLeftEyeRot)
          if (rightEye && originalRightEyeRot) rightEye.rotation.copy(originalRightEyeRot)
        }

        animate()

        window.addEventListener('resize', handleResize)

      } catch (err) {
        if (mounted) {
          console.error('VRM init error:', err)
          setError('VRMの初期化に失敗しました')
          isLoadingRef.current = false
          onLoadingStateChange?.(false)
        }
      }
    }

    initVRM()

    return () => {
      mounted = false
      isLoadingRef.current = false // Reset loading flag

      window.removeEventListener('resize', handleResize)

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }

      if (mixer) {
        mixer.stopAllAction()
        mixer.uncacheRoot(mixer.getRoot())
      }

      if (cameraControls) {
        cameraControls.dispose()
      }

      if (renderer) {
        renderer.dispose()
      }

      if (vrm) {
        scene?.remove(vrm.scene)
        // @ts-ignore
        vrm.dispose?.()
      }

      if (microphone && camera) {
        camera.remove(microphone)
        microphone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach((m: THREE.Material) => m.dispose())
            } else if (child.material) {
              child.material.dispose()
            }
          }
        })
      }

      if (scene) {
        scene.clear()
      }
    }
  }, [modelPath, handleCameraUpdate, handleCharacterPositionUpdate, onLoadingStateChange])

  if (!isMounted) {
    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    )
  }

  return (
    <>
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'red',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '20px',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      )}

      {!isLoaded && !error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '20px',
          borderRadius: '8px'
        }}>
          VRMキャラクター読み込み中...
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </>
  )
})
