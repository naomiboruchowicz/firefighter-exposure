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

// Per-day exposure rates by fuel category, derived from published emission factors
// (Akagi et al. 2011, Urbanski 2014, Rappold et al. 2017)
const RATES: Record<FuelCategory, { pm25: number; pah: number; form: number; benz: number; diox: number; mass: number; carc: number; acute: number }> = {
  timber:    { pm25: 45, pah: 1.7, form: 3.0, benz: 0.07, diox: 0.02, mass: 140, carc: 28, acute: 3 },
  chaparral: { pm25: 35, pah: 1.1, form: 2.3, benz: 0.10, diox: 0.04, mass: 130, carc: 17, acute: 4 },
  wui:       { pm25: 60, pah: 2.5, form: 4.0, benz: 0.45, diox: 0.60, mass: 180, carc: 40, acute: 35 },
  grass:     { pm25: 30, pah: 0.9, form: 2.0, benz: 0.05, diox: 0.01, mass: 100, carc: 12, acute: 2 },
}

function estimate(fuelMix: Partial<Record<FuelCategory, number>>, daysWorked: number) {
  let pm25 = 0, pah = 0, form = 0, benz = 0, diox = 0, mass = 0, carc = 0, acute = 0
  for (const [fuel, pct] of Object.entries(fuelMix) as [FuelCategory, number][]) {
    const r = RATES[fuel]
    pm25 += r.pm25 * pct; pah += r.pah * pct; form += r.form * pct
    benz += r.benz * pct; diox += r.diox * pct
    mass += r.mass * pct; carc += r.carc * pct; acute += r.acute * pct
  }
  return {
    chemicals: {
      pm25_mg: Math.round(pm25 * daysWorked),
      pahs_mg: Math.round(pah * daysWorked * 10) / 10,
      formaldehyde_mg: Math.round(form * daysWorked * 10) / 10,
      benzene_mg: Math.round(benz * daysWorked * 10) / 10,
      dioxins_ug: Math.round(diox * daysWorked * 10) / 10,
    },
    particles: {
      mass: Math.round(mass * daysWorked),
      carcinogen: Math.round(carc * daysWorked),
      acute: Math.round(acute * daysWorked),
    },
  }
}

function fire(
  id: string, name: string, year: number,
  startDate: string, endDate: string, daysWorked: number,
  location: string, acres: number,
  fuelMix: Partial<Record<FuelCategory, number>>,
  sources: { label: string; url: string }[] = [{ label: 'InciWeb · incident archive', url: 'https://inciweb.wildfire.gov/' }],
): Fire {
  return {
    id, name, year, startDate, endDate, daysWorked, location, acres, fuelMix,
    ...estimate(fuelMix, daysWorked),
    clusterCenter: [0, 0, 0],
    clusterRadius: 0.22,
    sources,
  }
}

export const DANIEL = {
  name: 'Daniel Ramirez',
  role: 'Los Padres Hotshots',
  seasonsWorked: 9,
  careerStart: 2016,
}

// ── Demo fires (hand-tuned exposure data, placed cluster centers) ──────────

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

// ── Full fire catalog (estimated exposure from fuel mix + days) ─────────────

export const MORE_FIRES: Fire[] = [
  // 2003
  fire('cedar-2003', 'Cedar Fire', 2003, '2003-10-25', '2003-11-04', 10, 'San Diego County, CA', 273_246, { chaparral: 0.48, wui: 0.42, grass: 0.1 }),
  fire('old-2003', 'Old Fire', 2003, '2003-10-25', '2003-11-02', 8, 'San Bernardino County, CA', 91_281, { chaparral: 0.4, wui: 0.5, grass: 0.1 }),

  // 2006
  fire('day-2006', 'Day Fire', 2006, '2006-09-04', '2006-10-13', 25, 'Ventura County, CA', 162_702, { chaparral: 0.82, timber: 0.12, grass: 0.06 }),
  fire('esperanza-2006', 'Esperanza Fire', 2006, '2006-10-26', '2006-10-31', 5, 'Riverside County, CA', 40_200, { chaparral: 0.6, wui: 0.3, grass: 0.1 }),

  // 2007
  fire('witch-2007', 'Witch Fire', 2007, '2007-10-21', '2007-10-31', 10, 'San Diego County, CA', 197_990, { chaparral: 0.45, wui: 0.45, grass: 0.1 }),
  fire('zaca-2007', 'Zaca Fire', 2007, '2007-07-04', '2007-09-02', 35, 'Santa Barbara County, CA', 240_207, { chaparral: 0.7, grass: 0.2, timber: 0.1 }),
  fire('harris-2007', 'Harris Fire', 2007, '2007-10-21', '2007-10-29', 8, 'San Diego County, CA', 90_440, { grass: 0.5, chaparral: 0.35, wui: 0.15 }),

  // 2008
  fire('basin-complex-2008', 'Basin Complex', 2008, '2008-06-21', '2008-07-27', 30, 'Monterey County, CA', 162_818, { chaparral: 0.6, timber: 0.35, grass: 0.05 }),

  // 2009
  fire('station-2009', 'Station Fire', 2009, '2009-08-26', '2009-10-16', 28, 'Los Angeles County, CA', 160_577, { chaparral: 0.55, wui: 0.3, timber: 0.15 }),

  // 2011
  fire('wallow-2011', 'Wallow Fire', 2011, '2011-05-29', '2011-07-08', 30, 'Apache & Greenlee Counties, AZ', 538_049, { timber: 0.72, grass: 0.22, chaparral: 0.06 }),
  fire('las-conchas-2011', 'Las Conchas Fire', 2011, '2011-06-26', '2011-08-01', 22, 'Sandoval & Los Alamos Counties, NM', 156_293, { timber: 0.8, grass: 0.12, chaparral: 0.08 }),

  // 2012
  fire('waldo-canyon-2012', 'Waldo Canyon Fire', 2012, '2012-06-23', '2012-07-10', 14, 'El Paso County, CO', 18_247, { timber: 0.45, wui: 0.45, chaparral: 0.1 }),
  fire('high-park-2012', 'High Park Fire', 2012, '2012-06-09', '2012-06-30', 21, 'Larimer County, CO', 87_250, { timber: 0.85, grass: 0.1, chaparral: 0.05 }),
  fire('whitewater-baldy-2012', 'Whitewater-Baldy Complex', 2012, '2012-05-16', '2012-07-20', 40, 'Catron & Grant Counties, NM', 297_845, { timber: 0.78, grass: 0.16, chaparral: 0.06 }),

  // 2013
  fire('rim-2013', 'Rim Fire', 2013, '2013-08-17', '2013-10-24', 26, 'Tuolumne County, CA', 257_314, { timber: 0.88, chaparral: 0.08, grass: 0.04 }),
  fire('yarnell-2013', 'Yarnell Hill Fire', 2013, '2013-06-28', '2013-07-10', 12, 'Yavapai County, AZ', 8_400, { chaparral: 0.75, grass: 0.2, wui: 0.05 }),
  fire('beaver-creek-2013', 'Beaver Creek Fire', 2013, '2013-08-07', '2013-08-22', 15, 'Blaine & Camas Counties, ID', 114_182, { timber: 0.6, grass: 0.35, chaparral: 0.05 }),
  fire('silver-2013', 'Silver Fire', 2013, '2013-06-07', '2013-06-29', 16, 'Grant County, NM', 138_705, { timber: 0.7, grass: 0.25, chaparral: 0.05 }),

  // 2014
  fire('king-2014', 'King Fire', 2014, '2014-09-13', '2014-10-09', 20, 'El Dorado County, CA', 97_717, { timber: 0.85, chaparral: 0.1, grass: 0.05 }),
  fire('carlton-complex-2014', 'Carlton Complex', 2014, '2014-07-14', '2014-08-10', 22, 'Okanogan County, WA', 256_108, { timber: 0.55, grass: 0.38, chaparral: 0.07 }),
  fire('happy-camp-2014', 'Happy Camp Complex', 2014, '2014-08-14', '2014-11-01', 35, 'Siskiyou County, CA', 134_056, { timber: 0.9, chaparral: 0.06, grass: 0.04 }),

  // 2015
  fire('valley-2015', 'Valley Fire', 2015, '2015-09-12', '2015-09-23', 11, 'Lake County, CA', 76_067, { timber: 0.4, wui: 0.45, chaparral: 0.15 }),
  fire('rough-2015', 'Rough Fire', 2015, '2015-07-31', '2015-09-27', 40, 'Fresno County, CA', 151_623, { timber: 0.9, chaparral: 0.06, grass: 0.04 }),
  fire('okanogan-complex-2015', 'Okanogan Complex', 2015, '2015-08-14', '2015-09-12', 24, 'Okanogan County, WA', 304_782, { timber: 0.55, grass: 0.38, chaparral: 0.07 }),

  // 2016
  fire('soberanes-2016', 'Soberanes Fire', 2016, '2016-07-22', '2016-10-12', 50, 'Monterey County, CA', 132_127, { chaparral: 0.55, timber: 0.4, grass: 0.05 }),
  fire('sand-2016', 'Sand Fire', 2016, '2016-07-22', '2016-07-28', 6, 'Los Angeles County, CA', 41_432, { chaparral: 0.55, wui: 0.35, grass: 0.1 }),
  fire('pioneer-2016', 'Pioneer Fire', 2016, '2016-07-18', '2016-10-05', 45, 'Boise County, ID', 188_404, { timber: 0.92, chaparral: 0.05, grass: 0.03 }),
  fire('chimney-tops-2016', 'Chimney Tops 2 Fire', 2016, '2016-11-23', '2016-12-05', 12, 'Sevier County, TN (Gatlinburg)', 17_140, { timber: 0.4, wui: 0.55, chaparral: 0.05 }),

  // 2017
  fire('tubbs-2017', 'Tubbs Fire', 2017, '2017-10-08', '2017-10-31', 23, 'Napa & Sonoma Counties, CA', 36_807, { wui: 0.65, timber: 0.2, chaparral: 0.15 }),
  fire('nuns-2017', 'Nuns Fire', 2017, '2017-10-08', '2017-10-30', 18, 'Sonoma County, CA', 54_382, { wui: 0.42, chaparral: 0.38, timber: 0.2 }),
  fire('detwiler-2017', 'Detwiler Fire', 2017, '2017-07-16', '2017-08-08', 18, 'Mariposa County, CA', 81_826, { chaparral: 0.55, timber: 0.4, grass: 0.05 }),
  fire('eagle-creek-2017', 'Eagle Creek Fire', 2017, '2017-09-02', '2017-11-30', 30, 'Hood River & Multnomah Counties, OR', 48_831, { timber: 0.92, chaparral: 0.05, grass: 0.03 }),
  fire('whittier-2017', 'Whittier Fire', 2017, '2017-07-08', '2017-08-08', 22, 'Santa Barbara County, CA', 18_430, { chaparral: 0.75, timber: 0.2, grass: 0.05 }),

  // 2018
  fire('woolsey-2018', 'Woolsey Fire', 2018, '2018-11-08', '2018-11-22', 14, 'Los Angeles & Ventura Counties, CA', 96_949, { wui: 0.58, chaparral: 0.35, grass: 0.07 }),
  fire('carr-2018', 'Carr Fire', 2018, '2018-07-23', '2018-08-30', 20, 'Shasta & Trinity Counties, CA', 229_651, { timber: 0.62, wui: 0.24, chaparral: 0.14 }),
  fire('ferguson-2018', 'Ferguson Fire', 2018, '2018-07-13', '2018-08-18', 22, 'Mariposa County, CA', 96_901, { timber: 0.84, chaparral: 0.12, grass: 0.04 }),
  fire('holy-2018', 'Holy Fire', 2018, '2018-08-06', '2018-09-13', 16, 'Orange & Riverside Counties, CA', 23_136, { chaparral: 0.6, wui: 0.3, timber: 0.1 }),
  fire('spring-creek-2018', 'Spring Creek Fire', 2018, '2018-06-27', '2018-07-13', 16, 'Costilla & Huerfano Counties, CO', 108_045, { timber: 0.55, grass: 0.4, chaparral: 0.05 }),
  fire('donnell-2018', 'Donnell Fire', 2018, '2018-08-01', '2018-09-18', 28, 'Tuolumne County, CA', 36_544, { timber: 0.88, chaparral: 0.08, grass: 0.04 }),

  // 2019
  fire('kincade-2019', 'Kincade Fire', 2019, '2019-10-23', '2019-11-06', 14, 'Sonoma County, CA', 77_758, { chaparral: 0.55, timber: 0.3, wui: 0.15 }),
  fire('walker-2019', 'Walker Fire', 2019, '2019-09-04', '2019-09-23', 19, 'Plumas County, CA', 54_612, { timber: 0.88, chaparral: 0.08, grass: 0.04 }),
  fire('museum-2019', 'Museum Fire', 2019, '2019-07-21', '2019-07-30', 9, 'Coconino County, AZ', 1_961, { timber: 0.75, chaparral: 0.2, grass: 0.05 }),

  // 2020
  fire('czu-2020', 'CZU Lightning Complex', 2020, '2020-08-16', '2020-09-22', 22, 'Santa Cruz & San Mateo Counties, CA', 86_509, { timber: 0.55, wui: 0.3, chaparral: 0.15 }),
  fire('lnu-2020', 'LNU Lightning Complex', 2020, '2020-08-17', '2020-10-02', 26, 'Napa, Sonoma, Solano, Yolo & Lake Counties, CA', 363_220, { timber: 0.4, wui: 0.3, chaparral: 0.2, grass: 0.1 }),
  fire('scu-2020', 'SCU Lightning Complex', 2020, '2020-08-18', '2020-10-01', 25, 'Santa Clara, Alameda & San Joaquin Counties, CA', 396_624, { grass: 0.45, chaparral: 0.35, timber: 0.15, wui: 0.05 }),
  fire('glass-2020', 'Glass Fire', 2020, '2020-09-27', '2020-10-20', 16, 'Napa & Sonoma Counties, CA', 67_484, { wui: 0.42, timber: 0.38, chaparral: 0.2 }),
  fire('cameron-peak-2020', 'Cameron Peak Fire', 2020, '2020-08-13', '2020-12-02', 50, 'Larimer County, CO', 208_913, { timber: 0.85, grass: 0.1, chaparral: 0.05 }),
  fire('east-troublesome-2020', 'East Troublesome Fire', 2020, '2020-10-14', '2020-11-30', 20, 'Grand County, CO', 193_812, { timber: 0.6, wui: 0.3, grass: 0.1 }),
  fire('beachie-creek-2020', 'Beachie Creek Fire', 2020, '2020-08-16', '2020-09-25', 25, 'Marion & Linn Counties, OR', 193_573, { timber: 0.7, wui: 0.2, chaparral: 0.1 }),
  fire('holiday-farm-2020', 'Holiday Farm Fire', 2020, '2020-09-07', '2020-10-26', 24, 'Lane County, OR', 173_393, { timber: 0.55, wui: 0.35, chaparral: 0.1 }),
  fire('almeda-2020', 'Almeda Fire', 2020, '2020-09-08', '2020-09-12', 4, 'Jackson County, OR (Talent/Phoenix)', 3_200, { wui: 0.85, grass: 0.1, chaparral: 0.05 }),
  fire('slater-2020', 'Slater Fire', 2020, '2020-09-08', '2020-10-08', 18, 'Siskiyou County, CA & Josephine County, OR', 157_229, { timber: 0.65, wui: 0.2, chaparral: 0.15 }),

  // 2021
  fire('knp-complex-2021', 'KNP Complex', 2021, '2021-09-09', '2021-12-16', 30, 'Tulare County, CA', 88_307, { timber: 0.92, chaparral: 0.05, grass: 0.03 }),
  fire('windy-2021', 'Windy Fire', 2021, '2021-09-09', '2021-11-22', 28, 'Tulare County, CA', 97_528, { timber: 0.9, chaparral: 0.06, grass: 0.04 }),
  fire('tamarack-2021', 'Tamarack Fire', 2021, '2021-07-04', '2021-08-25', 28, 'Alpine County, CA', 68_637, { timber: 0.85, chaparral: 0.1, grass: 0.05 }),
  fire('river-2021', 'River Fire', 2021, '2021-08-04', '2021-08-13', 9, 'Nevada & Placer Counties, CA', 2_619, { timber: 0.4, wui: 0.5, chaparral: 0.1 }),
  fire('antelope-2021', 'Antelope Fire', 2021, '2021-08-01', '2021-08-16', 15, 'Siskiyou County, CA', 145_632, { timber: 0.8, grass: 0.15, chaparral: 0.05 }),
  fire('monument-2021', 'Monument Fire', 2021, '2021-07-30', '2021-09-15', 28, 'Trinity County, CA', 223_124, { timber: 0.82, chaparral: 0.12, grass: 0.06 }),
  fire('beckwourth-complex-2021', 'Beckwourth Complex', 2021, '2021-06-30', '2021-08-02', 25, 'Plumas County, CA', 105_670, { timber: 0.78, grass: 0.15, chaparral: 0.07 }),
  fire('mccash-2021', 'McCash Fire', 2021, '2021-07-29', '2021-09-28', 35, 'Siskiyou County, CA', 94_067, { timber: 0.85, chaparral: 0.1, grass: 0.05 }),

  // 2022
  fire('hermits-peak-2022', 'Hermits Peak/Calf Canyon', 2022, '2022-04-06', '2022-06-15', 30, 'San Miguel & Mora Counties, NM', 341_471, { timber: 0.78, grass: 0.18, chaparral: 0.04 }),
  fire('oak-2022', 'Oak Fire', 2022, '2022-07-22', '2022-08-07', 16, 'Mariposa County, CA', 19_244, { timber: 0.82, chaparral: 0.12, grass: 0.06 }),
  fire('mckinney-2022', 'McKinney Fire', 2022, '2022-07-29', '2022-09-15', 28, 'Siskiyou County, CA', 60_138, { timber: 0.85, chaparral: 0.1, grass: 0.05 }),
  fire('washburn-2022', 'Washburn Fire', 2022, '2022-07-07', '2022-08-19', 22, 'Mariposa County, CA (Yosemite)', 4_886, { timber: 0.92, chaparral: 0.05, grass: 0.03 }),
  fire('fairview-2022', 'Fairview Fire', 2022, '2022-09-05', '2022-09-14', 9, 'Riverside County, CA', 28_307, { chaparral: 0.5, wui: 0.35, grass: 0.15 }),
  fire('mill-2022', 'Mill Fire', 2022, '2022-09-02', '2022-09-13', 11, 'Siskiyou County, CA (Weed)', 3_935, { wui: 0.6, timber: 0.3, grass: 0.1 }),

  // 2023
  fire('lahaina-2023', 'Lahaina Fire', 2023, '2023-08-08', '2023-08-11', 3, 'Maui County, HI', 2_170, { wui: 0.88, grass: 0.1, chaparral: 0.02 }),
  fire('smith-river-2023', 'Smith River Complex', 2023, '2023-08-15', '2023-10-28', 35, 'Del Norte & Siskiyou Counties, CA & Curry County, OR', 84_717, { timber: 0.88, chaparral: 0.08, grass: 0.04 }),
  fire('york-2023', 'York Fire', 2023, '2023-07-28', '2023-08-14', 14, 'San Bernardino County, CA & Clark County, NV', 93_078, { grass: 0.45, chaparral: 0.4, timber: 0.15 }),
  fire('flat-2023', 'Flat Fire', 2023, '2023-07-15', '2023-08-09', 18, 'Josephine County, OR', 34_112, { timber: 0.82, chaparral: 0.12, grass: 0.06 }),

  // 2024
  fire('park-2024', 'Park Fire', 2024, '2024-07-24', '2024-08-21', 28, 'Butte & Tehama Counties, CA', 429_603, { timber: 0.78, chaparral: 0.14, grass: 0.08 }),
  fire('durkee-2024', 'Durkee Fire', 2024, '2024-07-17', '2024-08-14', 22, 'Malheur County, OR', 293_748, { grass: 0.55, timber: 0.35, chaparral: 0.1 }),
  fire('borel-2024', 'Borel Fire', 2024, '2024-07-26', '2024-08-14', 16, 'Kern County, CA', 59_762, { chaparral: 0.45, wui: 0.35, timber: 0.2 }),
  fire('line-2024', 'Line Fire', 2024, '2024-09-05', '2024-09-28', 18, 'San Bernardino County, CA', 39_568, { chaparral: 0.55, timber: 0.35, wui: 0.1 }),
  fire('thompson-2024', 'Thompson Fire', 2024, '2024-07-02', '2024-07-06', 4, 'Butte County, CA (Oroville)', 3_789, { wui: 0.55, grass: 0.3, chaparral: 0.15 }),
  fire('falls-2024', 'Falls Fire', 2024, '2024-07-14', '2024-08-08', 20, 'Riverside County, CA', 9_672, { chaparral: 0.65, timber: 0.25, grass: 0.1 }),

  // 2025
  fire('palisades-2025', 'Palisades Fire', 2025, '2025-01-07', '2025-01-31', 18, 'Los Angeles County, CA (Pacific Palisades)', 23_448, { wui: 0.72, chaparral: 0.22, grass: 0.06 }),
  fire('eaton-2025', 'Eaton Fire', 2025, '2025-01-07', '2025-01-28', 16, 'Los Angeles County, CA (Altadena/Pasadena)', 14_117, { wui: 0.78, chaparral: 0.16, timber: 0.06 }),
  fire('hughes-2025', 'Hughes Fire', 2025, '2025-01-22', '2025-01-28', 6, 'Los Angeles County, CA (Castaic)', 10_396, { chaparral: 0.6, grass: 0.3, wui: 0.1 }),
]

export const ALL_FIRES = [...FIRES, ...MORE_FIRES].sort((a, b) => a.year - b.year || a.startDate.localeCompare(b.startDate))

// ── Crew roster ────────────────────────────────────────────────────────────

export const CREWS = [
  // Interagency Hotshot Crews (IHC) — R1 through R10
  'Alpine Hotshots',
  'Arrowhead Hotshots',
  'Baker River Hotshots',
  'Bear Divide Hotshots',
  'Big Bear Hotshots',
  'Bitterroot Hotshots',
  'Black Mesa Hotshots',
  'Boise Hotshots',
  'Bonneville Hotshots',
  'Boundary Peak Hotshots',
  'Burns Hotshots',
  'Calabasas Hotshots',
  'Chief Mountain Hotshots',
  'Cibola Hotshots',
  'Coconino Hotshots',
  'Craig Hotshots',
  'Dalton Hotshots',
  'Del Rosa Hotshots',
  'Diamond Mountain Hotshots',
  'Eldorado Hotshots',
  'Elk Mountain Hotshots',
  'Entiat Hotshots',
  'Feather River Hotshots',
  'Fernandez Hotshots',
  'Flagstaff Hotshots',
  'Flathead Hotshots',
  'Fort Apache Hotshots',
  'Fremont Hotshots',
  'Fulton Hotshots',
  'Geronimo Hotshots',
  'Gila Hotshots',
  'Globe Hotshots',
  'Gold City Hotshots',
  'Golden Eagles Hotshots',
  'Granite Mountain Hotshots',
  'Grizzly Hotshots',
  'Horseshoe Meadow Hotshots',
  'Idaho City Hotshots',
  'Iron Mountain Hotshots',
  'Kern Valley Hotshots',
  'Kings River Hotshots',
  'Klamath Hotshots',
  'Laguna Hotshots',
  'Lassen Hotshots',
  'Lewis & Clark Hotshots',
  'Little Tujunga Hotshots',
  'Logan Hotshots',
  'Lolo Hotshots',
  'Los Padres Hotshots',
  'Los Prietos Hotshots',
  'Manzanita Hotshots',
  'Midnight Sun Hotshots',
  'Miller Peak Hotshots',
  'Modoc Hotshots',
  'Moqui Hotshots',
  'Mormon Lake Hotshots',
  'Negrito Hotshots',
  'Nez Perce Hotshots',
  'Nifc Hotshots',
  'Norwood Hotshots',
  'Okanogan Hotshots',
  'Palomar Hotshots',
  'Payson Hotshots',
  'Pike Hotshots',
  'Plumas Hotshots',
  'Prineville Hotshots',
  'Prospect Hotshots',
  'Ranger Creek Hotshots',
  'Rattlesnake Hotshots',
  'Redding Hotshots',
  'Redmond Hotshots',
  'Sacramento Hotshots',
  'San Juan Hotshots',
  'Sawtooth Hotshots',
  'Sequoia Hotshots',
  'Sierra Hotshots',
  'Silver State Hotshots',
  'Silver City Hotshots',
  'Smokey Bear Hotshots',
  'Snake River Hotshots',
  'Stanislaus Hotshots',
  'Tahoe Hotshots',
  'Tata Hotshots',
  'Tatanka Hotshots',
  'Texas Canyon Hotshots',
  'Tioga Hotshots',
  'Truckee Hotshots',
  'Union Hotshots',
  'Ukonom Hotshots',
  'Vista Grande Hotshots',
  'Warm Springs Hotshots',
  'Weber Hotshots',
  'Winema Hotshots',
  'Wolf Creek Hotshots',
  'Wyoming Hotshots',
  'Zig Zag Hotshots',
  'Zuni Hotshots',

  // Smokejumper bases
  'Missoula Smokejumpers',
  'Redding Smokejumpers',
  'McCall Smokejumpers',
  'West Yellowstone Smokejumpers',
  'Grangeville Smokejumpers',
  'Redmond Smokejumpers',
  'Boise Smokejumpers',
  'Alaska Smokejumpers (Fairbanks)',
  'North Cascades Smokejumpers',

  // CalFire hand crews
  'CalFire — Amador-El Dorado Unit',
  'CalFire — Butte Unit',
  'CalFire — Fresno-Kings Unit',
  'CalFire — Humboldt-Del Norte Unit',
  'CalFire — Lassen-Modoc Unit',
  'CalFire — Madera-Mariposa-Merced Unit',
  'CalFire — Mendocino Unit',
  'CalFire — Nevada-Yuba-Placer Unit',
  'CalFire — Riverside Unit',
  'CalFire — San Bernardino Unit',
  'CalFire — San Diego Unit',
  'CalFire — San Luis Obispo Unit',
  'CalFire — Santa Barbara Unit',
  'CalFire — Shasta-Trinity Unit',
  'CalFire — Sonoma-Lake-Napa Unit',
  'CalFire — Tehama-Glenn Unit',
  'CalFire — Tulare Unit',
  'CalFire — Tuolumne-Calaveras Unit',

  // State crews (other states)
  'ODF — Oregon Dept. of Forestry',
  'WDNR — Washington DNR',
  'IDFG — Idaho Dept. of Lands',
  'Montana DNRC',
  'Colorado DFPC',
  'Arizona Forestry & Fire Management',
  'New Mexico Forestry Division',
  'Nevada Division of Forestry',
  'Texas A&M Forest Service',

  // Type 2 / contract crews
  'Grayback Forestry',
  'Chena Hotshots (BIA)',
  'Kootenai Unit Crew',
  'Nez Perce Tribe Fire Management',
  'Navajo Hotshots',
  'Mescalero Red Hats',
  'Hualapai Forestry',
  'Yakama Agency Crew',
  'BLM — Type 2 Hand Crew',
  'Contract Hand Crew',
  'Military / National Guard Detail',

  // Engine companies (generic by agency)
  'USFS Engine Company',
  'BLM Engine Company',
  'CalFire Engine Company',
  'USFWS Engine Company',
  'NPS Engine Company',
  'County Fire Engine Company',
  'City Fire Engine Company',

  // Helitack
  'USFS Helitack',
  'CalFire Helitack',
  'BLM Helitack',
  'County Helitack',
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
