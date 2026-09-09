import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { RoadFeature, DrainageNode, DrainageEdge, SafeRouteResult, FloodReportItem } from '../types';
import { Layers, Eye, EyeOff, Navigation, X, Maximize2, Minimize2, ArrowRightLeft, Activity } from 'lucide-react';

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

// Calculate bearing/angle between two coordinates for rotated flow arrows
function getBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
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
    nodesGroup: L.FeatureGroup;
    routeGroup: L.FeatureGroup;
    reportsGroup: L.FeatureGroup;
  } | null>(null);

  // Hydraulic Flow Controls State
  const [showFlowDirection, setShowFlowDirection] = useState<boolean>(true);
  const [forcePeakSurcharge, setForcePeakSurcharge] = useState<boolean>(false);

  // ─── Initialize Map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Koramangala Ward 151 coordinates center
    const map = L.map(mapContainerRef.current, {
      center: [12.9345, 77.6265],
      zoom: 15,
      zoomControl: false
    });

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: 'abc'
    }).addTo(map);

    // Zoom controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const roadsGroup = L.featureGroup().addTo(map);
    const drainageGroup = L.featureGroup().addTo(map);
    const flowArrowsGroup = L.featureGroup().addTo(map);
    const nodesGroup = L.featureGroup().addTo(map);
    const routeGroup = L.featureGroup().addTo(map);
    const reportsGroup = L.featureGroup().addTo(map);

    layersGroupRef.current = { roadsGroup, drainageGroup, flowArrowsGroup, nodesGroup, routeGroup, reportsGroup };
    mapRef.current = map;

    return () => {
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

  // ─── Update Drainage Conduits & Flow Direction Indicators ─────────────────
  useEffect(() => {
    if (!layersGroupRef.current) return;
    const { drainageGroup, flowArrowsGroup } = layersGroupRef.current;
    drainageGroup.clearLayers();
    flowArrowsGroup.clearLayers();

    if (!layerVisibility.drainage) return;

    edges.forEach(edge => {
      const coords = edge.coordinates;
      if (!coords || coords.length < 2) return;

      const latlngs = coords.map(c => [c[1], c[0]] as [number, number]);

      // Determine hydraulic flow state: Normal (Downstream) vs Peak Surcharge (Upstream Backflow)
      const isBackflow = forcePeakSurcharge || (edge.flow_direction === 'BACKFLOW' && edge.flow_m3s > 0);

      const lineColor = isBackflow ? '#ef4444' : (edge.status === 'AT RISK' ? '#f59e0b' : '#38bdf8');
      const strokeDash = isBackflow ? 'flow-polyline-backflow' : 'flow-polyline-forward';

      // 1. Draw base conduit line
      const polyline = L.polyline(latlngs, {
        color: lineColor,
        weight: isBackflow ? 4.5 : 3.0,
        opacity: 0.9,
        className: strokeDash
      });

      const dirLabel = isBackflow
        ? '<span style="color:#ef4444;font-weight:bold;">⚠️ PEAK SURCHARGE BACKFLOW (Upstream ⬅)</span>'
        : '<span style="color:#38bdf8;font-weight:bold;">🌊 GRAVITY FLOW (Downstream ➡)</span>';

      const velStr = isBackflow
        ? `${edge.velocity_ms || -0.85} m/s (REVERSE)`
        : `+${edge.velocity_ms || 1.4} m/s`;

      polyline.bindTooltip(
        `<div style="font-family: Inter, sans-serif; padding: 2px;">
          <div style="font-weight: bold; color: #fff; font-size: 12px; margin-bottom: 2px;">Conduit ${edge.edge_code}</div>
          <div style="font-size: 11px; margin-bottom: 4px;">Flow Direction: ${dirLabel}</div>
          <div style="font-size: 11px; color: #cbd5e1;">
            Flow Rate: <b>${edge.flow_m3s} m³/s</b> • Velocity: <b>${velStr}</b>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
            Stress Ratio: <b style="color:${lineColor}">${edge.stress_ratio}x</b> • Blockage: <b>${edge.blockage_percent}%</b>
          </div>
          ${isBackflow ? `<div style="font-size:10px; color:#ef4444; margin-top:4px; font-weight:bold;">Hydraulic Surcharge Head: +${edge.surcharge_head_cm || 38} cm</div>` : ''}
        </div>`,
        { sticky: true, className: 'map-tooltip' }
      );

      polyline.addTo(drainageGroup);

      // 2. Draw Water Flow Direction Markers along each conduit segment
      if (showFlowDirection) {
        for (let i = 0; i < latlngs.length - 1; i++) {
          const p1 = latlngs[i];
          const p2 = latlngs[i + 1];

          // Midpoint of segment
          const midLat = (p1[0] + p2[0]) / 2;
          const midLng = (p1[1] + p2[1]) / 2;

          // Calculate rotation angle: forward points p1 -> p2, backflow points p2 -> p1 (reverse 180°)
          const bearing = isBackflow
            ? getBearing(p2[0], p2[1], p1[0], p1[1])
            : getBearing(p1[0], p1[1], p2[0], p2[1]);

          const arrowColor = isBackflow ? '#ef4444' : '#38bdf8';
          const iconClass = isBackflow ? 'flow-marker-backflow' : 'flow-marker-forward';

          // UP-oriented directional arrow (0° = NORTH), rotated by exact spherical bearing
          const arrowHtml = `
            <div class="${iconClass}" style="
              transform: rotate(${Math.round(bearing)}deg);
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${arrowColor}" stroke="${arrowColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 5px ${arrowColor});">
                <path d="M12 2L3 18h6v4h6v-4h6z"/>
              </svg>
            </div>`;

          const arrowIcon = L.divIcon({
            className: 'flow-arrow-icon',
            html: arrowHtml,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          const arrowMarker = L.marker([midLat, midLng], { icon: arrowIcon, interactive: false });
          arrowMarker.addTo(flowArrowsGroup);
        }
      }
    });
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

      const iconHtml = isCritical
        ? `<div class="pulse-indicator-critical flex items-center justify-center text-[10px] font-bold text-white shadow-lg">!</div>`
        : `<div class="w-3 h-3 rounded-full bg-[#10b981] border-2 border-white shadow"></div>`;

      const icon = L.divIcon({
        className: 'custom-node-icon',
        html: iconHtml,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker(latlng, { icon });
      marker.bindTooltip(
        `<div style="font-family: Inter, sans-serif; padding: 2px;">
          <b style="color:#fff">${node.node_code}</b> (${node.node_type})<br/>
          Elev: <b>${node.ground_elev_m} m AMSL</b><br/>
          Status: <b style="color:${isCritical ? '#ef4444' : '#10b981'}">${node.status}</b><br/>
          Stress: <b>${node.stress_ratio}x</b> • Inflow: <b>${node.predicted_inflow_m3s} m³/s</b>
        </div>`,
        { direction: 'top', offset: [0, -6], className: 'map-tooltip' }
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
          className="absolute top-4 left-4 glass-panel p-2.5 px-3 flex items-center gap-2 text-xs font-bold text-white hover:bg-[#152031] transition-all shadow-2xl border border-white/20 select-none cursor-pointer"
          style={{ zIndex: 1001 }}
          title="Open Spatial Layers & Flow Indicators"
        >
          <Layers size={15} className="text-[#10b981]" />
          <span>Spatial Layers</span>
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse ml-1" />
        </button>
      ) : (
        <div
          className="absolute top-4 left-4 glass-panel p-3.5 flex flex-col gap-2 shadow-2xl select-none min-w-[240px] animate-in fade-in zoom-in duration-150"
          style={{ zIndex: 1001 }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#86948a] flex items-center gap-1.5">
              <Layers size={13} className="text-[#10b981]" />
              <span>Spatial Layers &amp; Controls</span>
            </div>
            <button
              onClick={() => setIsLayersOpen(false)}
              className="p-1 rounded text-[#86948a] hover:text-white hover:bg-white/10 transition-all"
              title="Close Panel"
            >
              <X size={15} />
            </button>
          </div>

          {isFullGisMode && (
            <div className="pb-2 border-b border-[#334155] flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider">GIS Workbench Mode</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-mono">30m DEM</span>
            </div>
          )}

          <button
            onClick={() => setLayerVisibility(prev => ({ ...prev, roads: !prev.roads }))}
            className={`flex items-center justify-between gap-3 px-2.5 py-1.5 rounded text-xs transition-all ${
              layerVisibility.roads ? 'text-[#10b981] bg-[#10b981]/15 font-semibold border border-[#10b981]/30' : 'text-[#86948a] hover:bg-[#152031]'
            }`}
          >
            <span>Road Inundation Network</span>
            {layerVisibility.roads ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          <button
            onClick={() => setLayerVisibility(prev => ({ ...prev, drainage: !prev.drainage }))}
            className={`flex items-center justify-between gap-3 px-2.5 py-1.5 rounded text-xs transition-all ${
              layerVisibility.drainage ? 'text-[#38bdf8] bg-[#38bdf8]/15 font-semibold border border-[#38bdf8]/30' : 'text-[#86948a] hover:bg-[#152031]'
            }`}
          >
            <span>Drainage Conduits (1D)</span>
            {layerVisibility.drainage ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          <button
            onClick={() => setLayerVisibility(prev => ({ ...prev, nodes: !prev.nodes }))}
            className={`flex items-center justify-between gap-3 px-2.5 py-1.5 rounded text-xs transition-all ${
              layerVisibility.nodes ? 'text-[#f59e0b] bg-[#f59e0b]/15 font-semibold border border-[#f59e0b]/30' : 'text-[#86948a] hover:bg-[#152031]'
            }`}
          >
            <span>Manholes &amp; Inlets</span>
            {layerVisibility.nodes ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          {/* Water Flow & Surcharge Backflow Controls */}
          <div className="pt-2 border-t border-[#334155] space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8] px-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Activity size={12} /> Flow &amp; Backflow Indicators
              </span>
            </div>

            <button
              onClick={() => setShowFlowDirection(prev => !prev)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-xs transition-all ${
                showFlowDirection ? 'text-[#38bdf8] bg-[#38bdf8]/15 font-semibold border border-[#38bdf8]/30' : 'text-[#86948a] hover:bg-[#152031]'
              }`}
            >
              <span>Water Flow Arrows</span>
              <span className="text-[10px] font-mono">{showFlowDirection ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setForcePeakSurcharge(prev => !prev)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-xs transition-all ${
                forcePeakSurcharge
                  ? 'text-[#ef4444] bg-[#ef4444]/20 font-bold border border-[#ef4444] shadow-sm'
                  : 'text-[#86948a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 border border-white/10'
              }`}
              title="Simulate hydraulic head backwater surcharge flowing upstream"
            >
              <span className="flex items-center gap-1">
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
            <div className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded text-xs bg-[#f59e0b]/10 border border-[#f59e0b]/25">
              <span className="text-[#f59e0b] font-semibold">Incident Reports</span>
              <span className="text-[10px] font-mono text-[#f59e0b] bg-[#f59e0b]/20 px-1.5 py-0.5 rounded">{floodReports.length}</span>
            </div>
          )}

          {/* Map Size Toggle */}
          {onToggleMapSize && (
            <button
              onClick={onToggleMapSize}
              className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded text-xs transition-all border border-[rgba(255,255,255,0.1)] text-[#86948a] hover:text-white hover:bg-[#152031] mt-1"
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
          className="absolute bottom-6 left-4 glass-panel p-2.5 flex flex-col gap-1.5 text-[11px] shadow-xl select-none"
          style={{ zIndex: 1001, background: 'rgba(8, 20, 37, 0.9)', backdropFilter: 'blur(12px)' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#86948a] mb-0.5">
            Hydraulic Direction Legend
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#38bdf8] flex items-center justify-center text-white text-[8px] font-bold">➡</div>
            <span className="text-[#38bdf8] font-medium">Normal Downstream Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444] flex items-center justify-center text-white text-[8px] font-bold animate-pulse">⬅</div>
            <span className="text-[#ef4444] font-medium">Peak Surcharge Backflow (Upstream)</span>
          </div>
        </div>
      )}

      {/* Active Route HUD — floats at top center when a route is displayed */}
      {activeRoute && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel shadow-2xl select-none"
          style={{
            zIndex: 1001,
            minWidth: 380,
            maxWidth: 520,
            padding: '10px 14px',
            border: '1px solid rgba(16,185,129,0.35)',
            background: 'rgba(8,20,37,0.92)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Navigation size={14} className="text-[#10b981] shrink-0" />
              <span className="text-[11px] font-bold text-white">Active Route</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-[#ef4444] inline-block" style={{ background: 'repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 4px, transparent 4px, transparent 8px)' }} />
                <span className="text-[#ef4444] font-mono">{activeRoute.normal_route.max_depth_cm}cm</span>
                <span className="text-[#64748b]">standard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-[#10b981] inline-block" />
                <span className="text-[#10b981] font-mono">{activeRoute.flood_safe_route.max_depth_cm}cm</span>
                <span className="text-[#64748b]">safe route</span>
              </div>
            </div>
            {onClearRoute && (
              <button
                onClick={onClearRoute}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-[#86948a] hover:text-white hover:bg-white/10 transition-all border border-white/10"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
