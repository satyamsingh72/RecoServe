import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401/403 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || (error.response?.status === 403 && error.response.data?.detail?.includes('disabled'))) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Types (mirror backend models) ─────────────────────────────────────────────

export interface RecommendationItem {
  product_id: string;
  score: number;
  confidence: number;
  lift: number;
  l2_category: string;
  l3_category: string;
  rank: number;
}

export interface RecommendationResponse {
  customer_id: string;
  recommendations: RecommendationItem[];
  total: number;
  served_from: string;
  latency_ms: number | null;
}

export interface CategoryStat {
  category: string;
  avg_score: number;
  avg_lift: number;
  count: number;
}

export interface StatsResponse {
  customers_covered: number;
  avg_recommendations_per_customer: number;
  avg_lift: number;
  last_refresh_time: string | null;
  total_recommendations: number;
  category_stats: CategoryStat[];
  lift_distribution: { bucket: string; count: number }[];
  score_distribution: { bucket: string; count: number }[];
  top_products: { product_id: string; count: number; avg_score: number; avg_lift: number; avg_conf: number; category: string }[];
  quality_mix: { association: number; fallback: number };
  segments: string[];
  feedback: any;
  model_health: {
    avg_silhouette: number;
    cluster_distribution: Record<string, number>;
    status: string;
  };
}


export interface PipelineStatusResponse {
  pipeline_name: string;
  execution_arn: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  failure_reason: string | null;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  customers_loaded: number;
  refresh_time: string;
}

export interface HealthResponse {
  status: string;
  mock_mode: boolean;
  customers_in_memory: number;
  last_refresh_time: string | null;
}

export interface FeedbackRequest {
  rating: number;
  comment?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────

export const fetchStats = (): Promise<StatsResponse> =>
  api.get<StatsResponse>('/stats').then(r => r.data);

export const fetchRecommendations = (customerId: string, topN = 10): Promise<RecommendationResponse> =>
  api.get<RecommendationResponse>(`/recommendations/${customerId}`, { params: { top_n: topN } }).then(r => r.data);

export const fetchPipelineStatus = (): Promise<PipelineStatusResponse> =>
  api.get<PipelineStatusResponse>('/pipeline/status').then(r => r.data);

export const triggerPipeline = (): Promise<PipelineStatusResponse> =>
  api.post<PipelineStatusResponse>('/pipeline/run').then(r => r.data);

export const refreshData = (): Promise<RefreshResponse> =>
  api.post<RefreshResponse>('/data/refresh').then(r => r.data);

export const fetchHealth = (): Promise<HealthResponse> =>
  api.get<HealthResponse>('/health').then(r => r.data);

export const submitFeedback = (customerId: string, productId: string, feedback: FeedbackRequest): Promise<FeedbackResponse> =>
  api.post<FeedbackResponse>(`/recommendations/${customerId}/${productId}/feedback`, feedback).then(r => r.data);
