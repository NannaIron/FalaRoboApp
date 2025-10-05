import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
  standalone: true,
  imports: [CommonModule]
})
export class MenuComponent {
  @Input() isOpen = false;
  @Output() closeMenu = new EventEmitter<void>();
  @Output() select = new EventEmitter<string>();

  private expandedMap: Record<string, boolean> = {
    'motor-1': false
  };

  onBackdropClick(): void {
    this.closeMenu.emit();
  }

  onMenuClick(event: Event): void {
    event.stopPropagation();
  }

  onSelect(id: string): void {
    this.select.emit(id);
  }

  toggleExpand(id: string): void {
    this.expandedMap[id] = !this.expandedMap[id];
  }

  isExpanded(id: string): boolean {
    return !!this.expandedMap[id];
  }
}
