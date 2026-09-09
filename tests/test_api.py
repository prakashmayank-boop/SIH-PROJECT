import sys
import os
from fastapi.testclient import TestClient

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    print("[PASS] Health check passed")

def test_flood_forecast():
    res = client.get("/api/v1/flood-forecast?horizon=+1h")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0
    print(f"[PASS] Flood forecast passed with {len(data['features'])} road features")

def test_drainage_status():
    res = client.get("/api/v1/drainage/status?horizon=NOW")
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "Predicted hydraulic stress detected" in data["summary"]["notice"]
    print(f"[PASS] Drainage status passed: {data['summary']['total_nodes']} nodes, notice checked")

def test_safe_routing():
    # Route from St. John's Hospital area to Koramangala 6th block
    body = {
        "start": [12.9365, 77.6230],
        "end": [12.9280, 77.6330],
        "vehicle_type": "ambulance",
        "horizon_step": "+1h"
    }
    res = client.post("/api/v1/route/safe", json=body)
    assert res.status_code == 200
    data = res.json()
    assert "flood_safe_route" in data
    assert "normal_route" in data
    assert data["status_label"] == "Lowest predicted flood-risk route"
    print("[PASS] Safe routing passed with lowest predicted flood-risk route verification")

def test_alerts_lifecycle():
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) > 0
    alert_id = alerts[0]["alert_id"]
    
    # Acknowledge alert
    patch_res = client.patch(f"/api/v1/alerts/{alert_id}/status", json={
        "status": "ACKNOWLEDGED",
        "acknowledged_by": "Emergency Operator"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "ACKNOWLEDGED"
    print("[PASS] Alert lifecycle acknowledgment passed")

def test_explainability_and_confidence():
    # Test NOW horizon
    res_now = client.get("/api/v1/flood-forecast?horizon=NOW")
    assert res_now.status_code == 200
    data_now = res_now.json()
    first_road_now = data_now["features"][0]["properties"]
    assert "feature_attributions" in first_road_now
    assert isinstance(first_road_now["feature_attributions"], dict)
    assert len(first_road_now["feature_attributions"]) > 0
    assert "risk_primary_cause" in first_road_now
    assert len(first_road_now["risk_primary_cause"]) > 0
    assert "elevation_amsl" in first_road_now
    assert first_road_now["elevation_amsl"] > 0
    
    # Test confidence decay from NOW to +3h
    res_3h = client.get("/api/v1/flood-forecast?horizon=+3h")
    assert res_3h.status_code == 200
    first_road_3h = res_3h.json()["features"][0]["properties"]
    assert first_road_now["confidence"] > first_road_3h["confidence"]

    # Test summary confidence score decay
    sum_now = client.get("/api/v1/forecast/summary?horizon=NOW").json()
    sum_3h = client.get("/api/v1/forecast/summary?horizon=+3h").json()
    assert sum_now["confidence_score"] > sum_3h["confidence_score"]
    print("[PASS] Explainability attributes, primary cause, elevation AMSL, and confidence decay verified")

def test_what_if_scenario():
    # Test switching to custom scenario
    body = {
        "scenario_id": "custom",
        "custom_rainfall_mmph": 140.0
    }
    res = client.post("/api/v1/simulation/scenario", json=body)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["base_intensity_mmph"] == 140.0

    # Verify forecast reflects custom intensity
    f_res = client.get("/api/v1/flood-forecast?horizon=NOW")
    assert f_res.status_code == 200
    assert f_res.json()["rainfall"]["intensity_mmph"] == 140.0

    # Reset back to monsoon_65
    reset_res = client.post("/api/v1/simulation/scenario", json={"scenario_id": "monsoon_65"})
    assert reset_res.status_code == 200
    print("[PASS] What-If simulation scenario switching and map live query verified")

def test_edge_blockage_mutation():
    # Update blockage for P-105 (MH-04 -> MH-07)
    res = client.patch("/api/v1/drainage/edges/P-105/blockage", json={"blockage_percent": 75.0})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["blockage_percent"] == 75.0
    assert data["status_label"] == "CRITICAL"

    # Verify drainage status reflects new blockage
    drain_res = client.get("/api/v1/drainage/status?horizon=NOW")
    assert drain_res.status_code == 200
    p105 = next(e for e in drain_res.json()["edges"] if e["edge_code"] == "P-105")
    assert p105["blockage_percent"] == 75.0
    assert p105["status"] == "CRITICAL"

    # Reset blockage back to 50.0
    client.patch("/api/v1/drainage/edges/P-105/blockage", json={"blockage_percent": 50.0})
    print("[PASS] Dynamic conduit blockage mutation and hydraulic impact verified")

def test_historical_replay():
    res = client.get("/api/v1/replay/EVT-KOR-2024-0905")
    assert res.status_code == 200
    data = res.json()
    assert data["lead_time_minutes"] == 75
    assert data["lead_time_minutes"] >= 60
    print(f"[PASS] Historical replay lead time verification passed ({data['lead_time_minutes']} min)")

def test_sms_alerts_broadcast():
    payload = {
        "recipient_group": "all_citizens",
        "affected_roads": ["80 Feet Road", "100 Feet Road"],
        "max_depth_cm": 42.5,
        "critical_nodes": ["MH-07", "MH-04"],
        "custom_phone": "+919876543210"
    }
    res = client.post("/api/v1/alerts/broadcast-sms", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["recipients_count"] > 0
    assert "80 Feet Road" in data["preview_text"]
    assert "1533" in data["preview_text"]

    logs_res = client.get("/api/v1/alerts/sms-logs")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) > 0
    print(f"[PASS] SMS broadcast and carrier audit log verified ({data['recipients_count']} recipients dispatched)")

if __name__ == "__main__":
    test_health()
    test_flood_forecast()
    test_explainability_and_confidence()
    test_what_if_scenario()
    test_edge_blockage_mutation()
    test_drainage_status()
    test_safe_routing()
    test_alerts_lifecycle()
    test_historical_replay()
    test_sms_alerts_broadcast()
    print("\nALL BACKEND API AND MODEL TESTS PASSED SUCCESSFULLY!")


