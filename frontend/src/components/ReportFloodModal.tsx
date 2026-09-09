import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import { apiService } from '../services/api';

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
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111c2d] border border-[rgba(255,255,255,0.15)] rounded-lg w-full max-w-md shadow-2xl p-5 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)] mb-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <AlertCircle size={16} className="text-[#f59e0b]" />
            <span>Citizen / Field Flood Report</span>
          </div>
          <button onClick={onClose} className="text-[#86948a] hover:text-white">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle size={36} className="text-[#10b981] mx-auto animate-bounce" />
            <h4 className="text-white font-bold text-sm">Report Logged Successfully</h4>
            <p className="text-[11px] text-[#86948a]">Ground truth report forwarded to BBMP Control Room for sensor cross-validation.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Landmark Preset Selector */}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#86948a] block mb-1 flex items-center gap-1">
                <MapPin size={10} className="text-[#f59e0b]" /> Flood Location
              </label>
              <select
                value={landmarkIdx}
                onChange={e => setLandmarkIdx(Number(e.target.value))}
                className="w-full bg-[#081425] border border-[rgba(255,255,255,0.1)] rounded p-2 text-white outline-none focus:border-[#f59e0b] cursor-pointer"
              >
                {FLOOD_LANDMARKS.map((lm, i) => (
                  <option key={i} value={i}>{lm.label}</option>
                ))}
              </select>
              {/* Show selected coordinates */}
              <div className="mt-1 flex items-center gap-2 text-[10px] text-[#64748b] font-mono">
                <span>📍 {selectedLandmark.lat.toFixed(4)}° N, {selectedLandmark.lon.toFixed(4)}° E</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#86948a] block mb-1">Estimated Depth (cm)</label>
                <input
                  type="number"
                  value={estimatedDepth}
                  onChange={e => setEstimatedDepth(e.target.value)}
                  min="0"
                  max="200"
                  className="w-full bg-[#081425] border border-[rgba(255,255,255,0.1)] rounded p-2 text-white outline-none focus:border-[#f59e0b]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#86948a] block mb-1">Severity Rating</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  className="w-full bg-[#081425] border border-[rgba(255,255,255,0.1)] rounded p-2 text-white outline-none focus:border-[#f59e0b] cursor-pointer"
                >
                  <option value="CRITICAL">CRITICAL (&gt;30 cm)</option>
                  <option value="HIGH">HIGH (15-30 cm)</option>
                  <option value="MODERATE">MODERATE (5-15 cm)</option>
                  <option value="LOW">LOW (0-5 cm)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#86948a] block mb-1">Observation Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-[#081425] border border-[rgba(255,255,255,0.1)] rounded p-2 text-white outline-none focus:border-[#f59e0b] resize-none"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] flex items-center gap-2">
                <AlertCircle size={13} />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary text-xs font-bold">
                <Send size={12} />
                {loading ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
