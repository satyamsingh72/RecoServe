import { useState, useRef } from 'react';
import Spinner from '../components/Spinner';
import { fetchRecommendations, submitFeedback, type RecommendationItem } from '../api/client';

function scoreColor(score: number): string {
  if (score >= 0.85) return '#10b981';
  if (score >= 0.7)  return '#6378ff';
  return '#94a3c0';
}

export default function Lookup() {
  const [query, setQuery]     = useState('');
  const [topN, setTopN]       = useState(10);
  const [recs, setRecs]       = useState<RecommendationItem[]>([]);
  const [custId, setCustId]   = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = async (id = query.trim()) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await fetchRecommendations(id, topN);
      setRecs(data.recommendations);
      setCustId(data.customer_id);
      setLatency(data.latency_ms);
    } catch {
      setError('Could not fetch recommendations. Ensure the backend is running.');
      setRecs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (productId: string, rating: number) => {
    try {
      await submitFeedback(custId, productId, { rating });
      // No need to refresh the whole list, just visual confirmation
    } catch (e) {
      console.error('Failed to submit feedback', e);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔍 Customer Lookup</h1>
        <p className="page-subtitle">Enter a Customer ID to fetch their personalised recommendations from memory</p>
      </div>

      {/* Search bar */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <input
            ref={inputRef}
            className="input"
            placeholder="Enter Customer ID (e.g. CUST_042831)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <select
            className="input"
            style={{ flex: '0 0 100px' }}
            value={topN}
            onChange={e => setTopN(Number(e.target.value))}
          >
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>Top {n}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => search()} disabled={loading || !query.trim()}>
            {loading ? <Spinner size={16} /> : '⚡ Lookup'}
          </button>
        </div>

        {/* Latency badge */}
        {latency !== null && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>API latency:</span>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
              background: 'rgba(16,185,129,0.1)', color: 'var(--success)',
            }}>
              {latency.toFixed(2)} ms
            </span>
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Results */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '32px 0', color: 'var(--text-muted)' }}>
          <Spinner size={22} /> Fetching recommendations…
        </div>
      )}

      {!loading && searched && recs.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🤷</div>
          <div className="empty-title">No recommendations found</div>
          <div className="empty-desc">Customer <strong>{custId}</strong> was not found in the dataset.</div>
        </div>
      )}

      {!loading && recs.length > 0 && (
        <>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{recs.length}</strong> recommendations for
            </span>
            <span style={{
              fontFamily: 'monospace', fontSize: 13, padding: '3px 10px',
              background: 'rgba(99,120,255,0.1)', color: 'var(--primary-light)',
              borderRadius: 6, border: '1px solid rgba(99,120,255,0.2)',
            }}>{custId}</span>
          </div>

          <div className="rec-grid">
            {recs.map((rec) => (
              <div key={`${rec.product_id}-${rec.rank}`} className="rec-card" style={{ animationDelay: `${rec.rank * 30}ms` }}>
                <div className="rec-card-header">
                  <div className="rec-rank">{rec.rank}</div>
                  <div className="rec-product-id">{rec.product_id}</div>
                  <div className="rec-score-chip" style={{ color: scoreColor(rec.score) }}>
                    {rec.score.toFixed(3)}
                  </div>
                </div>
                <div className="rec-meta">
                  <span className="rec-tag">{rec.l2_category}</span>
                  <span className="rec-tag">{rec.l3_category}</span>
                  <span className="rec-lift">×{rec.lift.toFixed(2)} lift</span>
                    <span style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 4,
                      background: 'rgba(34,211,238,0.07)', color: '#22d3ee',
                      border: '1px solid rgba(34,211,238,0.15)',
                    }}>
                      conf {rec.confidence.toFixed(2)}
                    </span>
                    <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                      <button 
                        onClick={() => handleRate(rec.product_id, 1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 2 }}
                        title="Like"
                      >
                        👍
                      </button>
                      <button 
                        onClick={() => handleRate(rec.product_id, -1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 2 }}
                        title="Dislike"
                      >
                        👎
                      </button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </>
      )}

      {!searched && (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <div className="empty-title">Enter a Customer ID to get started</div>
          <div className="empty-desc">Lookups are served from memory with sub-10ms latency</div>
        </div>
      )}
    </div>
  );
}
