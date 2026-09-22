export type HorizonStep = 'NOW' | '+30m' | '+1h' | '+2h' | '+3h';

export interface RoadFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lon, lat]
  };
  properties: {
    road_id: string;
    external_id: string;
    name: string;
    road_class: string;
    elevation_m: number;
    predicted_depth_cm: number;
    risk_level: 'Low' | 'Moderate' | 'High' | 'Critical';
    risk_color: string;
    max_safe_depth_cm: number;
    is_emergency_corridor: boolean;
    passable_vehicle_classes: string[];
    confidence: number;
    horizon: HorizonStep;
    ml_model_used?: string;
    elevation_amsl?: number;
    risk_primary_cause?: string;
    feature_attributions?: Record<string, number>;
  };
}

export interface DrainageNode {
  node_id: string;
  node_code: string;
  node_type: string;
  node_name?: string;
  coordinates: [number, number]; // [lon, lat]
  ground_elev_m: number;
  predicted_inflow_m3s: number;
  inlet_capacity_m3s: number;
  stress_ratio: number;
  predicted_overflow_m3s: number;
  status: 'NORMAL' | 'AT RISK' | 'OVERLOADED' | 'CRITICAL';
  confidence: number;
  is_outfall?: boolean;
  discharge_target?: string;
}

export interface DrainageEdge {
  edge_id: string;
  edge_code: string;
  /** Upstream node code (from hydraulic_engine topology) */
  from_node_code?: string;
  /** Downstream node code */
  to_node_code?: string;
  /** True when this conduit terminates at an outfall */
  is_outfall_edge?: boolean;
  from_elev_m?: number;
  to_elev_m?: number;
  coordinates: [number, number][];
  diameter_m: number;
  slope: number;
  blockage_percent: number;
  design_capacity_m3s?: number;
  effective_capacity_m3s?: number;
  flow_m3s: number;
  flow_direction?: 'FORWARD' | 'BACKFLOW';
  velocity_ms?: number;
  surcharge_head_cm?: number;
  stress_ratio: number;
  status: 'NORMAL' | 'AT RISK' | 'OVERLOADED' | 'CRITICAL';
}

export interface ForecastSummary {
  horizon: HorizonStep;
  rainfall_mmph: number;
  scenario_name: string;
  flood_risk_index: number;
  max_predicted_depth_cm: number;
  critical_road_count: number;
  surcharged_node_count: number;
  peak_flood_time: string;
  highest_risk_area: string;
  confidence_score: number;
}

export interface AlertItem {
  alert_id: string;
  severity: 'WATCH' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  status: 'GENERATED' | 'ACKNOWLEDGED' | 'IN RESPONSE' | 'RESOLVED';
  raised_at: string;
  payload?: {
    affected_roads?: string[];
    max_predicted_depth_cm?: number;
    critical_nodes?: string[];
  };
}

export interface DispatchTaskItem {
  task_id: string;
  task_type: string;
  priority: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  target_description: string;
  assigned_at: string;
  completed_at?: string;
  observation?: string;
}

export interface SafeRouteResult {
  route_id: string;
  vehicle_type: string;
  normal_route: {
    coordinates: [number, number][];
    distance_m: number;
    duration_seconds: number;
    max_depth_cm: number;
    risk_level: string;
  };
  flood_safe_route: {
    coordinates: [number, number][];
    distance_m: number;
    duration_seconds: number;
    max_depth_cm: number;
    risk_level: string;
  };
  savings_explanation: string;
  is_safe: boolean;
  status_label: string;
}

export interface FloodReportItem {
  report_id: string;
  source: string;
  reported_at: string | null;
  coordinates: [number, number]; // [lon, lat]
  depth_cm: number;
  severity: string;
  description: string;
  verification_status: string;
}

export interface SmsLogItem {
  sms_id: string;
  alert_id: string;
  recipient_group: string;
  recipient_label: string;
  phone_number: string;
  recipients_count: number;
  message: string;
  severity: string;
  status: string;
  carrier_reference: string;
  dispatched_at: string;
}

