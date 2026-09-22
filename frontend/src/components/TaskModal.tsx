import React, { useState } from 'react';
import { X, Wrench, ClipboardCheck } from 'lucide-react';
import type { DrainageNode } from '../types';
import { apiService } from '../services/api';
import './admin-portal.css';

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
    <div className="ar-modal-backdrop">
      <div className="ar-modal-box" style={{ maxWidth: 480 }}>
        <div className="ar-modal-header">
          <div className="ar-modal-title">
            <Wrench size={16} className="text-[#10b981]" />
            <span>Dispatch Field Inspection Task</span>
          </div>
          <button onClick={onClose} className="ar-modal-close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ar-modal-body">
          {targetNode && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-[#64748b] block text-[10px] uppercase">Target Asset</span>
                <span className="text-[#0F172A] font-bold ar-mono text-sm">{targetNode.node_code}</span>
              </div>
              <div className="text-right">
                <span className="text-[#64748b] block text-[10px] uppercase">Hydraulic Stress</span>
                <span className="text-[#ef4444] font-bold ar-mono text-sm">{targetNode.stress_ratio}x</span>
              </div>
            </div>
          )}

          <div className="ar-field">
            <label className="ar-field-label">Task Type</label>
            <select
              value={taskType}
              onChange={e => setTaskType(e.target.value)}
              className="ar-field-select cursor-pointer"
            >
              <option value="inspection">Physical Inlet Inspection</option>
              <option value="drain_cleaning">Storm Drain Desilting / Cleaning</option>
              <option value="pump">Mobile Dewatering Pump Deployment</option>
              <option value="barricade">Traffic Barricade & Warning Signage</option>
            </select>
          </div>

          <div className="ar-field">
            <label className="ar-field-label">Dispatch Urgency / Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="ar-field-select cursor-pointer"
            >
              <option value="URGENT">URGENT (Imminent Overflow)</option>
              <option value="HIGH">HIGH (Elevated Nowcast Stress)</option>
              <option value="MEDIUM">MEDIUM (Scheduled Check)</option>
            </select>
          </div>

          <div className="ar-field">
            <label className="ar-field-label">Field Crew Directives</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="ar-field-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="ar-btn-secondary" style={{ width: 'auto', padding: '8px 16px' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="ar-btn-primary" style={{ width: 'auto', padding: '8px 20px' }}>
              <ClipboardCheck size={14} />
              {loading ? 'Dispatching...' : 'Assign to Field Crew'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
