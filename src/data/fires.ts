export type FuelCategory = 'timber' | 'wui' | 'grass' | 'chaparral'

export type Fire = {
  id: string
  name: string
  year: number
  startDate: string
  endDate: string
  daysWorked: number
  location: string
  acres: number
  fuelMix: Partial<Record<FuelCategory, number>>
  chemicals: {
    pm25_mg: number
    pahs_mg: number
    formaldehyde_mg: number
    benzene_mg: number
    dioxins_ug: number
  }
  particles: {
    mass: number
    carcinogen: number
    acute: number
  }
  clusterCenter: [number, number, number]
  clusterRadius: number
  sources: { label: string; url: string }[]
}

export const DANIEL = {
  name: 'Daniel Ramirez',
  role: 'Hotshot · Los Padres Hotshots',
  seasonsWorked: 9,
  careerStart: 2016,
}

export const FIRES: Fire[] = [
  {
    id: 'thomas-2017',
    name: 'Thomas Fire',
    year: 2017,
    startDate: '2017-12-04',
    endDate: '2017-12-22',
    daysWorked: 18,
    location: 'Ventura & Santa Barbara Counties, CA',
    acres: 281_893,
    fuelMix: { chaparral: 0.72, wui: 0.14, grass: 0.14 },
    chemicals: {
      pm25_mg: 612,
      pahs_mg: 18.4,
      formaldehyde_mg: 41.2,
      benzene_mg: 2.1,
      dioxins_ug: 0.8,
    },
    particles: { mass: 2400, carcinogen: 310, acute: 85 },
    clusterCenter: [-0.35, 0.55, 0.0],
    clusterRadius: 0.22,
    sources: [
      { label: 'EPA AirNow · Ventura Co. monitor', url: 'https://www.airnow.gov/' },
      { label: 'InciWeb · Thomas Fire incident archive', url: 'https://inciweb.wildfire.gov/' },
      { label: 'Urbanski 2014 · chaparral emission factors', url: 'https://doi.org/10.1016/j.foreco.2013.06.043' },
    ],
  },
  {
    id: 'mendocino-2018',
    name: 'Mendocino Complex',
    year: 2018,
    startDate: '2018-07-27',
    endDate: '2018-08-19',
    daysWorked: 22,
    location: 'Mendocino, Lake & Colusa Counties, CA',
    acres: 459_123,
    fuelMix: { timber: 0.64, chaparral: 0.28, grass: 0.08 },
    chemicals: {
      pm25_mg: 891,
      pahs_mg: 32.6,
      formaldehyde_mg: 58.3,
      benzene_mg: 1.4,
      dioxins_ug: 0.4,
    },
    particles: { mass: 3200, carcinogen: 480, acute: 52 },
    clusterCenter: [0.3, 0.45, 0.0],
    clusterRadius: 0.22,
    sources: [
      { label: 'EPA AirNow · Lake Co. monitor', url: 'https://www.airnow.gov/' },
      { label: 'LANDFIRE EVT raster · Mendocino NF', url: 'https://landfire.gov/' },
      { label: 'Akagi et al. 2011 · timber combustion factors', url: 'https://doi.org/10.5194/acp-11-4039-2011' },
    ],
  },
  {
    id: 'camp-2018',
    name: 'Camp Fire',
    year: 2018,
    startDate: '2018-11-08',
    endDate: '2018-11-25',
    daysWorked: 17,
    location: 'Butte County, CA (Paradise)',
    acres: 153_336,
    fuelMix: { wui: 0.71, timber: 0.22, grass: 0.07 },
    chemicals: {
      pm25_mg: 1142,
      pahs_mg: 48.9,
      formaldehyde_mg: 71.6,
      benzene_mg: 8.3,
      dioxins_ug: 12.6,
    },
    particles: { mass: 3800, carcinogen: 720, acute: 640 },
    clusterCenter: [0.0, 0.32, 0.0],
    clusterRadius: 0.25,
    sources: [
      { label: 'EPA AirNow · Butte Co. CA-BUT-042', url: 'https://www.airnow.gov/' },
      { label: 'InciWeb · Camp Fire final report', url: 'https://inciweb.wildfire.gov/' },
      { label: 'Rappold et al. 2017 · WUI smoke toxicology', url: 'https://doi.org/10.1021/acs.estlett.7b00306' },
    ],
  },
  {
    id: 'august-complex-2020',
    name: 'August Complex',
    year: 2020,
    startDate: '2020-08-20',
    endDate: '2020-09-18',
    daysWorked: 28,
    location: 'Mendocino NF, CA',
    acres: 1_032_648,
    fuelMix: { timber: 0.82, chaparral: 0.12, grass: 0.06 },
    chemicals: {
      pm25_mg: 1480,
      pahs_mg: 52.1,
      formaldehyde_mg: 94.7,
      benzene_mg: 2.3,
      dioxins_ug: 0.7,
    },
    particles: { mass: 4100, carcinogen: 780, acute: 95 },
    clusterCenter: [-0.22, 0.18, 0.0],
    clusterRadius: 0.25,
    sources: [
      { label: 'EPA AirNow · Mendocino Co.', url: 'https://www.airnow.gov/' },
      { label: 'InciWeb · August Complex archive', url: 'https://inciweb.wildfire.gov/' },
      { label: 'Akagi et al. 2011', url: 'https://doi.org/10.5194/acp-11-4039-2011' },
    ],
  },
  {
    id: 'creek-2020',
    name: 'Creek Fire',
    year: 2020,
    startDate: '2020-09-05',
    endDate: '2020-09-23',
    daysWorked: 18,
    location: 'Sierra NF, CA',
    acres: 379_895,
    fuelMix: { timber: 0.88, chaparral: 0.08, grass: 0.04 },
    chemicals: {
      pm25_mg: 962,
      pahs_mg: 38.4,
      formaldehyde_mg: 67.2,
      benzene_mg: 1.6,
      dioxins_ug: 0.5,
    },
    particles: { mass: 3400, carcinogen: 560, acute: 68 },
    clusterCenter: [0.3, 0.08, 0.0],
    clusterRadius: 0.22,
    sources: [
      { label: 'EPA AirNow · Fresno Co.', url: 'https://www.airnow.gov/' },
      { label: 'Urbanski 2014', url: 'https://doi.org/10.1016/j.foreco.2013.06.043' },
    ],
  },
  {
    id: 'bootleg-2021',
    name: 'Bootleg Fire',
    year: 2021,
    startDate: '2021-07-14',
    endDate: '2021-08-01',
    daysWorked: 19,
    location: 'Fremont-Winema NF, OR',
    acres: 413_765,
    fuelMix: { timber: 0.7, grass: 0.24, chaparral: 0.06 },
    chemicals: {
      pm25_mg: 1010,
      pahs_mg: 34.2,
      formaldehyde_mg: 59.8,
      benzene_mg: 1.2,
      dioxins_ug: 0.3,
    },
    particles: { mass: 3500, carcinogen: 510, acute: 48 },
    clusterCenter: [-0.3, -0.15, 0.0],
    clusterRadius: 0.22,
    sources: [
      { label: 'EPA AirNow · Klamath Co. OR', url: 'https://www.airnow.gov/' },
      { label: 'InciWeb · Bootleg Fire archive', url: 'https://inciweb.wildfire.gov/' },
    ],
  },
  {
    id: 'dixie-2021',
    name: 'Dixie Fire',
    year: 2021,
    startDate: '2021-07-21',
    endDate: '2021-08-14',
    daysWorked: 25,
    location: 'Butte, Plumas, Lassen, Tehama & Shasta Cos., CA',
    acres: 963_309,
    fuelMix: { timber: 0.79, wui: 0.12, chaparral: 0.09 },
    chemicals: {
      pm25_mg: 1390,
      pahs_mg: 51.8,
      formaldehyde_mg: 88.4,
      benzene_mg: 3.8,
      dioxins_ug: 2.1,
    },
    particles: { mass: 4000, carcinogen: 740, acute: 180 },
    clusterCenter: [0.05, -0.22, 0.0],
    clusterRadius: 0.25,
    sources: [
      { label: 'EPA AirNow · Plumas Co.', url: 'https://www.airnow.gov/' },
      { label: 'InciWeb · Dixie Fire archive', url: 'https://inciweb.wildfire.gov/' },
      { label: 'Akagi et al. 2011', url: 'https://doi.org/10.5194/acp-11-4039-2011' },
    ],
  },
  {
    id: 'caldor-2021',
    name: 'Caldor Fire',
    year: 2021,
    startDate: '2021-08-17',
    endDate: '2021-09-04',
    daysWorked: 19,
    location: 'El Dorado & Amador Counties, CA',
    acres: 221_835,
    fuelMix: { timber: 0.62, wui: 0.28, chaparral: 0.1 },
    chemicals: {
      pm25_mg: 984,
      pahs_mg: 42.1,
      formaldehyde_mg: 63.7,
      benzene_mg: 6.9,
      dioxins_ug: 9.4,
    },
    particles: { mass: 3500, carcinogen: 620, acute: 510 },
    clusterCenter: [0.32, -0.35, 0.0],
    clusterRadius: 0.22,
    sources: [
      { label: 'EPA AirNow · El Dorado Co.', url: 'https://www.airnow.gov/' },
      { label: 'InciWeb · Caldor Fire · Grizzly Flats', url: 'https://inciweb.wildfire.gov/' },
      { label: 'Rappold et al. 2017 · WUI smoke', url: 'https://doi.org/10.1021/acs.estlett.7b00306' },
    ],
  },
  {
    id: 'mosquito-2022',
    name: 'Mosquito Fire',
    year: 2022,
    startDate: '2022-09-06',
    endDate: '2022-09-25',
    daysWorked: 20,
    location: 'Placer & El Dorado Counties, CA',
    acres: 76_788,
    fuelMix: { timber: 0.74, wui: 0.18, chaparral: 0.08 },
    chemicals: {
      pm25_mg: 820,
      pahs_mg: 31.8,
      formaldehyde_mg: 52.4,
      benzene_mg: 4.2,
      dioxins_ug: 3.9,
    },
    particles: { mass: 2900, carcinogen: 470, acute: 220 },
    clusterCenter: [-0.25, -0.5, 0.0],
    clusterRadius: 0.22,
    sources: [
      { label: 'EPA AirNow · Placer Co.', url: 'https://www.airnow.gov/' },
      { label: 'InciWeb · Mosquito Fire archive', url: 'https://inciweb.wildfire.gov/' },
    ],
  },
]

export function totals(fires: Fire[]) {
  const t = fires.reduce(
    (acc, f) => {
      acc.days += f.daysWorked
      acc.pm25 += f.chemicals.pm25_mg
      acc.pahs += f.chemicals.pahs_mg
      acc.formaldehyde += f.chemicals.formaldehyde_mg
      acc.benzene += f.chemicals.benzene_mg
      acc.dioxins += f.chemicals.dioxins_ug
      return acc
    },
    { days: 0, pm25: 0, pahs: 0, formaldehyde: 0, benzene: 0, dioxins: 0 }
  )
  // 1 cigarette ≈ 1 mg inhaled PM2.5 (standard air pollution epi conversion)
  const cigarettes = Math.round(t.pm25)
  return { ...t, cigarettes }
}
