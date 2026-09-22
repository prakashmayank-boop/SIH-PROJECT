// Mock & Demo Datasets for UFIS Citizen Portal
import type { CitizenReport, PublicWarning } from '../types';

export const DEMO_PUBLIC_WARNINGS: PublicWarning[] = [
  {
    id: 'WARN-DEMO-001',
    area_name: 'ST Bed Lowlands & 80 Feet Road Basin (Ward 151)',
    severity: 'CRITICAL',
    title: 'Severe Inundation Advisory — ST Bed Main & 80 Feet Corridor',
    safety_recommendation: 'Stormwater conduit surcharge active. Street depths exceed 25 cm. Avoid pedestrian transit near unbarricaded drains and take elevated detour via 100 Feet Road.',
    issued_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    expected_duration: 'Next 2 to 3 hours until secondary outfall recedes',
    affected_roads: ['80 Feet Road (Sony World Stretch)', 'ST Bed Main Low-Lying Avenue'],
    is_demo: true
  },
  {
    id: 'WARN-DEMO-002',
    area_name: 'Sony World Junction & Ejipura Canal Link',
    severity: 'WARNING',
    title: 'High Runoff Ponding Alert — Ejipura Link Road',
    safety_recommendation: 'Drainage outlet under hydraulic backpressure. Water ponding at road edges. Commuters on two-wheelers advised to reduce speed or pause travel.',
    issued_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    expected_duration: 'Next 60-90 minutes',
    affected_roads: ['Ejipura Canal Service Road', 'Koramangala 1st Block Underpass'],
    is_demo: true
  }
];

export const DEMO_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: 'demo-rep-101',
    public_ticket_id: 'UFIS-2026-00124',
    category: 'OVERFLOWING_DRAIN',
    severity: 'VEHICLES_AFFECTED',
    description: 'Stormwater drain overflowing rapidly over curb near 80 Feet Road junction. Silt and dirty water spreading across the two left lanes.',
    water_depth_category: 'ANKLE_DEPTH',
    latitude: 12.9310,
    longitude: 77.6270,
    location_accuracy_m: 8.5,
    is_manual_location: false,
    landmark: 'Near ST Bed Signal & Petrol Bunk',
    road_name: '80 Feet Road',
    media: [
      {
        id: 'media-demo-1',
        media_type: 'image/jpeg',
        file_name: 'overflowing_curb_80ft.jpg',
        storage_key: 'demo/overflow_1.jpg',
        preview_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=60',
        size_bytes: 1420000,
        upload_status: 'UPLOADED',
        created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ],
    source: 'SIMULATED',
    status: 'INSPECTION_IN_PROGRESS',
    status_history: [
      {
        status: 'RECEIVED',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        label: 'Observation Received',
        note: 'Geotagged observation logged via UFIS Citizen Portal.'
      },
      {
        status: 'UNDER_REVIEW',
        timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
        label: 'Triage & Hydraulic Cross-Check',
        note: 'Cross-referenced with nearby sensor MH-04 telemetry.'
      },
      {
        status: 'INSPECTION_IN_PROGRESS',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        label: 'Dispatched Field Crew',
        note: 'Ward maintenance truck assigned for silt suction and grating check.'
      }
    ],
    public_updates: [
      {
        id: 'update-1',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        author_role: 'Ward Maintenance Desk',
        message: 'Jetting crew deployed. Temporary sandbag diversion placed at curb.'
      }
    ],
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    last_public_update: '1 hour ago',
    is_demo: true
  },
  {
    id: 'demo-rep-102',
    public_ticket_id: 'UFIS-2026-00088',
    category: 'FLOODED_ROAD',
    severity: 'WATER_ENTERING_PROPERTY',
    description: 'Severe street flooding reaching basement parking ramps. Surcharge from canal feeder line.',
    water_depth_category: 'KNEE_DEPTH',
    latitude: 12.9295,
    longitude: 77.6255,
    location_accuracy_m: 6.2,
    is_manual_location: false,
    landmark: 'ST Bed Lowlands Residential Sector',
    road_name: 'ST Bed 4th Cross',
    media: [
      {
        id: 'media-demo-2',
        media_type: 'image/jpeg',
        file_name: 'flooded_residence_street.jpg',
        storage_key: 'demo/flood_road.jpg',
        preview_url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=60',
        size_bytes: 2150000,
        upload_status: 'UPLOADED',
        created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
      }
    ],
    source: 'SIMULATED',
    status: 'ACTION_TAKEN',
    status_history: [
      {
        status: 'RECEIVED',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        label: 'Observation Received'
      },
      {
        status: 'ASSIGNED',
        timestamp: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
        label: 'Priority Engineering Review'
      },
      {
        status: 'ACTION_TAKEN',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        label: 'Emergency Mobile Pump Operating',
        note: 'Auxiliary 100 HP dewatering diesel pump engaged.'
      }
    ],
    public_updates: [
      {
        id: 'update-2',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        author_role: 'Emergency Pump Operator',
        message: 'Secondary pump activated. Water level dropped by 18 cm.'
      }
    ],
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    last_public_update: '2 hours ago',
    is_demo: true
  },
  {
    id: 'demo-rep-103',
    public_ticket_id: 'UFIS-2026-00045',
    category: 'OPEN_MANHOLE',
    severity: 'OPEN_MANHOLE_RISK',
    description: 'Critical danger: Concrete manhole cover washed away by heavy torrent. Located right in front of pedestrian crossing.',
    water_depth_category: 'ANKLE_DEPTH',
    latitude: 12.9280,
    longitude: 77.6330,
    location_accuracy_m: 4.1,
    is_manual_location: false,
    landmark: 'Sony World Junction Traffic Island',
    road_name: '100 Feet Road / 80 Feet Road Intersection',
    media: [
      {
        id: 'media-demo-3',
        media_type: 'image/jpeg',
        file_name: 'open_manhole_hazard.jpg',
        storage_key: 'demo/manhole.jpg',
        preview_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=600&auto=format&fit=crop&q=60',
        size_bytes: 1890000,
        upload_status: 'UPLOADED',
        created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
      }
    ],
    source: 'SIMULATED',
    status: 'RESOLVED',
    status_history: [
      {
        status: 'RECEIVED',
        timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        label: 'Observation Received'
      },
      {
        status: 'ACTION_TAKEN',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        label: 'Barricaded by Traffic Volunteers'
      },
      {
        status: 'RESOLVED',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        label: 'Reinforced Steel Grating Installed',
        note: 'Emergency maintenance crew secured a new heavy-duty cast iron slab.'
      }
    ],
    public_updates: [
      {
        id: 'update-3',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        author_role: 'Dispatched Infrastructure Team',
        message: 'Chamber inspected and heavy-duty frame fitted. Hazard clear.'
      }
    ],
    created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    last_public_update: '5 hours ago',
    is_demo: true
  },
  {
    id: 'demo-rep-104',
    public_ticket_id: 'UFIS-2026-00012',
    category: 'DEBRIS_OBSTRUCTION',
    severity: 'PEDESTRIANS_AFFECTED',
    description: 'Storm culvert entrance completely blocked by tree branches and plastic packing crates. Water backing up onto footpath.',
    water_depth_category: 'ANKLE_DEPTH',
    latitude: 12.9350,
    longitude: 77.6320,
    location_accuracy_m: 5.0,
    is_manual_location: false,
    landmark: 'BDA Complex Drainage Outfall',
    road_name: 'Koramangala 3rd Block Link',
    media: [],
    source: 'SIMULATED',
    status: 'UNDER_REVIEW',
    status_history: [
      {
        status: 'RECEIVED',
        timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        label: 'Observation Received'
      },
      {
        status: 'UNDER_REVIEW',
        timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        label: 'Queued for Daytime Silt Clearance'
      }
    ],
    public_updates: [],
    created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    last_public_update: '18 hours ago',
    is_demo: true
  }
];

export const FLOOD_PRONE_LANDMARK_PRESETS = [
  { label: 'Sony World Junction (80 Feet Rd)', lat: 12.9280, lon: 77.6330, road: '80 Feet Road' },
  { label: 'ST Bed Signal & Main Avenue', lat: 12.9310, lon: 77.6270, road: 'ST Bed Road' },
  { label: 'ST Bed Lowlands (Suddaguntepalya)', lat: 12.9295, lon: 77.6255, road: '4th Cross Lowlands' },
  { label: 'Ejipura Canal Link Road', lat: 12.9400, lon: 77.6240, road: 'Ejipura Link' },
  { label: 'Koramangala 1st Block Underpass', lat: 12.9365, lon: 77.6200, road: 'Inner Ring Underpass' },
  { label: 'BDA Complex Drainage Outlet', lat: 12.9350, lon: 77.6320, road: 'BDA Complex Perimeter' },
  { label: 'Wipro Park Runoff Corridor', lat: 12.9240, lon: 77.6360, road: 'Koramangala 1st Main' },
  { label: 'St. John’s Hospital Junction', lat: 12.9345, lon: 77.6230, road: 'Sarjapur Main Road' }
];
