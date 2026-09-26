import { ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import { useAssessments } from '../hooks/useAssessments';
import KpiCards from './KpiCards';
import RiskChart from './RiskChart';
import RiskTable from './RiskTable';
import UserFilter from './UserFilter';

export default function Dashboard() {
  const {
    assessments,
    loading,
    error,
    selectedUser,
    setSelectedUser,
    userList,
    refetch
  } = useAssessments();

  // KPI Hesaplamaları
  const totalAssessments = assessments.length;
  const criticalAlerts = assessments.filter(a => a.priority === 'CRITICAL').length;
  const uniqueUsers = new Set(assessments.map(a => a.user_id)).size;

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-10 h-10 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">AegisFlow SOC</h1>
            <p className="text-slate-400 text-sm">User & Entity Behavior Analytics Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <UserFilter 
            selectedUser={selectedUser} 
            userList={userList} 
            onSelectUser={setSelectedUser} 
          />

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            loading ? 'bg-yellow-500/10 border-yellow-500/20' : 
            error ? 'bg-red-500/10 border-red-500/20' : 
            'bg-slate-800 border-slate-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              loading ? 'bg-yellow-500 animate-pulse' : 
              error ? 'bg-red-500' : 
              'bg-emerald-500'
            }`}></div>
            <span className={`font-medium text-sm ${
              loading ? 'text-yellow-500' : 
              error ? 'text-red-500' : 
              'text-emerald-400'
            }`}>
              {loading ? 'Connecting...' : error ? 'API Disconnected' : 'API Connected'}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl border border-slate-700"></div>)}
          </div>
          <div className="h-80 bg-slate-800 rounded-xl border border-slate-700"></div>
          <div className="h-64 bg-slate-800 rounded-xl border border-slate-700"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-12 text-center mt-12 shadow-lg">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Sistem Bağlantı Hatası</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">{error}</p>
          <button 
            type="button"
            onClick={refetch}
            className="flex items-center gap-2 mx-auto bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg border border-slate-600 transition-colors font-medium shadow-md"
          >
            <RefreshCw className="w-5 h-5" /> Yeniden Dene
          </button>
        </div>
      ) : (
        <>
          <KpiCards 
            totalAssessments={totalAssessments} 
            criticalAlerts={criticalAlerts} 
            uniqueUsers={uniqueUsers} 
          />
          <RiskChart assessments={assessments} />
          <RiskTable assessments={assessments} />
        </>
      )}
    </div>
  );
}