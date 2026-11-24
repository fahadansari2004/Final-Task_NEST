import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupabaseService, UserProfile, OrderRecord } from '../../services/supabase.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  activeTab: 'profile' | 'orders' = 'profile';

  profileForm!: FormGroup;
  currentUserProfile: UserProfile | null = null;
  userEmail = '';
  
  orders: OrderRecord[] = [];
  isLoadingOrders = false;
  isSavingProfile = false;
  isRefreshing = false;
  
  profileSuccess = '';
  profileError = '';
  ordersError = '';

  private authSub!: Subscription;
  private ordersChangeSub?: Subscription;
  private pollInterval?: any;
  private storageEventListener?: (e: StorageEvent) => void;
  private customOrderEventListener?: (e: any) => void;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    this.initForm();

    this.authSub = this.supabaseService.currentUser$.subscribe(user => {
      if (!user) {
        // Redirect to login if not authenticated
        this.router.navigate(['/auth'], { queryParams: { returnUrl: '/profile' } });
      } else {
        this.userEmail = user.email || '';
        this.loadProfile();
        this.loadOrders(true);
      }
    });

    // Also subscribe to profile updates
    this.supabaseService.currentProfile$.subscribe(profile => {
      if (profile) {
        this.currentUserProfile = profile;
        this.populateForm(profile);
      }
    });

    // 1. Subscribe to RxJS order status updates
    this.ordersChangeSub = this.supabaseService.ordersChanged$.subscribe(change => {
      if (change) {
        this.loadOrders(false);
      }
    });

    // 2. Setup cross-tab and cross-window listeners
    if (typeof window !== 'undefined') {
      this.storageEventListener = (e: StorageEvent) => {
        if (
          e.key === 'fh_orders_last_updated' ||
          e.key === 'fh_local_orders' ||
          e.key === 'fh_order_status_overrides'
        ) {
          this.loadOrders(false);
        }
      };
      window.addEventListener('storage', this.storageEventListener);

      this.customOrderEventListener = () => {
        this.loadOrders(false);
      };
      window.addEventListener('fh_orders_changed', this.customOrderEventListener);

      // 3. Setup light background poll (every 4 seconds) to detect status changes across incognito/normal windows
      this.pollInterval = setInterval(() => {
        if (this.activeTab === 'orders') {
          this.loadOrders(false);
        }
      }, 4000);
    }
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^[0-9+\s-]{8,15}$/)]],
      address: ['']
    });
  }

  private populateForm(profile: UserProfile): void {
    this.profileForm.patchValue({
      fullName: profile.full_name || '',
      phone: profile.phone || '',
      address: profile.address || ''
    });
  }

  async loadProfile(): Promise<void> {
    const user = this.supabaseService.getCurrentUser();
    if (user) {
      const profile = await this.supabaseService.fetchProfile(user.id);
      if (profile) {
        this.currentUserProfile = profile;
        this.populateForm(profile);
      }
    }
  }

  async loadOrders(showSpinner = false): Promise<void> {
    if (showSpinner) {
      this.isLoadingOrders = true;
    }
    this.ordersError = '';

    const { data, error } = await this.supabaseService.getUserOrders();
    if (showSpinner) {
      this.isLoadingOrders = false;
    }

    if (error) {
      console.warn('Orders fetch error:', error);
      if (this.orders.length === 0) {
        this.ordersError = 'Could not load your orders. Ensure the Supabase database schema is executed.';
      }
    } else if (data) {
      this.orders = data;
    }
  }

  async refreshOrders(): Promise<void> {
    this.isRefreshing = true;
    await this.loadOrders(false);
    setTimeout(() => {
      this.isRefreshing = false;
    }, 600);
  }

  setTab(tab: 'profile' | 'orders'): void {
    this.activeTab = tab;
    if (tab === 'orders') {
      this.loadOrders(true);
    }
  }

  // --- Status UI Helpers ---

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Confirmed':
        return 'status-badge-gold';
      case 'Preparing':
      case 'In Kitchen':
        return 'status-badge-cyan';
      case 'Out for Delivery':
        return 'status-badge-purple';
      case 'Delivered':
        return 'status-badge-green';
      case 'Cancelled':
        return 'status-badge-red';
      default:
        return 'status-badge-default';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Confirmed':
        return 'fa-solid fa-clock-rotate-left';
      case 'Preparing':
      case 'In Kitchen':
        return 'fa-solid fa-fire-burner';
      case 'Out for Delivery':
        return 'fa-solid fa-motorcycle';
      case 'Delivered':
        return 'fa-solid fa-circle-check';
      case 'Cancelled':
        return 'fa-solid fa-circle-xmark';
      default:
        return 'fa-solid fa-bell';
    }
  }

  getStatusStepIndex(status: string): number {
    switch (status) {
      case 'Confirmed':
        return 1;
      case 'Preparing':
      case 'In Kitchen':
        return 2;
      case 'Out for Delivery':
        return 3;
      case 'Delivered':
        return 4;
      case 'Cancelled':
        return -1;
      default:
        return 1;
    }
  }

  async onSaveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile = true;
    this.profileSuccess = '';
    this.profileError = '';

    const { fullName, phone, address } = this.profileForm.value;

    const { error } = await this.supabaseService.updateProfile({
      full_name: fullName,
      phone,
      address
    });

    this.isSavingProfile = false;

    if (error) {
      this.profileError = error.message || 'Failed to update profile.';
    } else {
      this.profileSuccess = 'Profile details saved successfully!';
      setTimeout(() => {
        this.profileSuccess = '';
      }, 4000);
    }
  }

  reorderItems(order: OrderRecord): void {
    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach(item => {
        const recipe: any = {
          id: item.recipe_id,
          name: item.recipe_name,
          price: item.price,
          image: item.recipe_image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
          category: 'Order History',
          difficulty: 'Easy',
          prepTimeMinutes: 15,
          rating: 4.8
        };
        this.cartService.addToCart(recipe, item.quantity);
      });

      this.router.navigate(['/cart']);
    }
  }

  async onSignOut(): Promise<void> {
    await this.supabaseService.signOut();
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    if (this.ordersChangeSub) {
      this.ordersChangeSub.unsubscribe();
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (typeof window !== 'undefined') {
      if (this.storageEventListener) {
        window.removeEventListener('storage', this.storageEventListener);
      }
      if (this.customOrderEventListener) {
        window.removeEventListener('fh_orders_changed', this.customOrderEventListener);
      }
    }
  }
}

