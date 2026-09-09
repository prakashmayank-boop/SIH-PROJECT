import React from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import type { HorizonStep } from '../types';

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
  const steps: { id: HorizonStep; label: string; desc: string }[] = [
    { id: 'NOW', label: 'NOW', desc: 'Current Observed' },
    { id: '+30m', label: '+30m', desc: 'Nowcast +30m' },
    { id: '+1h', label: '+1h', desc: 'Peak Inflow +1h' },
    { id: '+2h', label: '+2h', desc: 'Surface Flow +2h' },
    { id: '+3h', label: '+3h', desc: 'Recession +3h' }
  ];

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] glass-panel shadow-2xl border border-[rgba(255,255,255,0.15)] select-none"
      style={{ maxWidth: 'calc(100% - 32px)', width: 'auto' }}
    >
      {/* Main row: play + label + step buttons */}
      <div className="flex items-center gap-3 px-4 py-2 flex-wrap justify-center">
        {/* Play/Pause Scrubber */}
        <button
          onClick={onTogglePlay}
          className="w-8 h-8 rounded-full bg-[#10b981] hover:bg-[#0ea371] text-[#003824] flex items-center justify-center transition-all shadow-md shrink-0"
          title={isPlaying ? 'Pause Timeline' : 'Animate 0-3h Flood Progression'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <Clock size={14} className="text-[#86948a]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#86948a]">Nowcast Horizon:</span>
        </div>

        {/* Step Buttons */}
        <div className="flex items-center bg-[#081425] p-1 rounded border border-[rgba(255,255,255,0.08)] gap-1 shrink-0">
          {steps.map(s => {
            const active = currentHorizon === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onChangeHorizon(s.id)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#10b981] text-[#003824] shadow-sm scale-105'
                    : 'text-[#86948a] hover:text-white hover:bg-[#152031]'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Legend — inline on wide screens */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] pl-2 border-l border-[rgba(255,255,255,0.1)] shrink-0">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            <span className="text-[#86948a]">0-5cm</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span className="text-[#86948a]">5-15cm</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            <span className="text-[#86948a]">15-30cm</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7f1d1d]" />
            <span className="text-[#86948a]">&gt;30cm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
