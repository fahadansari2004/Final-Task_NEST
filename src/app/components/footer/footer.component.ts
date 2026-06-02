import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  email = '';
  isSubscribed = false;

  subscribeNewsletter(event: Event): void {
    event.preventDefault();
    if (this.email.trim()) {
      this.isSubscribed = true;
      this.email = '';
      setTimeout(() => {
        this.isSubscribed = false;
      }, 5000);
    }
  }
}
