import type { ReportDraft, CitizenReport } from '../types';

const DRAFT_KEY = 'ufis_citizen_report_draft_v1';
const SUBMITTED_REPORTS_KEY = 'ufis_citizen_local_reports_v1';
const SUBMISSION_LOCK_KEY = 'ufis_citizen_submission_lock_v1';

export const storageService = {
  // Draft management
  saveDraft(draft: ReportDraft): void {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
      console.warn('Unable to persist draft to localStorage', err);
    }
  },

  getSavedDraft(): ReportDraft | null {
    try {
      const data = localStorage.getItem(DRAFT_KEY);
      if (!data) return null;
      return JSON.parse(data) as ReportDraft;
    } catch (err) {
      console.warn('Unable to read draft from localStorage', err);
      return null;
    }
  },

  deleteDraft(): void {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      console.warn('Unable to delete draft from localStorage', err);
    }
  },

  // Locally submitted reports cache (so citizens see their own submissions even across refreshes or without login)
  getLocalReports(): CitizenReport[] {
    try {
      const data = localStorage.getItem(SUBMITTED_REPORTS_KEY);
      if (!data) return [];
      return JSON.parse(data) as CitizenReport[];
    } catch (err) {
      console.warn('Unable to read local reports', err);
      return [];
    }
  },

  saveLocalReport(report: CitizenReport): void {
    try {
      const current = this.getLocalReports();
      // Prepend so latest appears first
      const updated = [report, ...current.filter(r => r.id !== report.id && r.public_ticket_id !== report.public_ticket_id)];
      localStorage.setItem(SUBMITTED_REPORTS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Unable to save local report', err);
    }
  },

  updateLocalReport(updatedReport: CitizenReport): void {
    try {
      const current = this.getLocalReports();
      const updated = current.map(r => r.id === updatedReport.id ? updatedReport : r);
      localStorage.setItem(SUBMITTED_REPORTS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Unable to update local report', err);
    }
  },

  // Duplicate Submission Guard
  acquireSubmissionLock(): boolean {
    const lock = localStorage.getItem(SUBMISSION_LOCK_KEY);
    const now = Date.now();
    if (lock) {
      const timestamp = parseInt(lock, 10);
      // Lock expires after 8 seconds
      if (now - timestamp < 8000) {
        return false; // Still locked
      }
    }
    localStorage.setItem(SUBMISSION_LOCK_KEY, now.toString());
    return true;
  },

  releaseSubmissionLock(): void {
    localStorage.removeItem(SUBMISSION_LOCK_KEY);
  }
};
