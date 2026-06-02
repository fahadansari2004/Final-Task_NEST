import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Recipe } from './food.service';

export interface CartItem {
  recipe: Recipe;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  
  // Constants for fee structure
  readonly TAX_RATE = 0.08; // 8% sales tax
  readonly DELIVERY_FEE = 5.00; // Flat delivery fee
  readonly FREE_DELIVERY_THRESHOLD = 50.00;

  constructor() {
    this.loadCartFromStorage();
  }

  // Load cart from LocalStorage
  private loadCartFromStorage(): void {
    try {
      const stored = localStorage.getItem('foodie_cart');
      if (stored) {
        this.cartItems = JSON.parse(stored);
        this.cartItemsSubject.next([...this.cartItems]);
      }
    } catch (e) {
      console.error('Failed to parse cart items from localStorage', e);
      this.cartItems = [];
    }
  }

  // Save cart to LocalStorage
  private saveCartToStorage(): void {
    try {
      localStorage.setItem('foodie_cart', JSON.stringify(this.cartItems));
      this.cartItemsSubject.next([...this.cartItems]);
    } catch (e) {
      console.error('Failed to save cart items to localStorage', e);
    }
  }

  // Get reactive cart items observable
  getCart(): Observable<CartItem[]> {
    return this.cartItemsSubject.asObservable();
  }

  // Get current snapshot of cart items
  getSnapshot(): CartItem[] {
    return [...this.cartItems];
  }

  // Add item to cart
  addToCart(recipe: Recipe, quantity: number = 1): void {
    const existing = this.cartItems.find(item => item.recipe.id === recipe.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cartItems.push({ recipe, quantity });
    }
    this.saveCartToStorage();
    this.triggerToast(`${recipe.name} added to cart`);
  }

  // Update item quantity
  updateQuantity(recipeId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(recipeId);
      return;
    }
    const item = this.cartItems.find(item => item.recipe.id === recipeId);
    if (item) {
      item.quantity = quantity;
      this.saveCartToStorage();
    }
  }

  // Remove item from cart
  removeFromCart(recipeId: number): void {
    const idx = this.cartItems.findIndex(item => item.recipe.id === recipeId);
    if (idx !== -1) {
      const name = this.cartItems[idx].recipe.name;
      this.cartItems.splice(idx, 1);
      this.saveCartToStorage();
      this.triggerToast(`${name} removed from cart`);
    }
  }

  // Clear all items in cart
  clearCart(): void {
    this.cartItems = [];
    this.saveCartToStorage();
  }

  // Get total quantity in cart
  getTotalQuantity(): number {
    return this.cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }

  // Get subtotal price
  getSubtotal(): number {
    return parseFloat(this.cartItems.reduce((acc, item) => acc + (item.recipe.price * item.quantity), 0).toFixed(2));
  }

  // Get sales tax
  getTax(): number {
    return parseFloat((this.getSubtotal() * this.TAX_RATE).toFixed(2));
  }

  // Get delivery fee
  getDeliveryFee(): number {
    const subtotal = this.getSubtotal();
    if (subtotal === 0 || subtotal >= this.FREE_DELIVERY_THRESHOLD) {
      return 0.00;
    }
    return this.DELIVERY_FEE;
  }

  // Get grand total
  getGrandTotal(): number {
    return parseFloat((this.getSubtotal() + this.getTax() + this.getDeliveryFee()).toFixed(2));
  }

  // Simple animated micro-toast notification helper
  private triggerToast(message: string): void {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '24px';
      container.style.right = '24px';
      container.style.zIndex = '9999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-alert';
    toast.style.background = 'rgba(18, 18, 22, 0.95)';
    toast.style.color = '#f5f5f7';
    toast.style.border = '1px solid #c5a880';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '30px';
    toast.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(197, 168, 128, 0.2)';
    toast.style.fontFamily = "'Outfit', sans-serif";
    toast.style.fontWeight = '500';
    toast.style.fontSize = '0.9rem';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #c5a880;"></i> <span>${message}</span>`;
    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 50);

    // Animate out
    setTimeout(() => {
      toast.style.transform = 'translateY(-20px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3000);
  }
}
