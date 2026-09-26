import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { RiskAssessment } from '../types';

// X ekseni için 'timestamp' eklendi (Zaman doğrusunda doğru çizilmesi için)
interface ChartData extends RiskAssessment {
  timestamp: number; // YENİ: Gerçek zaman değeri
  risk: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartData;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Timestamp'i tekrar okunabilir saate çeviriyoruz
    const formattedTime = new Date(data.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    return (
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-xl">
        <p className="text-white font-bold mb-2 text-lg">{data.user_id}</p>
        <p className="text-slate-300 text-sm mb-1">Zaman: <span className="font-mono text-slate-100">{formattedTime}</span></p>
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

interface RiskChartProps {
  assessments: RiskAssessment[];
}

export default function RiskChart({ assessments }: RiskChartProps) {
  
  // Recharts için veriyi hazırlıyoruz. Artık X ekseni string değil, tam bir sayı!
  const chartData: ChartData[] = assessments.map(a => ({
    ...a,
    timestamp: new Date(a.window_start).getTime(),
    risk: a.final_risk
  }));

  // X ekseni altındaki yazıları (1695603600000 -> 03:00) formatlayan fonksiyon
  const formatXAxisTick = (tickItem: number) => {
    return new Date(tickItem).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const getColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      default: return '#10b981';
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
            
            {/* X eksenini artık "Number" (sayısal) yaptık ve otomatik ölçeklendirdik */}
            <XAxis 
              type="number" 
              dataKey="timestamp" 
              name="Zaman"
              domain={['dataMin', 'dataMax']} 
              tickFormatter={formatXAxisTick} 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8' }} 
              padding={{ left: 20, right: 20 }}
            />
            
            <YAxis dataKey="risk" stroke="#94a3b8" domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
            
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" 
              label={{ position: 'top', value: 'Kritik Eşik (80)', fill: '#ef4444', fontSize: 12 }} 
            />
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