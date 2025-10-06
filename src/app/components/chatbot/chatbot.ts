import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SensorService } from '../../../services/sensor.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChatbotComponent {
  userInput: string = '';
  messages: { type: 'user-message' | 'bot-message'; text: string }[] = [];
  loading: boolean = false;

  constructor(private sensorService: SensorService) {}

  sendMessage(): void {
    const question = this.userInput.trim();
    if (!question || this.loading) return;

    this.messages.push({ type: 'user-message', text: question });
    this.userInput = '';
    this.loading = true;

    this.messages.push({ type: 'bot-message', text: 'Pensando...' });

    const encoded = question.split(' ').filter(Boolean).join('%20');

    this.sensorService.getAI(encoded).subscribe({
      next: (response: string) => {
        this.messages.pop(); 
        this.messages.push({ type: 'bot-message', text: response });
        this.loading = false;
      },
      error: () => {
        this.messages.pop();
        this.messages.push({ type: 'bot-message', text: 'Desculpe, houve um erro ao responder.' });
        this.loading = false;
      }
    });
  }
}
