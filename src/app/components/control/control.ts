import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelService, PistonId } from '../../../services/model.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './control.html',
  styleUrls: ['./control.scss']
})
export class ControlComponent implements OnInit, OnDestroy {
  private model = inject(ModelService);
  private sub!: Subscription;

  grandeAnimating = true;
  pequenoAnimating = true;

  ngOnInit(): void {
    this.sub = this.model.states$.subscribe(states => {
      this.grandeAnimating = states.grande.animating;
      this.pequenoAnimating = states.pequeno.animating;
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  onToggleGrande(): void {
    if (this.grandeAnimating) {
      // request pause grande (will sequence: grande then pequeno)
      this.model.requestPause('grande');
    } else {
      // request resume grande (will sequence: grande then pequeno)
      this.model.requestResume('grande');
    }
  }

  onTogglePequeno(): void {
    if (this.pequenoAnimating) {
      this.model.requestPause('pequeno');
    } else {
      this.model.requestResume('pequeno');
    }
  }
}
