import { useEffect, useState } from 'react';
import { X, Activity, AlertOctagon, Terminal, FileText, BrainCircuit } from 'lucide-react';
import { SecurityIncident, EvidenceResponse } from '../types';
import { getAssessmentEvidence } from '../services/api';

interface IncidentDetailModalProps {
  incident: SecurityIncident;
  onClose: () => void;
}

export default function IncidentDetailModal({ incident, onClose }: IncidentDetailModalProps) {
  const [evidence, setEvidence] = useState<EvidenceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Incident'in bağlı olduğu assessment_id üzerinden kanıtları çekiyoruz!
    getAssessmentEvidence(incident.assessment_id)
      .then(data => {
        setEvidence(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Kanıtlar çekilemedi:", err);
        setLoading(false);
      });
  }, [incident.assessment_id]);

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
      default: return 'bg-slate-500 border-slate-700';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'RULE': return <Terminal className="w-3 h-3 text-blue-400" />;
      case 'ML_ANOMALY': return <BrainCircuit className="w-3 h-3 text-purple-400" />;
      default: return <FileText className="w-3 h-3 text-slate-400" />; 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* SOC INCIDENT HEADER */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-slate-500 font-mono text-lg">#{incident.id.toString().padStart(4, '0')}</span>
                <h2 className="text-2xl font-bold text-white">{incident.title}</h2>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <p className="text-slate-400 font-mono">
                  Target: <span className="text-slate-200 font-semibold">{incident.user_id}</span>
                </p>
                <span className="text-slate-600">|</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${incident.status === 'OPEN' ? 'text-red-400 border-red-400/30 bg-red-400/10' : 'text-slate-400 border-slate-400/30'}`}>
                  STATUS: {incident.status}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getSeverityColors(incident.severity)}`}>
                  RISK: {incident.risk_score.toFixed(1)} ({incident.severity})
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Timeline & Evidence) */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-40 bg-slate-800 rounded"></div>
              <div className="h-40 bg-slate-800 rounded"></div>
            </div>
          ) : evidence ? (
            <div className="space-y-10">
              
              {/* KORELASYON ZAMAN ÇİZELGESİ */}
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

              {/* DETAYLI KANITLAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Rule Signals</h3>
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

                <div className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Behavioral Analysis</h3>
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