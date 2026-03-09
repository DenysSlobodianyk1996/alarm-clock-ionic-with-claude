import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonList, IonItem, IonLabel, IonCheckbox, IonDatetime, IonInput,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmark } from 'ionicons/icons';
import { Alarm } from './alarm.model';

@Component({
  selector: 'app-alarm-modal',
  templateUrl: 'alarm-modal.component.html',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonList, IonItem, IonLabel, IonCheckbox, IonDatetime, IonInput,
  ],
})
export class AlarmModalComponent implements OnInit {
  @Input() alarm?: Alarm;

  timeValue = new Date().toISOString();

  form: Alarm = {
    id: '',
    hour: new Date().getHours(),
    minute: new Date().getMinutes(),
    repeatOnce: true,
    days: [],
    description: '',
  };

  readonly days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(private modalCtrl: ModalController) {
    addIcons({ close, checkmark });
  }

  ngOnInit() {
    if (this.alarm) {
      this.form = { ...this.alarm };
      const d = new Date();
      d.setHours(this.alarm.hour, this.alarm.minute, 0, 0);
      this.timeValue = d.toISOString();
    }
  }

  onTimeChange(event: CustomEvent) {
    const value = event.detail.value as string;
    const match = value?.match(/T(\d{2}):(\d{2})/);
    if (match) {
      this.form.hour = parseInt(match[1], 10);
      this.form.minute = parseInt(match[2], 10);
    }
  }

  allDaysSelected(): boolean {
    return this.form.days.length === 7;
  }

  toggleAllDays(event: CustomEvent) {
    this.form.days = event.detail.checked ? [0, 1, 2, 3, 4, 5, 6] : [];
  }

  isDaySelected(index: number): boolean {
    return this.form.days.includes(index);
  }

  toggleDay(index: number, event: CustomEvent) {
    this.form.days = event.detail.checked
      ? [...this.form.days, index]
      : this.form.days.filter(d => d !== index);
  }

  onRepeatOnceChange(event: CustomEvent) {
    this.form.repeatOnce = event.detail.checked;
    if (this.form.repeatOnce) {
      this.form.days = [];
    }
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save() {
    if (!this.form.id) {
      this.form.id = Date.now().toString();
    }
    this.modalCtrl.dismiss(this.form, 'confirm');
  }
}
