import { Component, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonFab, IonFabButton, IonIcon,
  IonList, IonItem, IonLabel,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
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
    IonList, IonItem, IonLabel,
  ],
})
export class HomePage implements OnInit {
  alarms: Alarm[] = [];

  readonly DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(
    private alarmService: AlarmService,
    private modalCtrl: ModalController,
  ) {
    addIcons({ add });
  }

  async ngOnInit() {
    this.alarms = await this.alarmService.getAll();
  }

  async openNewAlarm() {
    const modal = await this.modalCtrl.create({ component: AlarmModalComponent });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<Alarm>();
    if (role === 'confirm' && data) {
      await this.alarmService.save(data);
      this.alarms = await this.alarmService.getAll();
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
