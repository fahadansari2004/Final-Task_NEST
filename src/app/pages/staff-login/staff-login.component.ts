import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './staff-login.component.html',
  styleUrls: ['./staff-login.component.css']
})
export class StaffLoginComponent implements OnInit {
  activePortal: 'admin' | 'manager' = 'admin';
  isRegisterMode = false;
  applicationSubmitted = false;
  submittedManagerEmail = '';
  loginForm!: FormGroup;
  registerForm!: FormGroup;

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    this.route.queryParams.subscribe(params => {
      if (params['role'] === 'manager') {
        this.activePortal = 'manager';
      } else if (params['role'] === 'admin') {
        this.activePortal = 'admin';
      }
      if (params['mode'] === 'register' && this.activePortal === 'manager') {
        this.isRegisterMode = true;
      }
      this.returnUrl = params['returnUrl'] || (this.activePortal === 'admin' ? '/admin' : '/manager');
    });

    this.initForms();
  }

  private initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(7)]],
      branch: ['Main Flagship Kitchen', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  selectPortal(portal: 'admin' | 'manager'): void {
    this.activePortal = portal;
    this.errorMessage = '';
    this.successMessage = '';
    this.applicationSubmitted = false;

    // Admin has ONLY 1 master login, no registration
    if (portal === 'admin') {
      this.isRegisterMode = false;
    }

    this.returnUrl = portal === 'admin' ? '/admin' : '/manager';
    this.loginForm.reset({
      email: '',
      password: ''
    });
  }

  toggleMode(mode: 'login' | 'register'): void {
    if (this.activePortal === 'admin' && mode === 'register') {
      return; // Single admin only
    }
    this.isRegisterMode = mode === 'register';
    this.applicationSubmitted = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onStaffLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, password } = this.loginForm.value;
    const res = await this.supabaseService.staffSignIn(email, password, this.activePortal);

    this.isLoading = false;

    if (!res.success) {
      this.errorMessage = res.error || 'Login failed. Please verify credentials.';
    } else {
      this.successMessage = `Authentication confirmed! Welcome to the ${this.activePortal === 'admin' ? 'Admin Portal' : 'Manager Desk'}.`;
      setTimeout(() => {
        const dest = this.returnUrl || (this.activePortal === 'admin' ? '/admin' : '/manager');
        this.router.navigateByUrl(dest);
      }, 700);
    }
  }

  async onManagerRegister(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { fullName, email, phone, branch, password } = this.registerForm.value;
    const res = await this.supabaseService.registerManagerApplication({
      fullName,
      email,
      phone,
      branch,
      password
    });

    this.isLoading = false;

    if (!res.success) {
      this.errorMessage = res.error || 'Failed to submit manager application.';
    } else {
      this.applicationSubmitted = true;
      this.submittedManagerEmail = email;
      this.loginForm.patchValue({ email, password });
      this.registerForm.reset({ branch: 'Main Flagship Kitchen' });
    }
  }

  goToLoginAfterApplication(): void {
    this.applicationSubmitted = false;
    this.isRegisterMode = false;
    this.errorMessage = '';
    this.successMessage = 'Your application is registered. Once the Administrator approves it in the Admin Panel, you will be able to log in!';
  }
}

