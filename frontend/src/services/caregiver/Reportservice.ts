import { authFetch } from '@/src/api/authApi';
import { TaskCompletionReport, ReportTimeframe } from '../../types/caregiver.types';

export const fetchTaskCompletionReport = async (
  timeframe: ReportTimeframe,
  patientName: string,
): Promise<TaskCompletionReport> => {
  const params = new URLSearchParams({ timeframe });

  // Only send the filter when it's an actual patient - the backend treats a
  // missing patientName as "all".
  if (patientName && patientName !== 'All Patients') {
    params.append('patientName', patientName);
  }

  const data = await authFetch(`/caregiver/reports/task-completion?${params.toString()}`);
  if (!data.success) throw new Error(data.message);
  return data.report;
};