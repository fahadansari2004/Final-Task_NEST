import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { SupabaseService, UserProfile } from '../../services/supabase.service';
import { Subscription } from 'rxjs';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  cartCount = 0;
  currentUser: User | null = null;
  userProfile: UserProfile | null = null;
  private cartSub!: Subscription;
  private authSub!: Subscription;
  private profileSub!: Subscription;
  isScrolled = false;

  constructor(
    private cartService: CartService,
    public supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartSub = this.cartService.getCart().subscribe(items => {
      this.cartCount = this.cartService.getTotalQuantity();
    });

    this.authSub = this.supabaseService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.profileSub = this.supabaseService.currentProfile$.subscribe(profile => {
      this.userProfile = profile;
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.checkScroll);
    }
  }

  async signOut(): Promise<void> {
    await this.supabaseService.signOut();
    this.router.navigate(['/']);
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
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.checkScroll);
    }
  }

  checkScroll = (): void => {
    this.isScrolled = window.scrollY > 30;
  };
}
