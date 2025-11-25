import * as THREE from 'three'

/**
 * 一般的なスタジオマイク（コンデンサーマイク風）の3Dモデルを作成する
 */
export const createMicrophone = (): THREE.Group => {
    const group = new THREE.Group()

    // --- Materials ---
    const bodyColor = 0x333333 // ダークグレー/黒
    const meshColor = 0xc0c0c0 // シルバー
    const standColor = 0x111111 // 黒

    const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.5,
        metalness: 0.6
    })

    const meshMat = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.3,
        metalness: 0.8,
        wireframe: true // メッシュっぽさを表現
    })

    // メッシュの内側のスポンジ/カプセル用
    const innerMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.9
    })

    const standMat = new THREE.MeshStandardMaterial({
        color: standColor,
        roughness: 0.7,
        metalness: 0.2
    })

    // --- Geometry Construction ---

    // 1. Microphone Body (Cylinder)
    const bodyRadius = 0.025
    const bodyHeight = 0.12
    const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 0.8, bodyHeight, 32)
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0
    group.add(body)

    // 2. Microphone Head (Mesh Grille)
    const headRadius = 0.028
    const headHeight = 0.06
    // カプセル型にするためにSphereとCylinderを組み合わせるか、単純にSphereにする
    // ここでは少し縦長のSphereにする
    const headGeo = new THREE.SphereGeometry(headRadius, 32, 16)
    const head = new THREE.Mesh(headGeo, meshMat)
    head.scale.set(1, 1.3, 1)
    head.position.y = bodyHeight / 2 + (headRadius * 1.3) / 2
    group.add(head)

    // Inner capsule (visible through wireframe)
    const innerGeo = new THREE.SphereGeometry(headRadius * 0.8, 16, 16)
    const inner = new THREE.Mesh(innerGeo, innerMat)
    inner.scale.set(1, 1.3, 1)
    inner.position.y = head.position.y
    group.add(inner)

    // 3. Ring/Collar between body and head
    const ringGeo = new THREE.CylinderGeometry(headRadius, bodyRadius, 0.01, 32)
    const ring = new THREE.Mesh(ringGeo, bodyMat)
    ring.position.y = bodyHeight / 2
    group.add(ring)

    // 4. Stand Mount (Shock mount simplified)
    const mountGeo = new THREE.TorusGeometry(bodyRadius * 1.2, 0.005, 8, 32)
    const mount = new THREE.Mesh(mountGeo, standMat)
    mount.rotation.x = Math.PI / 2
    mount.position.y = -bodyHeight / 4
    group.add(mount)

    // Connectors for shock mount
    const connectorGeo = new THREE.CylinderGeometry(0.003, 0.003, bodyRadius * 0.4, 8)
    for (let i = 0; i < 4; i++) {
        const connector = new THREE.Mesh(connectorGeo, standMat)
        const angle = (i / 4) * Math.PI * 2
        connector.position.set(
            Math.cos(angle) * bodyRadius,
            -bodyHeight / 4,
            Math.sin(angle) * bodyRadius
        )
        connector.rotation.z = Math.PI / 2
        connector.rotation.y = angle
        group.add(connector)
    }

    // 5. Stand Pole
    const poleGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 16)
    const pole = new THREE.Mesh(poleGeo, standMat)
    pole.position.y = -(bodyHeight / 2 + 0.15)
    group.add(pole)

    // 6. Base (Simple disc)
    const baseGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.01, 32)
    const base = new THREE.Mesh(baseGeo, standMat)
    base.position.y = -(bodyHeight / 2 + 0.3)
    group.add(base)

    return group
}
