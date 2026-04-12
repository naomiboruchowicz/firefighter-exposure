import jsPDF from 'jspdf'
import type { Fire } from '../data/fires'

type Totals = {
  days: number
  pm25: number
  pahs: number
  formaldehyde: number
  benzene: number
  dioxins: number
  cigarettes: number
}

const PAGE_W = 210
const PAGE_H = 297
const M_LEFT = 20
const M_RIGHT = 20
const M_TOP = 24
const M_BOTTOM = 20
const CONTENT_W = PAGE_W - M_LEFT - M_RIGHT
const RIGHT_EDGE = PAGE_W - M_RIGHT

const PM25_PER_CIGARETTE_MG = 12
const DIOXIN_SAFE_DAILY_UG = 0.7 * 80 * 1e-6

const ROW_H = 5.2

function fmt(n: number): string {
  return n.toLocaleString('en-US')
}

function fmtDec(n: number, places = 1): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  })
}

function fmtDate(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function fuelLabel(mix: Fire['fuelMix']): string {
  return Object.entries(mix)
    .sort(([, a], [, b]) => b - a)
    .map(([fuel, pct]) => `${fuel} ${Math.round(pct * 100)}%`)
    .join(', ')
}

function drawRule(doc: jsPDF, y: number, weight: 'light' | 'medium' | 'heavy' = 'light') {
  const colors = { light: 225, medium: 185, heavy: 60 }
  doc.setDrawColor(colors[weight])
  doc.setLineWidth(weight === 'heavy' ? 0.4 : 0.2)
  doc.line(M_LEFT, y, RIGHT_EDGE, y)
  doc.setLineWidth(0.2)
}

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(0)
  doc.text(text, M_LEFT, y)
}

function tableHeader(doc: jsPDF, headers: { label: string; x: number; align?: 'right' }[], y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(130)
  for (const h of headers) {
    if (h.align === 'right') {
      doc.text(h.label, h.x, y, { align: 'right' })
    } else {
      doc.text(h.label, h.x, y)
    }
  }
}

function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(160)
    doc.text(`Page ${i} of ${pageCount}`, RIGHT_EDGE, PAGE_H - 10, { align: 'right' })
  }
}

export function exportExposureRecord(
  name: string,
  crew: string,
  fires: Fire[],
  totals: Totals
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = M_TOP

  function checkPage(needed: number) {
    if (y + needed > PAGE_H - M_BOTTOM) {
      doc.addPage()
      y = M_TOP
    }
  }

  // ── Title ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(0)
  doc.text('Breathline — Exposure Record', M_LEFT, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(130)
  doc.text(fmtDate(), RIGHT_EDGE, y, { align: 'right' })
  y += 3

  doc.setFontSize(8)
  doc.setTextColor(130)
  doc.text('Occupational Chemical Exposure Summary', M_LEFT, y)
  y += 5

  drawRule(doc, y, 'heavy')
  y += 8

  // ── Identity ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text(name || 'Not provided', M_LEFT, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80)
  const identityParts = [crew, `${fires.length} deployments`, `${fmt(totals.days)} days on line`].filter(Boolean)
  doc.text(identityParts.join('  \u00b7  '), M_LEFT, y)
  y += 8

  drawRule(doc, y, 'medium')
  y += 9

  // ── Cumulative exposure table (3 columns, no Classification) ──
  sectionTitle(doc, 'Cumulative Exposure', y)
  y += 7

  const doseCol = {
    substance: M_LEFT,
    dose: M_LEFT + 80,
    context: RIGHT_EDGE,
  }

  tableHeader(doc, [
    { label: 'SUBSTANCE', x: doseCol.substance },
    { label: 'DOSE', x: doseCol.dose, align: 'right' },
    { label: 'EQUIVALENCE', x: doseCol.context, align: 'right' },
  ], y)
  y += 2.5
  drawRule(doc, y)
  y += ROW_H

  const cigs = Math.round(totals.pm25 / PM25_PER_CIGARETTE_MG)
  const dioxinMultiple = fmt(Math.round(totals.dioxins / (DIOXIN_SAFE_DAILY_UG * totals.days)))

  const chemRows = [
    { substance: 'PM2.5 (fine particulate)', dose: `${fmtDec(totals.pm25 / 1000, 1)} g`, context: `${fmt(cigs)} cigarettes inhaled` },
    { substance: 'PAHs (polycyclic aromatic hydrocarbons)', dose: `${fmtDec(totals.pahs, 1)} mg`, context: '' },
    { substance: 'Formaldehyde', dose: `${fmtDec(totals.formaldehyde, 1)} mg`, context: '' },
    { substance: 'Benzene', dose: `${fmtDec(totals.benzene, 1)} mg`, context: 'No safe threshold (EPA)' },
    { substance: 'Dioxins / furans', dose: `${fmtDec(totals.dioxins, 2)} \u00b5g`, context: `${dioxinMultiple}x EPA reference dose` },
  ]

  doc.setFontSize(8)
  chemRows.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(247, 247, 247)
      doc.rect(M_LEFT, y - ROW_H + 1.2, CONTENT_W, ROW_H, 'F')
    }

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20)
    doc.text(row.substance, doseCol.substance, y)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(row.dose, doseCol.dose, y, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100)
    doc.text(row.context, doseCol.context, y, { align: 'right' })
    doc.setFontSize(8)

    y += ROW_H
  })

  // Footnote for classification
  y += 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(130)
  doc.text('All substances classified as carcinogenic by IARC (Group 1).', M_LEFT, y)

  y += 7
  drawRule(doc, y)
  y += 9

  // ── Deployment history ──
  sectionTitle(doc, 'Deployment History', y)
  y += 7

  const col = {
    name: M_LEFT,
    dates: M_LEFT + 38,
    days: M_LEFT + 82,
    location: M_LEFT + 96,
    pm25: RIGHT_EDGE,
  }

  tableHeader(doc, [
    { label: 'FIRE', x: col.name },
    { label: 'DATES', x: col.dates },
    { label: 'DAYS', x: col.days, align: 'right' },
    { label: 'LOCATION', x: col.location },
    { label: 'PM2.5', x: col.pm25, align: 'right' },
  ], y)
  y += 2.5
  drawRule(doc, y)
  y += ROW_H

  fires.forEach((fire) => {
    checkPage(14)

    // Main row
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(10)
    doc.text(fire.name, col.name, y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50)
    doc.text(`${fire.startDate} \u2013 ${fire.endDate}`, col.dates, y)
    doc.text(String(fire.daysWorked), col.days, y, { align: 'right' })

    const loc = fire.location.length > 30 ? fire.location.slice(0, 29) + '\u2026' : fire.location
    doc.text(loc, col.location, y)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10)
    doc.text(`${fmt(fire.chemicals.pm25_mg)} mg`, col.pm25, y, { align: 'right' })

    y += 4

    // Detail row: indented, darker than before so it's always visible
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(100)
    doc.text(
      `${fuelLabel(fire.fuelMix)}  |  PAHs ${fmtDec(fire.chemicals.pahs_mg, 1)} mg  |  Formaldehyde ${fmtDec(fire.chemicals.formaldehyde_mg, 1)} mg  |  Benzene ${fmtDec(fire.chemicals.benzene_mg, 1)} mg  |  Dioxins ${fmtDec(fire.chemicals.dioxins_ug, 2)} \u00b5g`,
      col.name + 2,
      y
    )

    y += 4.5

    // Row separator
    doc.setDrawColor(230)
    doc.line(M_LEFT, y, RIGHT_EDGE, y)

    y += ROW_H - 1
  })

  y += 4

  // ── Methodology footer ──
  checkPage(32)
  drawRule(doc, y, 'medium')
  y += 5

  const methStartY = y
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(130)
  doc.text('ABOUT THIS DOCUMENT', M_LEFT + 4, y)
  y += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(130)

  const methodLines = [
    'Estimated occupational chemical exposure from wildland fire deployments. May be used to support',
    'medical consultations, workers\u2019 compensation claims, and presumptive illness documentation.',
    '',
    'Modeled from published emission factors (Akagi et al. 2011, Urbanski 2014, Rappold et al. 2017),',
    'weighted by fuel type and days on the fireline. Not direct measurements. PM2.5 cigarette equivalence:',
    '12 mg inhaled particulate per cigarette. Dioxin ref.: EPA 0.7 pg/kg/day for 80 kg individual.',
  ]

  for (const line of methodLines) {
    if (line === '') { y += 1.5; continue }
    doc.text(line, M_LEFT + 4, y)
    y += 3
  }

  // Left border accent
  doc.setDrawColor(200)
  doc.setLineWidth(0.5)
  doc.line(M_LEFT + 1, methStartY - 2, M_LEFT + 1, y)
  doc.setLineWidth(0.2)

  // ── Page numbers ──
  addPageNumbers(doc)

  // Save
  const safeName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  doc.save(`exposure_record_${safeName}.pdf`)
}
