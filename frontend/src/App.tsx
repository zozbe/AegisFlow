import { useEffect, useState } from 'react'

// Backend'deki Pydantic şemamızın TypeScript karşılığı (DTO)
interface RiskAssessment {
  id: number;
  user_id: string;
  window_start: string;
  rule_score: number;
  ml_raw_score: number;
  ml_norm_score: number;
  final_risk: number;
  priority: string;
  created_at: string;
}

function App() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FastAPI'ye istek atıyoruz. (Daha önce yazdığımız CORS ayarı sayesinde engellenmeyecek)
    fetch('http://127.0.0.1:8000/api/v1/assessments')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        setAssessments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 20 }}>AegisFlow verileri yükleniyor... 🛡️</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>Hata: {error} (Backend çalışıyor mu?)</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🛡️ AegisFlow Risk Dashboard</h1>
      <p>Gerçek zamanlı kullanıcı ve varlık davranışı analitiği.</p>
      
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#1e293b', color: 'white' }}>
            <th style={{ padding: '12px' }}>Kullanıcı</th>
            <th style={{ padding: '12px' }}>Zaman (Pencere)</th>
            <th style={{ padding: '12px' }}>Kural Skoru</th>
            <th style={{ padding: '12px' }}>ML Skoru</th>
            <th style={{ padding: '12px' }}>Final Risk</th>
            <th style={{ padding: '12px' }}>Öncelik</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map(assessment => (
            <tr key={assessment.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontWeight: '500' }}>{assessment.user_id}</td>
              <td style={{ padding: '12px' }}>
                {new Date(assessment.window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td style={{ padding: '12px' }}>{assessment.rule_score.toFixed(1)}</td>
              <td style={{ padding: '12px' }}>{assessment.ml_norm_score.toFixed(1)}</td>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{assessment.final_risk.toFixed(2)}</td>
              <td style={{ 
                padding: '12px', 
                fontWeight: 'bold',
                color: assessment.priority === 'CRITICAL' ? '#dc2626' : 
                       assessment.priority === 'HIGH' ? '#ea580c' : 
                       assessment.priority === 'MEDIUM' ? '#ca8a04' : '#16a34a'
              }}>
                {assessment.priority}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App;