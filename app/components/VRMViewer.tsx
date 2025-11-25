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
import { AutoLookAt } from '../features/emoteController/autoLookAt'
import { CameraFollower } from '../features/camera/CameraFollower'
import { createMicrophone } from '../utils/createMicrophone'

interface VRMViewerProps {
  modelPath?: string
  followCamera?: boolean
  lipSyncVolume?: number
  onCameraUpdate?: (camera: THREE.PerspectiveCamera) => void
  onCharacterPositionUpdate?: (position: THREE.Vector3) => void
  onLoadingStateChange?: (loading: boolean) => void
}

export const VRMViewer: React.FC<VRMViewerProps> = React.memo(({
  modelPath = VRM_CONFIG.DEFAULT_MODEL_PATH,
  followCamera = false,
  lipSyncVolume = 0,
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
  const isLoadingRef = useRef(false)
  const animationFrameRef = useRef<number | null>(null)

  // Keep latest values available inside animation loop
  useEffect(() => {
    lipSyncVolumeRef.current = lipSyncVolume ?? 0
  }, [lipSyncVolume])

  useEffect(() => {
    followCameraRef.current = followCamera
  }, [followCamera])

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

    let cleanup: (() => void) | null = null

    const initVRM = async () => {
      if (!canvasRef.current || isLoadingRef.current) return
      isLoadingRef.current = true

      try {
        const THREE = await import('three')
        const { VRMLoaderPlugin } = await import('@pixiv/three-vrm')
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader')
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls')

        // Three.js setup
        const scene = new THREE.Scene()

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
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
        const renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: window.devicePixelRatio <= 1, // Only enable AA on low-DPI displays
          powerPreference: 'high-performance' // Prefer dedicated GPU
        })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap pixel ratio for performance
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap

        // Enable frustum culling and automatic clearing
        renderer.autoClear = true
        renderer.autoClearColor = true
        renderer.autoClearDepth = true
        renderer.autoClearStencil = true

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

        // Add camera to scene so that child objects (microphone) are rendered
        scene.add(camera)

        // Add Microphone
        const microphone = createMicrophone()
        // Position it in front of the camera (Camera local coordinates)
        // Z is negative forward in camera space
        // Adjust Y to be at the bottom of the screen
        microphone.position.set(
          AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.X,
          AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.Y,
          AUDIO_CONFIG.SPATIAL.MICROPHONE_POSITION.Z
        )
        // Adjust rotation if needed (it's upright by default)
        camera.add(microphone)

        // Camera controls setup
        const cameraControls = new OrbitControls(camera, renderer.domElement)
        cameraControls.screenSpacePanning = true
        cameraControls.target.set(0, VRM_CONFIG.CAMERA.POSITION.Y, 0)
        cameraControls.update()
        cameraControls.minDistance = 0.5

        // Function to update controls based on followCamera state
        const updateControlsState = (isFollowing: boolean) => {
          cameraControls.enableRotate = !isFollowing
        }

        // Notify parent about initial camera state
        handleCameraUpdate(camera)

        // Load VRM with LookAtSmoother plugin
        const { VRMLookAtSmootherLoaderPlugin } = await import('../lib/VRMLookAtSmoother/VRMLookAtSmootherLoaderPlugin')

        const loader = new GLTFLoader()
        loader.register((parser: any) => new VRMLoaderPlugin(parser, {
          lookAtPlugin: new VRMLookAtSmootherLoaderPlugin(parser),
        }))

        let vrm: VRMModel | null = null
        let autoBlink: AutoBlink | null = null
        let autoLookAt: AutoLookAt | null = null
        let mixer: THREE.AnimationMixer | null = null
        let cameraFollower: CameraFollower | null = null
        let mouthExpressionName: string | null = null
        const clock = new THREE.Clock()

        // Start loading
        onLoadingStateChange?.(true)

        loader.load(
          modelPath,
          async (gltf: VRMLoadResult) => {
            vrm = gltf.userData.vrm

            // Setup VRM model
            setupVRMModel(vrm)

            // Initialize auto blink and find mouth expression
            if (hasExpressionManager(vrm)) {
              autoBlink = new AutoBlink(vrm.expressionManager)

              // Find available mouth expression reliably
              const em = vrm.expressionManager
              const tryNames: string[] = [
                ...VRM_CONFIG.MOUTH_EXPRESSION_CANDIDATES,
                // Include manager-suggested names if available (aa, ee, ih, oh, ou)
                ...((em as any).mouthExpressionNames ?? [])
              ]
              for (const name of tryNames) {
                if (typeof em.getExpression === 'function' && em.getExpression(name)) {
                  mouthExpressionName = name
                  break
                }
              }

              // Fallback to 'aa' if nothing matched (some models still accept it)
              if (!mouthExpressionName && typeof em.getExpression === 'function' && em.getExpression('aa')) {
                mouthExpressionName = 'aa'
              }
            }

            // Initialize auto look-at system
            autoLookAt = new AutoLookAt(vrm, camera)

            // Initialize camera follower
            cameraFollower = new CameraFollower(vrm, camera)
            cameraFollower.setEnabled(followCameraRef.current)

            // Initialize animation mixer
            mixer = new THREE.AnimationMixer(vrm.scene)

            scene.add(vrm.scene)

            // Notify parent about character position
            handleCharacterPositionUpdate(vrm.scene.position)

            // Load idle animation
            try {
              const idleAnimation = await loadVRMAnimation('/idle_loop.vrma')
              if (idleAnimation) {
                const clip = idleAnimation.createAnimationClip(vrm)
                const action = mixer.clipAction(clip)
                action.setLoop(THREE.LoopRepeat, Infinity)
                action.play()
              }
            } catch (error) {
              // Idle animation is optional, continue without it
            }

            setIsLoaded(true)
            onLoadingStateChange?.(false)
          },
          undefined,
          (error: unknown) => {
            setError('VRMファイルの読み込みに失敗しました')
            onLoadingStateChange?.(false)
          }
        )

        // Animation loop with frame rate optimization
        let lastFrameTime = 0
        const targetFPS = 60
        const frameInterval = 1000 / targetFPS

        const animate = (currentTime = 0) => {
          animationFrameRef.current = requestAnimationFrame(animate)

          // Frame rate limiting for better performance
          if (currentTime - lastFrameTime < frameInterval) {
            return
          }
          lastFrameTime = currentTime

          const deltaTime = clock.getDelta()

          // Update animation mixer first (affects poses/expressions from clips)
          if (mixer) {
            mixer.update(deltaTime)
          }

          // Update camera controls
          cameraControls.update()

          // Notify parent about camera changes
          handleCameraUpdate(camera)

          // Check if followCamera state changed
          const currentFollowCamera = followCameraRef.current
          const prevFollowCamera = prevFollowCameraRef.current

          // If followCamera was turned ON, reset camera to initial position
          if (!prevFollowCamera && currentFollowCamera) {
            camera.position.set(
              VRM_CONFIG.CAMERA.POSITION.X,
              VRM_CONFIG.CAMERA.POSITION.Y,
              VRM_CONFIG.CAMERA.POSITION.Z
            )
            cameraControls.target.set(0, VRM_CONFIG.CAMERA.POSITION.Y, 0)
            cameraControls.update()
          }

          // Update camera follower
          if (cameraFollower) {
            cameraFollower.setEnabled(currentFollowCamera)
            cameraFollower.update()
          }

          // Update OrbitControls rotation based on followCamera state
          updateControlsState(currentFollowCamera)

          // Update previous state
          prevFollowCameraRef.current = currentFollowCamera

          // Update VRM expressions (lip sync) before vrm.update for this frame
          if (vrm) {
            // Update lip sync using pre-determined mouth expression
            if (vrm.expressionManager && mouthExpressionName) {
              // Map input volume [0,1] with volume multiplier (ChatVRM方式)
              const target = Math.max(0, Math.min(1, lipSyncVolumeRef.current * LIP_SYNC_CONFIG.VOLUME_MULTIPLIER))
              // Keep lightweight smoothing via previous value stored on manager
              // (fall back to target when not present)
              const prev = (vrm.expressionManager as any).__mouthPrev ?? 0
              const smoothed = prev + (target - prev) * LIP_SYNC_CONFIG.SMOOTHING_FACTOR
                ; (vrm.expressionManager as any).__mouthPrev = smoothed
              vrm.expressionManager.setValue(mouthExpressionName, smoothed)
            }
          }

          // Update VRM (applies expression weights and animations)
          if (vrm) {
            vrm.update(deltaTime)
          }

          if (autoBlink) {
            autoBlink.update(deltaTime)
          }

          // Apply manual tilt towards microphone (Head and Neck) temporarily for rendering
          const head = vrm?.humanoid?.getNormalizedBoneNode('head')
          const neck = vrm?.humanoid?.getNormalizedBoneNode('neck')
          const leftEye = vrm?.humanoid?.getNormalizedBoneNode('leftEye')
          const rightEye = vrm?.humanoid?.getNormalizedBoneNode('rightEye')

          const originalHeadRot = head?.rotation.clone()
          const originalNeckRot = neck?.rotation.clone()
          const originalLeftEyeRot = leftEye?.rotation.clone()
          const originalRightEyeRot = rightEye?.rotation.clone()

          // Tilt head/neck down towards mic
          const tiltAmount = 0.15
          const neckTiltAmount = 0.05

          if (head) head.rotation.x += tiltAmount
          if (neck) neck.rotation.x += neckTiltAmount

          // Compensate eyes to look back up at camera
          // (Subtract the total tilt amount from eyes)
          const totalTilt = tiltAmount + neckTiltAmount
          if (leftEye) leftEye.rotation.x -= totalTilt
          if (rightEye) rightEye.rotation.x -= totalTilt

          renderer.render(scene, camera)

          // Restore original rotations to prevent accumulation
          if (head && originalHeadRot) head.rotation.copy(originalHeadRot)
          if (neck && originalNeckRot) neck.rotation.copy(originalNeckRot)
          if (leftEye && originalLeftEyeRot) leftEye.rotation.copy(originalLeftEyeRot)
          if (rightEye && originalRightEyeRot) rightEye.rotation.copy(originalRightEyeRot)
        }
        animate()

        // Handle resize
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
          cameraControls.update()
        }

        window.addEventListener('resize', handleResize)

        // Final cleanup function
        cleanup = () => {
          window.removeEventListener('resize', handleResize)

          // Stop animation loop
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }

          // Clean up VRM
          if (vrm) {
            scene.remove(vrm.scene)
            vrm.dispose?.()
          }

          // Clean up mixer
          if (mixer) {
            mixer.stopAllAction()
            mixer.uncacheRoot(mixer.getRoot())
          }

          // Clean up controls and renderer
          cameraControls.dispose()
          renderer.dispose()

          // Clean up Microphone
          camera.remove(microphone)
          microphone.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose()
              if (Array.isArray(child.material)) {
                child.material.forEach((m: THREE.Material) => m.dispose())
              } else {
                child.material.dispose()
              }
            }
          })

          // Clear scene
          scene.clear()

          // Reset loading flag
          isLoadingRef.current = false
        }

      } catch (err) {
        setError('VRMの初期化に失敗しました')
        isLoadingRef.current = false
      }
    }

    initVRM()

    return () => {
      if (cleanup) cleanup()
    }
  }, [modelPath]) // modelPathが変更された時のみ再初期化

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
