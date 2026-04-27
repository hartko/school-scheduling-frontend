import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { schedulerApi, type GenerateScheduleRequest, type JobStatus, type ProposedClassGroup } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export interface SchedulerState {
  step: 'idle' | 'solving' | 'review' | 'committing' | 'done' | 'error';
  jobId: string | null;
  progress: number;
  message: string;
  result: ProposedClassGroup[];
  committed: number;
  failed: number;
  errors: string[];
  error: string | null;
}

const INITIAL: SchedulerState = {
  step: 'idle',
  jobId: null,
  progress: 0,
  message: '',
  result: [],
  committed: 0,
  failed: 0,
  errors: [],
  error: null,
};

export function useScheduler() {
  const qc = useQueryClient();
  const [state, setState] = useState<SchedulerState>(INITIAL);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const generate = useCallback(async (request: GenerateScheduleRequest) => {
    setState({ ...INITIAL, step: 'solving', progress: 5, message: 'Starting solver…' });
    try {
      const job = await schedulerApi.generate(request);
      setState((s) => ({ ...s, jobId: job.job_id }));

      pollRef.current = setInterval(async () => {
        try {
          const status = await schedulerApi.getJob(job.job_id);
          setState((s) => ({ ...s, progress: status.progress, message: status.message ?? '' }));

          if (status.status === 'done') {
            stopPolling();
            const res = await schedulerApi.getResult(job.job_id);
            setState((s) => ({ ...s, step: 'review', result: res.class_groups, progress: 100, message: `Found ${res.total} class groups` }));
          } else if (status.status === 'failed') {
            stopPolling();
            setState((s) => ({ ...s, step: 'error', error: status.message ?? 'Solver failed' }));
          }
        } catch (e) {
          stopPolling();
          setState((s) => ({ ...s, step: 'error', error: (e as Error).message }));
        }
      }, 2000);
    } catch (e) {
      setState((s) => ({ ...s, step: 'error', error: (e as Error).message }));
    }
  }, [stopPolling]);

  const commit = useCallback(async () => {
    if (!state.jobId) return;
    setState((s) => ({ ...s, step: 'committing' }));
    try {
      const res = await schedulerApi.commit(state.jobId);
      setState((s) => ({ ...s, step: 'done', committed: res.committed, failed: res.failed, errors: res.errors }));
      qc.invalidateQueries({ queryKey: queryKeys.classGroups.all() });
    } catch (e) {
      setState((s) => ({ ...s, step: 'error', error: (e as Error).message }));
    }
  }, [state.jobId, qc]);

  const reset = useCallback(() => {
    stopPolling();
    setState(INITIAL);
  }, [stopPolling]);

  return { state, generate, commit, reset };
}
