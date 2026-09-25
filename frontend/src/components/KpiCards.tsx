import { Activity, Users, AlertTriangle } from 'lucide-react';

interface KpiCardsProps {
  totalAssessments: number;
  criticalAlerts: number;
  uniqueUsers: number;
}

export default function KpiCards({
  totalAssessments,
  criticalAlerts,
  uniqueUsers,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-400 font-medium">
            Toplam Değerlendirme
          </h3>
          <Activity className="text-blue-400 w-5 h-5" />
        </div>
        <p className="text-3xl font-bold text-white">
          {totalAssessments}
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-400 font-medium">
            Kritik Uyarılar
          </h3>
          <AlertTriangle className="text-red-500 w-5 h-5" />
        </div>
        <p className="text-3xl font-bold text-red-500">
          {criticalAlerts}
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-400 font-medium">
            Benzersiz Kullanıcı
          </h3>
          <Users className="text-purple-400 w-5 h-5" />
        </div>
        <p className="text-3xl font-bold text-white">
          {uniqueUsers}
        </p>
      </div>
    </div>
  );
}