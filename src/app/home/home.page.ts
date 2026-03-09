import { Component, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonFab, IonFabButton, IonIcon,
  IonList, IonItem, IonLabel, IonToggle, IonButton,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trashOutline } from 'ionicons/icons';
import { AlarmService } from './alarm.service';
import { AlarmModalComponent } from './alarm-modal.component';
import { Alarm } from './alarm.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonFab, IonFabButton, IonIcon,
    IonList, IonItem, IonLabel, IonToggle, IonButton,
  ],
})
export class HomePage implements OnInit {
  alarms: Alarm[] = [];

  readonly DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(
    private alarmService: AlarmService,
    private modalCtrl: ModalController,
  ) {
    addIcons({ add, trashOutline });
  }

  async ngOnInit() {
    await this.loadAlarms();
  }

  private async loadAlarms() {
    const all = await this.alarmService.getAll();
    this.alarms = all.sort((a, b) => a.hour !== b.hour ? a.hour - b.hour : a.minute - b.minute);
  }

  async openNewAlarm() {
    await this.openModal();
  }

  async openAlarm(alarm: Alarm) {
    await this.openModal(alarm);
  }

  async toggleAlarm(alarm: Alarm, enabled: boolean) {
    await this.alarmService.save({ ...alarm, enabled });
    await this.loadAlarms();
  }

  async deleteAlarm(alarm: Alarm) {
    await this.alarmService.remove(alarm.id);
    await this.loadAlarms();
  }

  private async openModal(alarm?: Alarm) {
    const modal = await this.modalCtrl.create({
      component: AlarmModalComponent,
      componentProps: alarm ? { alarm } : {},
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<Alarm>();
    if (role === 'confirm' && data) {
      await this.alarmService.save(data);
      await this.loadAlarms();
    }
  }

  formatTime(alarm: Alarm): string {
    return `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`;
  }

  formatRepeat(alarm: Alarm): string {
    if (alarm.repeatOnce) return 'Once';
    if (alarm.days.length === 7) return 'Every day';
    return alarm.days.map(d => this.DAY_NAMES[d]).join(', ');
  }
}
