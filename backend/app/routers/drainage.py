from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.schemas_v1 import DrainageNode, DrainageEdge
from backend.app.schemas.pydantic_models import EdgeBlockageUpdate
from backend.app.services.hydraulic_engine import calculate_hydraulic_state

router = APIRouter(prefix="/api/v1/drainage", tags=["Drainage"])

def normalize_horizon(h: str) -> str:
    h = (h or "NOW").strip()
    if h == "NOW" or h.startswith("+"):
        return h
    return "+" + h

@router.get("/status")
def get_drainage_status(
    horizon: str = Query("NOW", description="NOW, +30m, +1h, +2h, +3h"),
    db: Session = Depends(get_db)
):
    horizon = normalize_horizon(horizon)
    nodes = db.query(DrainageNode).all()
    edges = db.query(DrainageEdge).all()

    hydraulic_state = calculate_hydraulic_state(nodes, edges, horizon_step=horizon)
    nodes_data = list(hydraulic_state["nodes"].values())
    edges_data = hydraulic_state["edges"]

    total_nodes = len(nodes_data)
    normal_count = sum(1 for n in nodes_data if n["status"] == "NORMAL")
    at_risk_count = sum(1 for n in nodes_data if n["status"] == "AT RISK")
    critical_count = sum(1 for n in nodes_data if n["status"] in ["OVERLOADED", "CRITICAL"])

    return {
        "summary": {
            "total_nodes": total_nodes,
            "normal": normal_count,
            "at_risk": at_risk_count,
            "critical": critical_count,
            "notice": "Predicted hydraulic stress detected based on hydrodynamic inflow analysis. Field verification required to confirm physical silt/blockage condition."
        },
        "nodes": nodes_data,
        "edges": edges_data
    }

@router.get("/nodes/{node_id}")
def get_drainage_node_detail(
    node_id: str,
    horizon: str = Query("NOW"),
    db: Session = Depends(get_db)
):
    node = db.query(DrainageNode).filter(
        (DrainageNode.node_id == node_id) | (DrainageNode.node_code == node_id)
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Drainage node not found")

    nodes = db.query(DrainageNode).all()
    edges = db.query(DrainageEdge).all()
    state = calculate_hydraulic_state(nodes, edges, horizon_step=horizon)
    node_info = state["nodes"].get(node.node_code, {})

    return {
        "node_id": node.node_id,
        "node_code": node.node_code,
        "node_type": node.node_type,
        "ground_elev_m": node.ground_elev_m,
        "invert_elev_m": node.invert_elev_m,
        "rim_elev_m": node.rim_elev_m,
        "coordinates": node.geom["coordinates"],
        "predicted_inflow_m3s": node_info.get("predicted_inflow_m3s", 1.2),
        "inlet_capacity_m3s": node.inlet_capacity_m3s,
        "stress_ratio": node_info.get("stress_ratio", 1.1),
        "predicted_overflow_m3s": node_info.get("predicted_overflow_m3s", 0.0),
        "status": node_info.get("status", "NORMAL"),
        "hydraulic_stress_label": "Predicted hydraulic stress detected" if node_info.get("status") in ["OVERLOADED", "CRITICAL"] else "Nominal hydraulic flow",
        "confidence": node_info.get("confidence", 0.9)
    }

@router.patch("/edges/{edge_id}/blockage")
def update_edge_blockage(
    edge_id: str,
    req: EdgeBlockageUpdate,
    db: Session = Depends(get_db)
):
    edge = db.query(DrainageEdge).filter(
        (DrainageEdge.edge_id == edge_id) | (DrainageEdge.edge_code == edge_id)
    ).first()
    if not edge:
        clean = edge_id.replace("→", "->")
        if "->" in clean:
            from_c, to_c = [x.strip() for x in clean.split("->", 1)]
            from_node = db.query(DrainageNode).filter(DrainageNode.node_code == from_c).first()
            to_node = db.query(DrainageNode).filter(DrainageNode.node_code == to_c).first()
            if from_node and to_node:
                edge = db.query(DrainageEdge).filter(
                    ((DrainageEdge.from_node_id == from_node.node_id) & (DrainageEdge.to_node_id == to_node.node_id)) |
                    ((DrainageEdge.from_node_id == to_node.node_id) & (DrainageEdge.to_node_id == from_node.node_id))
                ).first()
    if not edge:
        raise HTTPException(status_code=404, detail="Drainage conduit edge not found")

    edge.blockage_percent = max(0.0, min(100.0, req.blockage_percent))
    edge.effective_capacity_factor = round(max(0.1, 1.0 - (edge.blockage_percent / 100.0) * 0.7), 2)
    edge.status = "CRITICAL" if edge.blockage_percent >= 70 else ("OVERLOADED" if edge.blockage_percent >= 50 else ("AT RISK" if edge.blockage_percent > 25 else "NORMAL"))
    db.commit()
    db.refresh(edge)
    return {
        "status": "success",
        "edge_id": edge.edge_id,
        "edge_code": edge.edge_code,
        "blockage_percent": edge.blockage_percent,
        "effective_capacity_factor": edge.effective_capacity_factor,
        "effective_capacity_m3s": round(edge.design_capacity_m3s * edge.effective_capacity_factor, 2),
        "status_label": edge.status
    }
