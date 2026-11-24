import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

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

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    // Set min date to today's date (YYYY-MM-DD)
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); 
    const yyyy = today.getFullYear();
    this.minDate = `${yyyy}-${mm}-${dd}`;

    const profile = this.supabaseService.getCurrentProfile();
    const user = this.supabaseService.getCurrentUser();

    this.bookingForm = this.fb.group({
      name: [profile?.full_name || '', [Validators.required, Validators.minLength(2)]],
      email: [user?.email || profile?.email || '', [Validators.required, Validators.email]],
      phone: [profile?.phone || '', [Validators.required, Validators.pattern(/^[0-9+\s-]{8,15}$/)]],
      date: ['', Validators.required],
      time: ['', Validators.required],
      guests: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
      requests: ['']
    });

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.bookingForm.valid) {
      this.isSending = true;
      const val = this.bookingForm.value;
      const code = 'FH-' + Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();

      if (this.supabaseService.isConfigured()) {
        await this.supabaseService.createReservation({
          booking_code: code,
          name: val.name,
          email: val.email,
          phone: val.phone,
          reservation_date: val.date,
          reservation_time: val.time,
          guests: val.guests,
          special_requests: val.requests || ''
        });
      }

      this.isSending = false;
      this.isBooked = true;
      this.bookingCode = code;
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
