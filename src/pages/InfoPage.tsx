import { useState } from 'react';
import type { CompanyInfo, Sector, CompanySize, DigitalLevel } from '../types';

const SECTORS: Array<{ value: Sector; label: string }> = [
  { value: 'manufactura', label: 'Manufactura / Industria' },
  { value: 'servicios', label: 'Servicios Profesionales' },
  { value: 'comercio', label: 'Comercio / Distribución' },
  { value: 'agro', label: 'Agroindustria / Agro' },
  { value: 'tecnologia', label: 'Tecnología / Software' },
  { value: 'construccion', label: 'Construcción / Inmobiliaria' },
  { value: 'salud', label: 'Salud / Bienestar' },
  { value: 'educacion', label: 'Educación / Formación' },
  { value: 'otro', label: 'Otro sector' },
];

interface Props {
  onComplete: (info: CompanyInfo) => void;
  onBack: () => void;
}

const empty: CompanyInfo = {
  nombre: '', nit: '', ciudad: '', sector: 'servicios', subsector: '',
  antiguedad: '', size: 'pequena', empleados: '', exporta: false,
  mercado: 'nacional', certificaciones: false, digitalLevel: 'basico',
  responsable: '', cargo: '', email: '',
};

export default function InfoPage({ onComplete, onBack }: Props) {
  const [info, setInfo] = useState<CompanyInfo>(empty);

  function set<K extends keyof CompanyInfo>(key: K, val: CompanyInfo[K]) {
    setInfo(prev => ({ ...prev, [key]: val }));
  }

  function handleSubmit() {
    onComplete(info);
  }

  const inputCls =
    'w-full px-4 py-3 rounded-lg text-sm border outline-none transition-all border-gray-200 bg-white focus:border-navy-500';

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-600 uppercase tracking-wide mb-2" style={{ color: '#4B5563', fontFamily: 'var(--font-display)' }}>
      {children}
    </label>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-cream-50)' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between" style={{ background: '#0F2449', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm transition-opacity opacity-60 hover:opacity-100" style={{ color: '#E5B94A' }}>← Volver</button>
          <span className="text-sm font-600" style={{ color: 'rgba(255,255,255,0.5)' }}>/</span>
          <span className="font-display font-600 text-white text-sm">Información General</span>
        </div>
        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>Paso 1 de 2</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display font-700 text-3xl mb-2" style={{ color: '#0F2449' }}>Información de la Empresa</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            Esta información personaliza el diagnóstico según el perfil de su empresa. Tomará menos de 3 minutos.
          </p>
        </div>

        {/* Company data */}
        <section className="rounded-2xl p-8 mb-6" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
          <h2 className="font-display font-600 text-lg mb-6" style={{ color: '#0F2449' }}>Datos de la empresa</h2>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <Label>Nombre o razón social</Label>
              <input className={inputCls} value={info.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Comercializadora ABC S.A.S." />
            </div>
            <div>
              <Label>NIT / RUC / RUT</Label>
              <input className={inputCls} value={info.nit} onChange={e => set('nit', e.target.value)} placeholder="Número de identificación" />
            </div>
            <div>
              <Label>Ciudad / Municipio</Label>
              <input className={inputCls} value={info.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Ej: Bogotá, Medellín, Lima" />
            </div>
            <div>
              <Label>Sector económico</Label>
              <select className={inputCls} value={info.sector} onChange={e => set('sector', e.target.value as Sector)}>
                {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Subsector o actividad específica</Label>
              <input className={inputCls} value={info.subsector} onChange={e => set('subsector', e.target.value)} placeholder="Ej: Alimentos, Textil, Logística..." />
            </div>
            <div>
              <Label>Años de operación</Label>
              <input className={inputCls} value={info.antiguedad} onChange={e => set('antiguedad', e.target.value)} placeholder="Ej: 5" type="number" min="0" />
            </div>
            <div>
              <Label>Número de colaboradores</Label>
              <input className={inputCls} value={info.empleados} onChange={e => set('empleados', e.target.value)} placeholder="Ej: 12" type="number" min="0" />
            </div>
          </div>
        </section>

        {/* Size & market */}
        <section className="rounded-2xl p-8 mb-6" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
          <h2 className="font-display font-600 text-lg mb-6" style={{ color: '#0F2449' }}>Tamaño y mercado</h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label>Tamaño de la empresa</Label>
              <select className={inputCls} value={info.size} onChange={e => set('size', e.target.value as CompanySize)}>
                <option value="micro">Microempresa (hasta 10 empleados)</option>
                <option value="pequena">Pequeña empresa (11–50 empleados)</option>
                <option value="mediana">Mediana empresa (51–200 empleados)</option>
              </select>
            </div>
            <div>
              <Label>Mercado principal</Label>
              <select className={inputCls} value={info.mercado} onChange={e => set('mercado', e.target.value as CompanyInfo['mercado'])}>
                <option value="local">Local / Municipal</option>
                <option value="regional">Regional / Departamental</option>
                <option value="nacional">Nacional</option>
                <option value="internacional">Internacional</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>Nivel de digitalización actual</Label>
              <div className="grid grid-cols-4 gap-3 mt-1">
                {([
                  ['ninguno', 'Ninguno', 'No usamos herramientas digitales'],
                  ['basico', 'Básico', 'Email, redes sociales, ofimática'],
                  ['intermedio', 'Intermedio', 'Software contable, CRM básico'],
                  ['avanzado', 'Avanzado', 'ERP, BI, automatización'],
                ] as const).map(([val, label, desc]) => (
                  <button key={val} type="button"
                    onClick={() => set('digitalLevel', val as DigitalLevel)}
                    className="p-3 rounded-xl text-left text-xs transition-all"
                    style={{
                      border: info.digitalLevel === val ? '2px solid #1A3D6E' : '2px solid #E5E7EB',
                      background: info.digitalLevel === val ? '#EEF2F8' : 'white',
                    }}>
                    <div className="font-600 mb-1" style={{ color: info.digitalLevel === val ? '#0F2449' : '#374151', fontFamily: 'var(--font-display)' }}>{label}</div>
                    <div style={{ color: '#9CA3AF' }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Additional */}
        <section className="rounded-2xl p-8 mb-6" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
          <h2 className="font-display font-600 text-lg mb-6" style={{ color: '#0F2449' }}>Características adicionales</h2>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <Label>¿La empresa exporta actualmente?</Label>
              <div className="flex gap-4 mt-1">
                {[true, false].map(val => (
                  <button key={String(val)} type="button" onClick={() => set('exporta', val)}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-600 transition-all"
                    style={{
                      border: info.exporta === val ? '2px solid #1A3D6E' : '2px solid #E5E7EB',
                      background: info.exporta === val ? '#EEF2F8' : 'white',
                      color: info.exporta === val ? '#0F2449' : '#6B7280',
                      fontFamily: 'var(--font-display)',
                    }}>
                    {val ? 'Sí, exportamos' : 'No, solo mercado local/nacional'}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <Label>¿La empresa tiene certificaciones de calidad o normas?</Label>
              <div className="flex gap-4 mt-1">
                {[true, false].map(val => (
                  <button key={String(val)} type="button" onClick={() => set('certificaciones', val)}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-600 transition-all"
                    style={{
                      border: info.certificaciones === val ? '2px solid #1A3D6E' : '2px solid #E5E7EB',
                      background: info.certificaciones === val ? '#EEF2F8' : 'white',
                      color: info.certificaciones === val ? '#0F2449' : '#6B7280',
                      fontFamily: 'var(--font-display)',
                    }}>
                    {val ? 'Sí (ISO, HACCP, BASC, etc.)' : 'No tenemos certificaciones'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Respondent */}
        <section className="rounded-2xl p-8 mb-8" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
          <h2 className="font-display font-600 text-lg mb-6" style={{ color: '#0F2449' }}>Datos del responsable</h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label>Nombre del responsable</Label>
              <input className={inputCls} value={info.responsable} onChange={e => set('responsable', e.target.value)} placeholder="Nombre completo" />
            </div>
            <div>
              <Label>Cargo</Label>
              <input className={inputCls} value={info.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ej: Gerente General" />
            </div>
            <div className="col-span-2">
              <Label>Correo electrónico (opcional)</Label>
              <input className={inputCls} value={info.email} onChange={e => set('email', e.target.value)} placeholder="Para referencia del informe" type="email" />
            </div>
          </div>
        </section>

        <button onClick={handleSubmit}
          className="w-full py-4 rounded-xl font-display font-600 text-base transition-all"
          style={{ background: '#0F2449', color: 'white' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1A3D6E')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0F2449')}>
          Continuar al Diagnóstico →
        </button>
      </main>
    </div>
  );
}
