import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import KpiCards from './KpiCards';
import { RiskAssessment } from '../types';
import { getAssessments } from '../services/api';
import RiskTable from './RiskTable';
import RiskChart from './RiskChart';

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
      <KpiCards 
        totalAssessments={totalAssessments} 
        criticalAlerts={criticalAlerts} 
        uniqueUsers={uniqueUsers} 
      />

      {/* Risk Trend / Anomali Grafiği */}
      <RiskChart assessments={assessments} />

      {/* Risk Tablosu */}
      <RiskTable assessments={assessments} />

    </div>
  );
}