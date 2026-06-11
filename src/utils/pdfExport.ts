import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ItemState, SiteWalk } from '../types';
import { walkCompletion } from '../store/walkStore';

// TITAN palette (RGB)
const DECK: [number, number, number] = [11, 16, 28];
const BRASS: [number, number, number] = [201, 169, 97];
const INK: [number, number, number] = [40, 40, 40];
const MUTE: [number, number, number] = [120, 120, 120];
const OK: [number, number, number] = [90, 140, 105];
const WARN: [number, number, number] = [180, 145, 60];
const ALERT: [number, number, number] = [200, 95, 80];

const PAGE_W = 612; // letter, pt
const PAGE_H = 792;
const MARGIN = 48;

function drawStateGlyph(doc: jsPDF, state: ItemState, x: number, y: number) {
  const s = 7;
  if (state === 'flagged') {
    doc.setFillColor(...ALERT);
    doc.triangle(x + s / 2, y, x + s, y + s / 2, x + s / 2, y + s, 'F');
    doc.triangle(x + s / 2, y, x, y + s / 2, x + s / 2, y + s, 'F');
  } else if (state === 'checked') {
    doc.setFillColor(...BRASS);
    doc.rect(x, y, s, s, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.9);
    doc.line(x + 1.6, y + 3.8, x + 3, y + 5.4);
    doc.line(x + 3, y + 5.4, x + 5.6, y + 1.8);
  } else {
    doc.setDrawColor(...MUTE);
    doc.setLineWidth(0.6);
    doc.rect(x, y, s, s, 'S');
  }
}

function header(doc: jsPDF, subtitle: string) {
  doc.setFillColor(...DECK);
  doc.rect(0, 0, PAGE_W, 64, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRASS);
  doc.text('SILVER PLATTER · CM SITE WALK REPORT', MARGIN, 30);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(195, 196, 209);
  doc.text(subtitle.toUpperCase(), MARGIN, 46);
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(text, MARGIN, y);
  doc.setDrawColor(...BRASS);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y + 4, MARGIN + 80, y + 4);
  return y + 16;
}

function outcomeLabel(walk: SiteWalk): { label: string; color: [number, number, number] } {
  switch (walk.outcome) {
    case 'ready':
      return { label: 'READY', color: OK };
    case 'conditional':
      return { label: 'CONDITIONAL', color: WARN };
    case 'not-ready':
      return { label: 'NOT READY', color: ALERT };
    default:
      return { label: 'PENDING', color: MUTE };
  }
}

export async function exportWalkPdf(walk: SiteWalk): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  // ---------- Page 1: site details ----------
  header(doc, `${walk.siteId} · ${walk.market || '—'} · ${walk.walkDate}`);

  let y = 96;
  y = sectionTitle(doc, 'Site Details', y);

  const outcome = outcomeLabel(walk);
  doc.setFillColor(...outcome.color);
  doc.roundedRect(PAGE_W - MARGIN - 110, 78, 110, 24, 3, 3, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(outcome.label, PAGE_W - MARGIN - 55, 93, { align: 'center' });

  const gps =
    walk.gpsLat !== null && walk.gpsLng !== null ? `${walk.gpsLat.toFixed(6)}, ${walk.gpsLng.toFixed(6)}` : 'Not captured';

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9.5, textColor: INK, cellPadding: 5 },
    columnStyles: { 0: { font: 'courier', fontStyle: 'bold', cellWidth: 150, textColor: MUTE } },
    body: [
      ['SITE ID', walk.siteId],
      ['MARKET', walk.market || '—'],
      ['CLIENT', walk.client],
      ['SITE TYPE', walk.siteType],
      ['WALK DATE', walk.walkDate],
      ['CM NAME', walk.cmName],
      ['PM NAME', walk.pmName || '—'],
      ['RF ENGINEER', walk.rfEngineerName || '—'],
      ['GPS', gps],
      ['COMPLETION', `${walkCompletion(walk)}%`],
      ['STATUS', walk.status.toUpperCase()]
    ]
  });

  // ---------- Checklist sections ----------
  doc.addPage();
  header(doc, 'Checklist · 16 Sections');
  let cursorY = 90;

  for (const section of walk.sections) {
    if (cursorY > PAGE_H - 130) {
      doc.addPage();
      header(doc, 'Checklist · Continued');
      cursorY = 90;
    }
    cursorY = sectionTitle(doc, `${String(section.number).padStart(2, '0')} — ${section.title}`, cursorY);

    if (section.freeTextOnly) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      const text = section.freeText.trim() || 'No notes recorded.';
      const lines = doc.splitTextToSize(text, PAGE_W - MARGIN * 2);
      doc.text(lines, MARGIN, cursorY + 4);
      cursorY += lines.length * 12 + 18;
      continue;
    }

    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9, textColor: INK, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 280 },
        2: { font: 'courier', fontSize: 8, textColor: MUTE }
      },
      body: section.items.map((item) => ['', item.label, item.notes || '']),
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const item = section.items[data.row.index];
          drawStateGlyph(doc, item.state, data.cell.x + 4, data.cell.y + 4);
        }
      }
    });
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
  }

  // ---------- Measurements ----------
  doc.addPage();
  header(doc, 'Field Measurements');
  let my = 90;
  my = sectionTitle(doc, 'Measurements', my);

  const m = walk.measurements;
  const powerTotal = (parseFloat(m.powerMmpToMeter) || 0) + (parseFloat(m.powerMeterToCabinets) || 0);
  const measurementRows: string[][] = [
    ['COMPOUND', `${m.compoundLength || '—'} ft × ${m.compoundWidth || '—'} ft`],
    ...m.easementRuns.map((r) => [`EASEMENT · ${r.label.toUpperCase()}`, `${r.lengthFt || '—'} ft`]),
    ['POWER · MMP→METER', `${m.powerMmpToMeter || '—'} ft`],
    ['POWER · METER→CABINETS', `${m.powerMeterToCabinets || '—'} ft`],
    ['POWER · TOTAL RUN', `${powerTotal} ft${powerTotal > 200 ? '  — A&E WIRE SIZE REVIEW REQUIRED' : ''}`],
    ['TELCO · MMP→D-MARK', `${m.telcoMmpToDmark || '—'} ft`],
    ['TELCO · D-MARK→CABINETS', `${m.telcoDmarkToCabinets || '—'} ft`],
    ['TOWER HEIGHT', `${m.towerHeight || '—'} ft`],
    ['PROPOSED NSD HEIGHT', `${m.nsdHeight || '—'} ft`],
    ['CRANE PAD', `${m.cranePadLength || '—'} ft × ${m.cranePadWidth || '—'} ft`],
    ['NOTES', m.notes || '—']
  ];

  autoTable(doc, {
    startY: my,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9.5, textColor: INK, cellPadding: 5 },
    columnStyles: { 0: { font: 'courier', fontStyle: 'bold', cellWidth: 190, textColor: MUTE, fontSize: 8.5 } },
    body: measurementRows
  });

  // ---------- Utilities ----------
  doc.addPage();
  header(doc, 'Utilities');
  let uy = 90;
  uy = sectionTitle(doc, 'Power', uy);
  const p = walk.utilities.power;
  autoTable(doc, {
    startY: uy,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9.5, textColor: INK, cellPadding: 5 },
    columnStyles: { 0: { font: 'courier', fontStyle: 'bold', cellWidth: 170, textColor: MUTE, fontSize: 8.5 } },
    body: [
      ['PROVIDER', p.provider || '—'],
      ['FEED TYPE', p.feedType ? p.feedType.toUpperCase() : '—'],
      ['BUILD-TO-POWER', p.buildToPower || '—'],
      ['MMP LOCATION', p.mmpLocation || '—'],
      ['BORE VS TRENCH', p.boreOrTrench || '—'],
      ['NOTES', p.notes || '—']
    ]
  });
  uy = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;
  uy = sectionTitle(doc, 'Telco', uy);
  const t = walk.utilities.telco;
  autoTable(doc, {
    startY: uy,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9.5, textColor: INK, cellPadding: 5 },
    columnStyles: { 0: { font: 'courier', fontStyle: 'bold', cellWidth: 170, textColor: MUTE, fontSize: 8.5 } },
    body: [
      ['PROVIDERS', t.providers.filter(Boolean).join(' · ') || '—'],
      ['PREFERRED PROVIDER', t.preferredProvider || '—'],
      ['D-MARK LOCATION', t.dmarkLocation || '—'],
      ['FIBER VS COAX', t.fiberOrCoax ? t.fiberOrCoax.toUpperCase() : '—'],
      ['BORE VS TRENCH', t.boreOrTrench || '—'],
      ['NOTES', t.notes || '—']
    ]
  });

  // ---------- Risk register ----------
  doc.addPage();
  header(doc, 'Risk Register');
  let ry = 90;
  ry = sectionTitle(doc, 'Risk Register', ry);
  // Risks are flagged inside the checklist; the item's field notes carry the
  // risk description, so they stand in when no explicit mitigation was logged.
  const itemNotesFor = (itemId: string | null): string => {
    if (!itemId) return '';
    for (const section of walk.sections) {
      const item = section.items.find((i) => i.id === itemId);
      if (item) return item.notes;
    }
    return '';
  };
  if (walk.risks.length === 0) {
    doc.setFont('courier', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...MUTE);
    doc.text('No risks flagged.', MARGIN, ry + 6);
  } else {
    autoTable(doc, {
      startY: ry,
      margin: { left: MARGIN, right: MARGIN },
      theme: 'grid',
      headStyles: { fillColor: DECK, textColor: BRASS, font: 'courier', fontSize: 8 },
      styles: { font: 'helvetica', fontSize: 9, textColor: INK, cellPadding: 5 },
      head: [['SECTION', 'ITEM', 'SEVERITY', 'NOTES / MITIGATION']],
      body: walk.risks.map((r) => [
        r.section || 'MANUAL',
        r.item || '—',
        r.severity.toUpperCase(),
        r.mitigation || itemNotesFor(r.itemId) || '—'
      ]),
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const sev = walk.risks[data.row.index].severity;
          data.cell.styles.font = 'courier';
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = sev === 'high' ? ALERT : sev === 'medium' ? WARN : [80, 120, 170];
        }
      }
    });
  }

  // ---------- Photos ----------
  if (walk.photos.length > 0) {
    doc.addPage();
    header(doc, 'Photo Registry');
    let py = 90;
    py = sectionTitle(doc, `Photos · ${walk.photos.length}`, py);
    const cellW = (PAGE_W - MARGIN * 2 - 24) / 3;
    const imgH = cellW * 0.75;
    let col = 0;
    for (const photo of walk.photos) {
      if (py + imgH + 30 > PAGE_H - 60) {
        doc.addPage();
        header(doc, 'Photo Registry · Continued');
        py = 90;
        col = 0;
      }
      const x = MARGIN + col * (cellW + 12);
      try {
        const fmt = photo.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(photo.dataUrl, fmt, x, py, cellW, imgH);
      } catch {
        doc.setDrawColor(...MUTE);
        doc.rect(x, py, cellW, imgH, 'S');
      }
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MUTE);
      const stampParts = [new Date(photo.capturedAt).toLocaleString()];
      if (photo.gpsLat != null && photo.gpsLng != null) {
        stampParts.push(`${photo.gpsLat.toFixed(5)}, ${photo.gpsLng.toFixed(5)}${photo.gpsSource === 'site' ? ' (site)' : ''}`);
      }
      const captionText = `${photo.category} · ${photo.caption || 'UNCAPTIONED'}\n${stampParts.join(' · ')}`;
      doc.text(doc.splitTextToSize(captionText, cellW), x, py + imgH + 10);
      col += 1;
      if (col === 3) {
        col = 0;
        py += imgH + 34;
      }
    }
  }

  // ---------- Sign-off ----------
  doc.addPage();
  header(doc, 'Certification');
  let sy = 90;
  sy = sectionTitle(doc, 'Walk Sign-Off', sy);

  const so = walk.signOff;
  autoTable(doc, {
    startY: sy,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9.5, textColor: INK, cellPadding: 5 },
    columnStyles: { 0: { font: 'courier', fontStyle: 'bold', cellWidth: 190, textColor: MUTE, fontSize: 8.5 } },
    body: [
      ['OUTCOME', outcome.label],
      ['BLOCKING ISSUES', walk.outcomeReason || '—'],
      ['GENERAL COMMENTS', walk.generalComments || '—'],
      ['PROJECT MANAGER', so.pmName || '—'],
      ['RF ENGINEER', so.rfEngineerName || '—'],
      ['CONSTRUCTION MANAGER', so.cmName || '—'],
      ['CERTIFIED', so.certifiedAt ? new Date(so.certifiedAt).toLocaleString() : 'NOT CERTIFIED'],
      ['EXPORTED', new Date().toLocaleString()]
    ]
  });

  // ---------- Footer pass ----------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BRASS);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, PAGE_H - 36, PAGE_W - MARGIN, PAGE_H - 36);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTE);
    doc.text('SILVER PLATTER PROGRAM · RKC SITE SOLUTIONS · CONFIDENTIAL', MARGIN, PAGE_H - 24);
    doc.text(`${i} / ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 24, { align: 'right' });
  }

  doc.save(`${walk.siteId || 'site-walk'}-walk-report.pdf`);
}
