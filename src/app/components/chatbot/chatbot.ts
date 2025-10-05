import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
  standalone: true,
  imports: [CommonModule]
})
export class ChatbotComponent implements OnInit {

  constructor() {}

  ngOnInit(): void {}
}
