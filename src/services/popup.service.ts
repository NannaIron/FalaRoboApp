import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private _open$ = new BehaviorSubject<boolean>(false);
  open$ = this._open$.asObservable();

  open(): void {
    this._open$.next(true);
  }

  close(): void {
    this._open$.next(false);
  }

  toggle(): void {
    this._open$.next(!this._open$.value);
  }

  isOpen(): boolean {
    return this._open$.value;
  }
}
