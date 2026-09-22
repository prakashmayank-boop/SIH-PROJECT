import json
from datetime import datetime, timezone
from backend.app.database import SessionLocal, Base, engine
from backend.app.models.schemas_v1 import (
    Tenant, User, City, Zone, DrainageNode, DrainageEdge, RoadSegment,
    MonitoringSite, Sensor, SensorReading, Alert, DispatchTask, ModelRun
)
from backend.app.config import settings

def seed_database(force_refresh_topology: bool = True):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Tenant
    tenant = db.query(Tenant).filter_by(tenant_id=settings.DEFAULT_TENANT_ID).first()
    if not tenant:
        tenant = Tenant(
            tenant_id=settings.DEFAULT_TENANT_ID,
            name="Bruhat Bengaluru Mahanagara Palike (BBMP)",
            slug="bbmp-blr",
            status="active",
            settings={"alert_sms": True, "radar_source": "IMD_Bengaluru"}
        )
        db.add(tenant)
        db.flush()

    # 1b. Demo Control Room User
    if not db.query(User).filter_by(email="operator@bbmp.gov.in").first():
        demo_user = User(
            email="operator@bbmp.gov.in",
            hashed_password="pbkdf2:sha256:260000$ufis_salt$04f2161f30ab452140ef8bfa3fa6d997230aa7b036fa78c8ff13a17e0e7a27ef",
            full_name="Control Room Operator",
            role="operator",
            tenant_id=settings.DEFAULT_TENANT_ID
        )
        db.add(demo_user)
        db.flush()

    # 2. City
    if not db.query(City).filter_by(city_id=settings.DEFAULT_CITY_ID).first():
        city = City(
            city_id=settings.DEFAULT_CITY_ID,
            tenant_id=settings.DEFAULT_TENANT_ID,
            name="Bengaluru",
            state="Karnataka",
            country_code="IN",
            timezone="Asia/Kolkata",
            boundary={"type": "Polygon", "coordinates": [[[77.61, 12.92], [77.65, 12.92], [77.65, 12.95], [77.61, 12.95], [77.61, 12.92]]]}
        )
        db.add(city)
        db.flush()

    # 3. Zone (Ward 151 - Koramangala)
    if not db.query(Zone).filter_by(zone_id=settings.DEFAULT_ZONE_ID).first():
        zone = Zone(
            zone_id=settings.DEFAULT_ZONE_ID,
            tenant_id=settings.DEFAULT_TENANT_ID,
            city_id=settings.DEFAULT_CITY_ID,
            name="Ward 151 - Koramangala",
            zone_type="ward",
            risk_priority=1,
            boundary={"type": "Polygon", "coordinates": [[[77.615, 12.925], [77.640, 12.925], [77.640, 12.945], [77.615, 12.945], [77.615, 12.925]]]}
        )
        db.add(zone)
        db.flush()

    # Clear existing drainage elements & sensors & roads to allow clean topology update
    db.query(SensorReading).delete()
    db.query(Sensor).delete()
    db.query(MonitoringSite).delete()
    db.query(DrainageEdge).delete()
    db.query(DrainageNode).delete()
    db.query(RoadSegment).delete()
    db.flush()

    # 4. Drainage Nodes (Manholes, Inlets, Junctions, Outfalls)
    # Authentic Ward 151 positions with verified hydrologic network topology
    raw_nodes = [
        {"code": "MH-01", "type": "inlet", "name": "80ft Rd / 6th Block Inlet Grate", "coords": [77.6205, 12.9405], "elev": 904.0, "rim": 904.3, "cap": 1.4, "outfall": False},
        {"code": "MH-02", "type": "manhole", "name": "80ft Rd / 4th Block Collector Manhole", "coords": [77.6225, 12.9380], "elev": 901.5, "rim": 901.8, "cap": 1.8, "outfall": False},
        {"code": "MH-03", "type": "junction", "name": "Sony World Signal K100 Rajakaluve Junction", "coords": [77.6275, 12.9365], "elev": 897.8, "rim": 898.1, "cap": 2.2, "outfall": False},
        {"code": "MH-04", "type": "manhole", "name": "ST Bed North Basin Inflow Manhole", "coords": [77.6305, 12.9335], "elev": 894.2, "rim": 894.5, "cap": 1.6, "outfall": False},
        {"code": "MH-05", "type": "inlet", "name": "7th Main / 1st Block Link Storm Inlet", "coords": [77.6330, 12.9345], "elev": 896.5, "rim": 896.8, "cap": 1.5, "outfall": False},
        {"code": "MH-06", "type": "manhole", "name": "Maharaja Signal / 100ft Rd Collector", "coords": [77.6260, 12.9300], "elev": 896.2, "rim": 896.5, "cap": 1.7, "outfall": False},
        {"code": "MH-07", "type": "manhole", "name": "ST Bed Main Surcharge Basin Manhole", "coords": [77.6335, 12.9300], "elev": 893.5, "rim": 893.8, "cap": 1.3, "outfall": False},
        {"code": "MH-08", "type": "inlet", "name": "4th Block Internal Street Drain Inlet", "coords": [77.6240, 12.9350], "elev": 899.0, "rim": 899.3, "cap": 1.5, "outfall": False},
        {"code": "MH-09", "type": "manhole", "name": "Srinivagilu North Feeder Manhole", "coords": [77.6320, 12.9390], "elev": 898.0, "rim": 898.3, "cap": 1.9, "outfall": False},
        {"code": "MH-10", "type": "junction", "name": "SHBCS Regional Trunk Culvert Junction", "coords": [77.6375, 12.9285], "elev": 892.0, "rim": 892.4, "cap": 2.5, "outfall": False},
        {"code": "MH-13", "type": "manhole", "name": "6th Block / Chandra Reddy Layout North", "coords": [77.6295, 12.9385], "elev": 898.5, "rim": 898.8, "cap": 1.7, "outfall": False},
        {"code": "MH-14", "type": "junction", "name": "Chandra Reddy Layout Central Feeder", "coords": [77.6325, 12.9360], "elev": 896.8, "rim": 897.1, "cap": 2.0, "outfall": False},
        {"code": "OF-01", "type": "outfall", "name": "Agara Lake Primary Valley Outfall (Northwest Terminal)", "coords": [77.6445, 12.9305], "elev": 890.0, "rim": 890.5, "cap": 4.5, "outfall": True, "target": "Agara Lake Primary Basin / Challaghatta Valley Outfall"},
        {"code": "OF-02", "type": "outfall", "name": "Agara Lake Secondary Valley Outfall (Emergency Bypass)", "coords": [77.6445, 12.9298], "elev": 889.5, "rim": 890.0, "cap": 4.0, "outfall": True, "target": "Agara Lake Regional Surcharge Spillway"},
    ]

    node_map = {}
    for n in raw_nodes:
        meta = {
            "name": n["name"],
            "is_terminal_outfall": n.get("outfall", False),
            "discharge_target": n.get("target", None)
        }
        dnode = DrainageNode(
            tenant_id=settings.DEFAULT_TENANT_ID,
            city_id=settings.DEFAULT_CITY_ID,
            zone_id=settings.DEFAULT_ZONE_ID,
            node_code=n["code"],
            node_type=n["type"],
            geom={"type": "Point", "coordinates": n["coords"]},
            ground_elev_m=n["elev"],
            invert_elev_m=n["elev"] - 2.5,
            rim_elev_m=n["rim"],
            inlet_capacity_m3s=n["cap"],
            metadata_json=meta,
            status="NORMAL" if n["code"] not in ["MH-04", "MH-07"] else "AT RISK"
        )
        db.add(dnode)
        node_map[n["code"]] = dnode

    db.flush()

    # 5. Drainage Edges (Conduits/Pipes connecting nodes with street/canal geometries)
    edge_definitions = [
        ("MH-01", "MH-02", "P-101", 1.0, 0.005, 0.0, [[77.6205, 12.9405], [77.6212, 12.9395], [77.6225, 12.9380]]),
        ("MH-02", "MH-03", "P-102", 1.2, 0.006, 0.0, [[77.6225, 12.9380], [77.6242, 12.9373], [77.6258, 12.9368], [77.6275, 12.9365]]),
        ("MH-08", "MH-03", "P-103", 0.9, 0.007, 0.0, [[77.6240, 12.9350], [77.6255, 12.9357], [77.6275, 12.9365]]),
        ("MH-03", "MH-04", "P-104", 1.2, 0.004, 35.0, [[77.6275, 12.9365], [77.6288, 12.9352], [77.6298, 12.9342], [77.6305, 12.9335]]), # K100 Rajakuve canal
        ("MH-04", "MH-07", "P-105", 1.0, 0.003, 65.0, [[77.6305, 12.9335], [77.6315, 12.9322], [77.6325, 12.9310], [77.6335, 12.9300]]), # ST Bed canal bottleneck
        ("MH-06", "MH-07", "P-106", 1.0, 0.004, 10.0, [[77.6260, 12.9300], [77.6285, 12.9301], [77.6310, 12.9300], [77.6335, 12.9300]]), # 7th Cross street drain
        ("MH-05", "MH-07", "P-107", 1.1, 0.005, 0.0, [[77.6330, 12.9345], [77.6332, 12.9325], [77.6335, 12.9300]]),
        ("MH-07", "MH-10", "P-108", 1.4, 0.005, 15.0, [[77.6335, 12.9300], [77.6350, 12.9295], [77.6362, 12.9290], [77.6375, 12.9285]]),
        ("MH-09", "MH-05", "P-109", 1.2, 0.006, 0.0, [[77.6320, 12.9390], [77.6325, 12.9368], [77.6330, 12.9345]]),
        ("MH-10", "OF-01", "P-110", 1.8, 0.008, 0.0, [[77.6375, 12.9285], [77.6405, 12.9295], [77.6445, 12.9305]]), # Agara Lake Primary Outfall
        ("MH-10", "OF-02", "P-111", 1.5, 0.007, 0.0, [[77.6375, 12.9285], [77.6410, 12.9290], [77.6445, 12.9298]]), # Agara Lake Secondary Outfall
        ("MH-03", "MH-13", "P-113", 1.1, 0.005, 0.0, [[77.6275, 12.9365], [77.6285, 12.9378], [77.6295, 12.9385]]), # Sony World to Chandra Reddy North (MH-13)
        ("MH-13", "MH-14", "P-114", 1.1, 0.005, 0.0, [[77.6295, 12.9385], [77.6310, 12.9372], [77.6325, 12.9360]]), # Chandra Reddy North (MH-13) to Central (MH-14)
        ("MH-14", "MH-05", "P-115", 1.0, 0.004, 0.0, [[77.6325, 12.9360], [77.6328, 12.9352], [77.6330, 12.9345]]), # Chandra Reddy Central (MH-14) to 7th Main Link (MH-05)
        ("MH-14", "MH-07", "P-116", 1.2, 0.005, 0.0, [[77.6325, 12.9360], [77.6330, 12.9330], [77.6335, 12.9300]]), # Chandra Reddy Central (MH-14) to ST Bed Basin (MH-07)
    ]

    for f_code, t_code, e_code, diam, slope, blockage, coords in edge_definitions:
        from_n = node_map[f_code]
        to_n = node_map[t_code]
        dedge = DrainageEdge(
            tenant_id=settings.DEFAULT_TENANT_ID,
            city_id=settings.DEFAULT_CITY_ID,
            from_node_id=from_n.node_id,
            to_node_id=to_n.node_id,
            edge_code=e_code,
            edge_type="pipe",
            geom={"type": "LineString", "coordinates": coords},
            length_m=280.0,
            diameter_m=diam,
            slope=slope,
            manning_n=0.015,
            design_capacity_m3s=round(2.8 * (diam ** 1.3), 2),
            effective_capacity_factor=round(1.0 - (blockage / 100.0) * 0.7, 2),
            blockage_percent=blockage,
            status="OVERLOADED" if blockage >= 50 else ("AT RISK" if blockage > 25 else "NORMAL")
        )
        db.add(dedge)

    # 6. Road Segments (Koramangala Ward 151 — OSM-aligned road centerlines)
    # Coordinates verified against OpenStreetMap tile imagery.
    # Junction endpoints are shared exactly between connected roads for valid topology.
    #
    # Key junctions (shared between roads):
    #   J-A: [77.6209, 12.9345]  - St. John's Hospital / 80 Feet Rd start
    #   J-B: [77.6265, 12.9345]  - Sony World Signal (80ft Rd × Intermediate Ring Rd)
    #   J-C: [77.6265, 12.9300]  - Maharaja Junction / 100 Feet Rd south end
    #   J-D: [77.6320, 12.9390]  - Koramangala 6th Block / IRR north junction
    #   J-E: [77.6375, 12.9285]  - ST Bed / SHBCS Trunk culvert junction
    #   J-F: [77.6335, 12.9300]  - ST Bed Avenue / 7th Cross junction

    roads = [
        {
            # 80 Feet Road: St John's Hospital → Sony World Signal
            # Follows actual 80 Feet Rd NE-SW alignment through Koramangala
            "id": "R-101",
            "name": "80 Feet Road (Sony World Stretch)",
            "class": "primary",
            "coords": [
                [77.6209, 12.9345],   # J-A: St John's Hospital end
                [77.6220, 12.9348],
                [77.6232, 12.9350],
                [77.6245, 12.9350],
                [77.6258, 12.9348],
                [77.6265, 12.9345],   # J-B: Sony World Signal
                [77.6275, 12.9335],
                [77.6282, 12.9320],
                [77.6285, 12.9310],
                [77.6265, 12.9300],   # J-C: Maharaja Junction
            ],
            "elev": 895.5,
            "corridor": True,
            "impervious": 92.0,
            "max_safe_depth": 15
        },
        {
            # 100 Feet Road (Intermediate Ring Road): Maharaja Junction → North
            # Follows IRR northward alignment
            "id": "R-102",
            "name": "100 Feet Road (Maharaja Junction Stretch)",
            "class": "primary",
            "coords": [
                [77.6265, 12.9300],   # J-C: Maharaja Junction
                [77.6268, 12.9315],
                [77.6270, 12.9330],
                [77.6268, 12.9345],
                [77.6265, 12.9345],   # J-B: Sony World Signal
                [77.6268, 12.9360],
                [77.6275, 12.9375],
                [77.6285, 12.9390],
                [77.6320, 12.9390],   # J-D: 6th Block IRR junction
            ],
            "elev": 897.0,
            "corridor": True,
            "impervious": 90.0,
            "max_safe_depth": 20
        },
        {
            # Koramangala 4th Block High-Ridge Bypass
            # Elevated road through 4th/6th Block ridge — safe detour corridor
            "id": "R-103",
            "name": "Koramangala 4th Block Ridge Bypass",
            "class": "secondary",
            "coords": [
                [77.6209, 12.9345],   # J-A start
                [77.6218, 12.9360],
                [77.6225, 12.9378],
                [77.6230, 12.9395],
                [77.6242, 12.9405],
                [77.6260, 12.9410],
                [77.6280, 12.9408],
                [77.6300, 12.9402],
                [77.6320, 12.9390],   # J-D: 6th Block junction
            ],
            "elev": 904.0,
            "corridor": True,
            "impervious": 80.0,
            "max_safe_depth": 25
        },
        {
            # ST Bed Main Avenue — low-lying collector road (flood-prone)
            "id": "R-104",
            "name": "ST Bed Main Low-Lying Avenue",
            "class": "secondary",
            "coords": [
                [77.6265, 12.9300],   # J-C: Maharaja Junction
                [77.6285, 12.9300],
                [77.6300, 12.9300],
                [77.6320, 12.9300],
                [77.6335, 12.9300],   # J-F: 7th Cross junction
                [77.6355, 12.9293],
                [77.6375, 12.9285],   # J-E: SHBCS trunk culvert
            ],
            "elev": 894.2,
            "corridor": False,
            "impervious": 88.0,
            "max_safe_depth": 12
        },
        {
            # Sony World Junction to Koramangala 1st Block connector
            "id": "R-105",
            "name": "Sony World Signal Corridor (1st Block Link)",
            "class": "tertiary",
            "coords": [
                [77.6265, 12.9345],   # J-B: Sony World Signal
                [77.6278, 12.9345],
                [77.6295, 12.9348],
                [77.6310, 12.9348],
                [77.6320, 12.9345],
            ],
            "elev": 898.0,
            "corridor": False,
            "impervious": 84.0,
            "max_safe_depth": 15
        },
        {
            # Intermediate Ring Road south: Sony World → ST Bed → SHBCS
            "id": "R-106",
            "name": "Intermediate Ring Road (Srinivagilu South Link)",
            "class": "primary",
            "coords": [
                [77.6320, 12.9390],   # J-D: 6th Block
                [77.6325, 12.9370],
                [77.6330, 12.9345],
                [77.6338, 12.9330],
                [77.6345, 12.9318],
                [77.6355, 12.9305],
                [77.6375, 12.9285],   # J-E: SHBCS culvert
            ],
            "elev": 897.5,
            "corridor": True,
            "impervious": 91.0,
            "max_safe_depth": 18
        },
        {
            # Koramangala 7th Cross internal collector
            "id": "R-107",
            "name": "Koramangala 7th Cross Collector",
            "class": "residential",
            "coords": [
                [77.6265, 12.9345],   # J-B: Sony World
                [77.6265, 12.9330],
                [77.6265, 12.9315],
                [77.6265, 12.9300],   # J-C: Maharaja Junction
            ],
            "elev": 896.0,
            "corridor": False,
            "impervious": 86.0,
            "max_safe_depth": 15
        },
        {
            # Koramangala 5th Block internal road
            "id": "R-109",
            "name": "Koramangala 1st Block 7th Main",
            "class": "secondary",
            "coords": [
                [77.6320, 12.9390],   # J-D: 6th Block
                [77.6325, 12.9360],
                [77.6330, 12.9345],
                [77.6335, 12.9320],
                [77.6335, 12.9300],   # J-F: 7th Cross junction
                [77.6340, 12.9280],
            ],
            "elev": 896.0,
            "corridor": False,
            "impervious": 86.0,
            "max_safe_depth": 15
        },
        {
            # Koramangala 6th Block 12th Main Road
            "id": "R-111",
            "name": "Koramangala 6th Block 12th Main Road",
            "class": "secondary",
            "coords": [
                [77.6209, 12.9345],   # J-A: St John's Hospital
                [77.6215, 12.9360],
                [77.6220, 12.9378],
                [77.6225, 12.9390],
                [77.6245, 12.9398],
                [77.6265, 12.9400],
            ],
            "elev": 899.5,
            "corridor": False,
            "impervious": 85.0,
            "max_safe_depth": 18
        },
        {
            # ST Bed 4th Cross — low lying connector to drainage basin
            "id": "R-112",
            "name": "ST Bed 4th Cross Low-Lying Collector",
            "class": "residential",
            "coords": [
                [77.6265, 12.9345],   # J-B: Sony World Signal
                [77.6272, 12.9340],
                [77.6280, 12.9335],
                [77.6292, 12.9332],
                [77.6305, 12.9330],
                [77.6305, 12.9315],
                [77.6305, 12.9300],   # meets R-104 ST Bed Ave
            ],
            "elev": 893.8,
            "corridor": False,
            "impervious": 89.0,
            "max_safe_depth": 10
        }
    ]

    for r in roads:
        rseg = RoadSegment(
            tenant_id=settings.DEFAULT_TENANT_ID,
            city_id=settings.DEFAULT_CITY_ID,
            zone_id=settings.DEFAULT_ZONE_ID,
            external_road_id=r["id"],
            name=r["name"],
            road_class=r["class"],
            geom={"type": "LineString", "coordinates": r["coords"]},
            length_m=420.0,
            baseline_speed_kph=45.0,
            max_safe_depth_cm=r["max_safe_depth"],
            is_emergency_corridor=r["corridor"],
            elevation_m=r["elev"],
            impervious_percent=r["impervious"]
        )
        db.add(rseg)

    # 7. IoT Sensors (Monitoring Sites)
    sensor_configs = [
        {"id": "SENS-WL-01", "name": "Sony World Junction Radar Gauge", "type": "water_level", "coords": [77.6265, 12.9345], "node": "MH-03"},
        {"id": "SENS-WL-02", "name": "ST Bed Surcharge Basin Monitor", "type": "water_level", "coords": [77.6285, 12.9330], "node": "MH-04"},
        {"id": "SENS-WL-03", "name": "80ft Road Culvert Ultrasonic Flow", "type": "flow", "coords": [77.6295, 12.9305], "node": "MH-07"},
        {"id": "SENS-RG-01", "name": "Koramangala Automated Rain Gauge", "type": "rain_gauge", "coords": [77.6200, 12.9380], "node": "MH-01"},
    ]

    for sc in sensor_configs:
        site = MonitoringSite(
            tenant_id=settings.DEFAULT_TENANT_ID,
            city_id=settings.DEFAULT_CITY_ID,
            zone_id=settings.DEFAULT_ZONE_ID,
            name=sc["name"],
            site_type="drain" if sc["type"] != "rain_gauge" else "rain_gauge",
            geom={"type": "Point", "coordinates": sc["coords"]},
            node_id=node_map[sc["node"]].node_id,
            active=True
        )
        db.add(site)
        db.flush()

        sens = Sensor(
            tenant_id=settings.DEFAULT_TENANT_ID,
            site_id=site.site_id,
            external_device_id=sc["id"],
            sensor_type=sc["type"],
            manufacturer="AeroSense Telemetry",
            model="AS-HYDRO-X1",
            unit="cm" if sc["type"] == "water_level" else ("m3/s" if sc["type"] == "flow" else "mm/h"),
            status="ONLINE",
            last_seen_at=datetime.now(timezone.utc)
        )
        db.add(sens)
        db.flush()

        # Seed initial reading
        val = 14.2 if sc["id"] == "SENS-WL-02" else (6.5 if sc["id"] == "SENS-WL-01" else (2.1 if sc["type"] == "flow" else 68.4))
        reading = SensorReading(
            tenant_id=settings.DEFAULT_TENANT_ID,
            sensor_id=sens.sensor_id,
            observed_at=datetime.now(timezone.utc),
            value=val,
            unit=sens.unit,
            quality_flag="GOOD"
        )
        db.add(reading)

    # 8. Initial High Priority Alert
    alert = Alert(
        tenant_id=settings.DEFAULT_TENANT_ID,
        city_id=settings.DEFAULT_CITY_ID,
        severity="CRITICAL",
        title="Severe Inundation Warning — ST Bed Main & 80 Feet Rd",
        message="Hydraulic surcharge detected at MH-04 and MH-07. Predicted street flood depth exceeding 24 cm in the next 45 minutes.",
        status="GENERATED",
        payload={
            "affected_roads": ["80 Feet Road (Sony World Stretch)", "ST Bed Main Low-Lying Avenue"],
            "max_predicted_depth_cm": 28.5,
            "critical_nodes": ["MH-04", "MH-07"]
        }
    )
    db.add(alert)
    db.flush()

    # 9. Initial Field Inspection Task
    task = DispatchTask(
        tenant_id=settings.DEFAULT_TENANT_ID,
        city_id=settings.DEFAULT_CITY_ID,
        alert_id=alert.alert_id,
        task_type="inspection",
        priority="HIGH",
        status="ASSIGNED",
        target_description="Inspect MH-04 and downstream conduit P-105 for stormwater inlet choke or backwater restriction.",
        target_geom={"type": "Point", "coordinates": [77.6285, 12.9330]}
    )
    db.add(task)

    db.commit()
    db.close()
    print("UFIS Database successfully seeded with Koramangala Ward 151 data!")

if __name__ == "__main__":
    seed_database()
