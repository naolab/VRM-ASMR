import * as THREE from "three"
import { VRM } from "@pixiv/three-vrm"

/**
 * 目線を制御するクラス
 *
 * サッケードはVRMLookAtSmootherの中でやっているので、
 * より目線を大きく動かしたい場合はここに実装する。
 */
export class AutoLookAt {


  constructor(vrm: VRM, target: THREE.Object3D) {
    if (vrm.lookAt) vrm.lookAt.target = target
  }
}
