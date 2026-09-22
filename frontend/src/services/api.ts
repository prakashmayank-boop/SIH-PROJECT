import type {
  ForecastSummary,
  RoadFeature,
  DrainageNode,
  DrainageEdge,
  AlertItem,
  DispatchTaskItem,
  SafeRouteResult,
  HorizonStep
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText} (${res.status})`);
  }
  return res.json();
}

export const apiService = {
  async login(email: string, password: string): Promise<{ access_token: string; user: any }> {
    return fetchJson<{ access_token: string; user: any }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  },

  async getForecastSummary(horizon: HorizonStep = 'NOW'): Promise<ForecastSummary> {
    return fetchJson<ForecastSummary>(`${API_BASE}/forecast/summary?horizon=${encodeURIComponent(horizon)}`);
  },

  async getFloodForecast(horizon: HorizonStep = 'NOW'): Promise<{ features: RoadFeature[]; rainfall: any }> {
    return fetchJson<{ features: RoadFeature[]; rainfall: any }>(
      `${API_BASE}/flood-forecast?horizon=${encodeURIComponent(horizon)}`
    );
  },

  async getDrainageStatus(horizon: HorizonStep = 'NOW'): Promise<{
    summary: any;
    nodes: DrainageNode[];
    edges: DrainageEdge[];
  }> {
    return fetchJson<{
      summary: any;
      nodes: DrainageNode[];
      edges: DrainageEdge[];
    }>(`${API_BASE}/drainage/status?horizon=${encodeURIComponent(horizon)}`);
  },

  async getAlerts(): Promise<AlertItem[]> {
    return fetchJson<AlertItem[]>(`${API_BASE}/alerts`);
  },

  async updateAlertStatus(alertId: string, status: string): Promise<any> {
    return fetchJson(`${API_BASE}/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, acknowledged_by: 'Control Room Operator' })
    });
  },

  async getTasks(): Promise<DispatchTaskItem[]> {
    return fetchJson<DispatchTaskItem[]>(`${API_BASE}/tasks`);
  },

  async createTask(taskData: {
    task_type: string;
    priority: string;
    target_description: string;
  }): Promise<any> {
    return fetchJson(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
  },

  async completeTask(taskId: string, observation: string, notes: string): Promise<any> {
    return fetchJson(`${API_BASE}/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observation, notes })
    });
  },

  async getSafeRoute(
    start: [number, number],
    end: [number, number],
    vehicleType: string = 'ambulance',
    horizon: HorizonStep = 'NOW'
  ): Promise<SafeRouteResult> {
    return fetchJson<SafeRouteResult>(`${API_BASE}/route/safe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start,
        end,
        vehicle_type: vehicleType,
        horizon_step: horizon
      })
    });
  },

  async switchScenario(scenarioId: string, customRainfall?: number): Promise<any> {
    return fetchJson(`${API_BASE}/simulation/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenarioId,
        custom_rainfall_mmph: customRainfall
      })
    });
  },

  async updateEdgeBlockage(edgeId: string, blockagePercent: number): Promise<any> {
    return fetchJson(`${API_BASE}/drainage/edges/${encodeURIComponent(edgeId)}/blockage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockage_percent: blockagePercent })
    });
  },

  async submitReport(report: {
    lat: number;
    lon: number;
    depth_cm: number;
    severity: string;
    description: string;
  }): Promise<any> {
    return fetchJson(`${API_BASE}/reports/flood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
  },

  async listReplayEvents(): Promise<any[]> {
    return fetchJson<any[]>(`${API_BASE}/replay`);
  },

  async getReplayEvent(eventId: string): Promise<any> {
    return fetchJson<any>(`${API_BASE}/replay/${eventId}`);
  },

  async getReplayStep(eventId: string, step: number): Promise<any> {
    return fetchJson<any>(`${API_BASE}/replay/${eventId}/step/${step}`);
  },

  async getMlStatus(): Promise<any> {
    return fetchJson<any>(`${API_BASE}/ml/status`);
  },

  async retrainMlModel(dataPath?: string): Promise<any> {
    return fetchJson<any>(`${API_BASE}/ml/retrain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_path: dataPath })
    });
  },

  async getFloodReports(): Promise<import('../types').FloodReportItem[]> {
    return fetchJson<import('../types').FloodReportItem[]>(`${API_BASE}/reports/flood`);
  },

  async completeFloodReport(reportId: string): Promise<any> {
    return fetchJson(`${API_BASE}/reports/flood/${encodeURIComponent(reportId)}/complete`, {
      method: 'PATCH'
    });
  },

  async broadcastSms(payload: {
    alert_id?: string;
    title?: string;
    severity?: string;
    affected_roads?: string[];
    max_depth_cm?: number;
    critical_nodes?: string[];
    recipient_group?: string;
    custom_phone?: string;
    custom_message?: string;
  }): Promise<any> {
    return fetchJson(`${API_BASE}/alerts/broadcast-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async getSmsLogs(): Promise<import('../types').SmsLogItem[]> {
    return fetchJson<import('../types').SmsLogItem[]>(`${API_BASE}/alerts/sms-logs`);
  }
};

