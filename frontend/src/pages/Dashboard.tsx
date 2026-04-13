import { useEffect, useState } from 'react';
import KPICard from '../components/KPICard';
import CategoryBar from '../charts/CategoryBar';
import CategoryPie from '../charts/CategoryPie';
import QualityMixPie from '../charts/QualityMixPie';
import ClusterDistBar from '../charts/ClusterDistBar';
import DistributionHistogram from '../charts/DistributionHistogram';
import Spinner from '../components/Spinner';
import { fetchStats, type StatsResponse } from '../api/client';

function fmt(n: number, dec = 1): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(dec) + 'K';
  return n.toFixed(dec);
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('All');

  const load = async () => {
    try {
      setError('');
      const data = await fetchStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load stats. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    const id = setInterval(load, 30_000); 
    return () => clearInterval(id); 
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <Spinner size={28} /><span style={{ color: 'var(--text-muted)' }}>Loading analytics…</span>
    </div>
  );

  if (error) return <div className="error-msg">{error}</div>;
  if (!stats) return null;

  const filteredTopProducts = selectedSegment === 'All' 
    ? (stats.top_products ?? []) 
    : (stats.top_products ?? []).filter(p => selectedSegment.startsWith(p.category ?? ''));

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-subtitle">Real-time recommendation analytics — auto-refreshes every 30s</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Segment:</span>
          <select 
            value={selectedSegment} 
            onChange={(e) => setSelectedSegment(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #dde3ed', fontSize: 13, background: 'white', outline: 'none' }}
          >
            <option value="All">All Segments</option>
            {stats.segments?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <KPICard label="Customers Covered"     value={fmt(stats.customers_covered, 0)}             icon="👥" color="indigo" />
        <KPICard label="Avg Recs / Customer"   value={stats.avg_recommendations_per_customer?.toFixed(1) ?? '0.0'} icon="🎯" color="cyan" />
        <KPICard label="Avg Lift"              value={`×${stats.avg_lift?.toFixed(2) ?? '0.00'}`}              icon="📈" color="violet" />
        <KPICard label="Last Refresh"          value={fmtDate(stats.last_refresh_time)}             icon="🕒" color="emerald" />
      </div>

      {/* Row 1: Model Health & Quality Mix */}
      <div className="charts-grid" style={{ marginBottom: 16 }}>
        <div className="glass-card" style={{ animationDelay: '100ms' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Model Health</div>
              <div className="card-subtitle">Clustering density & stability</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-light)', background: 'rgba(99,120,255,0.1)', padding: '2px 8px', borderRadius: 100 }}>
              Avg Sil: {stats.model_health?.avg_silhouette ?? 'N/A'}
            </div>
          </div>
          <ClusterDistBar data={stats.model_health?.cluster_distribution ?? {}} />
        </div>

        <div className="glass-card" style={{ animationDelay: '150ms' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Quality Mix</div>
              <div className="card-subtitle">Association vs Fallback ratio</div>
            </div>
          </div>
          <QualityMixPie data={stats.quality_mix ?? { association: 0, fallback: 0 }} />
        </div>
      </div>

      {/* Row 2: Category Analysis */}
      <div className="charts-grid" style={{ marginBottom: 16 }}>
        <div className="glass-card" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Category Performance</div>
              <div className="card-subtitle">Avg score & lift by L2 category</div>
            </div>
          </div>
          <CategoryBar data={stats.category_stats ?? []} />
        </div>
        <div className="glass-card" style={{ animationDelay: '250ms' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Category Distribution</div>
              <div className="card-subtitle">Share of recommendations per category</div>
            </div>
          </div>
          <CategoryPie data={stats.category_stats ?? []} />
        </div>
      </div>

      {/* Row 3: Distributions */}
      <div className="charts-grid" style={{ marginBottom: 16 }}>
        <div className="glass-card" style={{ animationDelay: '300ms' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Lift Distribution</div>
              <div className="card-subtitle">Number of recs by lift bucket</div>
            </div>
          </div>
          <DistributionHistogram data={stats.lift_distribution ?? []} color="#a78bfa" label="Count" />
        </div>

        <div className="glass-card" style={{ animationDelay: '350ms' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Score Distribution</div>
              <div className="card-subtitle">Number of recs by score bucket</div>
            </div>
          </div>
          <DistributionHistogram data={stats.score_distribution ?? []} color="#22d3ee" label="Count" />
        </div>
      </div>

      {/* Row 4: Feedback Analysis */}
      <div className="glass-card" style={{ marginBottom: 16, animationDelay: '400ms' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Feedback Analysis</div>
            <div className="card-subtitle">Actual sales team acceptance rates</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, padding: '0 10px 20px' }}>
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Overall Acceptance</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-light)' }}>
              {stats.feedback?.overall?.acceptance_rate ? `${(stats.feedback.overall.acceptance_rate * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>High Signal Rate</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
              {stats.feedback?.overall?.high_rate ? `${(stats.feedback.overall.high_rate * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Low Signal Rate</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>
              {stats.feedback?.overall?.low_rate ? `${(stats.feedback.overall.low_rate * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Feedback Recency</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)' }}>
              {stats.feedback?.generated_at ? new Date(stats.feedback.generated_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="glass-card" style={{ animationDelay: '450ms' }}>
        <div className="card-header">
          <div>
            <div className="card-title">🏆 Top Recommended Products</div>
            <div className="card-subtitle">Top 20 products by recommendation count</div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product ID</th>
                <th>Category</th>
                <th>Rec Count</th>
                <th>Avg Score</th>
                <th>Avg Lift</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {filteredTopProducts.map((p, i) => (
                <tr key={p.product_id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td className="highlight">{p.product_id}</td>
                  <td>
                    <span style={{ 
                      fontSize: 12, padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: 4, color: 'var(--text-muted)' 
                    }}>
                      {p.category}
                    </span>
                  </td>
                  <td>{p.count.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        width: 40, height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          width: `${(p.avg_score * 100)}%`, height: '100%', background: 'var(--primary-light)', borderRadius: 3 
                        }} />
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                        background: 'rgba(99,120,255,0.1)', color: 'var(--primary-light)',
                      }}>
                        {p.avg_score.toFixed(4)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {p.avg_lift?.toFixed(3) ?? '0.000'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {(p.avg_conf * 100).toFixed(1)}%
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
