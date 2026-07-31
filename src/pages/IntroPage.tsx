import logoJa from '../assets/logo-ja-transparent.png';

interface IntroPageProps {
  onStart: () => void;
}

export default function IntroPage({ onStart }: IntroPageProps) {
  return (
    <div className="intro-page min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F2449 0%, #1A3D6E 50%, #2D5A9E 100%)' }}>
      <div className="intro-sparkle intro-sparkle-a" />
      <div className="intro-sparkle intro-sparkle-b" />
      <div className="intro-sparkle intro-sparkle-c" />
      <div className="intro-ray intro-ray-a" />
      <div className="intro-ray intro-ray-b" />

      <header className="relative z-10 px-8 py-4 flex items-center justify-between">
        <img
          src={logoJa}
          alt="Logo"
          className="h-24 w-auto object-contain"
          style={{ filter: 'drop-shadow(0 0 18px rgba(229,185,74,0.34))' }}
        />
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Diagnóstico Empresarial</span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-6 pt-8 pb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full text-xs font-600 uppercase tracking-widest" style={{ background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', color: '#E5B94A' }}>
          <span>◆</span> Herramienta Profesional de Diagnóstico
        </div>

        <h1 className="font-display font-700 mb-5 leading-tight" style={{ fontSize: 'clamp(2.1rem, 4.7vw, 3.35rem)', color: 'white', maxWidth: 760 }}>
          Diagnóstico Integral de<br />
          <span style={{ color: '#E5B94A' }}>Madurez Empresarial</span>
        </h1>

        <p className="text-lg mb-8 max-w-2xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
          Evalúa el nivel de madurez de tu empresa en 8 dimensiones estratégicas, identifica brechas y oportunidades, y recibe un informe ejecutivo profesional con un plan de mejora priorizado.
        </p>

        <button
          onClick={onStart}
          className="group relative px-10 py-4 rounded-lg font-display font-600 text-base transition-all duration-200"
          style={{ background: '#D4A843', color: '#0F2449', boxShadow: '0 18px 48px rgba(212,168,67,0.24)' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#E5B94A')}
          onMouseLeave={e => (e.currentTarget.style.background = '#D4A843')}
        >
          Iniciar Diagnóstico
          <span className="ml-2">→</span>
        </button>

        <div className="mt-10 grid grid-cols-1 gap-4 max-w-3xl w-full" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { icon: '◆', title: '8 Dimensiones', desc: 'Evaluación integral de las áreas críticas del negocio' },
            { icon: '✦', title: 'Adaptativo', desc: 'El diagnóstico se adapta al sector, tamaño y perfil de tu empresa' },
            { icon: '◈', title: 'Informe PDF', desc: 'Reporte ejecutivo descargable elaborado al nivel de una firma consultora' },
          ].map(f => (
            <div key={f.title} className="rounded-xl p-5 text-left" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-xl mb-2" style={{ color: '#E5B94A' }}>{f.icon}</div>
              <h3 className="font-display font-600 text-white mb-2 text-sm">{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
