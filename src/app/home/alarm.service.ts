import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Alarm } from './alarm.model';

const KEY = 'alarms';

@Injectable({ providedIn: 'root' })
export class AlarmService {
  async getAll(): Promise<Alarm[]> {
    const { value } = await Preferences.get({ key: KEY });
    return value ? JSON.parse(value) : [];
  }

  async save(alarm: Alarm): Promise<void> {
    const alarms = await this.getAll();
    const idx = alarms.findIndex(a => a.id === alarm.id);
    if (idx >= 0) {
      alarms[idx] = alarm;
    } else {
      alarms.push(alarm);
    }
    await Preferences.set({ key: KEY, value: JSON.stringify(alarms) });
  }

  async remove(id: string): Promise<void> {
    const alarms = (await this.getAll()).filter(a => a.id !== id);
    await Preferences.set({ key: KEY, value: JSON.stringify(alarms) });
  }
}
