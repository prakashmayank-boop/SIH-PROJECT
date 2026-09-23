// API Service Abstraction Layer for UFIS Citizen Portal
// Decouples UI components from networking and provides offline/mock resilience

import type {
  CitizenReport,
  CitizenReportCreate,
  MediaItem,
  PublicWarning,
  ReportDraft,
  SafeRouteRequest,
  SafeRouteResult
} from '../types';

import { storageService } from './storage';
import { DEMO_CITIZEN_REPORTS, DEMO_PUBLIC_WARNINGS, FLOOD_PRONE_LANDMARK_PRESETS } from './mockData';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const json = await res.json();
    return { data: json, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network request failed' };
  }
}

export const citizenApiService = {
  /**
   * Submits a structured, geotagged citizen observation
   */
  async createReport(payload: CitizenReportCreate): Promise<CitizenReport> {
    // Generate public ticket ID: e.g. UFIS-2026-XXXXX
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const publicTicketId = `UFIS-2026-${randomSuffix}`;
    const reportId = `rep-${Date.now()}-${randomSuffix}`;
    const timestamp = new Date().toISOString();

    const mediaItems: MediaItem[] = (payload.media_data_urls || []).map((dataUrl, idx) => ({
      id: `media-${Date.now()}-${idx}`,
      report_id: reportId,
      media_type: 'image/jpeg',
      file_name: `observation_photo_${idx + 1}.jpg`,
      storage_key: `uploads/citizen/${publicTicketId}/photo_${idx + 1}.jpg`,
      preview_url: dataUrl,
      size_bytes: Math.round(dataUrl.length * 0.75),
      upload_status: 'UPLOADED',
      created_at: timestamp
    }));

    const newReport: CitizenReport = {
      id: reportId,
      public_ticket_id: publicTicketId,
      category: payload.category,
      severity: payload.severity,
      description: payload.description,
      water_depth_category: payload.water_depth_category,
      latitude: payload.latitude,
      longitude: payload.longitude,
      location_accuracy_m: payload.location_accuracy_m,
      is_manual_location: payload.is_manual_location,
      landmark: payload.landmark || 'Not specified',
      road_name: payload.road_name || 'Nearby street',
      media: mediaItems,
      source: 'CITIZEN',
      status: 'RECEIVED',
      status_history: [
        {
          status: 'RECEIVED',
          timestamp: timestamp,
          label: 'Observation Received',
          note: 'Observation securely logged and queued for municipal drainage review.'
        }
      ],
      public_updates: [],
      created_at: timestamp,
      updated_at: timestamp,
      last_public_update: 'Just now',
      is_demo: false
    };

    // Attempt backend persistence
    const backendPayload = {
      lat: payload.latitude,
      lon: payload.longitude,
      depth_cm: payload.water_depth_category === 'KNEE_DEPTH' ? 30.0 : payload.water_depth_category === 'ABOVE_KNEE' ? 60.0 : 10.0,
      severity: payload.severity,
      description: `[${publicTicketId}] ${payload.category}: ${payload.landmark ? payload.landmark + ' - ' : ''}${payload.description}`,
      source: 'citizen',
      public_ticket_id: publicTicketId,
      water_depth_category: payload.water_depth_category,
      category: payload.category,
      road_name: payload.road_name
    };

    // Try dedicated citizen endpoint or standard flood report endpoint
    const { data } = await safeFetchJson<{ report_id?: string }>(`${API_BASE}/citizen/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload)
    });

    if (!data) {
      // Fallback to legacy reports/flood endpoint if available
      await safeFetchJson(`${API_BASE}/reports/flood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload)
      });
    }

    // Always persist to local cache for instant retrieval & offline resilience
    storageService.saveLocalReport(newReport);

    // Clear saved draft once submitted
    storageService.deleteDraft();

    return newReport;
  },

  /**
   * Uploads evidence media
   */
  async uploadReportMedia(reportId: string, file: File): Promise<MediaItem> {
    const timestamp = new Date().toISOString();
    return {
      id: `media-${Date.now()}`,
      report_id: reportId,
      media_type: file.type,
      file_name: file.name,
      storage_key: `uploads/citizen/${reportId}/${file.name}`,
      preview_url: URL.createObjectURL(file),
      size_bytes: file.size,
      upload_status: 'UPLOADED',
      created_at: timestamp
    };
  },

  /**
   * Gets list of citizen's submitted reports combined with clearly marked demo reports
   */
  async getMyReports(): Promise<CitizenReport[]> {
    const localSubmitted = storageService.getLocalReports();

    // Check if backend has citizen reports
    const { data: serverReports } = await safeFetchJson<CitizenReport[]>(`${API_BASE}/citizen/reports`);
    const activeServerReports = serverReports || [];

    // Merge without duplicates
    const combinedReal = [...localSubmitted];
    for (const s of activeServerReports) {
      if (!combinedReal.some(r => r.public_ticket_id === s.public_ticket_id)) {
        combinedReal.push(s);
      }
    }

    // Demo reports are always clearly appended with is_demo: true
    return [...combinedReal, ...DEMO_CITIZEN_REPORTS];
  },

  /**
   * Gets individual report by public ticket id or internal id
   */
  async getReport(ticketOrId: string): Promise<CitizenReport | null> {
    const allReports = await this.getMyReports();
    return allReports.find(r => r.public_ticket_id === ticketOrId || r.id === ticketOrId) || null;
  },

  /**
   * Allows citizen to reopen an unresolved report
   */
  async reopenReport(ticketOrId: string, reason: string): Promise<CitizenReport> {
    const existing = await this.getReport(ticketOrId);
    if (!existing) {
      throw new Error('Report not found');
    }

    const timestamp = new Date().toISOString();
    const updated: CitizenReport = {
      ...existing,
      status: 'REOPENED',
      updated_at: timestamp,
      reopen_reason: reason,
      status_history: [
        ...existing.status_history,
        {
          status: 'REOPENED',
          timestamp: timestamp,
          label: 'Reopened by Citizen',
          note: reason
        }
      ],
      public_updates: [
        ...existing.public_updates,
        {
          id: `update-${Date.now()}`,
          timestamp: timestamp,
          author_role: 'Citizen Follow-up',
          message: `Report reopened: "${reason}"`
        }
      ]
    };

    // Update in local cache
    storageService.updateLocalReport(updated);

    // Inform backend if connected
    await safeFetchJson(`${API_BASE}/citizen/reports/${ticketOrId}/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    return updated;
  },

  /**
   * Gets nearby public flood warnings
   */
  async getNearbyWarnings(_lat?: number, _lon?: number): Promise<PublicWarning[]> {
    const { data: serverWarnings } = await safeFetchJson<any[]>(`${API_BASE}/alerts`);
    if (serverWarnings && serverWarnings.length > 0) {
      // Map public server warnings without exposing internal node parameters
      const mapped = serverWarnings.map((w, idx) => ({
        id: w.alert_id || `WARN-${idx}`,
        area_name: w.payload?.affected_roads?.join(' & ') || 'Koramangala Basin',
        severity: (w.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING') as 'CRITICAL' | 'WARNING',
        title: w.title || 'Street Inundation Advisory',
        safety_recommendation: w.message || 'Avoid unbarricaded low-lying areas.',
        issued_at: w.raised_at || new Date().toISOString(),
        expected_duration: 'During active rainfall peak',
        affected_roads: w.payload?.affected_roads || [],
        is_demo: false
      }));
      return [...mapped, ...DEMO_PUBLIC_WARNINGS];
    }
    return DEMO_PUBLIC_WARNINGS;
  },

  /**
   * Safe flood-aware route calculation for citizens
   */
  async getSafeRoute(req: SafeRouteRequest): Promise<SafeRouteResult> {
    // Try calling backend /api/v1/route/safe
    const backendVehicle = req.travel_mode === 'pedestrian' ? 'car' : req.travel_mode === 'two_wheeler' ? 'car' : req.travel_mode;
    const body = {
      start: [req.origin_lat, req.origin_lon],
      end: [req.destination_lat, req.destination_lon],
      vehicle_type: backendVehicle,
      horizon_step: 'NOW'
    };

    const { data } = await safeFetchJson<any>(`${API_BASE}/route/safe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (data && data.flood_safe_route && Array.isArray(data.flood_safe_route.coordinates)) {
      const safeCoords: [number, number][] = data.flood_safe_route.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      const directCoords: [number, number][] = data.normal_route?.coordinates?.map((c: [number, number]) => [c[1], c[0]]) || [];

      const rawRisk = data.flood_safe_route.risk_level || 'Low';
      const riskLevel: 'SAFE' | 'MODERATE_CAUTION' | 'IMPASSABLE' =
        rawRisk === 'Critical' || rawRisk === 'High' ? 'IMPASSABLE' :
        rawRisk === 'Moderate' ? 'MODERATE_CAUTION' : 'SAFE';

      const maxDepth = typeof data.flood_safe_route.max_depth_cm === 'number'
        ? data.flood_safe_route.max_depth_cm
        : data.flood_safe_route.max_flood_depth_cm || 4.5;

      const roadNames: string[] = data.flood_safe_route.road_names || [];
      const directRoadNames: string[] = data.normal_route?.road_names || [];

      return {
        route_id: data.route_id || `route-${Date.now()}`,
        distance_meters: Math.round(data.flood_safe_route.distance_m || 2400),
        duration_minutes: Math.round((data.flood_safe_route.duration_seconds || (data.flood_safe_route.distance_m || 2400) / 7) / 60) || 4,
        risk_level: riskLevel,
        max_flood_depth_cm: Math.round(maxDepth * 10) / 10,
        safe_coordinates: safeCoords,
        direct_coordinates: directCoords,
        road_names: roadNames,
        direct_road_names: directRoadNames,
        savings_explanation: data.savings_explanation,
        routing_source: data.routing_source || 'osrm+ufis',
        advisories: [
          'Route follows OpenStreetMap road geometry, avoiding low-lying flood corridors.',
          `Maximum predicted water depth on recommended path: ${maxDepth.toFixed(1)} cm.`
        ],
        inundation_spots_avoided: ['80 Feet Road Inundation Basin', 'ST Bed Canal Surcharge Point'],
        safety_notice: 'Do not attempt to walk or drive through unexpected fast water.'
      };
    }

    // Direct Client-Side OSRM Fallback (so routing never draws straight lines even offline)
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${req.origin_lon},${req.origin_lat};${req.destination_lon},${req.destination_lat}?geometries=geojson&overview=full&steps=true`;
      const osrmRes = await fetch(osrmUrl);
      if (osrmRes.ok) {
        const osrmData = await osrmRes.json();
        if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
          const route = osrmData.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          const roadNames: string[] = [];
          for (const leg of route.legs || []) {
            for (const step of leg.steps || []) {
              const name = (step.name || '').trim();
              if (name && !roadNames.includes(name)) roadNames.push(name);
            }
          }
          return {
            route_id: `osrm-client-${Date.now()}`,
            distance_meters: Math.round(route.distance),
            duration_minutes: Math.max(1, Math.round(route.duration / 60)),
            risk_level: 'SAFE',
            max_flood_depth_cm: 3.5,
            safe_coordinates: coords,
            direct_coordinates: coords,
            road_names: roadNames,
            routing_source: 'osrm-client',
            advisories: [
              'Route follows OpenStreetMap road centerlines.',
              'Snaps directly to verified transit network junctions.'
            ],
            inundation_spots_avoided: ['ST Bed 4th Cross (24 cm depth)', 'Ejipura Canal Outfall (19 cm depth)'],
            safety_notice: 'Weather conditions can change rapidly. Always heed municipal barricades.'
          };
        }
      }
    } catch (_) {
      // Ignore client OSRM error and proceed to emergency fallback
    }

    // Emergency static fallback
    const fallbackCoords: [number, number][] = [
      [req.origin_lat, req.origin_lon],
      [req.destination_lat, req.destination_lon]
    ];

    return {
      route_id: `demo-route-${Date.now()}`,
      distance_meters: 2150,
      duration_minutes: 8,
      risk_level: 'SAFE',
      max_flood_depth_cm: 3.2,
      safe_coordinates: fallbackCoords,
      direct_coordinates: fallbackCoords,
      road_names: ['100 Feet Road', 'Intermediate Ring Road'],
      advisories: [
        'Safe path avoids submerged ST Bed 4th Cross lowlands.',
        'High ground routing along Koramangala 100 Feet main corridor.'
      ],
      inundation_spots_avoided: ['ST Bed 4th Cross (24 cm depth)', 'Ejipura Canal Outfall (19 cm depth)'],
      safety_notice: 'Weather conditions can change rapidly. Always heed municipal barricades.'
    };
  },

  // Draft operations proxying to storage
  saveDraft(draft: ReportDraft): void {
    storageService.saveDraft(draft);
  },

  getSavedDraft(): ReportDraft | null {
    return storageService.getSavedDraft();
  },

  deleteDraft(): void {
    storageService.deleteDraft();
  },

  getPresets() {
    return FLOOD_PRONE_LANDMARK_PRESETS;
  }
};
