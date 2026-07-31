import { useState, useEffect } from 'react';
import type { CompanyInfo, Question } from '../types';
import { AREAS } from '../data/areas';
import { RESPONSE_SCALES } from '../types';

interface Props {
  companyInfo: CompanyInfo;
  questions: Question[];
  answers: Record<string, number>;
  onAnswer: (qid: string, val: number) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function WizardPage({ companyInfo, questions, answers, onAnswer, onComplete, onBack }: Props) {
  // Group questions by area
  const areaGroups = AREAS.map(area => ({
    area,
    questions: questions.filter(q => q.areaId === area.id),
  })).filter(g => g.questions.length > 0);

  const [areaIdx, setAreaIdx] = useState(0);
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const currentGroup = areaGroups[areaIdx];
  const currentArea = currentGroup?.area;
  const currentQs = currentGroup?.questions ?? [];
  const areaColor = currentArea?.color ?? '#0F2449';
  const areaLightColor = currentArea?.lightColor ?? '#EEF2F8';

  const totalAnswered = Object.keys(answers).length;
  const progress = (totalAnswered / questions.length) * 100;

  const areaAnswered = currentQs.filter(q => answers[q.id] !== undefined).length;
  const areaComplete = areaAnswered === currentQs.length;

  function goNext() {
    if (areaIdx < areaGroups.length - 1) setAreaIdx(i => i + 1);
    else onComplete();
  }

  function goPrev() {
    if (areaIdx > 0) setAreaIdx(i => i - 1);
    else onBack();
  }

  const isLast = areaIdx === areaGroups.length - 1;

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [areaIdx]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-cream-50)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20" style={{ background: '#0F2449', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={goPrev} className="text-sm transition-opacity opacity-60 hover:opacity-100" style={{ color: '#E5B94A' }}>← Atrás</button>
            <span className="font-display font-600 text-white text-sm hidden sm:block">Diagnóstico Empresarial</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {totalAnswered}/{questions.length} respondidas
            </span>
            <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: areaColor }} />
            </div>
            <span className="text-xs font-mono font-500" style={{ color: '#E5B94A' }}>{Math.round(progress)}%</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar – area nav */}
        <aside className="w-56 shrink-0 hidden lg:flex flex-col py-8 px-4" style={{ background: '#0F2449', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          {areaGroups.map((g, i) => {
            const aQs = g.questions.filter(q => answers[q.id] !== undefined).length;
            const complete = aQs === g.questions.length;
            const active = i === areaIdx;
            return (
              <button key={g.area.id} onClick={() => setAreaIdx(i)}
                className="flex items-start gap-3 px-3 py-3 rounded-lg mb-1 text-left transition-all"
                style={{
                  background: active ? 'rgba(212,168,67,0.15)' : 'transparent',
                  border: active ? '1px solid rgba(212,168,67,0.3)' : '1px solid transparent',
                }}>
                <div className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-xs"
                  style={{
                    background: complete ? '#D4A843' : active ? 'rgba(212,168,67,0.3)' : 'rgba(255,255,255,0.1)',
                    color: complete ? '#0F2449' : 'white',
                  }}>
                  {complete ? '✓' : i + 1}
                </div>
                <div>
                  <div className="text-xs font-600 leading-tight" style={{ color: active ? '#E5B94A' : complete ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-display)' }}>
                    {g.area.shortName}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {aQs}/{g.questions.length}
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 px-6 lg:px-8 py-10 w-full">
          {/* Area header */}
          <div className="mb-10 text-center rounded-2xl px-8 py-8" style={{ background: areaLightColor, border: `1px solid ${areaColor}22` }}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-xs font-600" style={{ color: areaColor, fontFamily: 'var(--font-display)' }}>Área {areaIdx + 1} de {areaGroups.length}</span>
            </div>
            <h1 className="font-display font-700 text-4xl mb-3" style={{ color: areaColor, fontWeight: 800 }}>{currentArea?.name}</h1>
            <p className="text-lg leading-relaxed max-w-5xl mx-auto" style={{ color: '#6B7280' }}>{currentArea?.description}</p>
          </div>

          {/* Questions */}
          <div className="space-y-6 mb-10">
            {currentQs.map((q, qi) => {
              const selected = answers[q.id];
              const scale = RESPONSE_SCALES[q.scale];
              return (
                <div key={q.id} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: `1px solid ${areaColor}24`, boxShadow: `inset 6px 0 0 ${areaColor}` }}>
                  <div className="px-8 lg:px-10 pt-8 pb-6">
                    <div className="flex items-start gap-4 mb-6">
                      <span className="font-mono text-xs font-500 mt-0.5 shrink-0 px-2 py-1 rounded" style={{ color: areaColor, background: areaLightColor }}>{q.id}</span>
                      <div className="flex-1">
                        <p className="text-lg font-500 leading-relaxed mb-3" style={{ color: '#1C1C2E' }}>
                          {q.text}
                          {q.weight === 3 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: '#FEF3C7', color: '#92400E' }}>Alta prioridad</span>
                          )}
                        </p>
                        <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                          Escala: <span className="font-600" style={{ fontFamily: 'var(--font-display)' }}>{scale.name}</span>
                        </p>
                        <button
                          onClick={() => setShowHelp(showHelp === q.id ? null : q.id)}
                          className="text-xs flex items-center gap-1 transition-opacity opacity-60 hover:opacity-100"
                          style={{ color: areaColor }}>
                          <span>{showHelp === q.id ? '▲' : '▼'}</span> {showHelp === q.id ? 'Ocultar ayuda' : 'Ver orientación'}
                        </button>
                        {showHelp === q.id && (
                          <div className="mt-3 p-3 rounded-lg text-xs leading-relaxed" style={{ background: areaLightColor, color: '#374151', border: `1px solid ${areaColor}22` }}>
                            {q.help}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${scale.options.length}, minmax(${scale.options.length === 2 ? '180px' : '120px'}, 1fr))`, paddingBottom: 2 }}>
                      {scale.options.map(o => (
                        <button
                          key={o.score}
                          onClick={() => onAnswer(q.id, o.score)}
                          title={o.desc}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all text-center"
                          style={{
                            border: selected === o.score ? `2px solid ${scoreColor(o.score)}` : '2px solid #E5E7EB',
                            background: selected === o.score ? `${scoreColor(o.score)}18` : 'white',
                            minHeight: 112,
                          }}>
                          <span className="w-11 h-11 rounded-full flex items-center justify-center text-base font-600"
                            style={{
                              background: selected === o.score ? scoreColor(o.score) : '#F3F4F6',
                              color: selected === o.score ? 'white' : '#6B7280',
                              fontFamily: 'var(--font-mono)',
                            }}>
                            {o.score}
                          </span>
                          <span className="text-sm leading-tight" style={{ color: selected === o.score ? scoreColor(o.score) : '#9CA3AF', fontFamily: 'var(--font-display)', fontWeight: selected === o.score ? 600 : 400 }}>
                            {o.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {selected !== undefined && selected <= 2 && (
                    <div className="px-6 py-3 text-xs border-t" style={{ background: '#FFF7ED', borderColor: '#FDE68A', color: '#92400E' }}>
                      💡 <strong>Recomendación:</strong> {q.rec.action}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={goPrev}
              className="px-6 py-3 rounded-xl text-sm font-600 transition-all"
              style={{ background: 'white', border: '1px solid #E5E7EB', color: '#374151', fontFamily: 'var(--font-display)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#1A3D6E')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
              ← Anterior
            </button>

            <div className="flex items-center gap-2">
              {!areaComplete && (
                <span className="text-xs" style={{ color: '#9CA3AF' }}>
                  {currentQs.length - areaAnswered} sin responder
                </span>
              )}
              <button
                onClick={goNext}
                disabled={!areaComplete}
                className="px-6 py-3 rounded-xl text-sm font-600 transition-all"
                style={{
                  background: areaComplete ? '#0F2449' : '#E5E7EB',
                  color: areaComplete ? 'white' : '#9CA3AF',
                  fontFamily: 'var(--font-display)',
                  cursor: areaComplete ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={e => { if (areaComplete) e.currentTarget.style.background = '#1A3D6E'; }}
                onMouseLeave={e => { if (areaComplete) e.currentTarget.style.background = '#0F2449'; }}>
                {isLast ? 'Ver Resultados →' : 'Siguiente Área →'}
              </button>
            </div>
          </div>

          {/* Skip */}
          {!areaComplete && areaAnswered > 0 && (
            <p className="text-center mt-4 text-xs" style={{ color: '#9CA3AF' }}>
              Responde todas las preguntas del área para continuar
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  const map: Record<number, string> = { 1: '#B91C1C', 2: '#D97706', 3: '#B45309', 4: '#047857', 5: '#1A3D6E' };
  return map[score] ?? '#6B7280';
}
