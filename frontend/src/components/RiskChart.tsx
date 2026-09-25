import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { RiskAssessment } from '../types';

interface RiskChartProps {
  assessments: RiskAssessment[];
}

// AegisFlow'a özel, verilerin içyüzünü gösteren Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-xl">
        <p className="text-white font-bold mb-2 text-lg">{data.user_id}</p>
        <p className="text-slate-300 text-sm mb-1">Zaman: <span className="font-mono text-slate-100">{data.time}</span></p>
        <p className="text-slate-300 text-sm mb-1">Kural Skoru: <span className="font-semibold text-slate-100">{data.rule_score.toFixed(1)}</span></p>
        <p className="text-slate-300 text-sm mb-3">ML Skoru: <span className="font-semibold text-slate-100">{data.ml_norm_score.toFixed(1)}</span></p>
        
        <div className="pt-2 border-t border-slate-700">
          <p className="text-sm font-bold flex justify-between gap-6 items-center">
            <span className="text-slate-300">Final Risk: <span className="text-white text-lg">{data.final_risk.toFixed(2)}</span></span>
            <span className={`px-2 py-1 rounded text-xs ${
              data.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 
              data.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500' : 
              'bg-emerald-500/20 text-emerald-500'
            }`}>
              {data.priority}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function RiskChart({ assessments }: RiskChartProps) {
  // Recharts'ın anlayacağı ve X eksenine dizeceği formata çeviriyoruz
  const chartData = assessments.map(a => ({
    ...a,
    time: new Date(a.window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    risk: a.final_risk // Y ekseni için kısayol
  }));

  // Nokta renkleri
  const getColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#ef4444'; // Tailwind red-500
      case 'HIGH': return '#f97316';     // Tailwind orange-500
      case 'MEDIUM': return '#eab308';   // Tailwind yellow-500
      default: return '#10b981';         // Tailwind emerald-500
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Risk Dağılımı ve Anomaliler</h3>
        <span className="text-xs text-slate-400">UEBA Event Scatter Plot</span>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis dataKey="risk" stroke="#94a3b8" domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
            
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            {/* 80 Puan - Kritik Risk Sınırı Çizgisi */}
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" 
              label={{ position: 'top', value: 'Kritik Eşik (80)', fill: '#ef4444', fontSize: 12 }} 
            />
            
            {/* 60 Puan - Yüksek Risk Sınırı Çizgisi */}
            <ReferenceLine y={60} stroke="#f97316" strokeDasharray="4 4" opacity={0.5} />

            <Scatter data={chartData} name="Assessments">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.priority)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}