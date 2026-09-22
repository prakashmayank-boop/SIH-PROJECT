import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { RoadFeature, DrainageNode, DrainageEdge, SafeRouteResult, FloodReportItem } from '../types';
import { Layers, Eye, EyeOff, Navigation, X, Maximize2, Minimize2, ArrowRightLeft, Activity, Droplets } from 'lucide-react';

interface MapGISProps {
  roads: RoadFeature[];
  nodes: DrainageNode[];
  edges: DrainageEdge[];
  activeRoute: SafeRouteResult | null;
  floodReports?: FloodReportItem[];
  onSelectRoad: (road: RoadFeature) => void;
  onSelectNode: (node: DrainageNode) => void;
  onClearRoute?: () => void;
  isFullGisMode?: boolean;
  mapSize?: 'full' | 'compact';
  onToggleMapSize?: () => void;
  layerVisibility: {
    roads: boolean;
    drainage: boolean;
    nodes: boolean;
    sensors: boolean;
  };
  setLayerVisibility: React.Dispatch<
    React.SetStateAction<{
      roads: boolean;
      drainage: boolean;
      nodes: boolean;
      sensors: boolean;
    }>
  >;
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

/** Spherical bearing in degrees (0°=N, 90°=E) from point 1 → point 2 */
function getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Interpolate a point at fraction t along a LatLng polyline, projected in container-pixel space */
function interpolatePolylineLatLng(map: L.Map, latlngs: L.LatLng[], t: number): L.LatLng {
  const clamped = Math.max(0, Math.min(1, t));
  const pts = latlngs.map(ll => map.latLngToContainerPoint(ll));
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++)
    total += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
  let target = clamped * total;
  for (let i = 0; i < pts.length - 1; i++) {
    const segLen = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    if (target <= segLen) {
      const f = segLen > 0 ? target / segLen : 0;
      return map.containerPointToLatLng([
        pts[i].x + f * (pts[i + 1].x - pts[i].x),
        pts[i].y + f * (pts[i + 1].y - pts[i].y),
      ]);
    }
    target -= segLen;
  }
  return latlngs[latlngs.length - 1];
}

// ── Particle animation engine ─────────────────────────────────────────────────

interface FlowParticle {
  t: number;
  speed: number;
  marker: L.Marker;
  edgeIndex: number;
  direction: 'FORWARD' | 'BACKFLOW';
}

let _animFrame: number | null = null;
let _particles: FlowParticle[] = [];
let _particleEdges: DrainageEdge[] = [];
let _particleMap: L.Map | null = null;
let _animActive = false;

function stopParticleAnimation() {
  _animActive = false;
  if (_animFrame !== null) { cancelAnimationFrame(_animFrame); _animFrame = null; }
  _particles = [];
  _particleEdges = [];
}

function createParticleIcon(color: string, size: number = 6): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;box-shadow:0 0 6px ${color},0 0 12px ${color}88;pointer-events:none;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function spawnEdgeParticles(
  map: L.Map,
  particleGroup: L.FeatureGroup,
  edges: DrainageEdge[],
  forcePeakSurcharge: boolean
) {
  stopParticleAnimation();
  particleGroup.clearLayers();
  _particleMap = map;
  _particleEdges = edges;
  _animActive = true;
  _particles = [];

  edges.forEach((edge, edgeIdx) => {
    const coords = edge.coordinates;
    if (!coords || coords.length < 2) return;
    if (edge.flow_m3s <= 0 && !forcePeakSurcharge) return;

    const isBackflow = forcePeakSurcharge || (edge.flow_direction === 'BACKFLOW' && edge.flow_m3s > 0);
    const color = isBackflow ? '#ef4444'
      : edge.is_outfall_edge ? '#fbbf24'
      : edge.status === 'CRITICAL' ? '#f97316'
      : edge.status === 'AT RISK' ? '#f59e0b'
      : '#38bdf8';
    const size = edge.is_outfall_edge ? 8 : isBackflow ? 7 : 5;

    const nParticles = Math.min(6, Math.max(1, Math.round(edge.flow_m3s * 3)));
    const spacing = 1.0 / nParticles;

    for (let p = 0; p < nParticles; p++) {
      const initT = isBackflow ? 1.0 - p * spacing : p * spacing;
      const latlngs = coords.map(c => L.latLng(c[1], c[0]));
      const pos = interpolatePolylineLatLng(map, latlngs, initT);
      const marker = L.marker(pos, {
        icon: createParticleIcon(color, size),
        interactive: false,
        zIndexOffset: 500,
      }).addTo(particleGroup);
      _particles.push({
        t: initT,
        speed: Math.max(0.0004, (Math.abs(edge.velocity_ms ?? 1.2) / 2.5) * 0.0012),
        marker,
        edgeIndex: edgeIdx,
        direction: isBackflow ? 'BACKFLOW' : 'FORWARD',
      });
    }
  });

  function tick() {
    if (!_animActive || !_particleMap) return;
    _particles.forEach(p => {
      const edge = _particleEdges[p.edgeIndex];
      if (!edge?.coordinates || edge.coordinates.length < 2) return;
      const latlngs = edge.coordinates.map(c => L.latLng(c[1], c[0]));
      if (p.direction === 'FORWARD') {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
      } else {
        p.t -= p.speed;
        if (p.t < 0) p.t = 1;
      }
      p.marker.setLatLng(interpolatePolylineLatLng(_particleMap!, latlngs, p.t));
    });
    _animFrame = requestAnimationFrame(tick);
  }
  _animFrame = requestAnimationFrame(tick);
}

// ── Surface runoff helper ────────────────────────────────────────────────────

function buildSurfaceRunoffGroup(surfaceGroup: L.FeatureGroup, roads: RoadFeature[]) {
  surfaceGroup.clearLayers();
  roads
    .filter(r => r.properties.predicted_depth_cm >= 5)
    .forEach(road => {
      const coords = road.geometry.coordinates;
      if (coords.length < 2) return;
      const mid = coords[Math.floor(coords.length / 2)];
      const depth = road.properties.predicted_depth_cm;
      const color = road.properties.risk_color;
      const size = depth > 25 ? 14 : depth > 15 ? 11 : 9;
      const html = `<div style="pointer-events:none;">
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" opacity="0.85"
          style="filter:drop-shadow(0 0 4px ${color});animation:ping 2.4s ease-in-out infinite;">
          <path d="M12 2C12 2 4 10 4 16a8 8 0 0 0 16 0C20 10 12 2 12 2z"/>
        </svg>
      </div>`;
      L.marker([mid[1], mid[0]], {
        icon: L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
        interactive: false,
      }).addTo(surfaceGroup);
    });
}


export const MapGIS: React.FC<MapGISProps> = ({
  roads,
  nodes,
  edges,
  activeRoute,
  floodReports = [],
  onSelectRoad,
  onSelectNode,
  onClearRoute,
  isFullGisMode = false,
  mapSize = 'full',
  onToggleMapSize,
  layerVisibility,
  setLayerVisibility
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<{
    roadsGroup: L.FeatureGroup;
    drainageGroup: L.FeatureGroup;
    flowArrowsGroup: L.FeatureGroup;
    particleGroup: L.FeatureGroup;
    surfaceGroup: L.FeatureGroup;
    nodesGroup: L.FeatureGroup;
    routeGroup: L.FeatureGroup;
    reportsGroup: L.FeatureGroup;
  } | null>(null);

  // Hydraulic Flow Controls State
  const [showFlowDirection, setShowFlowDirection] = useState<boolean>(true);
  const [showSurfaceRunoff, setShowSurfaceRunoff] = useState<boolean>(true);
  const [forcePeakSurcharge, setForcePeakSurcharge] = useState<boolean>(false);

  // ─── Initialize Map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9345, 77.6265],
      zoom: 15,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: 'abc'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const roadsGroup     = L.featureGroup().addTo(map);
    const drainageGroup  = L.featureGroup().addTo(map);
    const flowArrowsGroup = L.featureGroup().addTo(map);
    const particleGroup  = L.featureGroup().addTo(map);
    const surfaceGroup   = L.featureGroup().addTo(map);
    const nodesGroup     = L.featureGroup().addTo(map);
    const routeGroup     = L.featureGroup().addTo(map);
    const reportsGroup   = L.featureGroup().addTo(map);

    layersGroupRef.current = { roadsGroup, drainageGroup, flowArrowsGroup, particleGroup, surfaceGroup, nodesGroup, routeGroup, reportsGroup };
    mapRef.current = map;

    return () => {
      stopParticleAnimation();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─── ResizeObserver — triggers invalidateSize on container resize ──────────
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapRef.current) {
        requestAnimationFrame(() => {
          mapRef.current?.invalidateSize({ animate: false });
        });
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize({ animate: false }), 150);
    }
  }, [mapSize]);

  // ─── Update Road Inundation Heatmap ─────────────────────────────────────────
  useEffect(() => {
    if (!layersGroupRef.current) return;
    const { roadsGroup } = layersGroupRef.current;
    roadsGroup.clearLayers();

    if (!layerVisibility.roads) return;

    roads.forEach(road => {
      const latlngs = road.geometry.coordinates.map(coord => [coord[1], coord[0]] as [number, number]);
      const depth = road.properties.predicted_depth_cm;
      const risk = road.properties.risk_level;
      const color = road.properties.risk_color;

      // Render a smooth outer glow buffer for inundated roads (> 10cm depth)
      if (depth > 10) {
        const glowPolyline = L.polyline(latlngs, {
          color: color,
          weight: depth > 25 ? 16 : 11,
          opacity: 0.22,
          lineCap: 'round',
          lineJoin: 'round'
        });
        glowPolyline.addTo(roadsGroup);
      }

      // Centerline street polyline
      const polyline = L.polyline(latlngs, {
        color: depth < 5 ? '#10b981' : color,
        weight: depth > 20 ? 5.5 : depth > 10 ? 4.5 : 3.0,
        opacity: depth < 5 ? 0.65 : 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });

      const passableStr = road.properties.passable_vehicle_classes?.length
        ? road.properties.passable_vehicle_classes.join(', ')
        : 'Emergency Heavy Trucks Only';

      polyline.bindTooltip(
        `<div style="font-family: Inter, sans-serif; padding: 2px;">
          <div style="font-weight: bold; color: #fff; font-size: 12px; margin-bottom: 2px;">${road.properties.name}</div>
          <div style="font-size: 11px; color: #94a3b8;">Class: <span style="color:#d8e3fb">${road.properties.road_class}</span> • Elev: <span style="color:#38bdf8">${road.properties.elevation_amsl}m</span></div>
          <div style="font-size: 11px; margin-top: 4px;">
            Predicted Flood Depth: <b style="color:${color}">${depth} cm</b>
          </div>
          <div style="font-size: 10px; margin-top: 2px;">
            Risk Level: <span style="color:${color}; font-weight:bold">${risk.toUpperCase()}</span>
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 3px;">
            Passable: <span style="color:#10b981">${passableStr}</span>
          </div>
        </div>`,
        { sticky: true, className: 'map-tooltip' }
      );

      polyline.on('click', () => onSelectRoad(road));
      polyline.addTo(roadsGroup);
    });
  }, [roads, layerVisibility.roads]);

  // ─── LAYER 2: Surface Runoff Droplet Indicators ───────────────────────────────────
  useEffect(() => {
    if (!layersGroupRef.current) return;
    const { surfaceGroup } = layersGroupRef.current;
    if (!layerVisibility.roads || !showSurfaceRunoff) {
      surfaceGroup.clearLayers();
      return;
    }
    buildSurfaceRunoffGroup(surfaceGroup, roads);
  }, [roads, layerVisibility.roads, showSurfaceRunoff]);

  // ─── LAYER 3: Drainage Conduits + Topology-Aware Particle Flow ──────────────
  useEffect(() => {
    if (!layersGroupRef.current || !mapRef.current) return;
    const { drainageGroup, flowArrowsGroup, particleGroup } = layersGroupRef.current;
    drainageGroup.clearLayers();
    flowArrowsGroup.clearLayers();
    stopParticleAnimation();
    particleGroup.clearLayers();

    if (!layerVisibility.drainage) return;

    const map = mapRef.current;

    edges.forEach(edge => {
      const coords = edge.coordinates;
      if (!coords || coords.length < 2) return;

      const latlngs = coords.map(c => [c[1], c[0]] as [number, number]);
      const isBackflow = forcePeakSurcharge || (edge.flow_direction === 'BACKFLOW' && edge.flow_m3s > 0);
      const hasFlow = edge.flow_m3s > 0 || forcePeakSurcharge;

      // Color:
      // When dry (rain = 0 mm / flow = 0): Conduits remain normal baseline cyan (#38bdf8).
      // Only when active water is flowing (> 0) or forced surcharge simulation:
      //   - backflow = red (#ef4444)
      //   - outfall active discharge = gold (#fbbf24)
      //   - critical hydraulic stress = orange (#f97316)
      //   - at risk overloaded = amber (#f59e0b)
      //   - normal active flow = cyan (#38bdf8)
      const lineColor = isBackflow ? '#ef4444'
        : (hasFlow && edge.is_outfall_edge) ? '#fbbf24'
        : (hasFlow && edge.status === 'CRITICAL') ? '#f97316'
        : (hasFlow && edge.status === 'AT RISK') ? '#f59e0b'
        : '#38bdf8';

      const strokeClass = isBackflow ? 'flow-polyline-backflow'
        : hasFlow ? 'flow-polyline-forward'
        : '';

      const polyline = L.polyline(latlngs, {
        color: lineColor,
        weight: isBackflow ? 4.5 : (hasFlow && edge.is_outfall_edge) ? 5.0 : 3.0,
        opacity: hasFlow ? 0.92 : 0.70,
        className: strokeClass
      });

      const fromLabel = edge.from_node_code ?? '?';
      const toLabel   = edge.to_node_code ?? '?';
      const outfallTag = edge.is_outfall_edge
        ? `<div style="font-size:10px;color:${hasFlow ? '#fbbf24' : '#38bdf8'};margin-top:3px;font-weight:bold">🏁 OUTFALL → Agara Lake ${hasFlow ? '(ACTIVE DISCHARGE)' : '(STANDBY)'}</div>`
        : '';
      const dirLabel = isBackflow
        ? `<span style="color:#ef4444;font-weight:bold">⚠️ SURCHARGE BACKFLOW (${fromLabel} ⬅ ${toLabel})</span>`
        : hasFlow
        ? `<span style="color:${lineColor};font-weight:bold">🌊 GRAVITY FLOW (${fromLabel} ➡ ${toLabel})</span>`
        : `<span style="color:#94a3b8;font-weight:bold">⚪ DRY CONDUIT (Slope: ${fromLabel} ➡ ${toLabel})</span>`;

      polyline.bindTooltip(
        `<div style="font-family:Inter,sans-serif;padding:2px">
          <div style="font-weight:bold;color:#fff;font-size:12px;margin-bottom:2px">Conduit ${edge.edge_code}</div>
          <div style="font-size:11px;margin-bottom:3px">${dirLabel}</div>
          <div style="font-size:11px;color:#cbd5e1">Rate: <b>${edge.flow_m3s} m³/s</b> · Vel: <b>${Math.abs(edge.velocity_ms ?? 0)} m/s</b></div>
          <div style="font-size:11px;color:#cbd5e1;margin-top:2px">Stress: <b style="color:${lineColor}">${edge.stress_ratio}x</b> · Blockage: <b>${edge.blockage_percent}%</b></div>
          ${isBackflow ? `<div style="font-size:10px;color:#ef4444;margin-top:3px;font-weight:bold">Surcharge Head: +${edge.surcharge_head_cm ?? 38} cm</div>` : ''}
          ${outfallTag}
        </div>`,
        { sticky: true, className: 'map-tooltip' }
      );
      polyline.addTo(drainageGroup);

      // Flow direction arrows at midpoints of each segment (only shown during active flow or surcharge)
      if (showFlowDirection && hasFlow) {
        for (let i = 0; i < latlngs.length - 1; i++) {
          const p1 = latlngs[i];
          const p2 = latlngs[i + 1];
          const midLat = (p1[0] + p2[0]) / 2;
          const midLng = (p1[1] + p2[1]) / 2;
          const bearing = isBackflow
            ? getBearing(p2[0], p2[1], p1[0], p1[1])
            : getBearing(p1[0], p1[1], p2[0], p2[1]);
          const iconClass = isBackflow ? 'flow-marker-backflow' : 'flow-marker-forward';
          const arrowHtml = `
            <div class="${iconClass}" style="transform:rotate(${Math.round(bearing)}deg);width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${lineColor}" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 5px ${lineColor});">
                <path d="M12 2L3 18h6v4h6v-4h6z"/>
              </svg>
            </div>`;
          L.marker([midLat, midLng], {
            icon: L.divIcon({ className: 'flow-arrow-icon', html: arrowHtml, iconSize: [20, 20], iconAnchor: [10, 10] }),
            interactive: false
          }).addTo(flowArrowsGroup);
        }
      }
    });

    // Start live particle animation following conduit geometry
    if (edges.length > 0) {
      spawnEdgeParticles(map, particleGroup, edges, forcePeakSurcharge);
    }
  }, [edges, layerVisibility.drainage, showFlowDirection, forcePeakSurcharge]);


  // ─── Update Drainage Nodes & Sensors ──────────────────────────────────────
  useEffect(() => {
    if (!layersGroupRef.current) return;
    const { nodesGroup } = layersGroupRef.current;
    nodesGroup.clearLayers();

    if (!layerVisibility.nodes) return;

    nodes.forEach(node => {
      const latlng: [number, number] = [node.coordinates[1], node.coordinates[0]];
      const isCritical = node.status === 'CRITICAL' || node.status === 'OVERLOADED';
      const isOutfall = Boolean(node.is_outfall || node.node_type === 'outfall' || node.node_code.startsWith('OF-'));

      let iconHtml: string;
      let iconSize: [number, number] = [14, 14];
      let iconAnchor: [number, number] = [7, 7];

      if (isOutfall) {
        iconSize = [24, 24];
        iconAnchor = [12, 12];
        const isActive = (node.predicted_inflow_m3s ?? 0) > 0;
        iconHtml = `
          <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
            ${isActive ? '<div style="position:absolute;width:24px;height:24px;border-radius:50%;background:#fbbf24;opacity:0.6;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>' : ''}
            <div style="position:relative;width:20px;height:20px;border-radius:50%;background:${isActive ? '#d97706' : '#0284c7'};border:2px solid #fff;box-shadow:0 0 8px ${isActive ? '#fbbf24' : '#38bdf8'};display:flex;align-items:center;justify-content:center;font-size:10px;">
              🌊
            </div>
          </div>
        `;
      } else if (isCritical) {
        iconHtml = `<div class="pulse-indicator-critical flex items-center justify-center text-[10px] font-bold text-white shadow-lg">!</div>`;
      } else if (node.node_type === 'inlet') {
        iconHtml = `<div class="w-3.5 h-3.5 rounded-sm bg-[#38bdf8] border border-white shadow flex items-center justify-center text-[8px] font-mono text-black font-bold">I</div>`;
      } else {
        iconHtml = `<div class="w-3 h-3 rounded-full bg-[#10b981] border-2 border-white shadow"></div>`;
      }

      const icon = L.divIcon({
        className: 'custom-node-icon',
        html: iconHtml,
        iconSize,
        iconAnchor
      });

      const marker = L.marker(latlng, { icon });
      const outfallBadge = isOutfall
        ? `<div style="background:#fbbf24;color:#0f172a;font-weight:bold;font-size:10px;padding:2px 6px;border-radius:4px;margin-bottom:4px;text-align:center;">🌊 TERMINAL VALLEY OUTFALL</div>`
        : '';

      marker.bindTooltip(
        `<div style="font-family: Inter, sans-serif; padding: 2px;">
          ${outfallBadge}
          <b style="color:#fff">${node.node_code}</b> - <span style="color:#93c5fd">${node.node_name || node.node_type}</span><br/>
          Type: <b style="color:#e2e8f0;text-transform:uppercase">${node.node_type}</b><br/>
          Elev: <b>${node.ground_elev_m} m AMSL</b><br/>
          Status: <b style="color:${isCritical ? '#ef4444' : '#10b981'}">${node.status}</b><br/>
          Stress: <b>${node.stress_ratio}x</b> • Inflow: <b>${node.predicted_inflow_m3s} m³/s</b>
          ${node.discharge_target ? `<div style="font-size:10px;color:#cbd5e1;margin-top:3px;border-top:1px solid rgba(255,255,255,0.1);padding-top:2px;">Discharge: <b style="color:#fbbf24">${node.discharge_target}</b></div>` : ''}
        </div>`,
        { direction: 'top', offset: [0, -8], className: 'map-tooltip' }
      );

      marker.on('click', () => onSelectNode(node));
      marker.addTo(nodesGroup);
    });
  }, [nodes, layerVisibility.nodes]);

  // ─── Update Safe Route Overlays ───────────────────────────────────────────
  useEffect(() => {
    if (!layersGroupRef.current) return;
    const { routeGroup } = layersGroupRef.current;
    routeGroup.clearLayers();

    if (!activeRoute) return;

    // 1. Normal Route (Red Dashed Line)
    const normalLatLngs = activeRoute.normal_route.coordinates.map(
      c => [c[1], c[0]] as [number, number]
    );
    const normalLine = L.polyline(normalLatLngs, {
      color: '#ef4444',
      weight: 5,
      dashArray: '8, 8',
      opacity: 0.75
    }).addTo(routeGroup);
    normalLine.bindTooltip(
      `<b>Standard Route (High Flood Exposure)</b><br/>Max Depth: ${activeRoute.normal_route.max_depth_cm} cm`,
      { sticky: true }
    );

    // 2. Flood Safe Route (Glowing Neon Green Line)
    const safeLatLngs = activeRoute.flood_safe_route.coordinates.map(
      c => [c[1], c[0]] as [number, number]
    );
    const safeLine = L.polyline(safeLatLngs, {
      color: '#10b981',
      weight: 7,
      opacity: 0.95
    }).addTo(routeGroup);
    safeLine.bindTooltip(
      `<b>${activeRoute.status_label}</b><br/>Max Depth: ${activeRoute.flood_safe_route.max_depth_cm} cm<br/>Distance: ${activeRoute.flood_safe_route.distance_m} m`,
      { sticky: true }
    );

    // Fit map bounds to show full route
    const allLatLngs = [...normalLatLngs, ...safeLatLngs];
    if (mapRef.current && allLatLngs.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(allLatLngs).pad(0.2));
    }
  }, [activeRoute]);

  // ─── Update Flood Report Incident Markers ─────────────────────────────────
  useEffect(() => {
    if (!layersGroupRef.current) return;
    const { reportsGroup } = layersGroupRef.current;
    reportsGroup.clearLayers();

    floodReports.forEach(report => {
      const latlng: [number, number] = [report.coordinates[1], report.coordinates[0]];
      const severityColor = report.severity === 'CRITICAL' ? '#dc2626'
        : report.severity === 'HIGH' ? '#f59e0b'
        : report.severity === 'MODERATE' ? '#f97316'
        : '#10b981';

      const iconHtml = `
        <div style="
          position: relative;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            background: ${severityColor};
            border-radius: 50%;
            opacity: 0.25;
            animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 12px;
            height: 12px;
            background: ${severityColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 8px ${severityColor};
            position: relative;
            z-index: 1;
          "></div>
        </div>`;

      const icon = L.divIcon({
        className: 'flood-report-icon',
        html: iconHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker(latlng, { icon });
      const timeLabel = report.reported_at
        ? new Date(report.reported_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'Unknown time';
      marker.bindTooltip(
        `<b>⚠ Flood Report</b><br/>
         Depth: <b>${report.depth_cm} cm</b><br/>
         Severity: <span style="color:${severityColor};font-weight:bold">${report.severity}</span><br/>
         ${report.description}<br/>
         <span style="color:#94a3b8;font-size:10px">${timeLabel} • ${report.verification_status}</span>`,
        { direction: 'top', offset: [0, -8], className: 'map-tooltip' }
      );
      marker.addTo(reportsGroup);
    });
  }, [floodReports]);

  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Layer Toggle + Map Controls Floating Pop-up Panel */}
      {!isLayersOpen ? (
        <button
          onClick={() => setIsLayersOpen(true)}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xl select-none cursor-pointer"
          style={{
            zIndex: 1001,
            background: 'rgba(10, 22, 40, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(12px)'
          }}
          title="Open Spatial Layers & Flow Indicators"
        >
          <Layers size={14} className="text-[#10b981]" />
          <span>Spatial Layers</span>
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse ml-0.5" />
        </button>
      ) : (
        <div
          className="absolute top-4 left-4 p-3.5 flex flex-col gap-2.5 shadow-2xl select-none min-w-[250px] animate-in fade-in zoom-in duration-150 rounded-xl"
          style={{
            zIndex: 1001,
            background: 'rgba(10, 22, 40, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#86948a] flex items-center gap-1.5">
              <Layers size={13} className="text-[#10b981]" />
              <span>Spatial GIS Layers</span>
            </div>
            <button
              onClick={() => setIsLayersOpen(false)}
              className="p-1 rounded text-[#86948a] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Close Panel"
            >
              <X size={14} />
            </button>
          </div>

          {isFullGisMode && (
            <div className="pb-2 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider">GIS Workbench Mode</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-mono">30m DEM</span>
            </div>
          )}

          <button
            onClick={() => setLayerVisibility(prev => ({ ...prev, roads: !prev.roads }))}
            className={`flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
              layerVisibility.roads ? 'text-[#10b981] bg-[#10b981]/15 font-semibold border border-[#10b981]/30' : 'text-[#86948a] hover:bg-white/5'
            }`}
          >
            <span>Road Inundation Network</span>
            {layerVisibility.roads ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          <button
            onClick={() => setLayerVisibility(prev => ({ ...prev, drainage: !prev.drainage }))}
            className={`flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
              layerVisibility.drainage ? 'text-[#38bdf8] bg-[#38bdf8]/15 font-semibold border border-[#38bdf8]/30' : 'text-[#86948a] hover:bg-white/5'
            }`}
          >
            <span>Drainage Conduits (1D)</span>
            {layerVisibility.drainage ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          <button
            onClick={() => setLayerVisibility(prev => ({ ...prev, nodes: !prev.nodes }))}
            className={`flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
              layerVisibility.nodes ? 'text-[#f59e0b] bg-[#f59e0b]/15 font-semibold border border-[#f59e0b]/30' : 'text-[#86948a] hover:bg-white/5'
            }`}
          >
            <span>Manholes &amp; Inlets</span>
            {layerVisibility.nodes ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          {/* Water Flow & Surcharge Backflow Controls */}
          <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8] px-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Activity size={12} /> Flow &amp; Backflow Indicators
              </span>
            </div>

            <button
              onClick={() => setShowSurfaceRunoff(prev => !prev)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                showSurfaceRunoff ? 'text-[#38bdf8] bg-[#38bdf8]/15 font-semibold border border-[#38bdf8]/30' : 'text-[#86948a] hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Droplets size={12} className={showSurfaceRunoff ? 'text-[#38bdf8]' : ''} />
                Surface Runoff (Road ➔ Drain)
              </span>
              <span className="text-[10px] font-mono">{showSurfaceRunoff ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowFlowDirection(prev => !prev)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                showFlowDirection ? 'text-[#38bdf8] bg-[#38bdf8]/15 font-semibold border border-[#38bdf8]/30' : 'text-[#86948a] hover:bg-white/5'
              }`}
            >
              <span>Water Flow Direction</span>
              <span className="text-[10px] font-mono">{showFlowDirection ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setForcePeakSurcharge(prev => !prev)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                forcePeakSurcharge
                  ? 'text-[#ef4444] bg-[#ef4444]/20 font-bold border border-[#ef4444] shadow-sm'
                  : 'text-[#86948a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 border border-white/10'
              }`}
              title="Simulate hydraulic head backwater surcharge flowing upstream"
            >
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft size={12} className={forcePeakSurcharge ? 'animate-pulse text-[#ef4444]' : ''} />
                Sim Surcharge Backflow
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${forcePeakSurcharge ? 'bg-[#ef4444] text-white font-bold' : 'bg-white/10'}`}>
                {forcePeakSurcharge ? 'PEAK ⬅' : 'AUTO'}
              </span>
            </button>
          </div>

          {/* Incident reports count indicator */}
          {floodReports.length > 0 && (
            <div className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-xs bg-[#f59e0b]/10 border border-[#f59e0b]/25">
              <span className="text-[#f59e0b] font-semibold">Incident Reports</span>
              <span className="text-[10px] font-mono text-[#f59e0b] bg-[#f59e0b]/20 px-1.5 py-0.5 rounded">{floodReports.length}</span>
            </div>
          )}

          {/* Map Size Toggle */}
          {onToggleMapSize && (
            <button
              onClick={onToggleMapSize}
              className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-xs transition-all border border-[rgba(255,255,255,0.1)] text-[#86948a] hover:text-white hover:bg-white/5 mt-1 cursor-pointer"
              title={mapSize === 'full' ? 'Switch to Compact Map' : 'Expand to Full Map'}
            >
              <span>{mapSize === 'full' ? 'Compact Map View' : 'Full Map View'}</span>
              {mapSize === 'full' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          )}
        </div>
      )}

      {/* Hydraulic Flow Legend Floating Badge (Bottom Left) */}
      {layerVisibility.drainage && (
        <div
          className="absolute bottom-6 left-4 p-2.5 px-3 flex flex-col gap-1.5 text-[11px] shadow-xl select-none rounded-xl"
          style={{
            zIndex: 1001,
            background: 'rgba(10, 22, 40, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#86948a] mb-0.5">
            Hydraulic Direction Legend
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#38bdf8] flex items-center justify-center text-white text-[8px] font-bold">➡</div>
            <span className="text-[#38bdf8] font-medium text-[11px]">Downstream Gravity Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#ef4444] flex items-center justify-center text-white text-[8px] font-bold animate-pulse">⬅</div>
            <span className="text-[#ef4444] font-medium text-[11px]">Surcharge Backflow (Upstream)</span>
          </div>
        </div>
      )}

      {/* Active Route HUD — floats at top center when a route is displayed */}
      {activeRoute && (
        <div
          className="ar-route-hud"
        >
          <div className="flex items-center gap-2">
            <Navigation size={14} className="text-[#10b981] shrink-0" />
            <span className="text-xs font-bold text-white">Active Safe Route</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#ef4444] inline-block" />
              <span className="text-[#ef4444] font-mono font-bold">{activeRoute.normal_route.max_depth_cm}cm</span>
              <span className="text-[#64748b]">standard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#10b981] inline-block" />
              <span className="text-[#10b981] font-mono font-bold">{activeRoute.flood_safe_route.max_depth_cm}cm</span>
              <span className="text-[#64748b]">safe route</span>
            </div>
          </div>
          {onClearRoute && (
            <button
              onClick={onClearRoute}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-[#86948a] hover:text-white hover:bg-white/10 transition-all border border-white/10 cursor-pointer"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
      )}

    </div>
  );
};
