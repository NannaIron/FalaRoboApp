import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SensorService } from '../../../services/sensor.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './control.html',
  styleUrls: ['./control.scss']
})
export class ControlComponent implements OnInit, OnDestroy {
  private sensorService = inject(SensorService);
  private sub!: Subscription;

  running = false;
  pressureInput: string = '';

  ngOnInit(): void {
    this.sub = this.sensorService.getState().subscribe({
      next: (state: any) => {
        this.running = !!state?.running;
      },
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  onToggleRunning(): void {
    const next = !this.running;
    this.sensorService.postStart(next).subscribe({
      next: () => {
        this.sensorService.setState({ ...(this.getLatestStateSnapshot() || {}), running: next });
        this.running = next;
      },
      error: () => {}
    });
  }

  private getLatestStateSnapshot(): any {
    let snap: any = null;
    const sub = this.sensorService.getState().subscribe(s => snap = s);
    sub.unsubscribe();
    return snap;
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Home',
      'End'
    ];
    if (allowedKeys.includes(event.key)) return;

    if (event.key === '.') {
      if (this.pressureInput.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onSendPressure(): void {
    let raw = this.pressureInput.trim();
    if (!raw) return;

    raw = raw.replace(',', '.');

    if (!raw.includes('.')) {
      raw = `${raw}.0`;
    } else {
      const parts = raw.split('.');
      if (parts.length > 2) {
        raw = parts[0] + '.' + parts.slice(1).join('');
      }
      if (raw.endsWith('.')) raw = raw + '0';
    }

    const num = Number(raw);
    if (Number.isNaN(num)) return;

    this.sensorService.postPressure(num).subscribe({
      next: () => {
        const snapshot = this.getLatestStateSnapshot() || {};
        this.sensorService.setState({ ...snapshot, bar: num });
      },
      error: () => {
      }
    });
  }
}
