import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Recipe } from '../../services/food.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-food-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './food-card.component.html',
  styleUrls: ['./food-card.component.css']
})
export class FoodCardComponent {
  @Input() recipe!: Recipe;

  constructor(private cartService: CartService) {}

  addToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.cartService.addToCart(this.recipe);
  }
}
