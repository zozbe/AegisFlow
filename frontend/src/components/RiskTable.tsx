import { RiskAssessment } from '../types';

interface RiskTableProps {
  assessments: RiskAssessment[];
}

export default function RiskTable({ assessments }: RiskTableProps) {
  // Öncelik durumuna göre renk (Badge) döndüren yardımcı fonksiyon
  // Bu UI mantığı olduğu için artık Dashboard'da değil, burada yaşıyor.
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4 font-medium">Kullanıcı</th>
              <th className="px-6 py-4 font-medium">Zaman (Pencere)</th>
              <th className="px-6 py-4 font-medium">Kural Skoru</th>
              <th className="px-6 py-4 font-medium">ML Skoru</th>
              <th className="px-6 py-4 font-medium">Final Risk</th>
              <th className="px-6 py-4 font-medium">Öncelik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {assessments.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{assessment.user_id}</td>
                <td className="px-6 py-4">
                  {new Date(assessment.window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4 text-slate-400">{assessment.rule_score.toFixed(1)}</td>
                <td className="px-6 py-4 text-slate-400">{assessment.ml_norm_score.toFixed(1)}</td>
                <td className="px-6 py-4 font-bold text-white">{assessment.final_risk.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${getPriorityColor(assessment.priority)}`}>
                    {assessment.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}