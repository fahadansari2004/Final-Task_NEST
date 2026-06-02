import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  
  private cartSub!: Subscription;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.freeDeliveryThreshold = this.cartService.FREE_DELIVERY_THRESHOLD;
    
    this.cartSub = this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
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

  checkout(): void {
    this.isCheckingOut = true;
    
    setTimeout(() => {
      this.isCheckingOut = false;
      this.orderCompleted = true;
      this.bookingRef = 'ORD-' + Math.floor(100000 + Math.random() * 900000).toString().toUpperCase();
      this.cartService.clearCart();
    }, 2000);
  }

  resetOrderState(): void {
    this.orderCompleted = false;
  }

  ngOnDestroy(): void {
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
  }
}
