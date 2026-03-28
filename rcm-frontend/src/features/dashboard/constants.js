import { ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';

export const STAGE_ORDER = ['preAuth', 'admitted', 'settled'];

export const STAGE_LABELS = {
  preAuth: 'Pre-Authorization',
  admitted: 'Admitted / Running',
  settled: 'Finalized / Settled'
};

export const STAGE_ICONS = {
  preAuth: ShieldCheck,
  admitted: Activity,
  settled: CheckCircle2
};
