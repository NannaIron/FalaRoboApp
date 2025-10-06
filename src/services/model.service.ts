import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PistonId = 'grande' | 'pequeno';

interface PistonState {
  animating: boolean; 
  pendingPause: boolean;
  pendingResume: boolean;
}

@Injectable({ providedIn: 'root' })
export class ModelService {
  private state: Record<PistonId, PistonState> = {
    grande: { animating: true, pendingPause: false, pendingResume: false },
    pequeno: { animating: true, pendingPause: false, pendingResume: false }
  };

  private changes$ = new BehaviorSubject<Record<PistonId, PistonState>>(this.cloneState());
  states$ = this.changes$.asObservable();

  private cloneState() {
    return {
      grande: { ...this.state.grande },
      pequeno: { ...this.state.pequeno }
    };
  }

  isAnimating(which: PistonId): boolean {
    return this.state[which].animating;
  }

  hasPendingPause(which: PistonId): boolean {
    return this.state[which].pendingPause;
  }

  hasPendingResume(which: PistonId): boolean {
    return this.state[which].pendingResume;
  }

  requestPause(which: PistonId): void {
    this.state[which].pendingPause = true;
    this.emit();
  }

  requestResume(which: PistonId): void {
    this.state[which].pendingResume = true;
    this.emit();
  }

  notifyPaused(which: PistonId): void {
    this.state[which].pendingPause = false;
    this.state[which].animating = false;
    this.emit();
  }

  notifyResumed(which: PistonId): void {
    this.state[which].pendingResume = false;
    this.state[which].animating = true;
    this.emit();
  }

  forceResume(which: PistonId): void {
    this.state[which].pendingPause = false;
    this.state[which].pendingResume = false;
    this.state[which].animating = true;
    this.emit();
  }

  forcePause(which: PistonId): void {
    this.state[which].pendingPause = false;
    this.state[which].pendingResume = false;
    this.state[which].animating = false;
    this.emit();
  }

  private emit(): void {
    this.changes$.next(this.cloneState());
  }
}
