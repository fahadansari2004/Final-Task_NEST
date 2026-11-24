import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FoodService, Recipe } from '../../services/food.service';
import { FoodCardComponent } from '../../components/food-card/food-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FoodCardComponent, FormsModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, OnDestroy {
  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  categories: string[] = [];
  
  selectedCategory = 'All';
  searchQuery = '';
  searchSubject = new Subject<string>();
  onlyAvailable = false;
  
  isLoading = true;
  currentPage = 1;
  pageSize = 9;
  totalPages = 1;
  paginatedRecipes: Recipe[] = [];
  
  private routeSub!: Subscription;
  private searchSub!: Subscription;

  constructor(
    private foodService: FoodService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Fetch categories
    this.foodService.getCategories().subscribe(cats => this.categories = cats);

    // Setup debounce search
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filterRecipes();
    });

    // Check query params for category filter
    this.routeSub = this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      } else {
        this.selectedCategory = 'All';
      }
      this.loadAllRecipes();
    });
  }

  loadAllRecipes(): void {
    this.isLoading = true;
    this.foodService.getRecipes().subscribe({
      next: (recipes) => {
        this.recipes = recipes;
        this.filterRecipes();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching recipes', err);
        this.isLoading = false;
      }
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  toggleOnlyAvailable(): void {
    this.onlyAvailable = !this.onlyAvailable;
    this.filterRecipes();
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category === 'All' ? null : category },
      queryParamsHandling: 'merge'
    });
    this.filterRecipes();
  }

  filterRecipes(): void {
    let result = this.recipes;

    // Apply category filter
    if (this.selectedCategory !== 'All') {
      result = result.filter(r => r.category.toLowerCase() === this.selectedCategory.toLowerCase());
    }

    // Apply available only filter
    if (this.onlyAvailable) {
      result = result.filter(r => r.is_available !== false);
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.cuisine.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    this.filteredRecipes = result;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRecipes.length / this.pageSize);
    if (this.totalPages < 1) this.totalPages = 1;
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedRecipes = this.filteredRecipes.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      
      if (typeof window !== 'undefined') {
        const offset = 220; // Scroll below the header
        const element = document.getElementById('menu-listing');
        if (element) {
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.searchSub) this.searchSub.unsubscribe();
  }
}
