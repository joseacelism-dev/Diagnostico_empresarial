import type { CompanyInfo, Question, DiagnosticResults, AreaResult } from '../types';
import { MATURITY_LEVELS } from '../types';
import { AREAS } from '../data/areas';
import { TOOL_RECS } from '../data/toolRecommendations';
import type { ToolRec } from '../data/toolRecommendations';

export function getMaturityLevel(score: number): number {
  for (const level of MATURITY_LEVELS) {
    if (score >= level.range[0] && score <= level.range[1]) return level.level;
  }
  return score < 1.9 ? 1 : 5;
}

export function getMaturityInfo(score: number) {
  return MATURITY_LEVELS.find(l => l.level === getMaturityLevel(score)) ?? MATURITY_LEVELS[0];
}

export function computeResults(
  companyInfo: CompanyInfo,
  answers: Record<string, number>,
  appliedQuestions: Question[],
): DiagnosticResults {
  const areaResults: AreaResult[] = AREAS.map(area => {
    const areaQs = appliedQuestions.filter(q => q.areaId === area.id);
    const answered = areaQs.filter(q => answers[q.id] !== undefined);
    if (answered.length === 0) {
      return { areaId: area.id, score: 0, level: 0, questionsCount: 0, weakQuestions: [] };
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;
    const weakQuestions: Array<{ question: Question; score: number }> = [];

    for (const q of answered) {
      const score = answers[q.id];
      totalWeightedScore += score * q.weight;
      totalWeight += q.weight;
      if (score <= 3) {
        weakQuestions.push({ question: q, score });
      }
    }

    const score = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    return {
      areaId: area.id,
      score: Math.round(score * 100) / 100,
      level: getMaturityLevel(score),
      questionsCount: answered.length,
      weakQuestions: weakQuestions.sort((a, b) => (a.score - b.score) || (b.question.weight - a.question.weight)),
    };
  }).filter(r => r.questionsCount > 0);

  const activatedAreas = areaResults.filter(r => r.questionsCount > 0);
  let totalWeighted = 0;
  let totalAreaWeight = 0;
  for (const ar of activatedAreas) {
    const area = AREAS.find(a => a.id === ar.areaId)!;
    totalWeighted += ar.score * area.weight;
    totalAreaWeight += area.weight;
  }

  const overallScore = totalAreaWeight > 0 ? Math.round((totalWeighted / totalAreaWeight) * 100) / 100 : 0;

  return {
    companyInfo,
    answers,
    overallScore,
    overallLevel: getMaturityLevel(overallScore),
    areaResults,
    completedAt: new Date(),
  };
}

export function getTopRecommendations(
  results: DiagnosticResults,
  appliedQuestions: Question[],
  limit = 15,
): Array<{ question: Question; score: number; priority: number }> {
  const recs: Array<{ question: Question; score: number; priority: number }> = [];
  for (const q of appliedQuestions) {
    const score = results.answers[q.id];
    if (score !== undefined && score <= 3) {
      const priority = (5 - score) * q.weight;
      recs.push({ question: q, score, priority });
    }
  }
  return recs.sort((a, b) => b.priority - a.priority).slice(0, limit);
}

export function getStrengths(
  results: DiagnosticResults,
  appliedQuestions: Question[],
): Array<{ question: Question; score: number }> {
  return appliedQuestions
    .filter(q => results.answers[q.id] >= 4)
    .map(q => ({ question: q, score: results.answers[q.id] }))
    .sort((a, b) => b.score - a.score);
}

export function getRisks(results: DiagnosticResults): string[] {
  const risks: string[] = [];
  const { areaResults } = results;

  const gf = areaResults.find(r => r.areaId === 'GF');
  if (gf && gf.score < 2.5) risks.push('Riesgo financiero crítico: gestión financiera insuficiente puede comprometer la liquidez y solvencia de la empresa.');

  const ga = areaResults.find(r => r.areaId === 'GA');
  if (ga && ga.score < 2.5) risks.push('Riesgo operativo y legal: ausencia de controles internos y cumplimiento regulatorio expone a sanciones y pérdidas patrimoniales.');

  const it = areaResults.find(r => r.areaId === 'IT');
  if (it && it.score < 2.5) risks.push('Riesgo de obsolescencia digital: la baja digitalización reduce la competitividad y aumenta la vulnerabilidad ante disruptores del sector.');

  const cm = areaResults.find(r => r.areaId === 'CM');
  if (cm && cm.score < 2.5) risks.push('Riesgo comercial: propuesta de valor débil y canales no optimizados limitan el crecimiento de ingresos y la retención de clientes.');

  const pe = areaResults.find(r => r.areaId === 'PE');
  if (pe && pe.score < 2.5) risks.push('Riesgo estratégico: ausencia de planeación estructurada genera decisiones reactivas y pérdida de oportunidades de mercado.');

  if (results.overallScore < 2.0) risks.push('Riesgo sistémico: el nivel de madurez global de la empresa es crítico, con múltiples brechas que amenazan la continuidad del negocio.');

  return risks;
}

export function getApplicableToolRecs(results: DiagnosticResults): ToolRec[] {
  const { areaResults, companyInfo } = results;
  const scoreMap: Record<string, number> = {};
  for (const ar of areaResults) scoreMap[ar.areaId] = ar.score;

  return TOOL_RECS
    .filter(tr => {
      const areaScore = scoreMap[tr.triggerAreaId];
      if (areaScore === undefined) return false;
      if (areaScore > tr.triggerScoreMax) return false;
      if (tr.sectorFilter && !tr.sectorFilter.includes(companyInfo.sector)) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.urgencyOrder !== b.urgencyOrder) return a.urgencyOrder - b.urgencyOrder;
      const sa = scoreMap[a.triggerAreaId] ?? 5;
      const sb = scoreMap[b.triggerAreaId] ?? 5;
      return sa - sb;
    });
}

export function getOpportunities(results: DiagnosticResults): string[] {
  const opps: string[] = [];
  const { areaResults, companyInfo } = results;

  const pe = areaResults.find(r => r.areaId === 'PE');
  if (pe && pe.score >= 3.5) opps.push('La fortaleza estratégica de la empresa es una base sólida para evaluar nuevas líneas de negocio o expansión geográfica.');

  const cm = areaResults.find(r => r.areaId === 'CM');
  if (cm && cm.score >= 3.5) opps.push('La madurez comercial permite escalar a nuevos segmentos y mercados con mayor probabilidad de éxito.');

  const it = areaResults.find(r => r.areaId === 'IT');
  if (it && it.score >= 3.0) opps.push('La capacidad de innovación y digitalización puede convertirse en un diferenciador competitivo si se potencia con inversión focalizada.');

  const so = areaResults.find(r => r.areaId === 'SO');
  if (so && so.score >= 3.0) opps.push('Las prácticas de sostenibilidad bien desarrolladas pueden usarse como argumento comercial y abrir acceso a financiamiento verde.');

  if (!companyInfo.exporta) opps.push('La empresa tiene potencial exportador no explorado. Un plan de internacionalización puede diversificar fuentes de ingresos significativamente.');

  if (results.overallScore >= 3.5) opps.push('El nivel de madurez general de la empresa es una base sólida para escalar, atraer inversión o establecer franquicias o alianzas estratégicas.');

  return opps;
}
