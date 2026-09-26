import { useEffect, useState } from 'react';
import { X, ShieldAlert, Activity, AlertOctagon, Terminal, FileText, BrainCircuit } from 'lucide-react';
import { RiskAssessment, EvidenceResponse } from '../types';
import { getAssessmentEvidence } from '../services/api';

interface RiskDetailModalProps {
  assessment: RiskAssessment;
  onClose: () => void;
}

export default function RiskDetailModal({ assessment, onClose }: RiskDetailModalProps) {
  const [evidence, setEvidence] = useState<EvidenceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssessmentEvidence(assessment.id)
      .then(data => {
        setEvidence(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Kanıtlar çekilemedi:", err);
        setLoading(false);
      });
  }, [assessment.id]);

  // Önem derecesine göre rozet (badge) ve çizelge noktası renkleri
  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'LOW': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 border-red-900';
      case 'HIGH': return 'bg-orange-500 border-orange-900';
      case 'MEDIUM': return 'bg-yellow-500 border-yellow-900';
      case 'LOW': return 'bg-blue-500 border-blue-900';
      default: return 'bg-slate-500 border-slate-700';
    }
  };

  // Kaynağa (Source) göre ikon seçimi
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'RULE': return <Terminal className="w-3 h-3 text-blue-400" />;
      case 'ML_ANOMALY': return <BrainCircuit className="w-3 h-3 text-purple-400" />;
      default: return <FileText className="w-3 h-3 text-slate-400" />; // RAW_EVENT
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ShieldAlert className={assessment.priority === 'CRITICAL' ? 'text-red-500' : 'text-yellow-500'} />
              <h2 className="text-xl font-bold text-white">Risk Analiz Detayı</h2>
            </div>
            <p className="text-sm text-slate-400 font-mono">
              Hedef: <span className="text-slate-200 font-semibold">{assessment.user_id}</span> | 
              Pencere: {new Date(assessment.window_start).toLocaleString('tr-TR', { 
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
              })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          
          {/* Skor Özeti */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Kural Skoru</p>
              <p className="text-2xl font-bold text-slate-200">{assessment.rule_score.toFixed(1)}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">ML Skoru</p>
              <p className="text-2xl font-bold text-slate-200">{assessment.ml_norm_score.toFixed(1)}</p>
            </div>
            <div className={`border rounded-lg p-4 text-center ${assessment.priority === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${assessment.priority === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400'}`}>Final Risk</p>
              <p className={`text-2xl font-bold ${assessment.priority === 'CRITICAL' ? 'text-red-500' : 'text-yellow-500'}`}>{assessment.final_risk.toFixed(1)}</p>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-slate-800 rounded"></div>
              <div className="h-40 bg-slate-800 rounded"></div>
            </div>
          ) : evidence ? (
            <div className="space-y-10">
              
              {/* --- KORELASYON ZAMAN ÇİZELGESİ --- */}
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" /> Correlated Activity Timeline
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Related security signals within this risk window. Correlation does not confirm an attack.
                  </p>
                </div>

                <div className="relative border-l border-slate-700 ml-4 space-y-8 pb-4">
                  {evidence.timeline.map((event, idx) => (
                    <div key={idx} className="relative pl-6 group">
                      {/* Çizgi Üzerindeki Nokta */}
                      <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${getSeverityDot(event.severity)} group-hover:scale-125 transition-transform`}></div>
                      
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {new Date(event.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="text-sm font-bold text-slate-200">{event.event_type}</span>
                          </div>
                          <p className="text-sm text-slate-400">{event.description}</p>
                        </div>
                        
                        {/* Etiketler (Badges) */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded border bg-slate-800 border-slate-700 text-slate-300">
                            {getSourceIcon(event.source)}
                            {event.source}
                          </span>
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border ${getSeverityColors(event.severity)}`}>
                            {event.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {evidence.timeline.length === 0 && (
                    <div className="pl-6 text-sm text-slate-500 italic">Bu pencerede kayıtlı olay bulunamadı.</div>
                  )}
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* --- DETAYLI KANITLAR --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Kural Kanıtları */}
                <div className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Rule Signals
                  </h3>
                  {evidence.rule_evidence.length > 0 ? (
                    <div className="space-y-3">
                      {evidence.rule_evidence.map((rule, idx) => (
                        <div key={idx} className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-slate-200">{rule.rule_name}</p>
                            <p className="text-[10px] uppercase text-slate-400 mt-0.5">Önem: {rule.severity}</p>
                          </div>
                          <span className="bg-slate-900 text-slate-300 text-xs font-bold px-2 py-1 rounded border border-slate-700">
                            {rule.count} Tetiklenme
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm italic">No rule violations</div>
                  )}
                </div>

                {/* ML Kanıtları */}
                <div className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Behavioral Analysis
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-sm text-slate-300">Toplam Olay</span>
                      <span className="text-sm font-bold text-slate-200">{evidence.ml_evidence.total_events} Event</span>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-sm text-slate-300">Farklı IP</span>
                      <span className="text-sm font-bold text-slate-200">{evidence.ml_evidence.distinct_ips} IP</span>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 flex justify-between items-center">
                      <span className="flex items-center gap-2 text-sm text-slate-300">
                        <AlertOctagon className="w-4 h-4 text-orange-400" /> Kritik Eylemler
                      </span>
                      <span className="text-sm font-bold text-orange-400">{evidence.ml_evidence.critical_actions}</span>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">Veri alınamadı.</div>
          )}
        </div>
      </div>
    </div>
  );
}