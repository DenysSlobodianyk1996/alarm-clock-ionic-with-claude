import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Alarm } from './alarm.model';

@Injectable({ providedIn: 'root' })
export class AlarmSchedulerService {
  readonly alarmFired$ = new Subject<Alarm>();

  private webTimer?: ReturnType<typeof setInterval>;
  private lastFiredMinute = -1;
  private notifToAlarm = new Map<number, Alarm>();
  private listenerAdded = false;

  async setup(alarms: Alarm[]): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.setupNative(alarms);
    } else {
      this.setupWeb(alarms);
    }
  }

  // ── Native ────────────────────────────────────────────────────────────────

  private async setupNative(alarms: Alarm[]): Promise<void> {
    const { display } = await LocalNotifications.requestPermissions();
    if (display !== 'granted') return;

    if (!this.listenerAdded) {
      this.listenerAdded = true;
      await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        const alarm = this.notifToAlarm.get(notification.id);
        if (alarm) {
          this.playDing();
          this.alarmFired$.next(alarm);
        }
      });
    }

    // Cancel all previously scheduled alarms
    const { notifications: pending } = await LocalNotifications.getPending();
    if (pending.length) {
      await LocalNotifications.cancel({ notifications: pending });
    }

    this.notifToAlarm.clear();
    const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;

      if (alarm.repeatOnce) {
        const id = this.notifId(alarm.id, -1);
        this.notifToAlarm.set(id, alarm);
        notifications.push({
          id,
          title: 'Alarm',
          body: alarm.description || 'Alarm',
          schedule: { at: this.nextOccurrence(alarm.hour, alarm.minute), allowWhileIdle: true },
        });
      } else {
        for (const day of alarm.days) {
          const id = this.notifId(alarm.id, day);
          this.notifToAlarm.set(id, alarm);
          notifications.push({
            id,
            title: 'Alarm',
            body: alarm.description || 'Alarm',
            schedule: {
              on: { weekday: this.toCapacitorWeekday(day), hour: alarm.hour, minute: alarm.minute },
              allowWhileIdle: true,
            },
          });
        }
      }
    }

    if (notifications.length) {
      await LocalNotifications.schedule({ notifications });
    }
  }

  // ── Web ───────────────────────────────────────────────────────────────────

  private setupWeb(alarms: Alarm[]): void {
    clearInterval(this.webTimer);
    this.lastFiredMinute = -1;

    this.webTimer = setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const minuteKey = h * 60 + m;

      if (minuteKey === this.lastFiredMinute) return;

      // 0=Mon … 6=Sun (matches alarm.days)
      const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;

      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        if (alarm.hour !== h || alarm.minute !== m) continue;
        if (!alarm.repeatOnce && !alarm.days.includes(dayIndex)) continue;

        this.lastFiredMinute = minuteKey;
        this.playDing();
        this.alarmFired$.next(alarm);
        break;
      }
    }, 30_000);
  }

  private playDing(): void {
    const ctx = new AudioContext();
    const freqs = [880, 1108, 1318];
    const noteDuration = 0.9;
    const noteSpacing = 0.55;
    const totalDuration = 5;

    // Repeat ascending ding pattern for 5 seconds
    let i = 0;
    for (let t = ctx.currentTime; t < ctx.currentTime + totalDuration; t += noteSpacing, i++) {
      const freq = freqs[i % freqs.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.45, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration);

      osc.start(t);
      osc.stop(t + noteDuration);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private nextOccurrence(hour: number, minute: number): Date {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    if (d <= new Date()) d.setDate(d.getDate() + 1);
    return d;
  }

  /** Stable integer notification ID derived from alarm id + day slot */
  private notifId(alarmId: string, day: number): number {
    return (parseInt(alarmId.slice(-5), 10) * 10) + (day + 2);
  }

  /**
   * Convert alarm day index (0=Mon … 6=Sun)
   * to Capacitor weekday (1=Sun, 2=Mon … 7=Sat)
   */
  private toCapacitorWeekday(day: number): number {
    return day === 6 ? 1 : day + 2;
  }
}
