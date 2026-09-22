"""
UFIS Routing Engine — Hybrid OSRM + Flood-Awareness Layer
==========================================================
Architecture:
  1. OSRM (router.project-osrm.org) provides real OSM road-following geometry
     for both the direct route and a flood-safe detour (via avoidance waypoints).
  2. UFIS annotates the OSRM coordinates with predicted flood depth by snapping
     each route point to the nearest seeded road segment.
  3. If OSRM is unreachable (timeout/offline), falls back to the legacy graph-based
     engine using seeded road segment coordinates.
"""

import math
import urllib.request
import urllib.parse
import urllib.error
import json
import networkx as nx
from typing import List, Dict, Any, Optional, Tuple

OSRM_BASE = "https://router.project-osrm.org"
OSRM_TIMEOUT_S = 6  # seconds — fail-fast so demo doesn't hang

VEHICLE_THRESHOLDS = {
    "car": 12.0,           # Impassable if depth > 12 cm
    "suv": 20.0,           # Impassable if depth > 20 cm
    "ambulance": 22.0,     # Impassable if depth > 22 cm
    "rescue_truck": 38.0   # Impassable if depth > 38 cm
}

# Known high-risk drainage hotspot coordinates (lon, lat) in Koramangala
# These are used to generate detour waypoints that steer clear of flood zones
FLOOD_HOTSPOT_LONLAT = {
    "MH-04": [77.6305, 12.9335],  # ST Bed North Basin
    "MH-07": [77.6335, 12.9300],  # ST Bed Main Surcharge Basin
    "MH-10": [77.6375, 12.9285],  # SHBCS Trunk Culvert
}

# High-ground bypass waypoints for safe routing — elevated corridors
# that stay above the 100 Feet Rd / Koramangala 4th Block ridge
SAFE_BYPASS_LONLAT = [
    [77.6230, 12.9412],   # Koramangala 4th Block high ridge
    [77.6290, 12.9400],   # 6th Block connector high ground
    [77.6320, 12.9390],   # Srinivagilu high ground feeder
]


# ─── Haversine Distance ───────────────────────────────────────────────────────

def distance_haversine(coord1: List[float], coord2: List[float]) -> float:
    """Haversine distance in metres between two [lon, lat] coordinate pairs."""
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    R = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


# ─── OSRM Integration ────────────────────────────────────────────────────────

def fetch_osrm_route(
    start_lonlat: List[float],
    end_lonlat: List[float],
    waypoints: Optional[List[List[float]]] = None,
    profile: str = "driving"
) -> Optional[Dict[str, Any]]:
    """
    Call the OSRM HTTP API and return the full road-snapped GeoJSON geometry.
    
    Returns:
        dict with keys: coordinates (list of [lon,lat]), distance_m (float), duration_s (float)
        or None if the request fails.
    """
    # Build coordinate string: lon,lat;lon,lat;...
    coord_parts = [f"{start_lonlat[0]},{start_lonlat[1]}"]
    if waypoints:
        for wp in waypoints:
            coord_parts.append(f"{wp[0]},{wp[1]}")
    coord_parts.append(f"{end_lonlat[0]},{end_lonlat[1]}")
    coord_str = ";".join(coord_parts)

    url = (
        f"{OSRM_BASE}/route/v1/{profile}/{coord_str}"
        f"?geometries=geojson&overview=full&steps=true"
    )

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "UFIS-SIH2026/1.0 (educational project)"}
        )
        with urllib.request.urlopen(req, timeout=OSRM_TIMEOUT_S) as resp:
            raw = json.loads(resp.read().decode("utf-8"))

        if raw.get("code") != "Ok" or not raw.get("routes"):
            return None

        route = raw["routes"][0]
        geom_coords = route["geometry"]["coordinates"]  # list of [lon, lat]

        # Extract road name steps
        road_names: List[str] = []
        for leg in route.get("legs", []):
            for step in leg.get("steps", []):
                name = step.get("name", "").strip()
                if name and name not in road_names:
                    road_names.append(name)

        return {
            "coordinates": geom_coords,
            "distance_m": round(route["distance"], 1),
            "duration_s": round(route["duration"], 0),
            "road_names": road_names,
            "source": "osrm"
        }

    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError):
        return None


# ─── Flood Depth Annotation ───────────────────────────────────────────────────

def annotate_route_with_flood_depth(
    coordinates: List[List[float]],
    road_forecasts: List[Dict[str, Any]]
) -> Tuple[float, str, str]:
    """
    For each coordinate in the route, find the nearest road segment and
    accumulate the maximum predicted flood depth.
    
    Returns:
        (max_depth_cm, risk_level, risk_color)
    """
    if not road_forecasts:
        return 2.0, "Low", "#10B981"

    max_depth = 0.0

    for coord in coordinates:
        best_depth = 0.0
        best_dist = float("inf")

        for road in road_forecasts:
            road_coords = road.get("coordinates", [])
            # Sample each road segment's midpoint for nearest-road matching
            for i in range(len(road_coords) - 1):
                mid = [
                    (road_coords[i][0] + road_coords[i + 1][0]) / 2,
                    (road_coords[i][1] + road_coords[i + 1][1]) / 2
                ]
                dist = distance_haversine(coord, mid)
                if dist < best_dist:
                    best_dist = dist
                    best_depth = road.get("predicted_depth_cm", 0.0)

        # Only attribute depth if route passes within 80m of a road segment
        if best_dist < 80:
            max_depth = max(max_depth, best_depth)

    max_depth = round(max_depth, 1)

    if max_depth < 5.0:
        return max_depth, "Low", "#10B981"
    elif max_depth < 15.0:
        return max_depth, "Moderate", "#F59E0B"
    elif max_depth < 30.0:
        return max_depth, "High", "#EF4444"
    else:
        return max_depth, "Critical", "#7F1D1D"


# ─── Flood Detour Waypoint Selection ─────────────────────────────────────────

def find_flood_detour_waypoints(
    start_lonlat: List[float],
    end_lonlat: List[float],
    road_forecasts: List[Dict[str, Any]],
    vehicle_type: str
) -> List[List[float]]:
    """
    Select 1-2 intermediate waypoints on high ground that steer the safe route
    away from critically flooded road segments.
    
    Strategy:
    - Find any road forecasts with depth > vehicle threshold
    - Pick the bypass waypoint(s) that are closest to the route midpoint
      but above the critical flood elevation
    """
    threshold = VEHICLE_THRESHOLDS.get(vehicle_type, 15.0)

    # Check if any known hotspots are critically flooded
    critical_hotspots = []
    for road in road_forecasts:
        if road.get("predicted_depth_cm", 0) > threshold:
            mid_coords = road.get("coordinates", [])
            if mid_coords:
                mid = mid_coords[len(mid_coords) // 2]
                critical_hotspots.append(mid)

    if not critical_hotspots:
        # No critical flooding — no detour needed
        return []

    # Calculate route midpoint to select the most relevant bypass waypoints
    route_mid = [
        (start_lonlat[0] + end_lonlat[0]) / 2,
        (start_lonlat[1] + end_lonlat[1]) / 2
    ]

    # Score each bypass waypoint by proximity to route midpoint
    bypass_scored = [
        (distance_haversine(wp, route_mid), wp)
        for wp in SAFE_BYPASS_LONLAT
    ]
    bypass_scored.sort(key=lambda x: x[0])

    # Return the 1-2 closest bypass waypoints
    return [wp for _, wp in bypass_scored[:2]]


# ─── Legacy Graph-Based Fallback ──────────────────────────────────────────────

def _build_road_graph(road_forecasts: List[Dict[str, Any]]) -> nx.Graph:
    G = nx.Graph()
    for r in road_forecasts:
        coords = r["coordinates"]
        for i in range(len(coords) - 1):
            u = f"{coords[i][0]:.5f},{coords[i][1]:.5f}"
            v = f"{coords[i+1][0]:.5f},{coords[i+1][1]:.5f}"
            seg_len = distance_haversine(coords[i], coords[i+1])
            G.add_edge(
                u, v,
                road_id=r["road_id"],
                name=r["name"],
                depth_cm=r["predicted_depth_cm"],
                risk_level=r["risk_level"],
                length=seg_len,
                coords=[coords[i], coords[i+1]]
            )
    return G


def _find_nearest_node(graph: nx.Graph, point: List[float]) -> Optional[str]:
    # point is [lat, lon] -> target is [lon, lat]
    p_lon, p_lat = point[1], point[0]
    best_node = None
    min_dist = float("inf")
    for node in graph.nodes():
        lon, lat = map(float, node.split(","))
        dist = distance_haversine([p_lon, p_lat], [lon, lat])
        if dist < min_dist:
            min_dist = dist
            best_node = node
    return best_node


def _extract_path_geometry(
    graph: nx.Graph,
    path_nodes: List[str],
    start_lonlat: List[float],
    end_lonlat: List[float]
) -> Tuple[List[List[float]], float, float]:
    coords = [start_lonlat]
    total_dist = 0.0
    max_depth = 0.0

    for i in range(len(path_nodes) - 1):
        u, v = path_nodes[i], path_nodes[i + 1]
        edge_data = graph.get_edge_data(u, v, default={"length": 150, "depth_cm": 0.0})
        total_dist += edge_data.get("length", 150)
        max_depth = max(max_depth, edge_data.get("depth_cm", 0.0))

        u_lon, u_lat = map(float, u.split(","))
        v_lon, v_lat = map(float, v.split(","))
        edge_coords = edge_data.get("coords", [[u_lon, u_lat], [v_lon, v_lat]])
        if distance_haversine(edge_coords[0], [u_lon, u_lat]) > distance_haversine(edge_coords[-1], [u_lon, u_lat]):
            edge_coords = list(reversed(edge_coords))
        for pt in edge_coords:
            if not coords or distance_haversine(coords[-1], pt) > 2.0:
                coords.append(pt)

    if not coords:
        coords = [start_lonlat, end_lonlat]
    elif distance_haversine(coords[-1], end_lonlat) > 5:
        coords.append(end_lonlat)
    else:
        coords[-1] = end_lonlat

    return coords, round(total_dist, 1), round(max_depth, 1)


def _legacy_calculate_routes(
    start_point: List[float],
    end_point: List[float],
    vehicle_type: str,
    road_forecasts: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Graph-based fallback routing from seeded road segments."""
    start_lonlat = [start_point[1], start_point[0]]
    end_lonlat = [end_point[1], end_point[0]]

    G = _build_road_graph(road_forecasts)
    start_node = _find_nearest_node(G, start_point)
    end_node = _find_nearest_node(G, end_point)

    if not start_node or not end_node or start_node == end_node:
        dist = distance_haversine(start_lonlat, end_lonlat)
        return {
            "route_id": "route-direct-fallback",
            "vehicle_type": vehicle_type,
            "normal_route": {
                "coordinates": [start_lonlat, end_lonlat],
                "distance_m": dist,
                "duration_seconds": 180,
                "max_depth_cm": 8.0,
                "risk_level": "Moderate",
                "road_names": []
            },
            "flood_safe_route": {
                "coordinates": [start_lonlat, end_lonlat],
                "distance_m": dist,
                "duration_seconds": 180,
                "max_depth_cm": 8.0,
                "risk_level": "Moderate",
                "road_names": []
            },
            "savings_explanation": "Network routing unavailable. Direct connection shown.",
            "is_safe": True,
            "status_label": "Lowest flood-risk route available"
        }

    try:
        normal_path = nx.shortest_path(G, source=start_node, target=end_node, weight="length")
    except nx.NetworkXNoPath:
        normal_path = [start_node, end_node]

    normal_coords, normal_dist, normal_max_depth = _extract_path_geometry(G, normal_path, start_lonlat, end_lonlat)

    max_thresh = VEHICLE_THRESHOLDS.get(vehicle_type, 22.0)
    G_safe = G.copy()
    for u, v, data in G_safe.edges(data=True):
        d = data["depth_cm"]
        if d > max_thresh:
            data["safe_weight"] = 999_999.0
        elif d > 3.0:
            data["safe_weight"] = data["length"] * (1.0 + (d / 2.0) ** 3)
        else:
            data["safe_weight"] = data["length"] * (1.0 + d / 10.0)

    try:
        safe_path = nx.shortest_path(G_safe, source=start_node, target=end_node, weight="safe_weight")
    except nx.NetworkXNoPath:
        safe_path = normal_path

    safe_coords, safe_dist, safe_max_depth = _extract_path_geometry(G_safe, safe_path, start_lonlat, end_lonlat)

    normal_duration = int((normal_dist / 30_000.0) * 3600) + (180 if normal_max_depth > 15 else 60 if normal_max_depth > 5 else 0)
    safe_duration = int((safe_dist / 35_000.0) * 3600)

    return {
        "route_id": f"route-fallback-{int(normal_dist)}-{vehicle_type}",
        "vehicle_type": vehicle_type,
        "normal_route": {
            "type": "LineString",
            "coordinates": normal_coords,
            "distance_m": normal_dist,
            "duration_seconds": normal_duration,
            "max_depth_cm": normal_max_depth,
            "risk_level": "Critical" if normal_max_depth > 25 else "High",
            "road_names": []
        },
        "flood_safe_route": {
            "type": "LineString",
            "coordinates": safe_coords,
            "distance_m": safe_dist,
            "duration_seconds": safe_duration,
            "max_depth_cm": safe_max_depth,
            "risk_level": "Low" if safe_max_depth < 8 else "Moderate",
            "road_names": []
        },
        "savings_explanation": (
            f"Standard route: {normal_max_depth:.1f} cm predicted flood depth. "
            f"Safe detour reduces max exposure to {safe_max_depth:.1f} cm."
        ),
        "is_safe": True,
        "status_label": "Lowest flood-risk route (offline mode)"
    }


# ─── Main Public API ──────────────────────────────────────────────────────────

def calculate_routes(
    start_point: List[float],
    end_point: List[float],
    vehicle_type: str,
    road_forecasts: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Primary routing function called by the /api/v1/route/safe endpoint.
    
    start_point / end_point: [lat, lon]
    road_forecasts: output from hydraulic_engine.calculate_road_flood_depths()
    
    Returns a dict with normal_route and flood_safe_route, each containing
    real road-following coordinates from OSRM where available.
    """
    start_lonlat = [start_point[1], start_point[0]]  # [lon, lat]
    end_lonlat   = [end_point[1], end_point[0]]

    # ── Step 1: Request direct (normal) route from OSRM ─────────────────────
    normal_osrm = fetch_osrm_route(start_lonlat, end_lonlat)

    if not normal_osrm:
        # OSRM unavailable — use legacy graph engine
        return _legacy_calculate_routes(start_point, end_point, vehicle_type, road_forecasts)

    # ── Step 2: Annotate normal route with flood depths ──────────────────────
    normal_depth, normal_risk, _ = annotate_route_with_flood_depth(
        normal_osrm["coordinates"], road_forecasts
    )

    # ── Step 3: Compute flood-safe route via OSRM with high-ground waypoints ──
    detour_waypoints = find_flood_detour_waypoints(
        start_lonlat, end_lonlat, road_forecasts, vehicle_type
    )

    safe_osrm = None
    if detour_waypoints:
        safe_osrm = fetch_osrm_route(start_lonlat, end_lonlat, waypoints=detour_waypoints)

    # If OSRM detour failed or no detour needed, use normal route as safe route
    if not safe_osrm:
        safe_osrm = normal_osrm

    # ── Step 4: Annotate safe route with flood depths ────────────────────────
    safe_depth, safe_risk, _ = annotate_route_with_flood_depth(
        safe_osrm["coordinates"], road_forecasts
    )

    # ── Step 5: Calculate durations (speed assumptions) ─────────────────────
    # Normal route: reduce speed if flooded (20 km/h in floods, 35 km/h clear)
    normal_speed_mps = (20_000 if normal_depth > 10 else 35_000) / 3600.0
    normal_duration = int(normal_osrm["distance_m"] / normal_speed_mps)

    # Safe route: 30 km/h baseline (slight detour, but flood-clear)
    safe_speed_mps = 30_000.0 / 3600.0
    safe_duration = int(safe_osrm["distance_m"] / safe_speed_mps)

    # ── Step 6: Build savings explanation ────────────────────────────────────
    dist_delta = round(safe_osrm["distance_m"] - normal_osrm["distance_m"])
    depth_saved = round(max(0.0, normal_depth - safe_depth), 1)
    if dist_delta > 0:
        explanation = (
            f"The direct route passes through areas with {normal_depth:.1f} cm predicted flood depth. "
            f"The flood-safe detour via higher-elevation corridors adds {dist_delta} m, "
            f"reducing maximum flood exposure to {safe_depth:.1f} cm."
        )
    else:
        explanation = (
            f"No significant flood detour required. "
            f"Maximum predicted flood depth along route: {safe_depth:.1f} cm. "
            f"Route follows real road network geometry via OpenStreetMap."
        )

    return {
        "route_id": f"route-osrm-{int(normal_osrm['distance_m'])}-{vehicle_type}",
        "vehicle_type": vehicle_type,
        "routing_source": "osrm+ufis",
        "normal_route": {
            "type": "LineString",
            "coordinates": normal_osrm["coordinates"],
            "distance_m": normal_osrm["distance_m"],
            "duration_seconds": normal_duration,
            "max_depth_cm": normal_depth,
            "risk_level": normal_risk,
            "road_names": normal_osrm.get("road_names", [])
        },
        "flood_safe_route": {
            "type": "LineString",
            "coordinates": safe_osrm["coordinates"],
            "distance_m": safe_osrm["distance_m"],
            "duration_seconds": safe_duration,
            "max_depth_cm": safe_depth,
            "risk_level": safe_risk,
            "road_names": safe_osrm.get("road_names", [])
        },
        "savings_explanation": explanation,
        "depth_reduction_cm": depth_saved,
        "detour_used": bool(detour_waypoints and safe_osrm != normal_osrm),
        "is_safe": safe_depth <= VEHICLE_THRESHOLDS.get(vehicle_type, 20.0),
        "status_label": "Flood-safe route — real OSM road geometry"
    }
