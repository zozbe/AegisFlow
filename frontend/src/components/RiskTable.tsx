import { useState } from 'react';
import { RiskAssessment } from '../types';
import RiskDetailModal from './RiskDetailModal';

interface RiskTableProps {
  assessments: RiskAssessment[];
}

export default function RiskTable({ assessments }: RiskTableProps) {
  // Tıklanan satırın verisini tutacak state
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);

  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mt-8 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Kullanıcı (Hedef)</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Zaman Penceresi</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Kural Skoru</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">ML Skoru</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Final Risk</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Önem Derecesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {assessments.map((assessment) => (
                <tr 
                  key={assessment.id}
                  onClick={() => setSelectedAssessment(assessment)}
                  className="hover:bg-slate-700/60 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 font-medium text-slate-200 group-hover:text-white transition-colors">
                    {assessment.user_id}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(assessment.window_start).toLocaleString('tr-TR', { 
                      year: 'numeric', month: 'short', day: 'numeric', 
                      hour: '2-digit', minute:'2-digit' 
                    })}
                  </td>
                  <td className="px-6 py-4">{assessment.rule_score.toFixed(1)}</td>
                  <td className="px-6 py-4">{assessment.ml_norm_score.toFixed(1)}</td>
                  <td className="px-6 py-4 font-bold text-slate-200">{assessment.final_risk.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      assessment.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      assessment.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      assessment.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {assessment.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {assessments.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              Bu kriterlere uygun değerlendirme bulunamadı.
            </div>
          )}
        </div>
      </div>

      {/* Modal'ın çağrıldığı yer */}
      {selectedAssessment && (
        <RiskDetailModal 
          assessment={selectedAssessment} 
          onClose={() => setSelectedAssessment(null)} 
        />
      )}
    </>
  );
}