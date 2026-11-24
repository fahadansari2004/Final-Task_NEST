import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  returnUrl = '/profile';

  // Config helper
  isConfigured = false;
  showConfigModal = false;
  configUrl = '';
  configKey = '';

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

    this.isConfigured = this.supabaseService.isConfigured();
    const active = this.supabaseService.getActiveConfig();
    this.configUrl = active.url.includes('YOUR_SUPABASE') ? '' : active.url;
    this.configKey = active.key.includes('YOUR_SUPABASE') ? '' : active.key;

    // Check if user is already logged in
    if (this.supabaseService.getCurrentUser()) {
      this.router.navigate(['/profile']);
      return;
    }

    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
      if (params['mode'] === 'signup') {
        this.isLoginMode = false;
      }
    });

    this.initForms();
  }

  private initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  toggleMode(mode: 'login' | 'signup'): void {
    this.isLoginMode = mode === 'login';
    this.errorMessage = '';
    this.successMessage = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (!this.supabaseService.isConfigured()) {
      this.errorMessage = 'Supabase credentials are required. Please configure your Supabase URL & Anon Key below.';
      this.showConfigModal = true;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, password } = this.loginForm.value;
    const { data, error } = await this.supabaseService.signIn(email, password);

    this.isLoading = false;

    if (error) {
      this.errorMessage = error.message || 'Login failed. Please check your credentials.';
    } else if (data.user) {
      this.successMessage = 'Welcome back! Redirecting...';
      setTimeout(() => {
        const staffRole = this.supabaseService.getStaffRole();
        if (staffRole === 'admin' || data.user.email?.includes('admin')) {
          this.router.navigate(['/admin']);
        } else if (staffRole === 'manager' || data.user.email?.includes('manager')) {
          this.router.navigate(['/manager']);
        } else {
          this.router.navigateByUrl(this.returnUrl);
        }
      }, 700);
    }
  }

  fillCredentials(email: string, pass: string): void {
    this.isLoginMode = true;
    this.loginForm.patchValue({ email, password: pass });
    this.errorMessage = '';
  }

  async onSignup(): Promise<void> {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const { fullName, email, password, confirmPassword } = this.signupForm.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (!this.supabaseService.isConfigured()) {
      this.errorMessage = 'Supabase credentials are required. Please configure your Supabase URL & Anon Key below.';
      this.showConfigModal = true;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { data, error } = await this.supabaseService.signUp(email, password, fullName);

    this.isLoading = false;

    if (error) {
      this.errorMessage = error.message || 'Registration failed. Please try again.';
    } else {
      if (data?.session) {
        this.successMessage = 'Account created successfully! Redirecting...';
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 1200);
      } else {
        // Email confirmation enabled in Supabase project
        this.successMessage = 'Account created! If email confirmation is required by your Supabase project, please check your inbox to verify your email, or sign in now.';
        this.isLoginMode = true;
      }
    }
  }

  saveConfig(): void {
    if (!this.configUrl || !this.configKey) {
      this.errorMessage = 'Please enter both Supabase URL and Anon Key.';
      return;
    }

    this.supabaseService.setCustomCredentials(this.configUrl, this.configKey);
    this.isConfigured = this.supabaseService.isConfigured();
    this.showConfigModal = false;
    this.successMessage = 'Supabase credentials connected successfully! You can now log in or sign up.';
  }
}
