// UFIS Citizen Portal Type Definitions
// Structured, geotagged observation data models adhering strictly to civic privacy

export type IssueCategoryId =
  | 'BLOCKED_MANHOLE'
  | 'OVERFLOWING_DRAIN'
  | 'FLOODED_ROAD'
  | 'OPEN_MANHOLE'
  | 'DAMAGED_DRAIN_COVER'
  | 'DEBRIS_OBSTRUCTION'
  | 'WATER_ENTERING_PROPERTY'
  | 'OTHER_HAZARD';

export type SeverityLevel =
  | 'NO_IMMEDIATE_DANGER'
  | 'PEDESTRIANS_AFFECTED'
  | 'VEHICLES_AFFECTED'
  | 'WATER_ENTERING_PROPERTY'
  | 'OPEN_MANHOLE_RISK'
  | 'ELECTRICAL_EMERGENCY';

export type WaterDepthCategory =
  | 'NO_STANDING_WATER'
  | 'ANKLE_DEPTH'
  | 'KNEE_DEPTH'
  | 'ABOVE_KNEE'
  | 'UNKNOWN';

export type ReportStatus =
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'INSPECTION_IN_PROGRESS'
  | 'ACTION_TAKEN'
  | 'RESOLVED'
  | 'REOPENED'
  | 'REJECTED'
  | 'POSSIBLE_DUPLICATE';

export interface MediaItem {
  id: string;
  report_id?: string;
  media_type: 'image/jpeg' | 'image/png' | 'image/jpg' | string;
  file_name: string;
  storage_key: string;
  preview_url: string;
  size_bytes: number;
  upload_status: 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'FAILED';
  created_at: string;
}

export interface StatusTimelineEntry {
  status: ReportStatus;
  timestamp: string;
  label: string;
  note?: string;
}

export interface PublicUpdateMessage {
  id: string;
  timestamp: string;
  author_role: string;
  message: string;
}

export interface CitizenReport {
  id: string;
  public_ticket_id: string;
  category: IssueCategoryId;
  severity: SeverityLevel;
  description: string;
  water_depth_category: WaterDepthCategory;
  latitude: number;
  longitude: number;
  location_accuracy_m: number;
  is_manual_location: boolean;
  landmark: string;
  road_name: string;
  media: MediaItem[];
  source: 'CITIZEN' | 'SIMULATED';
  status: ReportStatus;
  status_history: StatusTimelineEntry[];
  public_updates: PublicUpdateMessage[];
  created_at: string;
  updated_at: string;
  last_public_update: string;
  reopen_reason?: string;
  is_demo?: boolean;
}

export interface CitizenReportCreate {
  category: IssueCategoryId;
  severity: SeverityLevel;
  description: string;
  water_depth_category: WaterDepthCategory;
  latitude: number;
  longitude: number;
  location_accuracy_m: number;
  is_manual_location: boolean;
  landmark?: string;
  road_name?: string;
  media_files?: File[];
  media_data_urls?: string[];
  consent_confirmed: boolean;
}

export interface ReportDraft {
  step: number;
  category?: IssueCategoryId;
  description?: string;
  water_depth_category?: WaterDepthCategory;
  severity?: SeverityLevel;
  latitude?: number;
  longitude?: number;
  location_accuracy_m?: number;
  is_manual_location?: boolean;
  landmark?: string;
  road_name?: string;
  media_items?: Array<{
    name: string;
    type: string;
    size: number;
    data_url: string;
  }>;
  consent_confirmed?: boolean;
  saved_at: string;
}

export interface PublicWarning {
  id: string;
  area_name: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  title: string;
  safety_recommendation: string;
  issued_at: string;
  expected_duration: string;
  affected_roads: string[];
  is_demo?: boolean;
}

export interface SafeRouteRequest {
  origin_lat: number;
  origin_lon: number;
  origin_name: string;
  destination_lat: number;
  destination_lon: number;
  destination_name: string;
  travel_mode: 'pedestrian' | 'two_wheeler' | 'car' | 'suv';
}

export interface SafeRouteResult {
  route_id: string;
  distance_meters: number;
  duration_minutes: number;
  risk_level: 'SAFE' | 'MODERATE_CAUTION' | 'IMPASSABLE';
  max_flood_depth_cm: number;
  safe_coordinates: [number, number][]; // [lat, lon]
  direct_coordinates?: [number, number][]; // [lat, lon]
  advisories: string[];
  inundation_spots_avoided: string[];
  safety_notice: string;
  road_names?: string[];
  direct_road_names?: string[];
  savings_explanation?: string;
  routing_source?: string;
}

export type SupportedLanguage = 'en' | 'kn' | 'hi';

export type ScreenId =
  | 'home'
  | 'category'
  | 'evidence'
  | 'location'
  | 'severity'
  | 'review'
  | 'success'
  | 'my_reports'
  | 'report_details'
  | 'nearby_warnings'
  | 'safe_route'
  | 'help_safety';
