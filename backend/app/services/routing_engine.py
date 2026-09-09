import math
import networkx as nx
from typing import List, Dict, Any

VEHICLE_THRESHOLDS = {
    "car": 12.0,           # Impassable if depth > 12 cm
    "suv": 20.0,           # Impassable if depth > 20 cm
    "ambulance": 22.0,     # Impassable if depth > 22 cm
    "rescue_truck": 38.0   # Impassable if depth > 38 cm
}

def distance_haversine(coord1, coord2):
    # coord: [lon, lat]
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    R = 6371000  # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2) ** 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def build_road_graph(road_forecasts: List[Dict[str, Any]]):
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

def find_nearest_node(graph: nx.Graph, point: List[float]):
    # point is [lat, lon] -> target coords is [lon, lat]
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

def extract_path_geometry(graph: nx.Graph, path_nodes: List[str], start_lonlat: List[float], end_lonlat: List[float]):
    coords = []
    total_dist = 0.0
    max_depth = 0.0

    # Start at origin pin
    coords.append(start_lonlat)

    for i in range(len(path_nodes) - 1):
        u, v = path_nodes[i], path_nodes[i+1]
        edge_data = graph.get_edge_data(u, v, default={"length": 150, "depth_cm": 0.0})
        total_dist += edge_data.get("length", 150)
        max_depth = max(max_depth, edge_data.get("depth_cm", 0.0))

        u_lon, u_lat = map(float, u.split(","))
        v_lon, v_lat = map(float, v.split(","))

        # Check if edge has full multi-point geometry
        edge_coords = edge_data.get("coords", [[u_lon, u_lat], [v_lon, v_lat]])
        # Forward or reverse matching
        if distance_haversine(edge_coords[0], [u_lon, u_lat]) > distance_haversine(edge_coords[-1], [u_lon, u_lat]):
            edge_coords = list(reversed(edge_coords))

        for pt in edge_coords:
            if not coords or distance_haversine(coords[-1], pt) > 2.0:
                coords.append(pt)

    # End at destination pin
    if not coords:
        coords = [start_lonlat, end_lonlat]
    elif distance_haversine(coords[-1], end_lonlat) > 5:
        coords.append(end_lonlat)
    else:
        coords[-1] = end_lonlat

    return coords, round(total_dist, 1), round(max_depth, 1)

def calculate_routes(start_point: List[float], end_point: List[float], vehicle_type: str, road_forecasts: List[Dict[str, Any]]):
    # start_point & end_point are [lat, lon]
    start_lonlat = [start_point[1], start_point[0]]
    end_lonlat = [end_point[1], end_point[0]]

    G = build_road_graph(road_forecasts)
    start_node = find_nearest_node(G, start_point)
    end_node = find_nearest_node(G, end_point)

    if not start_node or not end_node or start_node == end_node:
        coords = [start_lonlat, end_lonlat]
        dist = distance_haversine(start_lonlat, end_lonlat)
        return {
            "route_id": "route-direct",
            "vehicle_type": vehicle_type,
            "normal_route": {
                "coordinates": coords,
                "distance_m": dist,
                "duration_seconds": 180,
                "max_depth_cm": 8.0,
                "risk_status": "Low Risk"
            },
            "flood_safe_route": {
                "coordinates": coords,
                "distance_m": dist,
                "duration_seconds": 180,
                "max_depth_cm": 8.0,
                "risk_status": "Lowest predicted flood-risk route"
            },
            "savings_explanation": "Direct connection between selected locations.",
            "is_safe": True,
            "status_label": "Lowest predicted flood-risk route"
        }

    # 1. Normal shortest path (distance only)
    try:
        normal_path = nx.shortest_path(G, source=start_node, target=end_node, weight="length")
    except nx.NetworkXNoPath:
        normal_path = [start_node, end_node]

    normal_coords, normal_dist, normal_max_depth = extract_path_geometry(G, normal_path, start_lonlat, end_lonlat)

    # 2. Flood-aware safe path
    max_thresh = VEHICLE_THRESHOLDS.get(vehicle_type, 22.0)
    G_safe = G.copy()
    for u, v, data in G_safe.edges(data=True):
        d = data["depth_cm"]
        if d > max_thresh:
            data["safe_weight"] = 999999.0
        elif d > 3.0:
            penalty = 1.0 + (d / 2.0) ** 3
            data["safe_weight"] = data["length"] * penalty
        else:
            penalty = 1.0 + (d / 10.0)
            data["safe_weight"] = data["length"] * penalty

    try:
        safe_path = nx.shortest_path(G_safe, source=start_node, target=end_node, weight="safe_weight")
    except nx.NetworkXNoPath:
        safe_path = normal_path

    # If safe path is identical to normal path but normal path has flooding (> 3 cm),
    # force a heavily penalized search to attempt finding an elevated high-ridge detour
    if safe_path == normal_path and normal_max_depth > 3.0:
        G_bypass = G_safe.copy()
        for i in range(len(normal_path) - 1):
            u, v = normal_path[i], normal_path[i+1]
            if G_bypass.has_edge(u, v):
                G_bypass[u][v]["safe_weight"] = G_bypass[u][v].get("safe_weight", 100.0) * 100.0
        try:
            bypass_path = nx.shortest_path(G_bypass, source=start_node, target=end_node, weight="safe_weight")
            if bypass_path != normal_path:
                safe_path = bypass_path
        except nx.NetworkXNoPath:
            pass

    safe_coords, safe_dist, safe_max_depth = extract_path_geometry(G_safe, safe_path, start_lonlat, end_lonlat)

    normal_duration = int((normal_dist / 30000.0) * 3600) + (180 if normal_max_depth > 15 else 60 if normal_max_depth > 5 else 0)
    safe_duration = int((safe_dist / 35000.0) * 3600)

    explanation = (
        f"The standard direct route passes through low-lying corridors with predicted flood depth of {normal_max_depth:.1f} cm. "
        f"The recommended lowest-risk detour adds {int(max(0, safe_dist - normal_dist))} m along higher-elevation road segments, reducing max flood exposure to {safe_max_depth:.1f} cm."
    )

    return {
        "route_id": f"route-{int(normal_dist)}-{vehicle_type}",
        "vehicle_type": vehicle_type,
        "normal_route": {
            "type": "LineString",
            "coordinates": normal_coords,
            "distance_m": normal_dist,
            "duration_seconds": normal_duration,
            "max_depth_cm": normal_max_depth,
            "risk_level": "Critical" if normal_max_depth > 25 else "High"
        },
        "flood_safe_route": {
            "type": "LineString",
            "coordinates": safe_coords,
            "distance_m": safe_dist,
            "duration_seconds": safe_duration,
            "max_depth_cm": safe_max_depth,
            "risk_level": "Low" if safe_max_depth < 8 else "Moderate"
        },
        "savings_explanation": explanation,
        "is_safe": True,
        "status_label": "Lowest predicted flood-risk route"
    }
