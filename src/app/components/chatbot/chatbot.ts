import { Component, OnInit } from '@angular/core';
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
export class ChatbotComponent implements OnInit {
  userInput: string = '';
  messages: { type: 'user-message' | 'bot-message'; text: string }[] = [];
  loading: boolean = false;
  private storageKey = 'falaRoboSessionMessages';

  constructor(private sensorService: SensorService) {}

  ngOnInit(): void {
    const saved = sessionStorage.getItem(this.storageKey);
    if (saved) {
      this.messages = JSON.parse(saved);
    }
  }

  sendMessage(): void {
    const question = this.userInput.trim();
    if (!question || this.loading) return;

    this.messages.push({ type: 'user-message', text: question });
    this.userInput = '';
    this.loading = true;
    this.saveMessages();

    this.messages.push({ type: 'bot-message', text: 'Pensando...' });
    this.saveMessages();

    const encoded = question.split(' ').filter(Boolean).join('%20');

    this.sensorService.getAI(encoded).subscribe({
      next: (response: string) => {
        this.messages.pop();
        this.messages.push({ type: 'bot-message', text: response });
        this.loading = false;
        this.saveMessages();
      },
      error: () => {
        this.messages.pop();
        this.messages.push({ type: 'bot-message', text: 'Desculpe, houve um erro ao responder.' });
        this.loading = false;
        this.saveMessages();
      }
    });
  }

  private saveMessages(): void {
    sessionStorage.setItem(this.storageKey, JSON.stringify(this.messages));
  }
}
