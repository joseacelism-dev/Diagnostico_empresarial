import logoJa from '../assets/logo-ja-transparent.png';

interface IntroPageProps {
  onStart: () => void;
}

export default function IntroPage({ onStart }: IntroPageProps) {
  return (
    <div
      className="intro-page min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #07162D 0%, #0F2449 48%, #173E72 100%)' }}
    >
      <div className="intro-glow intro-glow-main" />
      <div className="intro-glow intro-glow-accent" />
      <div className="intro-accent-line" />

      <header className="relative z-10 px-8 py-3 flex items-center justify-between">
        <img
          src={logoJa}
          alt="Logo"
          className="h-28 w-auto object-contain"
          style={{ filter: 'drop-shadow(0 18px 36px rgba(0,0,0,0.28)) drop-shadow(0 0 22px rgba(0,196,235,0.18))' }}
        />
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Diagnóstico Empresarial</span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-6 pt-0 pb-7 -mt-7 text-center">
        <div className="intro-kicker inline-flex items-center mb-4 px-5 py-2 rounded-full text-xs font-600 uppercase tracking-widest">
          Herramienta Profesional de Diagnóstico
        </div>

        <h1 className="font-display font-700 mb-4 leading-tight" style={{ fontSize: 'clamp(2.2rem, 4.8vw, 3.45rem)', color: 'white', maxWidth: 780 }}>
          Diagnóstico Integral de<br />
          <span style={{ color: '#E5B94A' }}>Madurez Empresarial</span>
        </h1>

        <p className="text-lg mb-7 max-w-2xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
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

        <div className="mt-8 grid grid-cols-1 gap-3 max-w-3xl w-full" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { title: '8 Dimensiones', desc: 'Evaluación integral de las áreas críticas del negocio' },
            { title: 'Adaptativo', desc: 'Se ajusta al sector, tamaño y perfil de la empresa' },
            { title: 'Informe PDF', desc: 'Reporte ejecutivo descargable con plan priorizado' },
          ].map(f => (
            <div key={f.title} className="intro-feature rounded-lg p-4 text-left">
              <h3 className="font-display font-600 text-white mb-2 text-sm">{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
