import { useEffect, useState, useCallback } from 'react';
import type { CompanyInfo, DiagnosticResults } from './types';
import { ALL_QUESTIONS } from './data/questions';
import { computeResults } from './utils/scoring';
import IntroPage from './pages/IntroPage';
import InfoPage from './pages/InfoPage';
import WizardPage from './pages/WizardPage';
import DashboardPage from './pages/DashboardPage';

type Phase = 'intro' | 'info' | 'wizard' | 'dashboard';

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<DiagnosticResults | null>(null);

  useEffect(() => {
    document.title = 'Diagnóstico Empresarial';
  }, []);

  // Compute applicable questions based on company profile
  const applicableQuestions = companyInfo
    ? ALL_QUESTIONS.filter(q => !q.showIf || q.showIf(companyInfo, answers))
    : [];

  const handleAnswer = useCallback((qid: string, val: number) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  }, []);

  const handleInfoComplete = (info: CompanyInfo) => {
    setCompanyInfo(info);
    setAnswers({});
    setPhase('wizard');
  };

  const handleWizardComplete = () => {
    if (!companyInfo) return;
    const r = computeResults(companyInfo, answers, applicableQuestions);
    setResults(r);
    setPhase('dashboard');
  };

  const handleRestart = () => {
    setPhase('intro');
    setCompanyInfo(null);
    setAnswers({});
    setResults(null);
  };

  if (phase === 'intro') return <IntroPage onStart={() => setPhase('info')} />;
  if (phase === 'info') return <InfoPage onComplete={handleInfoComplete} onBack={() => setPhase('intro')} />;
  if (phase === 'wizard' && companyInfo) {
    return (
      <WizardPage
        companyInfo={companyInfo}
        questions={applicableQuestions}
        answers={answers}
        onAnswer={handleAnswer}
        onComplete={handleWizardComplete}
        onBack={() => setPhase('info')}
      />
    );
  }
  if (phase === 'dashboard' && results) {
    return <DashboardPage results={results} onRestart={handleRestart} />;
  }

  return null;
}
