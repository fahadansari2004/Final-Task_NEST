import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})
export class ReservationComponent implements OnInit {
  bookingForm!: FormGroup;
  isBooked = false;
  isSending = false;
  bookingCode = '';
  minDate = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Set min date to today's date (YYYY-MM-DD)
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); 
    const yyyy = today.getFullYear();
    this.minDate = `${yyyy}-${mm}-${dd}`;

    this.bookingForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{8,15}$/)]],
      date: ['', Validators.required],
      time: ['', Validators.required],
      guests: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
      requests: ['']
    });

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }

  onSubmit(): void {
    if (this.bookingForm.valid) {
      this.isSending = true;
      // Simulate booking API
      setTimeout(() => {
        this.isSending = false;
        this.isBooked = true;
        // Generate random uppercase booking code
        this.bookingCode = 'FH-' + Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
      }, 1500);
    } else {
      this.markFormGroupTouched(this.bookingForm);
    }
  }

  resetBooking(): void {
    this.isBooked = false;
    this.bookingForm.reset({
      guests: 2
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
