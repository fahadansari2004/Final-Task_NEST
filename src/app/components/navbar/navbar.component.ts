import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  cartCount = 0;
  private cartSub!: Subscription;
  isScrolled = false;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartSub = this.cartService.getCart().subscribe(items => {
      this.cartCount = this.cartService.getTotalQuantity();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.checkScroll);
    }
  }

  ngOnDestroy(): void {
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.checkScroll);
    }
  }

  checkScroll = (): void => {
    this.isScrolled = window.scrollY > 30;
  };
}
