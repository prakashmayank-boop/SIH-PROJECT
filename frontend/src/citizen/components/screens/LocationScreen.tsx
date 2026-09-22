import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  Building,
  Navigation,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import type { SupportedLanguage } from '../../types';

import { TRANSLATIONS } from '../../i18n/translations';
import { LocationPickerMap } from '../LocationPickerMap';
import { citizenApiService } from '../../services/citizenApi';

interface LocationScreenProps {
  lang: SupportedLanguage;
  latitude: number;
  longitude: number;
  accuracyM: number;
  isManual: boolean;
  landmark: string;
  roadName: string;
  onLocationChange: (lat: number, lon: number, acc: number, isManual: boolean) => void;
  onLandmarkChange: (landmark: string) => void;
  onRoadNameChange: (roadName: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const LocationScreen: React.FC<LocationScreenProps> = ({
  lang,
  latitude,
  longitude,
  accuracyM,
  isManual,
  landmark,
  roadName,
  onLocationChange,
  onLandmarkChange,
  onRoadNameChange,
  onNext,
  onBack
}) => {
  const t = TRANSLATIONS[lang];
  const presets = citizenApiService.getPresets();

  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Request browser GPS on component mount if coordinates not set
  useEffect(() => {
    if (!isManual && accuracyM === 0) {
      requestGpsLocation();
    }
  }, []);

  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError(t.gpsUnavailable);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);
    setGpsStatusMessage(t.gpsFetching);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        onLocationChange(lat, lon, Math.round(accuracy), false);
        setGpsStatusMessage(t.gpsAccuracy.replace('{acc}', Math.round(accuracy).toString()));
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(t.gpsPermissionDenied);
        } else {
          setGpsError(t.gpsUnavailable);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000
      }
    );
  };

  const handlePresetSelect = (idx: number) => {
    const p = presets[idx];
    if (p) {
      onLocationChange(p.lat, p.lon, 10, true);
      onLandmarkChange(p.label);
      onRoadNameChange(p.road);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Title & Instructions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 3 of 5</span>
          <span className="text-xs text-slate-400">Required</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">{t.locationTitle}</h2>
        <p className="text-xs text-slate-600 mt-0.5">{t.locationSubtitle}</p>
      </div>

      {/* GPS Status & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2">
          {gpsLoading ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : gpsError ? (
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          )}

          <div className="text-xs">
            {gpsLoading ? (
              <span className="text-slate-600 font-medium">{t.gpsFetching}</span>
            ) : gpsError ? (
              <span className="text-amber-800 font-medium">{gpsError}</span>
            ) : (
              <span className="text-slate-700 font-medium">
                {isManual ? 'Manual pin placed' : gpsStatusMessage || t.gpsSuccess}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={requestGpsLocation}
          disabled={gpsLoading}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-2xs"
        >
          <Crosshair size={14} />
          <span>{t.btnUseCurrentLocation}</span>
        </button>
      </div>

      {/* Interactive Map Picker */}
      <div className="space-y-1.5">
        <LocationPickerMap
          latitude={latitude}
          longitude={longitude}
          accuracyM={accuracyM}
          isManual={isManual}
          onLocationChange={(lat, lon, manual) => onLocationChange(lat, lon, manual ? 0 : accuracyM, manual)}
        />
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
          <span>Lat: {latitude.toFixed(5)}°, Lon: {longitude.toFixed(5)}°</span>
          {accuracyM > 0 && <span>GPS Accuracy: ±{accuracyM}m</span>}
        </div>
      </div>

      {/* Quick Landmark Preset Dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Navigation size={13} className="text-blue-600" />
          <span>{t.presetLandmarks}</span>
        </label>
        <select
          onChange={(e) => handlePresetSelect(Number(e.target.value))}
          className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition shadow-2xs cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>-- Select a known junction / hotspot --</option>
          {presets.map((p, idx) => (
            <option key={idx} value={idx}>
              {p.label} ({p.road})
            </option>
          ))}
        </select>
      </div>

      {/* Text Fields: Landmark & Street */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Building size={13} className="text-slate-500" />
            <span>{t.landmarkLabel}</span>
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => onLandmarkChange(e.target.value)}
            placeholder={t.landmarkPlaceholder}
            className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition shadow-2xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <MapPin size={13} className="text-slate-500" />
            <span>{t.roadNameLabel}</span>
          </label>
          <input
            type="text"
            value={roadName}
            onChange={(e) => onRoadNameChange(e.target.value)}
            placeholder={t.roadNamePlaceholder}
            className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition shadow-2xs"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-3 flex items-center justify-between border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition"
        >
          <ArrowLeft size={16} />
          <span>{t.btnBack}</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
        >
          <span>Continue to Severity</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
