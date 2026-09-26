import { useState } from 'react';
import { ChevronRight, ShieldAlert } from 'lucide-react';
import { SecurityIncident } from '../types';
import IncidentDetailModal from './IncidentDetailModal';

interface IncidentTableProps {
  incidents: SecurityIncident[];
}

export default function IncidentTable({ incidents }: IncidentTableProps) {
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-red-400 border-red-400/30';
      case 'INVESTIGATING': return 'text-yellow-400 border-yellow-400/30';
      case 'RESOLVED': return 'text-emerald-400 border-emerald-400/30';
      default: return 'text-slate-400 border-slate-400/30';
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-widest">
              <th className="p-4 font-semibold">Incident ID</th>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Target User</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Risk Score</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                  Şu an açık bir vaka bulunmuyor. Sistem güvende.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr 
                  key={incident.id} 
                  onClick={() => setSelectedIncident(incident)}
                  className="hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                  <td className="p-4 text-sm font-mono text-slate-400">
                    #{incident.id.toString().padStart(4, '0')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={`w-4 h-4 ${incident.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`} />
                      <span className="font-medium text-slate-200">{incident.title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-300 font-medium">
                    {incident.user_id}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getStatusColor(incident.status)}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className="text-sm font-mono text-slate-400">{incident.risk_score.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-slate-500 group-hover:text-emerald-400 transition-colors">
                      <ChevronRight className="w-5 h-5 ml-auto" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedIncident && (
        <IncidentDetailModal 
          incident={selectedIncident} 
          onClose={() => setSelectedIncident(null)} 
        />
      )}
    </div>
  );
}