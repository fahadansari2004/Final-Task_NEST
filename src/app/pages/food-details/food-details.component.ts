import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FoodService, Recipe } from '../../services/food.service';
import { CartService } from '../../services/cart.service';
import { FoodCardComponent } from '../../components/food-card/food-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-food-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FoodCardComponent, FormsModule],
  templateUrl: './food-details.component.html',
  styleUrls: ['./food-details.component.css']
})
export class FoodDetailsComponent implements OnInit, OnDestroy {
  recipe: Recipe | undefined;
  similarRecipes: Recipe[] = [];
  quantity = 1;
  isLoading = true;
  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private foodService: FoodService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Subscribe to paramMap to watch for route changes (e.g. clicking similar food details)
    this.routeSub = this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        this.loadRecipeDetails(id);
      }
    });
  }

  loadRecipeDetails(id: number): void {
    this.isLoading = true;
    this.quantity = 1; // Reset quantity on recipe switch
    
    this.foodService.getRecipeById(id).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        if (recipe) {
          this.loadSimilarRecipes(recipe.category, recipe.id);
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error(`Error loading recipe ID ${id}`, err);
        this.isLoading = false;
      }
    });
  }

  loadSimilarRecipes(category: string, excludeId: number): void {
    this.foodService.getSimilarRecipes(category, excludeId, 3).subscribe({
      next: (recipes) => {
        this.similarRecipes = recipes;
        this.isLoading = false;
        // Scroll window back to top on page load
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      error: (err) => {
        console.error('Error fetching similar recipes', err);
        this.isLoading = false;
      }
    });
  }

  incrementQuantity(): void {
    this.quantity++;
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.recipe && this.recipe.is_available !== false) {
      this.cartService.addToCart(this.recipe, this.quantity);
    }
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
