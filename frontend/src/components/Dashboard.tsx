import { useEffect, useState, useRef } from 'react';
import { ShieldAlert, AlertCircle, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import { RiskAssessment } from '../types';
import { getAssessments } from '../services/api';
import KpiCards from './KpiCards';
import RiskChart from './RiskChart';
import RiskTable from './RiskTable';

export default function Dashboard() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtreleme State'leri
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userList, setUserList] = useState<string[]>([]);
  
  // Custom Dropdown State'leri
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dropdown dışına tıklandığında menüyü kapatma mantığı
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = (userId: string) => {
    setLoading(true);
    setError(null);
    
    getAssessments(userId === '' ? undefined : userId)
      .then(data => {
        setAssessments(data);
        if (userId === '') {
          const uniqueUsers = Array.from(new Set(data.map(a => a.user_id)));
          setUserList(prev => prev.length === 0 ? uniqueUsers : prev);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Veri çekilemedi:", err);
        setError("SOC Engine ile bağlantı kurulamadı. Backend servisinin (FastAPI) çalıştığından emin olun.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData(selectedUser);
  }, [selectedUser]);

  const totalAssessments = assessments.length;
  const criticalAlerts = assessments.filter(a => a.priority === 'CRITICAL').length;
  const uniqueUsers = new Set(assessments.map(a => a.user_id)).size;

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
        
        {/* Sağ Üst Grup: Filtre ve API Status */}
        <div className="flex items-center gap-4">
          
          {/* Custom Profesyonel Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-700/80 transition-colors min-w-[180px] shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-200">
                  {selectedUser || 'Tüm Kullanıcılar'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-full min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => { setSelectedUser(''); setIsDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                    selectedUser === '' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedUser === '' ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                  Tüm Kullanıcılar
                </button>
                
                {userList.map(user => (
                  <button
                    key={user}
                    onClick={() => { setSelectedUser(user); setIsDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                      selectedUser === user ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedUser === user ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                    {user}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dinamik API Durum Rozeti */}
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

      {/* İçerik Yönetimi */}
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
            onClick={() => fetchData(selectedUser)}
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