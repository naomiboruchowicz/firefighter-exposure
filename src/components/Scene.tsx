import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei'
import { useEffect, useRef, useState, Suspense } from 'react'
import {
  AdditiveBlending,
  Box3,
  Mesh,
  Vector3,
  type MeshStandardMaterial,
} from 'three'
import { FIRES } from '../data/fires'
import {
  generateFireParticlesUniform,
  type FireParticles,
} from '../lib/particles'

useGLTF.preload('/models/human_base_mesh_male/scene.gltf')

type StageProps = {
  selectedFireId: string | null
  onSelectFire: (id: string | null) => void
}

function CameraSetup({ center }: { center: Vector3 }) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    camera.position.set(center.x, center.y + 0.15, center.z + 3.6)
    camera.lookAt(center)
    if (controlsRef.current) {
      controlsRef.current.target.copy(center)
      controlsRef.current.update()
    }
  }, [center, camera])

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={1.5}
      maxDistance={8}
    />
  )
}

function Stage({ selectedFireId, onSelectFire, timeIndex }: StageProps) {
  const { scene } = useGLTF('/models/human_base_mesh_male/scene.gltf')
  const [particles, setParticles] = useState<FireParticles[]>([])
  const [bodyCenter, setBodyCenter] = useState(new Vector3(0, 0, 0))
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    let mesh: Mesh | null = null
    scene.traverse((obj) => {
      const m = obj as Mesh
      if (m.isMesh && !mesh) {
        mesh = m
        const material = m.material as MeshStandardMaterial
        material.transparent = true
        material.opacity = 0.16
        material.color.set('#d4d8de')
        material.emissive?.set('#2a3340')
        material.depthWrite = false
      }
    })

    if (!mesh) return

    scene.updateMatrixWorld(true)
    const bbox = new Box3().setFromObject(scene)
    const center = new Vector3()
    bbox.getCenter(center)
    setBodyCenter(center)

    console.log('Body bbox:', bbox.min.toArray(), bbox.max.toArray())
    console.log('Body center:', center.toArray())

    const newParticles = FIRES.map((fire) =>
      generateFireParticlesUniform(fire, mesh!, bbox)
    )
    setParticles(newParticles)
    console.log(
      'Total particles:',
      newParticles.reduce((s, p) => s + p.count, 0)
    )
  }, [scene])

  const anySelected = selectedFireId !== null
  const visibleParticles = particles.filter((_, i) => i < timeIndex)

  return (
    <>
      <primitive object={scene} />
      <CameraSetup center={bodyCenter} />
      {visibleParticles.map((fp) => (
        <FireCloud
          key={fp.fireId}
          fp={fp}
          selected={selectedFireId === fp.fireId}
          anySelected={anySelected}
        />
      ))}
    </>
  )
}

type FireCloudProps = {
  fp: FireParticles
  selected: boolean
  anySelected: boolean
}

function FireCloud({ fp, selected, anySelected }: FireCloudProps) {
  const { positions, colors, count } = fp

  let opacity = 0.92
  if (anySelected) opacity = selected ? 1 : 0.05

  const size = selected ? 0.08 : 0.05

  if (count === 0) return null

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        transparent
        opacity={opacity}
        size={size}
        sizeAttenuation
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}

type SceneProps = {
  selectedFireId: string | null
  onSelectFire: (id: string | null) => void
  timeIndex: number
}

export default function Scene({ selectedFireId, onSelectFire, timeIndex }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#07080a']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={0.7} />
      <directionalLight
        position={[-4, 2, -3]}
        intensity={0.35}
        color="#8ea0bd"
      />
      <Suspense fallback={null}>
        <Stage
          selectedFireId={selectedFireId}
          onSelectFire={onSelectFire}
          timeIndex={timeIndex}
        />
      </Suspense>
    </Canvas>
  )
}
