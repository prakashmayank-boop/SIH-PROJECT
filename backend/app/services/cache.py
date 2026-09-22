import time
from typing import Any, Optional, Dict, Tuple
import threading

class TTLCache:
    """Thread-safe in-memory cache with time-to-live expiration."""
    def __init__(self, default_ttl_seconds: float = 5.0):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None
            val, expiry = self._cache[key]
            if time.time() > expiry:
                del self._cache[key]
                return None
            return val

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        duration = ttl if ttl is not None else self._default_ttl
        with self._lock:
            self._cache[key] = (value, time.time() + duration)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

# Global cache instance for hydraulic and forecast results
hydraulic_cache = TTLCache(default_ttl_seconds=5.0)
