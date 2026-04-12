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
import type { Fire } from '../data/fires'
import {
  generateFireParticlesUniform,
  type FireParticles,
} from '../lib/particles'

useGLTF.preload('/models/human_base_mesh_male/scene.gltf')

type StageProps = {
  fires: Fire[]
  selectedFireId: string | null
  onSelectFire: (id: string | null) => void
  timeIndex: number
}

function CameraSetup({ center }: { center: Vector3 }) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    camera.position.set(center.x, center.y + 0.15, center.z + 4.8)
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
      enableZoom={false}
    />
  )
}

function Stage({ fires, selectedFireId, timeIndex, onReady }: StageProps & { onReady?: () => void }) {
  const readyFired = useRef(false)
  const { scene } = useGLTF('/models/human_base_mesh_male/scene.gltf')
  const [particles, setParticles] = useState<FireParticles[]>([])
  const [bodyCenter, setBodyCenter] = useState(new Vector3(0, 0, 0))
  const meshRef = useRef<Mesh | null>(null)
  const bboxRef = useRef<Box3 | null>(null)
  const materialSetup = useRef(false)

  // Set up mesh material once
  useEffect(() => {
    if (materialSetup.current) return
    materialSetup.current = true

    scene.traverse((obj) => {
      const m = obj as Mesh
      if (m.isMesh && !meshRef.current) {
        meshRef.current = m
        const material = m.material as MeshStandardMaterial
        material.transparent = true
        material.opacity = 0.16
        material.color.set('#d4d8de')
        material.emissive?.set('#2a3340')
        material.depthWrite = false
      }
    })

    if (!meshRef.current) return

    scene.updateMatrixWorld(true)
    const bbox = new Box3().setFromObject(scene)
    bboxRef.current = bbox
    const center = new Vector3()
    bbox.getCenter(center)
    setBodyCenter(center)
  }, [scene])

  // Generate particles when fires change
  useEffect(() => {
    if (!meshRef.current || !bboxRef.current) return
    const mesh = meshRef.current
    const bbox = bboxRef.current

    const newParticles = fires.map((fire) =>
      generateFireParticlesUniform(fire, mesh, bbox)
    )
    setParticles(newParticles)
    if (!readyFired.current && onReady) {
      readyFired.current = true
      onReady()
    }
  }, [fires, onReady])

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

  const size = 0.03

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
  fires: Fire[]
  selectedFireId: string | null
  onSelectFire: (id: string | null) => void
  timeIndex: number
  onReady?: () => void
}

export default function Scene({ fires, selectedFireId, onSelectFire, timeIndex, onReady }: SceneProps) {
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
          fires={fires}
          selectedFireId={selectedFireId}
          onSelectFire={onSelectFire}
          timeIndex={timeIndex}
          onReady={onReady}
        />
      </Suspense>
    </Canvas>
  )
}
