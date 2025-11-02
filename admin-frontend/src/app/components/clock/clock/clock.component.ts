import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clock.component.html',
  styleUrls: ['./clock.component.scss']
})
export class ClockComponent implements OnInit, OnDestroy {
  hourDeg = 0;
  minuteDeg = 0;
  secondDeg = 0;
  zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private timer: any;

  ngOnInit() {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  updateClock() {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();

    this.secondDeg = seconds * 6;
    this.minuteDeg = minutes * 6 + seconds * 0.1;
    this.hourDeg = ((hours % 12) / 12) * 360 + minutes * 0.5;
  }
}
