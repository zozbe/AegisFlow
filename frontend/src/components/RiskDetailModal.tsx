import { useEffect, useState } from 'react';
import { X, ShieldAlert, Activity, AlertOctagon, Terminal } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ShieldAlert className={assessment.priority === 'CRITICAL' ? 'text-red-500' : 'text-yellow-500'} />
              <h2 className="text-xl font-bold text-white">Risk Analiz Detayı</h2>
            </div>
            <p className="text-sm text-slate-400 font-mono">
              Hedef: <span className="text-slate-200 font-semibold">{assessment.user_id}</span> | 
              Zaman: {new Date(assessment.window_start).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* Skor Özeti */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Kural Skoru</p>
              <p className="text-2xl font-bold text-slate-200">{assessment.rule_score.toFixed(1)}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">ML Anomaly (Norm)</p>
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
              <div className="h-24 bg-slate-800 rounded"></div>
            </div>
          ) : evidence ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Kural Kanıtları */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
                  <Terminal className="w-4 h-4 text-blue-400" /> Kural Sinyalleri
                </h3>
                {evidence.rule_evidence.length > 0 ? (
                  <div className="space-y-3">
                    {evidence.rule_evidence.map((rule, idx) => (
                      <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{rule.rule_name}</p>
                          <p className="text-xs text-slate-400">Önem: {rule.severity}</p>
                        </div>
                        <span className="bg-slate-900 text-slate-300 text-xs font-bold px-2 py-1 rounded border border-slate-700">
                          {rule.count} Tetiklenme
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-800/30 border border-slate-700/50 border-dashed rounded-lg p-6 text-center">
                    <p className="text-slate-500 text-sm">Bu zaman penceresinde statik kural ihlali tespit edilmedi.</p>
                  </div>
                )}
              </div>

              {/* ML Kanıtları */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
                  <Activity className="w-4 h-4 text-purple-400" /> Davranışsal Analiz (ML)
                </h3>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Toplam İşlem Hacmi</span>
                    <span className="text-sm font-bold text-slate-200">{evidence.ml_evidence.total_events} Event</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Farklı Cihaz/IP Sayısı</span>
                    <span className="text-sm font-bold text-slate-200">{evidence.ml_evidence.distinct_ips}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-700/50">
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                      <AlertOctagon className="w-4 h-4 text-orange-400" /> Kritik Eylemler
                    </span>
                    <span className="text-sm font-bold text-orange-400">{evidence.ml_evidence.critical_actions}</span>
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