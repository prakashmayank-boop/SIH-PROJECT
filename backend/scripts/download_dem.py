"""
Download SRTM 30m DEM tile covering Bengaluru (N12 E077).
Source: NASA SRTM via OpenTopography or USGS EarthExplorer mirror.

The SRTM tile naming convention: N12E077.hgt covers latitudes 12–13°N, longitudes 77–78°E,
which fully encloses the Koramangala Ward 151 pilot zone (12.93°N, 77.62°E).
"""
import os
import sys
import zipfile
import requests

# Copernicus GLO-30 DEM (free, no auth required)
# Falls back to SRTM GL1 via OpenTopography if Copernicus is unavailable.
TILE_NAME = "Copernicus_DSM_COG_10_N12_00_E077_00_DEM"
COPERNICUS_URL = (
    f"https://prism-dem-open.copernicus.eu/pd-desk-open-access/prismDownload/"
    f"{TILE_NAME}.tif"
)

# Alternative: SRTM 1-arc-second from a public mirror
SRTM_URL = "https://elevation-tiles-prod.s3.amazonaws.com/skadi/N12/N12E077.hgt.gz"

DEST_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "dem")
DEST_FILE = os.path.join(DEST_DIR, "koramangala_dem.tif")
SRTM_HGT = os.path.join(DEST_DIR, "N12E077.hgt")


def download_srtm():
    """Download SRTM .hgt.gz and convert to GeoTIFF using rasterio."""
    import gzip
    import numpy as np

    print(f"Downloading SRTM tile from {SRTM_URL} ...")
    resp = requests.get(SRTM_URL, stream=True, timeout=120)
    resp.raise_for_status()

    gz_path = SRTM_HGT + ".gz"
    with open(gz_path, "wb") as f:
        for chunk in resp.iter_content(8192):
            f.write(chunk)
    print(f"  Saved compressed tile: {gz_path}")

    # Decompress
    with gzip.open(gz_path, "rb") as gz, open(SRTM_HGT, "wb") as out:
        out.write(gz.read())
    os.remove(gz_path)
    print(f"  Decompressed to: {SRTM_HGT}")

    # Convert HGT -> GeoTIFF
    import rasterio
    from rasterio.transform import from_bounds

    # SRTM 1-arc-second: 3601 x 3601 signed 16-bit big-endian
    data = np.fromfile(SRTM_HGT, dtype=">i2").reshape((3601, 3601))
    transform = from_bounds(77.0, 12.0, 78.0, 13.0, 3601, 3601)

    with rasterio.open(
        DEST_FILE,
        "w",
        driver="GTiff",
        height=3601,
        width=3601,
        count=1,
        dtype="int16",
        crs="EPSG:4326",
        transform=transform,
        compress="deflate",
    ) as dst:
        dst.write(data, 1)

    os.remove(SRTM_HGT)
    print(f"  Converted to GeoTIFF: {DEST_FILE}")
    return DEST_FILE


def download_copernicus():
    """Try Copernicus DEM first (single GeoTIFF, no conversion needed)."""
    print(f"Attempting Copernicus GLO-30 DEM download ...")
    try:
        resp = requests.get(COPERNICUS_URL, stream=True, timeout=30)
        resp.raise_for_status()
        with open(DEST_FILE, "wb") as f:
            for chunk in resp.iter_content(8192):
                f.write(chunk)
        print(f"  Saved: {DEST_FILE}")
        return DEST_FILE
    except Exception as e:
        print(f"  Copernicus download failed ({e}), falling back to SRTM.")
        return None


def main():
    os.makedirs(DEST_DIR, exist_ok=True)

    if os.path.exists(DEST_FILE):
        print(f"DEM already exists: {DEST_FILE}")
        return

    # Try Copernicus first, then SRTM
    result = download_copernicus()
    if not result:
        result = download_srtm()

    print(f"\n✅ DEM ready at: {result}")
    print(f"   CRS: EPSG:4326")
    print(f"   Coverage: N12–N13, E077–E078 (covers all of Bengaluru)")


if __name__ == "__main__":
    main()
