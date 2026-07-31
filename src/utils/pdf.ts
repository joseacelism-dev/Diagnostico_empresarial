import type { DiagnosticResults, Question } from '../types';
import { AREAS } from '../data/areas';
import { MATURITY_LEVELS, RESPONSE_SCALES } from '../types';
import { getMaturityInfo } from './scoring';
import html2canvas from 'html2canvas';

const NAVY = [15, 36, 73] as const;
const GOLD = [212, 168, 67] as const;
const LIGHT_GRAY = [248, 249, 250] as const;
const MID_GRAY = [107, 114, 128] as const;
const DARK = [28, 28, 46] as const;
const WHITE = [255, 255, 255] as const;

function rgb(c: readonly number[]) { return c as [number, number, number]; }

function answerLabel(question: Question, score: number): string {
  return RESPONSE_SCALES[question.scale].options.find(o => o.score === score)?.label ?? `${score}/5`;
}

export async function generatePDF(
  results: DiagnosticResults,
  applicableQs: Question[],
  topRecs: Array<{ question: Question; score: number; priority: number }>,
  strengths: Array<{ question: Question; score: number }>,
  risks: string[],
  opportunities: string[],
  radarRef: React.RefObject<HTMLDivElement | null>,
  barRef: React.RefObject<HTMLDivElement | null>,
) {
  const jsPDF = (await import('jspdf')).default;
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const ML = 20, MR = 20, MT = 20;
  const TW = W - ML - MR;

  function addPage() {
    doc.addPage();
  }

  function setFont(style: 'normal' | 'bold' | 'italic' = 'normal', size = 10) {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  }

  function setColor(c: readonly number[]) {
    doc.setTextColor(c[0], c[1], c[2]);
  }

  function fillRect(x: number, y: number, w: number, h: number, c: readonly number[]) {
    doc.setFillColor(c[0], c[1], c[2]);
    doc.rect(x, y, w, h, 'F');
  }

  function hline(y: number, c: readonly number[] = [229, 231, 235], thickness = 0.3) {
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(thickness);
    doc.line(ML, y, W - MR, y);
  }

  function sectionTitle(text: string, y: number): number {
    fillRect(ML, y, TW, 8, NAVY);
    setFont('bold', 10);
    setColor(WHITE);
    doc.text(text.toUpperCase(), ML + 4, y + 5.5);
    return y + 8 + 4;
  }

  function pageFooter(pageNum: number) {
    const fy = H - 12;
    fillRect(0, fy, W, 12, [238, 242, 248]);
    setFont('normal', 8);
    setColor(MID_GRAY);
    doc.text('Prompt Maestro — Diagnóstico Integral de Madurez Empresarial', ML, fy + 7);
    doc.text(`Página ${pageNum}`, W - MR - 20, fy + 7);
    doc.text(new Date(results.completedAt).toLocaleDateString('es'), W / 2, fy + 7, { align: 'center' });
  }

  // ── PAGE 1: COVER ──────────────────────────────────────────────────────────
  fillRect(0, 0, W, H, NAVY);

  // Gold accent bar
  fillRect(0, 0, 6, H, GOLD);

  // Logo area
  fillRect(ML, 40, 14, 14, rgb(GOLD));
  setFont('bold', 7);
  setColor(NAVY);
  doc.text('PM', ML + 3, 49);

  setFont('bold', 8);
  setColor(rgb([200, 210, 230]));
  doc.text('PROMPT MAESTRO', ML + 18, 46);
  setFont('normal', 7);
  doc.text('DIAGNÓSTICO EMPRESARIAL', ML + 18, 51);

  // Title
  setFont('bold', 28);
  setColor(WHITE);
  doc.text('DIAGNÓSTICO INTEGRAL', ML, 100);
  setFont('bold', 28);
  setColor(rgb(GOLD));
  doc.text('DE MADUREZ EMPRESARIAL', ML, 115);

  setFont('normal', 11);
  setColor(rgb([170, 185, 210]));
  doc.text('Informe Ejecutivo de Resultados y Plan de Mejora', ML, 128);

  // Divider
  fillRect(ML, 136, 80, 1.5, GOLD);

  // Company info box
  fillRect(ML, 148, TW, 50, [20, 50, 90]);
  setFont('bold', 9);
  setColor(rgb(GOLD));
  doc.text('EMPRESA EVALUADA', ML + 8, 160);
  setFont('bold', 16);
  setColor(WHITE);
  const name = results.companyInfo.nombre || 'Sin nombre';
  doc.text(name.length > 35 ? name.slice(0, 32) + '...' : name, ML + 8, 172);

  setFont('normal', 9);
  setColor(rgb([180, 200, 230]));
  doc.text(`${results.companyInfo.ciudad}  ·  ${sectorLabel(results.companyInfo.sector)}  ·  ${results.companyInfo.antiguedad} años`, ML + 8, 182);
  doc.text(`Responsable: ${results.companyInfo.responsable}  ·  ${results.companyInfo.cargo}`, ML + 8, 189);

  // Score badge
  const matInfo = getMaturityInfo(results.overallScore);
  fillRect(W - MR - 50, 148, 50, 50, [10, 30, 65]);
  setFont('bold', 24);
  setColor(rgb(GOLD));
  doc.text(results.overallScore.toFixed(2), W - MR - 25, 168, { align: 'center' });
  setFont('normal', 8);
  setColor(rgb([180, 200, 230]));
  doc.text('PUNTAJE', W - MR - 25, 175, { align: 'center' });
  doc.text('GLOBAL', W - MR - 25, 180, { align: 'center' });
  setFont('bold', 8);
  setColor(WHITE);
  doc.text(`N${results.overallLevel}: ${matInfo.name.toUpperCase()}`, W - MR - 25, 190, { align: 'center' });

  // Methodology chips
  setFont('normal', 7);
  setColor(rgb([120, 145, 180]));
  doc.text('Metodología: BSC · ISO 9001 · ISO 56002 · Lean · BPM · ESG · Canvas · ISO 31000', ML, 215);

  // Footer cover
  fillRect(0, H - 20, W, 20, [8, 22, 50]);
  setFont('normal', 8);
  setColor(rgb([120, 145, 180]));
  doc.text('Confidencial — Solo para uso interno', ML, H - 8);
  doc.text(new Date(results.completedAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }), W - MR, H - 8, { align: 'right' });

  // ── PAGE 2: EXECUTIVE SUMMARY ────────────────────────────────────────────
  addPage();
  pageFooter(2);

  let y = MT;
  setFont('bold', 16);
  setColor(NAVY);
  doc.text('Resumen Ejecutivo', ML, y);
  y += 6;
  hline(y, GOLD, 1);
  y += 8;

  setFont('normal', 10);
  setColor(DARK);
  const summary = [
    `${results.companyInfo.nombre} completó el diagnóstico integral de madurez empresarial el ${new Date(results.completedAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}. `,
    `La evaluación comprendió ${Object.keys(results.answers).length} ítems distribuidos en ${results.areaResults.length} dimensiones estratégicas, obteniendo un puntaje global de ${results.overallScore.toFixed(2)}/5.0, `,
    `correspondiente al Nivel ${results.overallLevel} de madurez: "${matInfo.name}". ${matInfo.description}.`,
  ].join('');
  const sumLines = doc.splitTextToSize(summary, TW);
  doc.text(sumLines, ML, y);
  y += sumLines.length * 5 + 6;

  // Summary KPIs
  const kpis = [
    { label: 'Puntaje Global', val: `${results.overallScore.toFixed(2)}/5.0` },
    { label: 'Nivel de Madurez', val: `N${results.overallLevel}: ${matInfo.name}` },
    { label: 'Áreas Evaluadas', val: `${results.areaResults.length} de ${AREAS.length}` },
    { label: 'Ítems Evaluados', val: `${Object.keys(results.answers).length}` },
  ];
  const kpiW = TW / 4;
  kpis.forEach((k, i) => {
    const kx = ML + i * kpiW;
    fillRect(kx, y, kpiW - 3, 20, [238, 242, 248]);
    setFont('bold', 13);
    setColor(NAVY);
    doc.text(k.val, kx + (kpiW - 3) / 2, y + 11, { align: 'center' });
    setFont('normal', 7);
    setColor(MID_GRAY);
    doc.text(k.label, kx + (kpiW - 3) / 2, y + 17, { align: 'center' });
  });
  y += 28;

  // Top 3 areas
  y = sectionTitle('Áreas Más Destacadas', y);
  const topAreas = results.areaResults.sort((a, b) => b.score - a.score).slice(0, 3);
  topAreas.forEach(ar => {
    const area = AREAS.find(a => a.id === ar.areaId)!;
    const lvl = MATURITY_LEVELS.find(l => l.level === ar.level)!;
    fillRect(ML, y, TW, 10, [248, 249, 250]);
    setFont('bold', 9);
    setColor(DARK);
    doc.text(area.name, ML + 4, y + 6.5);
    setFont('bold', 10);
    setColor([parseInt(lvl.color.slice(1, 3), 16), parseInt(lvl.color.slice(3, 5), 16), parseInt(lvl.color.slice(5, 7), 16)]);
    doc.text(`${ar.score.toFixed(2)}/5`, W - MR - 20, y + 6.5);
    y += 12;
  });
  y += 4;

  // Critical areas
  y = sectionTitle('Áreas con Mayor Brecha', y);
  const critAreas = results.areaResults.sort((a, b) => a.score - b.score).slice(0, 3);
  critAreas.forEach(ar => {
    const area = AREAS.find(a => a.id === ar.areaId)!;
    fillRect(ML, y, TW, 10, [255, 245, 245]);
    setFont('bold', 9);
    setColor(DARK);
    doc.text(area.name, ML + 4, y + 6.5);
    setFont('bold', 10);
    setColor([185, 28, 28]);
    doc.text(`${ar.score.toFixed(2)}/5`, W - MR - 20, y + 6.5);
    y += 12;
  });
  y += 4;

  // Risks
  if (risks.length > 0) {
    y = sectionTitle('Riesgos Identificados', y);
    risks.forEach(risk => {
      setFont('normal', 8);
      setColor(DARK);
      const lines = doc.splitTextToSize(`▸ ${risk}`, TW - 4);
      doc.text(lines, ML + 4, y + 4);
      y += lines.length * 4 + 3;
    });
  }

  // ── PAGE 3: METHODOLOGY ─────────────────────────────────────────────────
  addPage();
  pageFooter(3);
  y = MT;
  setFont('bold', 16);
  setColor(NAVY);
  doc.text('Metodología del Diagnóstico', ML, y);
  y += 6;
  hline(y, GOLD, 1);
  y += 8;

  setFont('normal', 9);
  setColor(DARK);
  const methText = 'El diagnóstico de madurez empresarial aplica un enfoque multidimensional que combina las mejores prácticas de los marcos de referencia más reconocidos a nivel internacional. La evaluación utiliza una escala de madurez de cinco niveles, desde prácticas inexistentes (Nivel 1: Inicial) hasta excelencia operacional con mejora continua (Nivel 5: Optimizado). El carácter adaptativo del instrumento garantiza que cada empresa responda únicamente las preguntas pertinentes a su sector, tamaño, nivel de digitalización y perfil exportador.';
  const methLines = doc.splitTextToSize(methText, TW);
  doc.text(methLines, ML, y);
  y += methLines.length * 4.5 + 6;

  // Scale table
  y = sectionTitle('Escala de Madurez Empresarial', y);
  MATURITY_LEVELS.forEach(l => {
    const c = hexToRgb(l.color);
    fillRect(ML, y, 5, 10, c);
    fillRect(ML + 5, y, TW - 5, 10, hexToRgbLight(l.color));
    setFont('bold', 9);
    setColor(c);
    doc.text(`N${l.level}: ${l.name}`, ML + 9, y + 6.5);
    setFont('normal', 8);
    setColor(DARK);
    doc.text(`${l.range[0].toFixed(1)} – ${l.range[1].toFixed(1)} | ${l.description}`, ML + 55, y + 6.5);
    y += 12;
  });
  y += 4;

  // Dimensions
  y = sectionTitle('Dimensiones del Diagnóstico', y);
  results.areaResults.forEach(ar => {
    const area = AREAS.find(a => a.id === ar.areaId)!;
    setFont('bold', 8);
    setColor(DARK);
    doc.text(`${area.id} — ${area.name}`, ML + 4, y + 5);
    setFont('normal', 7);
    setColor(MID_GRAY);
    doc.text(area.description, ML + 60, y + 5);
    setFont('bold', 8);
    setColor(hexToRgb(getMaturityInfo(ar.score).color));
    doc.text(`${ar.questionsCount} ítems`, W - MR - 15, y + 5);
    y += 8;
  });

  // ── PAGE 4: CHARTS ───────────────────────────────────────────────────────
  addPage();
  pageFooter(4);
  y = MT;
  setFont('bold', 16);
  setColor(NAVY);
  doc.text('Resultados Gráficos', ML, y);
  y += 6;
  hline(y, GOLD, 1);
  y += 8;

  // Try to capture charts
  try {
    if (radarRef.current) {
      const canvas = await html2canvas(radarRef.current, { backgroundColor: 'white', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', ML, y, 80, 70);
    }
    if (barRef.current) {
      const canvas2 = await html2canvas(barRef.current, { backgroundColor: 'white', scale: 2 });
      const imgData2 = canvas2.toDataURL('image/png');
      doc.addImage(imgData2, 'PNG', ML + 88, y, 82, 70);
    }
    y += 78;
  } catch {
    setFont('italic', 9);
    setColor(MID_GRAY);
    doc.text('(Gráficas disponibles en el dashboard web)', ML, y + 20);
    y += 40;
  }

  // Area scores table
  y = sectionTitle('Tabla de Resultados por Área', y);
  const tableBody = results.areaResults.sort((a, b) => b.score - a.score).map(ar => {
    const area = AREAS.find(a => a.id === ar.areaId)!;
    const lvl = MATURITY_LEVELS.find(l => l.level === ar.level)!;
    return [ar.areaId, area.name, ar.score.toFixed(2), `N${ar.level}: ${lvl.name}`, String(ar.questionsCount), String(ar.weakQuestions.length)];
  });

  (doc as any).autoTable({
    head: [['Código', 'Área', 'Puntaje', 'Nivel', 'Preguntas', 'Brechas']],
    body: tableBody,
    startY: y,
    margin: { left: ML, right: MR },
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: NAVY as any, textColor: WHITE as any, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 100, 120] },
      2: { fontStyle: 'bold', halign: 'center' },
      3: { fontSize: 7.5 },
      4: { halign: 'center' },
      5: { halign: 'center', textColor: [185, 28, 28] },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── PAGE 5+: RECOMMENDATIONS ─────────────────────────────────────────────
  addPage();
  pageFooter(5);
  y = MT;
  setFont('bold', 16);
  setColor(NAVY);
  doc.text('Plan de Recomendaciones', ML, y);
  y += 6;
  hline(y, GOLD, 1);
  y += 5;
  setFont('normal', 9);
  setColor(MID_GRAY);
  doc.text('Recomendaciones ordenadas por prioridad e impacto. Enfóquese en las acciones de Prioridad Alta en los primeros 3 meses.', ML, y);
  y += 8;

  const recRows = topRecs.map((r, i) => {
    const area = AREAS.find(a => a.id === r.question.areaId)!;
    const prioColor: Record<string, [number, number, number]> = { Alta: [185, 28, 28], Media: [217, 119, 6], Baja: [4, 120, 87] };
    return [
      `#${i + 1}`,
      r.question.id,
      area.shortName,
      r.question.rec.action.length > 60 ? r.question.rec.action.slice(0, 57) + '…' : r.question.rec.action,
      r.question.rec.responsible,
      r.question.rec.priority,
      `${r.question.rec.months}m`,
      answerLabel(r.question, r.score),
    ];
  });

  (doc as any).autoTable({
    head: [['#', 'Código', 'Área', 'Acción Recomendada', 'Responsable', 'Prioridad', 'Plazo', 'Actual']],
    body: recRows,
    startY: y,
    margin: { left: ML, right: MR },
    styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: NAVY as any, textColor: WHITE as any, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8, fontStyle: 'bold', textColor: [150, 150, 160] },
      1: { cellWidth: 14, fontStyle: 'bold', textColor: [100, 100, 120] },
      2: { cellWidth: 20 },
      3: { cellWidth: 68 },
      4: { cellWidth: 28 },
      5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
    },
    didDrawCell: (data: any) => {
      if (data.column.index === 5 && data.section === 'body') {
        const val = data.cell.raw as string;
        const col = val === 'Alta' ? [220, 38, 38] : val === 'Media' ? [217, 119, 6] : [4, 120, 87];
        doc.setTextColor(col[0], col[1], col[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(val, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 0.5, { align: 'center' });
      }
    },
  });

  // ── PAGE: 12-MONTH PLAN ─────────────────────────────────────────────────
  addPage();
  const planPage = doc.getNumberOfPages();
  pageFooter(planPage);
  y = MT;
  setFont('bold', 16);
  setColor(NAVY);
  doc.text('Plan de Mejora a 12 Meses', ML, y);
  y += 6;
  hline(y, GOLD, 1);
  y += 8;

  const phases = [
    { label: 'FASE 1: Acciones Inmediatas (Meses 1–3)', filter: '1-3', color: [185, 28, 28] as [number, number, number] },
    { label: 'FASE 2: Consolidación (Meses 3–6)', filter: '3-6', color: [217, 119, 6] as [number, number, number] },
    { label: 'FASE 3: Transformación Estratégica (Meses 6–12)', filter: '6-12', color: [4, 120, 87] as [number, number, number] },
  ];

  for (const phase of phases) {
    const phaseRecs = topRecs.filter(r => r.question.rec.months === phase.filter);
    if (phaseRecs.length === 0) continue;

    fillRect(ML, y, TW, 8, phase.color);
    setFont('bold', 9);
    setColor(WHITE);
    doc.text(phase.label, ML + 4, y + 5.5);
    y += 10;

    phaseRecs.forEach((r, i) => {
      if (y > H - 35) { addPage(); pageFooter(doc.getNumberOfPages()); y = MT; }
      fillRect(ML, y, TW, 12, i % 2 === 0 ? [248, 249, 250] : WHITE);
      setFont('bold', 8);
      setColor(phase.color);
      doc.text(`${i + 1}.`, ML + 3, y + 8);
      setFont('bold', 8);
      setColor(DARK);
      doc.text(r.question.rec.action.length > 75 ? r.question.rec.action.slice(0, 72) + '…' : r.question.rec.action, ML + 10, y + 5.5);
      setFont('normal', 7);
      setColor(MID_GRAY);
      doc.text(`Responsable: ${r.question.rec.responsible}  ·  Herramienta: ${r.question.rec.tool.length > 50 ? r.question.rec.tool.slice(0, 47) + '…' : r.question.rec.tool}`, ML + 10, y + 10);
      y += 14;
    });
    y += 4;
  }

  // ── FINAL PAGE: CONCLUSIONS ────────────────────────────────────────────
  addPage();
  const lastPage = doc.getNumberOfPages();
  pageFooter(lastPage);
  y = MT;
  setFont('bold', 16);
  setColor(NAVY);
  doc.text('Conclusiones', ML, y);
  y += 6;
  hline(y, GOLD, 1);
  y += 8;

  const concl1 = `El diagnóstico de madurez empresarial de ${results.companyInfo.nombre} revela un nivel global ${matInfo.name} (${results.overallScore.toFixed(2)}/5.0). ` +
    `La empresa cuenta con ${strengths.length} fortalezas identificadas y ${topRecs.length} oportunidades de mejora priorizadas. ` +
    `Se recomienda implementar el plan de acción propuesto iniciando por las ${topRecs.filter(r => r.question.rec.priority === 'Alta').length} acciones de prioridad alta en los primeros tres meses.`;

  setFont('normal', 9);
  setColor(DARK);
  const c1Lines = doc.splitTextToSize(concl1, TW);
  doc.text(c1Lines, ML, y);
  y += c1Lines.length * 4.5 + 8;

  if (risks.length > 0) {
    y = sectionTitle('Riesgos a Atender con Urgencia', y);
    risks.forEach(r => {
      setFont('normal', 8);
      setColor(DARK);
      const rLines = doc.splitTextToSize(`▸ ${r}`, TW - 6);
      doc.text(rLines, ML + 4, y + 4);
      y += rLines.length * 4 + 3;
    });
    y += 3;
  }

  if (opportunities.length > 0) {
    y = sectionTitle('Oportunidades Estratégicas', y);
    opportunities.forEach(o => {
      setFont('normal', 8);
      setColor(DARK);
      const oLines = doc.splitTextToSize(`◎ ${o}`, TW - 6);
      doc.text(oLines, ML + 4, y + 4);
      y += oLines.length * 4 + 3;
    });
    y += 3;
  }

  // Closing note
  fillRect(ML, y + 4, TW, 20, [238, 242, 248]);
  setFont('bold', 9);
  setColor(NAVY);
  doc.text('Nota importante', ML + 4, y + 11);
  setFont('italic', 8);
  setColor(MID_GRAY);
  const note = 'Este diagnóstico es un instrumento de evaluación gerencial. Los resultados reflejan la percepción del respondiente y deben complementarse con análisis más detallados en las áreas críticas identificadas.';
  const nLines = doc.splitTextToSize(note, TW - 8);
  doc.text(nLines, ML + 4, y + 17);

  doc.save(`Diagnostico_Madurez_${results.companyInfo.nombre.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
}

function sectorLabel(sector: string): string {
  const map: Record<string, string> = {
    manufactura: 'Manufactura', servicios: 'Servicios', comercio: 'Comercio',
    agro: 'Agroindustria', tecnologia: 'Tecnología', construccion: 'Construcción',
    salud: 'Salud', educacion: 'Educación', otro: 'Otro',
  };
  return map[sector] ?? sector;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function hexToRgbLight(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [Math.min(255, r + 200), Math.min(255, g + 200), Math.min(255, b + 200)];
}
