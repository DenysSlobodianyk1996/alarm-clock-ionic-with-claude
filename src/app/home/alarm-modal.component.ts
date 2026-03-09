import { ChangeDetectorRef, Component, Input, computed, signal } from '@angular/core';
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
export class AlarmModalComponent {
  @Input() set alarm(value: Alarm | undefined) {
    if (value) {
      this.isEdit.set(true);
      this.form.set({ ...value });
      this.cdr.detectChanges();
    }
  }

  isEdit = signal(false);

  readonly form = signal<Alarm>({
    id: '',
    hour: new Date().getHours(),
    minute: new Date().getMinutes(),
    repeatOnce: true,
    days: [],
    description: '',
    enabled: true,
  });

  readonly timeValue = computed(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const { hour, minute } = this.form();
    return `2000-01-01T${pad(hour)}:${pad(minute)}:00`;
  });

  readonly days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(private modalCtrl: ModalController, private cdr: ChangeDetectorRef) {
    addIcons({ close, checkmark });
  }

  onTimeChange(event: CustomEvent) {
    const value = event.detail.value as string;
    const match = value?.match(/T(\d{2}):(\d{2})/);
    if (match) {
      this.form.update(f => ({
        ...f,
        hour: parseInt(match[1], 10),
        minute: parseInt(match[2], 10),
      }));
    }
  }

  allDaysSelected(): boolean {
    return this.form().days.length === 7;
  }

  toggleSelectAllDays() {
    this.form.update(f => ({
      ...f,
      days: f.days.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6],
    }));
  }

  toggleAllDays(event: CustomEvent) {
    this.form.update(f => ({
      ...f,
      days: event.detail.checked ? [0, 1, 2, 3, 4, 5, 6] : [],
    }));
  }

  isDaySelected(index: number): boolean {
    return this.form().days.includes(index);
  }

  toggleDay(index: number, event: CustomEvent) {
    this.form.update(f => ({
      ...f,
      days: event.detail.checked
        ? [...f.days, index]
        : f.days.filter(d => d !== index),
    }));
  }

  toggleRepeatOnce() {
    this.form.update(f => ({
      ...f,
      repeatOnce: !f.repeatOnce,
      days: !f.repeatOnce ? [] : f.days,
    }));
  }

  onRepeatOnceChange(event: CustomEvent) {
    this.form.update(f => ({
      ...f,
      repeatOnce: event.detail.checked,
      days: event.detail.checked ? [] : f.days,
    }));
  }

  setDescription(value: string) {
    this.form.update(f => ({ ...f, description: value }));
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save() {
    const alarm = this.form();
    const result = alarm.id ? alarm : { ...alarm, id: Date.now().toString() };
    this.modalCtrl.dismiss(result, 'confirm');
  }
}
