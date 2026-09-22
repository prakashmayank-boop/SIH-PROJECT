import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import { apiService } from '../services/api';
import './admin-portal.css';

interface ReportFloodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: () => void;
}

// Koramangala Ward 151 flood-prone landmark presets [lat, lon]
const FLOOD_LANDMARKS = [
  { label: 'Sony World Junction (80 Feet Rd)', lat: 12.9280, lon: 77.6330 },
  { label: '80 Feet Road near ST Bed Signal', lat: 12.9310, lon: 77.6270 },
  { label: 'ST Bed Lowlands (Suddaguntepalya)', lat: 12.9295, lon: 77.6255 },
  { label: 'Ejipura Link Road (Low-lying)', lat: 12.9400, lon: 77.6240 },
  { label: 'Koramangala 1st Block Underpass', lat: 12.9365, lon: 77.6200 },
  { label: 'BDA Complex Drainage Outlet', lat: 12.9350, lon: 77.6320 },
  { label: 'Wipro Park Runoff Corridor', lat: 12.9240, lon: 77.6360 },
  { label: 'Custom Location (Ward Center)', lat: 12.9345, lon: 77.6265 },
];

export const ReportFloodModal: React.FC<ReportFloodModalProps> = ({
  isOpen,
  onClose,
  onReportSubmitted
}) => {
  const [landmarkIdx, setLandmarkIdx] = useState(0);
  const [estimatedDepth, setEstimatedDepth] = useState('20');
  const [severity, setSeverity] = useState('HIGH');
  const [description, setDescription] = useState('Water rising rapidly above footpath curb level.');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedLandmark = FLOOD_LANDMARKS[landmarkIdx];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiService.submitReport({
        lat: selectedLandmark.lat,
        lon: selectedLandmark.lon,
        depth_cm: parseFloat(estimatedDepth) || 15.0,
        severity: severity,
        description: `${selectedLandmark.label}: ${description}`
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onReportSubmitted();
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit report. Please verify backend connectivity and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ar-modal-backdrop">
      <div className="ar-modal-box" style={{ maxWidth: 480 }}>
        <div className="ar-modal-header">
          <div className="ar-modal-title">
            <AlertCircle size={16} className="text-[#f59e0b]" />
            <span>Control Room Incident Ingestion</span>
          </div>
          <button onClick={onClose} className="ar-modal-close">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle size={36} className="text-[#059669] mx-auto animate-bounce" />
            <h4 className="text-[#0F172A] font-bold text-sm">Incident Ingested into Nowcast Model</h4>
            <p className="text-[11px] text-[#64748B]">Ground observation verified and forwarded to GIS prediction engine.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ar-modal-body">
            {/* Landmark Preset Selector */}
            <div className="ar-field">
              <label className="ar-field-label flex items-center gap-1">
                <MapPin size={11} className="text-[#f59e0b]" /> Inundation Location / Landmark
              </label>
              <select
                value={landmarkIdx}
                onChange={e => setLandmarkIdx(Number(e.target.value))}
                className="ar-field-select cursor-pointer"
              >
                {FLOOD_LANDMARKS.map((lm, i) => (
                  <option key={i} value={i}>{lm.label}</option>
                ))}
              </select>
              <div className="text-[10px] text-[#64748b] ar-mono mt-0.5">
                GPS: {selectedLandmark.lat.toFixed(4)}° N, {selectedLandmark.lon.toFixed(4)}° E
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="ar-field">
                <label className="ar-field-label">Water Depth (cm)</label>
                <input
                  type="number"
                  value={estimatedDepth}
                  onChange={e => setEstimatedDepth(e.target.value)}
                  min="0"
                  max="200"
                  className="ar-field-input ar-mono"
                />
              </div>
              <div className="ar-field">
                <label className="ar-field-label">Severity Level</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  className="ar-field-select cursor-pointer"
                >
                  <option value="CRITICAL">CRITICAL (&gt;30cm Impassable)</option>
                  <option value="HIGH">HIGH (15-30cm Surcharged)</option>
                  <option value="MODERATE">MODERATE (5-15cm Waterlogging)</option>
                  <option value="LOW">LOW (&lt;5cm Minor Ponding)</option>
                </select>
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-field-label">Observation Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="ar-field-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] text-xs">
                {error}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button type="button" onClick={onClose} className="ar-btn-secondary" style={{ width: 'auto', padding: '8px 16px' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="ar-btn-primary" style={{ width: 'auto', padding: '8px 20px' }}>
                <Send size={13} />
                {loading ? 'Submitting...' : 'Ingest Observation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
