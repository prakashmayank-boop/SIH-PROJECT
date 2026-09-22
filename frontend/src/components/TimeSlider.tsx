import React from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import type { HorizonStep } from '../types';
import './admin-portal.css';

interface TimeSliderProps {
  currentHorizon: HorizonStep;
  onChangeHorizon: (h: HorizonStep) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  currentHorizon,
  onChangeHorizon,
  isPlaying,
  onTogglePlay
}) => {
  const steps: { id: HorizonStep; label: string; sub: string }[] = [
    { id: 'NOW', label: 'NOW', sub: 'Observed' },
    { id: '+30m', label: '+30m', sub: 'Inflow' },
    { id: '+1h', label: '+1h', sub: 'Peak' },
    { id: '+2h', label: '+2h', sub: 'Surcharge' },
    { id: '+3h', label: '+3h', sub: 'Recession' }
  ];

  const currentStepInfo = steps.find(s => s.id === currentHorizon) || steps[0];

  return (
    <div className="ar-timeline-hud">
      {/* Play/Pause Scrubber */}
      <button
        onClick={onTogglePlay}
        className="ar-timeline-play"
        title={isPlaying ? 'Pause Timeline' : 'Animate 0-3h Flood Progression'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
      </button>

      {/* Horizon Label & Status */}
      <div className="ar-timeline-badge">
        <span className="ar-timeline-badge__title">
          <Clock size={11} />
          Nowcast 0–3h
        </span>
        <span className="ar-timeline-badge__sub">
          {currentStepInfo.label} &bull; {currentStepInfo.sub}
        </span>
      </div>

      {/* Step Buttons */}
      <div className="ar-timeline-steps">
        {steps.map(s => {
          const active = currentHorizon === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onChangeHorizon(s.id)}
              className={`ar-timeline-step-btn ${active ? 'ar-timeline-step-btn--active' : ''}`}
              title={`${s.label}: ${s.sub}`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Water Depth Classification Legend */}
      <div className="ar-depth-legend hidden md:flex">
        <div className="ar-depth-legend__item" title="Low risk depth">
          <span className="ar-depth-dot" style={{ background: '#10B981' }} />
          <span>&lt;5cm</span>
        </div>
        <div className="ar-depth-legend__item" title="Moderate risk depth">
          <span className="ar-depth-dot" style={{ background: '#F59E0B' }} />
          <span>5-15cm</span>
        </div>
        <div className="ar-depth-legend__item" title="High risk depth">
          <span className="ar-depth-dot" style={{ background: '#EF4444' }} />
          <span>15-30cm</span>
        </div>
        <div className="ar-depth-legend__item" title="Critical hazard depth">
          <span className="ar-depth-dot" style={{ background: '#7F1D1D', boxShadow: '0 0 6px #EF4444' }} />
          <span>&gt;30cm</span>
        </div>
      </div>
    </div>
  );
};
