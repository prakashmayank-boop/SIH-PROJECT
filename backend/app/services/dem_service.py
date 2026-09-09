"""
DEM (Digital Elevation Model) Service
--------------------------------------
Provides real elevation lookups from SRTM / Copernicus 30m DEM raster.
Falls back gracefully to hardcoded reference elevations when no DEM file is available.

Usage:
    from backend.app.services.dem_service import dem_service
    
    elev = dem_service.get_elevation(12.9345, 77.6265)   # returns metres AMSL
    elevs = dem_service.get_elevations([(12.93, 77.62), (12.94, 77.63)])
"""
import os
import logging
from typing import Optional, List, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# Path to the GeoTIFF DEM file
DEM_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "dem")
DEM_FILE = os.path.join(DEM_DIR, "koramangala_dem.tif")

# Fallback hardcoded elevations for the Koramangala pilot zone
# (used when DEM raster is not available)
FALLBACK_ELEVATIONS = {
    # lat, lon → elevation (m AMSL), based on known survey points
    "default": 898.0,
    "ridge":   904.0,
    "valley":  890.0,
}


class DEMService:
    """Manages DEM raster loading and elevation point queries."""

    def __init__(self):
        self._dataset = None
        self._data: Optional[np.ndarray] = None
        self._transform = None
        self._loaded = False
        self._load_dem()

    def _load_dem(self):
        """Attempt to load the DEM GeoTIFF. Silently degrades if unavailable."""
        if not os.path.exists(DEM_FILE):
            logger.warning(
                f"DEM file not found at {DEM_FILE}. "
                "Using fallback elevation model. "
                "Run 'python -m backend.scripts.download_dem' to fetch real DEM."
            )
            return

        try:
            import rasterio
            self._dataset = rasterio.open(DEM_FILE)
            self._data = self._dataset.read(1)  # Band 1
            self._transform = self._dataset.transform
            self._loaded = True
            logger.info(
                f"DEM loaded: {DEM_FILE} "
                f"({self._data.shape[1]}x{self._data.shape[0]}, "
                f"CRS={self._dataset.crs})"
            )
        except ImportError:
            logger.warning("rasterio not installed. Using fallback elevation model.")
        except Exception as e:
            logger.error(f"Failed to load DEM: {e}. Using fallback elevation model.")

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def get_elevation(self, lat: float, lon: float) -> float:
        """
        Query elevation at a single (lat, lon) coordinate.
        Returns elevation in metres AMSL.
        """
        if not self._loaded:
            return self._fallback_elevation(lat, lon)

        try:
            # Convert geographic coords to pixel coords
            col, row = ~self._transform * (lon, lat)
            row, col = int(round(row)), int(round(col))

            # Bounds check
            if 0 <= row < self._data.shape[0] and 0 <= col < self._data.shape[1]:
                value = float(self._data[row, col])
                # SRTM uses -32768 for void/nodata
                if value <= -32768 or value > 9000:
                    return self._fallback_elevation(lat, lon)
                return value
            else:
                return self._fallback_elevation(lat, lon)
        except Exception:
            return self._fallback_elevation(lat, lon)

    def get_elevations(self, coords: List[Tuple[float, float]]) -> List[float]:
        """
        Batch elevation query for multiple (lat, lon) pairs.
        Vectorised for performance when DEM is loaded.
        """
        if not self._loaded:
            return [self._fallback_elevation(lat, lon) for lat, lon in coords]

        try:
            lats = np.array([c[0] for c in coords])
            lons = np.array([c[1] for c in coords])

            # Inverse transform: (lon, lat) -> (col, row)
            cols, rows = ~self._transform * (lons, lats)
            rows = np.round(rows).astype(int)
            cols = np.round(cols).astype(int)

            results = []
            h, w = self._data.shape
            for r, c, (lat, lon) in zip(rows, cols, coords):
                if 0 <= r < h and 0 <= c < w:
                    v = float(self._data[r, c])
                    results.append(v if -500 < v < 9000 else self._fallback_elevation(lat, lon))
                else:
                    results.append(self._fallback_elevation(lat, lon))
            return results
        except Exception:
            return [self._fallback_elevation(lat, lon) for lat, lon in coords]

    def _fallback_elevation(self, lat: float, lon: float) -> float:
        """
        Heuristic elevation for Koramangala area when no DEM raster is available.
        Uses a simple linear gradient model based on known survey data:
        - Ridge (NW): ~904 m at (12.9400, 77.6200)
        - Valley (SE): ~890 m at (12.9280, 77.6340)
        """
        # Simple linear interpolation along the NW-SE gradient
        # Koramangala slopes from ~904m in the northwest to ~890m in the southeast
        lat_ref, lon_ref = 12.9400, 77.6200
        dlat = lat - lat_ref
        dlon = lon - lon_ref
        # Approximate gradient: -100 m/deg lat (northward = higher), -80 m/deg lon (westward = higher)
        elev = 904.0 + (dlat * 100.0) - (dlon * 80.0)
        return max(885.0, min(910.0, elev))

    def get_stats(self) -> dict:
        """Return DEM metadata for the /health or /settings endpoint."""
        if not self._loaded:
            return {
                "status": "fallback",
                "source": "heuristic_model",
                "resolution": "N/A",
                "message": "No DEM raster loaded. Run download_dem.py to fetch SRTM data."
            }
        return {
            "status": "loaded",
            "source": os.path.basename(DEM_FILE),
            "crs": str(self._dataset.crs),
            "resolution_arcsec": round(abs(self._transform.a) * 3600, 1),
            "shape": f"{self._data.shape[1]}x{self._data.shape[0]}",
            "bounds": {
                "west": self._dataset.bounds.left,
                "south": self._dataset.bounds.bottom,
                "east": self._dataset.bounds.right,
                "north": self._dataset.bounds.top,
            }
        }

    def close(self):
        if self._dataset:
            self._dataset.close()


# Singleton instance
dem_service = DEMService()
