import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IonContent, IonButton, IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alarmOutline, stopOutline } from 'ionicons/icons';
import { Alarm } from './alarm.model';

@Component({
  selector: 'app-alarm-ring',
  standalone: true,
  imports: [IonContent, IonButton, IonIcon],
  template: `
    <ion-content class="ring-content">
      <ion-icon name="alarm-outline"></ion-icon>
      <p>{{ alarm?.description || 'Alarm' }}</p>
      <ion-button size="large" (click)="stop()">
        <ion-icon slot="start" name="stop-outline"></ion-icon>
        Stop
      </ion-button>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: var(--ion-color-dark);
      --color: var(--ion-color-dark-contrast);
    }
    .ring-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      height: 100%;
    }
    ion-icon[name="alarm-outline"] {
      font-size: clamp(80px, 30vmin, 160px);
      color: var(--ion-color-warning);
      animation: pulse 0.6s ease-in-out infinite alternate;
    }
    @keyframes pulse {
      from { opacity: 0.6; transform: scale(0.95); }
      to   { opacity: 1;   transform: scale(1.05); }
    }
    p {
      font-size: clamp(18px, 5vmin, 28px);
      margin: 24px 0 40px;
      padding: 0 24px;
    }
  `],
})
export class AlarmRingComponent implements OnInit, OnDestroy {
  @Input() alarm?: Alarm;

  private timer?: ReturnType<typeof setTimeout>;

  constructor(private modalCtrl: ModalController) {
    addIcons({ alarmOutline, stopOutline });
  }

  ngOnInit() {
    this.timer = setTimeout(() => this.stop(), 5000);
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }

  stop() {
    clearTimeout(this.timer);
    this.modalCtrl.dismiss(null, 'stop');
  }
}
