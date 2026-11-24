import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../services/cart.service';
import { SupabaseService, UserProfile } from '../../services/supabase.service';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  subtotal = 0;
  tax = 0;
  deliveryFee = 0;
  grandTotal = 0;
  freeDeliveryThreshold = 0;
  
  isCheckingOut = false;
  orderCompleted = false;
  bookingRef = '';
  orderError = '';
  
  showCheckoutModal = false;
  checkoutForm!: FormGroup;

  currentUser: User | null = null;
  userProfile: UserProfile | null = null;

  private cartSub!: Subscription;
  private authSub!: Subscription;
  private profileSub!: Subscription;

  constructor(
    private cartService: CartService,
    private supabaseService: SupabaseService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.freeDeliveryThreshold = this.cartService.FREE_DELIVERY_THRESHOLD;
    
    this.cartSub = this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });

    this.initCheckoutForm();

    this.authSub = this.supabaseService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user && this.checkoutForm) {
        this.checkoutForm.patchValue({
          email: user.email || ''
        });
      }
    });

    this.profileSub = this.supabaseService.currentProfile$.subscribe(profile => {
      this.userProfile = profile;
      if (profile && this.checkoutForm) {
        this.checkoutForm.patchValue({
          name: profile.full_name || '',
          phone: profile.phone || '',
          address: profile.address || ''
        });
      }
    });

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }

  private initCheckoutForm(): void {
    this.checkoutForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{8,15}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      notes: ['']
    });
  }

  calculateTotals(): void {
    this.subtotal = this.cartService.getSubtotal();
    this.tax = this.cartService.getTax();
    this.deliveryFee = this.cartService.getDeliveryFee();
    this.grandTotal = this.cartService.getGrandTotal();
  }

  updateQuantity(recipeId: number, currentQty: number, delta: number): void {
    this.cartService.updateQuantity(recipeId, currentQty + delta);
  }

  removeItem(recipeId: number): void {
    this.cartService.removeFromCart(recipeId);
  }

  getFreeDeliveryProgress(): number {
    if (this.subtotal >= this.freeDeliveryThreshold) {
      return 100;
    }
    return (this.subtotal / this.freeDeliveryThreshold) * 100;
  }

  getRemainingForFreeDelivery(): number {
    return parseFloat((this.freeDeliveryThreshold - this.subtotal).toFixed(2));
  }

  openCheckout(): void {
    if (this.cartItems.length === 0) return;

    if (this.currentUser) {
      this.checkoutForm.patchValue({
        email: this.currentUser.email || '',
        name: this.userProfile?.full_name || '',
        phone: this.userProfile?.phone || '',
        address: this.userProfile?.address || ''
      });
    }

    this.orderError = '';
    this.showCheckoutModal = true;
  }

  closeCheckout(): void {
    this.showCheckoutModal = false;
  }

  async submitOrder(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isCheckingOut = true;
    this.orderError = '';

    const formVal = this.checkoutForm.value;
    const orderRef = 'FH-' + Math.floor(100000 + Math.random() * 900000).toString();

    // Prepare items for DB
    const itemsToSave = this.cartItems.map(item => ({
      recipe_id: item.recipe.id,
      recipe_name: item.recipe.name,
      recipe_image: item.recipe.image,
      price: item.recipe.price,
      quantity: item.quantity
    }));

    const orderPayload = {
      order_ref: orderRef,
      customer_name: formVal.name,
      customer_email: formVal.email,
      customer_phone: formVal.phone,
      delivery_address: formVal.address,
      subtotal: this.subtotal,
      tax: this.tax,
      delivery_fee: this.deliveryFee,
      total_amount: this.grandTotal,
      status: 'Confirmed',
      notes: formVal.notes || '',
      user_id: this.currentUser?.id || null
    };

    const { data, error } = await this.supabaseService.createOrder(orderPayload, itemsToSave);

    if (error) {
      console.warn('Notice from order creation:', error);
    }

    // Success handling
    this.isCheckingOut = false;
    this.bookingRef = orderRef;
    this.showCheckoutModal = false;
    this.orderCompleted = true;
    this.cartService.clearCart();
  }

  resetOrderState(): void {
    this.orderCompleted = false;
  }

  ngOnDestroy(): void {
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    if (this.profileSub) {
      this.profileSub.unsubscribe();
    }
  }
}
