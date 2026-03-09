import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonFab, IonFabButton, IonIcon,
  IonList, IonItem, IonLabel, IonToggle, IonButton,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { add, trashOutline, alarmOutline } from 'ionicons/icons';
import { AlarmService } from './alarm.service';
import { AlarmSchedulerService } from './alarm-scheduler.service';
import { AlarmModalComponent } from './alarm-modal.component';
import { AlarmRingComponent } from './alarm-ring.component';
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
export class HomePage implements OnInit, OnDestroy {
  alarms: Alarm[] = [];

  readonly DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  private ringSubscription?: Subscription;
  private ringModalOpen = false;

  constructor(
    private alarmService: AlarmService,
    private scheduler: AlarmSchedulerService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ add, trashOutline, alarmOutline });
  }

  async ngOnInit() {
    await this.loadAlarms();
    this.ringSubscription = this.scheduler.alarmFired$.subscribe(alarm => {
      this.showRingModal(alarm);
    });
  }

  ngOnDestroy() {
    this.ringSubscription?.unsubscribe();
  }

  private async showRingModal(alarm: Alarm) {
    if (this.ringModalOpen) return;
    this.ringModalOpen = true;
    const modal = await this.modalCtrl.create({
      component: AlarmRingComponent,
      componentProps: { alarm },
      backdropDismiss: false,
    });
    await modal.present();
    await modal.onDidDismiss();
    this.ringModalOpen = false;
    if (alarm.repeatOnce) {
      await this.alarmService.remove(alarm.id);
      await this.loadAlarms();
    }
  }

  private async loadAlarms() {
    const all = await this.alarmService.getAll();
    this.alarms = all.sort((a, b) => a.hour !== b.hour ? a.hour - b.hour : a.minute - b.minute);
    await this.scheduler.setup(this.alarms);
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
      const conflict = this.alarms.find(
        a => a.id !== data.id && a.hour === data.hour && a.minute === data.minute
      );
      if (conflict) {
        const toast = await this.toastCtrl.create({
          message: `An alarm already exists at ${this.formatTime(data)}.`,
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
        return;
      }
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
