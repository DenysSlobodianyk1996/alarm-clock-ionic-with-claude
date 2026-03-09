export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  repeatOnce: boolean;
  days: number[]; // 0=Mon … 6=Sun
  description: string;
}
