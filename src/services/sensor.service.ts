import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private commonUrl = environments.commonUrl;
  private aiUrl = environments.aiUrl;

  constructor(private http: HttpClient) {}

  postSensors(): Observable<any> {
    const payload = {
      small: { '1S1': false, '1S2': true },
      big: { '2S1': true, '2S2': false },
      positions: { small: 'Forwards', big: 'Backwards' }
    };
    return this.http.post(`${this.commonUrl}/sensors`, payload);
  }

  postStart(running: boolean): Observable<any> {
    return this.http.post(`${this.commonUrl}/control/start`, { running });
  }

  postPressure(bar: number): Observable<any> {
    return this.http.post(`${this.commonUrl}/control/pressure`, { bar });
  }

  getState(): Observable<any> {
    return this.http.get(`${this.commonUrl}/state`);
  }

  getAI(question: string): Observable<string> {
    const url = `${this.aiUrl}/ai?question="${encodeURIComponent(question)}"`;
    return this.http.get(url, { responseType: 'text' });
  }
}
