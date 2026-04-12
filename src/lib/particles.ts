import { Box3, Mesh, Raycaster, Vector3 } from 'three'
import type { Fire } from '../data/fires'

export type ChemicalType = 'pm25' | 'pahs' | 'formaldehyde' | 'benzene' | 'dioxins'

export const CHEM_COLORS: Record<ChemicalType, [number, number, number]> = {
  pm25: [0.92, 0.94, 0.97],
  pahs: [1.0, 0.7, 0.2],
  formaldehyde: [1.0, 0.88, 0.2],
  benzene: [0.3, 0.7, 1.0],
  dioxins: [1.0, 0.25, 0.45],
}

export const CHEM_LABELS: Record<ChemicalType, string> = {
  pm25: 'PM2.5',
  pahs: 'PAHs',
  formaldehyde: 'Formaldehyde',
  benzene: 'Benzene',
  dioxins: 'Dioxins',
}

const CHEM_SCALE: Record<ChemicalType, number> = {
  pm25: 5,
  pahs: 0.25,
  formaldehyde: 0.5,
  benzene: 0.1,
  dioxins: 1,
}

export type FireParticles = {
  fireId: string
  positions: Float32Array
  colors: Float32Array
  count: number
}

function chemParticleCount(fire: Fire): { type: ChemicalType; count: number }[] {
  return [
    {
      type: 'pm25',
      count: Math.max(1, Math.round(fire.chemicals.pm25_mg / CHEM_SCALE.pm25)),
    },
    {
      type: 'pahs',
      count: Math.max(1, Math.round(fire.chemicals.pahs_mg / CHEM_SCALE.pahs)),
    },
    {
      type: 'formaldehyde',
      count: Math.max(
        1,
        Math.round(fire.chemicals.formaldehyde_mg / CHEM_SCALE.formaldehyde)
      ),
    },
    {
      type: 'benzene',
      count: Math.max(
        1,
        Math.round(fire.chemicals.benzene_mg / CHEM_SCALE.benzene)
      ),
    },
    {
      type: 'dioxins',
      count: Math.max(
        1,
        Math.round(fire.chemicals.dioxins_ug / CHEM_SCALE.dioxins)
      ),
    },
  ]
}

function sampleUniformInsideMesh(
  mesh: Mesh,
  bbox: Box3,
  count: number
): Vector3[] {
  const raycaster = new Raycaster()
  const direction = new Vector3(1, 0, 0)
  const min = bbox.min
  const max = bbox.max

  const points: Vector3[] = []
  let attempts = 0
  const maxAttempts = count * 40

  while (points.length < count && attempts < maxAttempts) {
    attempts++
    const p = new Vector3(
      min.x + Math.random() * (max.x - min.x),
      min.y + Math.random() * (max.y - min.y),
      min.z + Math.random() * (max.z - min.z)
    )
    raycaster.set(p, direction)
    const hits = raycaster.intersectObject(mesh, false)
    if (hits.length % 2 === 1) {
      points.push(p)
    }
  }

  return points
}

export function generateFireParticlesUniform(
  fire: Fire,
  mesh: Mesh,
  bbox: Box3
): FireParticles {
  const chemCounts = chemParticleCount(fire)
  const total = chemCounts.reduce((s, c) => s + c.count, 0)

  const points = sampleUniformInsideMesh(mesh, bbox, total)
  const actual = points.length

  const positions = new Float32Array(actual * 3)
  const colors = new Float32Array(actual * 3)

  let idx = 0
  for (const { type, count } of chemCounts) {
    const color = CHEM_COLORS[type]
    const end = Math.min(idx + count, actual)
    for (; idx < end; idx++) {
      const p = points[idx]
      positions[idx * 3] = p.x
      positions[idx * 3 + 1] = p.y
      positions[idx * 3 + 2] = p.z
      colors[idx * 3] = color[0]
      colors[idx * 3 + 1] = color[1]
      colors[idx * 3 + 2] = color[2]
    }
  }

  return { fireId: fire.id, positions, colors, count: actual }
}
