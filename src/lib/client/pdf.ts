// PDF documents in the app's visual language: monthly class report and payment slip.
// Built with jsPDF on the device (no server round-trip), loaded only when needed.
import type { jsPDF as JsPDF } from 'jspdf';
import {
  WEEKDAY_LETTER,
  formatClock,
  formatDate,
  formatDay,
  formatMoneyPlain,
  formatTimeRange,
  monthLabel,
  toDate,
  WEEKDAY_SHORT,
} from './format';
import type { ClassLogDTO, PaymentDTO, TuitionDTO } from './types';

type RGB = [number, number, number];
const C = {
  ground: [238, 241, 251] as RGB,
  mist: [246, 247, 253] as RGB,
  ink: [30, 32, 72] as RGB,
  body: [59, 65, 102] as RGB,
  muted: [74, 80, 120] as RGB,
  line: [213, 218, 251] as RGB,
  primary: [84, 104, 240] as RGB,
  primaryDeep: [58, 58, 143] as RGB,
  primarySoft: [227, 231, 253] as RGB,
  coralSoft: [255, 233, 229] as RGB,
  coralInk: [158, 48, 32] as RGB,
  mintSoft: [225, 245, 239] as RGB,
  mintInk: [14, 107, 88] as RGB,
  white: [255, 255, 255] as RGB,
};

async function newDoc(format: 'a4' | 'a5'): Promise<JsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format, orientation: 'portrait' });
  doc.setFont('helvetica', 'normal');
  return doc;
}

const fill = (d: JsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const stroke = (d: JsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);
const color = (d: JsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);

function text(d: JsPDF, s: string, x: number, y: number, o: { size?: number; bold?: boolean; c?: RGB; align?: 'left' | 'right' | 'center' } = {}) {
  d.setFont('helvetica', o.bold ? 'bold' : 'normal');
  d.setFontSize(o.size ?? 10);
  color(d, o.c ?? C.ink);
  d.text(s, x, y, { align: o.align ?? 'left', baseline: 'alphabetic' });
}

function logoMark(d: JsPDF, x: number, y: number, s: number, bg: RGB = C.primary, fg: RGB = C.white) {
  fill(d, bg);
  d.roundedRect(x, y, s, s, s * 0.28, s * 0.28, 'F');
  stroke(d, fg);
  d.setLineWidth(s * 0.07);
  d.setLineCap('round');
  d.setLineJoin('round');
  // check mark
  d.lines(
    [
      [s * 0.14, s * 0.14],
      [s * 0.26, -s * 0.28],
    ],
    x + s * 0.3,
    y + s * 0.52
  );
}

function pill(d: JsPDF, label: string, x: number, y: number, bg: RGB, fg: RGB, align: 'left' | 'right' = 'left', size = 8) {
  d.setFont('helvetica', 'bold');
  d.setFontSize(size);
  const w = d.getTextWidth(label) + 6;
  const h = size * 0.55;
  const left = align === 'right' ? x - w : x;
  fill(d, bg);
  d.roundedRect(left, y - h + 1.4, w, h + 1.6, (h + 1.6) / 2, (h + 1.6) / 2, 'F');
  color(d, fg);
  d.text(label, left + 3, y + 0.6);
  return w;
}

function paymentState(p: PaymentDTO | null | undefined, fee: number | null | undefined) {
  const amount = p?.amount ?? fee ?? null;
  if (p?.paid) return { label: 'Paid', bg: C.mintSoft, fg: C.mintInk, amount };
  if (amount === null) return { label: 'No fee set', bg: C.mist, fg: C.muted, amount };
  return { label: 'Not paid', bg: C.coralSoft, fg: C.coralInk, amount };
}

/* ------------------------------------------------------------------ */
/* Monthly class report                                                */
/* ------------------------------------------------------------------ */

export interface ReportInput {
  tuition: TuitionDTO;
  monthYear: string;
  planned: number;
  taken: number;
  /** Increment logs of that month (any order). */
  classes: Pick<ClassLogDTO, 'classDate' | 'createdAt' | 'addedByName'>[];
  payment?: PaymentDTO | null;
  closed?: boolean;
}

export async function buildReport(input: ReportInput): Promise<JsPDF> {
  const { tuition: t, monthYear, planned, taken, payment, closed } = input;
  const d = await newDoc('a4');
  const W = 210;
  const M = 16;

  // Header band
  fill(d, C.ground);
  d.rect(0, 0, W, 46, 'F');
  logoMark(d, M, 13, 11);
  text(d, 'TuitionTrack', M + 15, 20.6, { size: 13, bold: true });
  text(d, 'Monthly class report', W - M, 20.6, { size: 10, bold: true, c: C.muted, align: 'right' });

  text(d, `${t.subject} · ${t.studentName ?? 'Student'}`, M, 36, { size: 18, bold: true });
  const sub = [monthLabel(monthYear), closed ? 'Closed month' : 'In progress', `Teacher: ${t.teacherName}`].join('   ·   ');
  text(d, sub, M, 42.5, { size: 9.5, c: C.muted });

  // Stat cards
  let y = 54;
  const gap = 5;
  const cw = (W - 2 * M - 2 * gap) / 3;
  const ch = 30;
  const pct = planned ? Math.round((taken / planned) * 100) : 0;
  const pay = paymentState(payment, t.feeAmount);

  const card = (i: number, bg: RGB) => {
    fill(d, bg);
    d.roundedRect(M + i * (cw + gap), y, cw, ch, 4, 4, 'F');
    return M + i * (cw + gap) + 6;
  };

  let x = card(0, C.primary);
  text(d, 'Classes taken', x, y + 9, { size: 8.5, c: C.primarySoft, bold: true });
  text(d, `${taken} of ${planned}`, x, y + 21, { size: 17, bold: true, c: C.white });

  x = card(1, C.mist);
  text(d, 'Completion', x, y + 9, { size: 8.5, c: C.muted, bold: true });
  text(d, `${pct}%`, x, y + 20, { size: 17, bold: true });
  fill(d, C.primarySoft);
  d.roundedRect(x, y + 23.5, cw - 12, 2.4, 1.2, 1.2, 'F');
  fill(d, C.primary);
  d.roundedRect(x, y + 23.5, Math.max(2.4, (cw - 12) * Math.min(1, pct / 100)), 2.4, 1.2, 1.2, 'F');

  x = card(2, C.mist);
  text(d, 'Monthly fee', x, y + 9, { size: 8.5, c: C.muted, bold: true });
  text(d, formatMoneyPlain(pay.amount), x, y + 20, { size: 14, bold: true });
  pill(d, pay.label, x, y + 26, pay.bg, pay.fg);

  // Schedule line
  y += ch + 11;
  const days = t.weekdays?.length ? t.weekdays.map((n) => WEEKDAY_SHORT[n]).join(', ') : `${t.daysPerWeek} days a week`;
  text(d, `Schedule: ${days}  ·  ${formatTimeRange(t.startTime, t.endTime)}`, M, y, { size: 9.5, c: C.body });

  // Calendar of the month
  y += 7;
  const [yy, mm] = monthYear.split('-').map(Number);
  const first = new Date(yy, mm - 1, 1);
  const nDays = new Date(yy, mm, 0).getDate();
  const takenKeys = new Set(
    input.classes.map((c) => toDate(c.classDate ?? c.createdAt)).filter((x): x is Date => !!x && x.getMonth() === mm - 1 && x.getFullYear() === yy).map((x) => x.getDate())
  );
  const calW = W - 2 * M;
  fill(d, C.white);
  stroke(d, C.line);
  d.setLineWidth(0.3);
  const rows = Math.ceil((first.getDay() + nDays) / 7);
  const cell = (calW - 12) / 7;
  const cellH = 9;
  const calH = 14 + rows * (cellH + 1.5) + 6;
  d.roundedRect(M, y, calW, calH, 4, 4, 'FD');
  WEEKDAY_LETTER.forEach((l, i) => text(d, l, M + 6 + i * cell + cell / 2, y + 8, { size: 8, bold: true, c: C.muted, align: 'center' }));
  for (let day = 1; day <= nDays; day++) {
    const idx = first.getDay() + day - 1;
    const r = Math.floor(idx / 7);
    const cx = M + 6 + (idx % 7) * cell;
    const cy = y + 12 + r * (cellH + 1.5);
    const isTaken = takenKeys.has(day);
    const scheduled = t.weekdays?.includes(new Date(yy, mm - 1, day).getDay());
    if (isTaken) {
      fill(d, C.primary);
      d.roundedRect(cx + 1, cy, cell - 2, cellH, 2.2, 2.2, 'F');
    } else if (scheduled) {
      fill(d, C.ground);
      d.roundedRect(cx + 1, cy, cell - 2, cellH, 2.2, 2.2, 'F');
    }
    text(d, String(day), cx + cell / 2, cy + 6, { size: 8.5, bold: isTaken, c: isTaken ? C.white : scheduled ? C.primaryDeep : C.muted, align: 'center' });
  }
  y += calH + 5;
  // legend
  fill(d, C.primary);
  d.roundedRect(M, y - 2.6, 3, 3, 0.8, 0.8, 'F');
  text(d, 'Class taken', M + 5, y, { size: 8, c: C.muted });
  if (t.weekdays?.length) {
    fill(d, C.ground);
    d.roundedRect(M + 28, y - 2.6, 3, 3, 0.8, 0.8, 'F');
    text(d, 'Scheduled day', M + 33, y, { size: 8, c: C.muted });
  }

  // Class log table
  y += 10;
  text(d, 'Class log', M, y, { size: 12, bold: true });
  y += 4;
  const cols = [M + 4, M + 18, M + 70, M + 110];
  const headH = 8;
  fill(d, C.ground);
  d.roundedRect(M, y, calW, headH, 2, 2, 'F');
  ['#', 'Class date', 'Logged', 'Logged by'].forEach((h, i) => text(d, h, cols[i], y + 5.4, { size: 8.5, bold: true, c: C.muted }));
  y += headH;

  const sorted = [...input.classes]
    .map((c) => ({ c, date: toDate(c.classDate ?? c.createdAt), logged: toDate(c.createdAt) }))
    .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));

  const rowH = 7.5;
  const bottom = 297 - 22;
  if (sorted.length === 0) {
    text(d, 'No classes logged this month.', M + 4, y + 6, { size: 9.5, c: C.muted });
  }
  sorted.forEach((row, i) => {
    if (y + rowH > bottom) {
      d.addPage();
      y = 20;
    }
    if (i % 2 === 1) {
      fill(d, C.mist);
      d.rect(M, y, calW, rowH, 'F');
    }
    text(d, String(i + 1), cols[0], y + 5, { size: 9, c: C.muted });
    text(d, formatDay(row.date) + (row.date ? ` ${row.date.getFullYear()}` : ''), cols[1], y + 5, { size: 9, bold: true });
    text(d, row.logged ? `${formatDate(row.logged)}, ${formatClock(row.logged)}` : '', cols[2], y + 5, { size: 9, c: C.body });
    text(d, row.c.addedByName ?? '', cols[3], y + 5, { size: 9, c: C.body });
    y += rowH;
  });

  footer(d, W, M, 297);
  return d;
}

function footer(d: JsPDF, W: number, M: number, H: number) {
  const pages = d.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    d.setPage(p);
    stroke(d, C.line);
    d.setLineWidth(0.3);
    d.line(M, H - 14, W - M, H - 14);
    text(d, `Generated ${formatDate(new Date())} with TuitionTrack`, M, H - 8, { size: 8, c: C.muted });
    text(d, `Page ${p} of ${pages}`, W - M, H - 8, { size: 8, c: C.muted, align: 'right' });
  }
}

/* ------------------------------------------------------------------ */
/* Payment slip                                                        */
/* ------------------------------------------------------------------ */

export interface SlipInput {
  tuition: TuitionDTO;
  monthYear: string;
  taken: number;
  planned: number;
  payment: PaymentDTO;
}

export async function buildSlip({ tuition: t, monthYear, taken, planned, payment }: SlipInput): Promise<JsPDF> {
  const d = await newDoc('a5');
  const W = 148;
  const H = 210;
  const M = 12;

  fill(d, C.ground);
  d.rect(0, 0, W, H, 'F');

  // Card
  fill(d, C.white);
  d.roundedRect(M, M, W - 2 * M, H - 2 * M, 6, 6, 'F');

  // Top band
  fill(d, C.primary);
  d.roundedRect(M, M, W - 2 * M, 44, 6, 6, 'F');
  d.rect(M, M + 30, W - 2 * M, 14, 'F');
  logoMark(d, M + 8, M + 9, 9, C.white, C.primary);
  text(d, 'TuitionTrack', M + 20, M + 15.2, { size: 11, bold: true, c: C.white });
  text(d, 'PAYMENT SLIP', W - M - 8, M + 15.2, { size: 8.5, bold: true, c: C.primarySoft, align: 'right' });
  text(d, formatMoneyPlain(payment.amount), M + 8, M + 33, { size: 22, bold: true, c: C.white });
  text(d, `${t.subject} fee for ${monthLabel(monthYear)}`, M + 8, M + 39.5, { size: 9, c: C.primarySoft });

  // Paid stamp
  let y = M + 56;
  pill(d, 'PAID', M + 8, y, C.mintSoft, C.mintInk, 'left', 10);
  const paidAt = toDate(payment.paidAt);
  text(d, paidAt ? `on ${formatDate(paidAt)}` : '', M + 26, y + 0.6, { size: 9.5, c: C.body });

  // Details
  y += 12;
  const rows: [string, string][] = [
    ['Slip no.', payment.slipNo ?? '—'],
    ['Received from', t.studentName ?? 'Student'],
    ['Received by', t.teacherName],
    ['Subject', t.subject],
    ['For month', monthLabel(monthYear)],
    ['Classes taken', `${taken} of ${planned}`],
  ];
  rows.forEach(([k, v], i) => {
    text(d, k, M + 8, y, { size: 9, c: C.muted });
    text(d, v, W - M - 8, y, { size: 10, bold: true, align: 'right' });
    if (i < rows.length - 1) {
      stroke(d, C.ground);
      d.setLineWidth(0.4);
      d.line(M + 8, y + 4, W - M - 8, y + 4);
    }
    y += 11;
  });

  // Perforation
  y += 2;
  stroke(d, C.line);
  d.setLineWidth(0.5);
  d.setLineDashPattern([1.5, 1.5], 0);
  d.line(M + 8, y, W - M - 8, y);
  d.setLineDashPattern([], 0);
  fill(d, C.ground);
  d.circle(M, y, 4, 'F');
  d.circle(W - M, y, 4, 'F');

  y += 10;
  d.setFont('helvetica', 'normal');
  d.setFontSize(8);
  color(d, C.muted);
  const note = d.splitTextToSize(
    `This slip confirms that ${t.teacherName} marked the ${monthLabel(monthYear)} fee for ${t.subject} as received. Generated ${formatDate(new Date())}.`,
    W - 2 * M - 16
  );
  d.text(note, M + 8, y);

  return d;
}

/* ------------------------------------------------------------------ */
/* Download / share                                                    */
/* ------------------------------------------------------------------ */

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Opens the native share sheet with the PDF when supported; otherwise downloads it. */
export async function shareOrDownload(doc: JsPDF, filename: string, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title, text: title });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
      // fall through to download
    }
  }
  download(blob, filename);
  return 'downloaded';
}

export function downloadPdf(doc: JsPDF, filename: string) {
  download(doc.output('blob'), filename);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** True when this device can share files through the system share sheet. */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  try {
    return !!nav.share && !!nav.canShare?.({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] });
  } catch {
    return false;
  }
}
