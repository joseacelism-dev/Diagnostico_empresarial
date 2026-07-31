interface IntroPageProps {
  onStart: () => void;
}

export default function IntroPage({ onStart }: IntroPageProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0F2449 0%, #1A3D6E 50%, #2D5A9E 100%)' }}>
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,168,67,0.2)', border: '1px solid rgba(212,168,67,0.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#D4A843"/>
            </svg>
          </div>
          <span className="font-display font-600 text-white tracking-wide text-sm uppercase">Prompt Maestro</span>
        </div>
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Diagnóstico Empresarial</span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-600 uppercase tracking-widest" style={{ background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', color: '#E5B94A' }}>
          <span>■</span> Herramienta Profesional de Diagnóstico
        </div>

        <h1 className="font-display font-700 mb-6 leading-tight" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: 'white', maxWidth: 720 }}>
          Diagnóstico Integral de<br />
          <span style={{ color: '#E5B94A' }}>Madurez Empresarial</span>
        </h1>

        <p className="text-lg mb-4 max-w-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
          Evalúa el nivel de madurez de tu empresa en 8 dimensiones estratégicas, identifica brechas y oportunidades, y recibe un informe ejecutivo profesional con un plan de mejora priorizado.
        </p>

        <p className="text-sm mb-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Tiempo estimado: 30–40 minutos · Sin registro · 100% confidencial
        </p>

        <button
          onClick={onStart}
          className="group relative px-10 py-4 rounded-lg font-display font-600 text-base transition-all duration-200"
          style={{ background: '#D4A843', color: '#0F2449' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#E5B94A')}
          onMouseLeave={e => (e.currentTarget.style.background = '#D4A843')}
        >
          Iniciar Diagnóstico
          <span className="ml-2">→</span>
        </button>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 gap-6 max-w-3xl w-full" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { icon: '◈', title: '10 Dimensiones', desc: 'Evaluación integral de todas las áreas críticas del negocio' },
            { icon: '◎', title: 'Adaptativo', desc: 'El diagnóstico se adapta al sector, tamaño y perfil de tu empresa' },
            { icon: '◉', title: 'Informe PDF', desc: 'Reporte ejecutivo descargable elaborado al nivel de una firma consultora' },
          ].map(f => (
            <div key={f.title} className="rounded-xl p-6 text-left" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-2xl mb-3" style={{ color: '#E5B94A' }}>{f.icon}</div>
              <h3 className="font-display font-600 text-white mb-2 text-sm">{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Methodology badges */}
      <footer className="px-8 py-6 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Metodología basada en</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['BSC', 'ISO 9001', 'ISO 56002', 'Lean', 'BPM', 'ESG', 'Canvas', 'ISO 31000'].map(m => (
            <span key={m} className="px-3 py-1 rounded text-xs font-mono" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {m}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
