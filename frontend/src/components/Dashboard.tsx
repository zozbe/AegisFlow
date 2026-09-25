import { useEffect, useState } from 'react';
import { ShieldAlert, Activity, Users, AlertTriangle } from 'lucide-react';
import { RiskAssessment } from '../types';
import { getAssessments } from '../services/api';

export default function Dashboard() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  // API'den verileri çekiyoruz (Artık Data Access Layer üzerinden)
  useEffect(() => {
    getAssessments()
      .then(data => {
        setAssessments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Veri çekilemedi:", err);
        setLoading(false);
      });
  }, []);

  // KPI (Metrik) Hesaplamaları
  const totalAssessments = assessments.length;
  const criticalAlerts = assessments.filter(a => a.priority === 'CRITICAL').length;
  const uniqueUsers = new Set(assessments.map(a => a.user_id)).size;

  // Öncelik durumuna göre renk (Badge) döndüren yardımcı fonksiyon
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      
      {/* Header Alanı */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-10 h-10 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">AegisFlow SOC</h1>
            <p className="text-slate-400 text-sm">User & Entity Behavior Analytics Engine</p>
          </div>
        </div>
        {/* animate-pulse kaldırıldı, statik doğrulama yapıldı */}
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-emerald-400 font-medium text-sm">API Connected</span>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">Toplam Değerlendirme</h3>
            <Activity className="text-blue-400 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-white">{totalAssessments}</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">Kritik Uyarılar</h3>
            <AlertTriangle className="text-red-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-red-500">{criticalAlerts}</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            {/* Başlık teknik olarak doğru hale getirildi */}
            <h3 className="text-slate-400 font-medium">Benzersiz Kullanıcı</h3>
            <Users className="text-purple-400 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-white">{uniqueUsers}</p>
        </div>
      </div>

      {/* Risk Tablosu */}
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

    </div>
  );
}