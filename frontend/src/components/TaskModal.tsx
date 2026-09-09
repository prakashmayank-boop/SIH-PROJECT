import React, { useState } from 'react';
import { X, Wrench, ClipboardCheck } from 'lucide-react';
import type { DrainageNode } from '../types';
import { apiService } from '../services/api';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNode: DrainageNode | null;
  onTaskCreated: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  targetNode,
  onTaskCreated
}) => {
  const [taskType, setTaskType] = useState('inspection');
  const [priority, setPriority] = useState('HIGH');
  const [description, setDescription] = useState(
    targetNode
      ? `Inspect stormwater inlet and culvert at ${targetNode.node_code} for surcharge and debris obstruction.`
      : 'Urgent drainage clearing inspection.'
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.createTask({
        task_type: taskType,
        priority: priority,
        target_description: description
      });
      onTaskCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111c2d] border border-[rgba(255,255,255,0.15)] rounded-lg w-full max-w-md shadow-2xl p-5 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)] mb-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Wrench size={16} className="text-[#10b981]" />
            <span>Dispatch Field Inspection Task</span>
          </div>
          <button onClick={onClose} className="text-[#86948a] hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {targetNode && (
            <div className="p-2.5 rounded bg-[#081425] border border-[rgba(255,255,255,0.06)] text-[11px]">
              <span className="text-[#86948a]">Target Asset: </span>
              <span className="text-white font-semibold">{targetNode.node_code}</span>
              <span className="text-[#86948a]"> | Stress: </span>
              <span className="text-[#ef4444] font-semibold">{targetNode.stress_ratio}x</span>
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold text-[#86948a] block mb-1">Task Type</label>
            <select
              value={taskType}
              onChange={e => setTaskType(e.target.value)}
              className="w-full bg-[#081425] border border-[rgba(255,255,255,0.1)] rounded p-2 text-white outline-none"
            >
              <option value="inspection">Physical Inlet Inspection</option>
              <option value="drain_cleaning">Storm Drain Desilting / Cleaning</option>
              <option value="pump">Mobile Dewatering Pump Deployment</option>
              <option value="barricade">Traffic Barricade & Warning Signage</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-[#86948a] block mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full bg-[#081425] border border-[rgba(255,255,255,0.1)] rounded p-2 text-white outline-none"
            >
              <option value="URGENT">URGENT (Imminent Overflow)</option>
              <option value="HIGH">HIGH (Elevated Nowcast Stress)</option>
              <option value="MEDIUM">MEDIUM (Scheduled Check)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-[#86948a] block mb-1">Task Instructions</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#081425] border border-[rgba(255,255,255,0.1)] rounded p-2 text-white outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs font-bold">
              <ClipboardCheck size={13} />
              {loading ? 'Dispatching...' : 'Assign to Field Crew'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
