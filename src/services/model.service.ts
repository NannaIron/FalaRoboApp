import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PistonId = 'grande' | 'pequeno';

interface PistonState {
  animating: boolean;     // currently animating (true) or paused (false)
  pendingPause: boolean;   // requested to pause when reaches initial
  pendingResume: boolean;  // requested resume sequencing
}

/**
 * Serviço central para coordenar pausa/resume sequencial entre pistões.
 */
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

  // Query helpers
  isAnimating(which: PistonId): boolean {
    return this.state[which].animating;
  }

  hasPendingPause(which: PistonId): boolean {
    return this.state[which].pendingPause;
  }

  hasPendingResume(which: PistonId): boolean {
    return this.state[which].pendingResume;
  }

  // Requests from UI
  requestPause(which: PistonId): void {
    // set pending pause for requested piston; sequencing handled by Canvas via checks + notifyPaused
    this.state[which].pendingPause = true;
    this.emit();
  }

  requestResume(which: PistonId): void {
    // request resume for the piston; sequencing handled by Canvas via checks + notifyResumed
    this.state[which].pendingResume = true;
    this.emit();
  }

  // Called by Canvas when it has actually paused a piston (arrived at initial pos)
  notifyPaused(which: PistonId): void {
    this.state[which].pendingPause = false;
    this.state[which].animating = false;
    this.emit();
  }

  // Called by Canvas when it has actually resumed a piston (started animating)
  notifyResumed(which: PistonId): void {
    this.state[which].pendingResume = false;
    this.state[which].animating = true;
    this.emit();
  }

  // Force resume immediately (used rarely)
  forceResume(which: PistonId): void {
    this.state[which].pendingPause = false;
    this.state[which].pendingResume = false;
    this.state[which].animating = true;
    this.emit();
  }

  // Force pause immediately (used rarely)
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
