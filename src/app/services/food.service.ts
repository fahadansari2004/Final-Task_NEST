import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, from, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  caloriesPerServing: number;
  tags: string[];
  image: string;
  rating: number;
  reviewCount: number;
  mealType: string[];
  price: number;
  category: string;
  is_available?: boolean;
  is_featured?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private apiUrl = 'https://dummyjson.com/recipes';
  private itemsChangedSubject = new BehaviorSubject<void>(undefined);
  itemsChanged$ = this.itemsChangedSubject.asObservable();

  // Mock Drinks because dummyjson has very few/no beverage items
  private mockDrinks: Recipe[] = [
    {
      id: 201,
      name: "Luxury Gold Flake Cappuccino",
      ingredients: ["Espresso shot", "Steamed organic milk", "Edible gold flakes", "Cinnamon dusting"],
      instructions: [
        "Pull a double shot of premium espresso.",
        "Froth organic milk to micro-foam consistency.",
        "Pour milk over espresso creating custom latte art.",
        "Gently place edible 24k gold flakes on top and dust with cinnamon."
      ],
      prepTimeMinutes: 5,
      cookTimeMinutes: 2,
      servings: 1,
      difficulty: "Medium",
      cuisine: "Italian",
      caloriesPerServing: 120,
      tags: ["Drinks", "Coffee", "Hot"],
      image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=600",
      rating: 4.9,
      reviewCount: 154,
      mealType: ["Breakfast", "Snack"],
      price: 9.99,
      category: "Drinks",
      is_available: true
    },
    {
      id: 202,
      name: "Premium Mango Mint Cooler",
      ingredients: ["Fresh Alphonso mango pulp", "Mint leaves", "Sparkling water", "Lime juice", "Agave nectar"],
      instructions: [
        "Muddle fresh mint leaves with lime juice and agave nectar in a shaker.",
        "Add mango pulp and ice, shake vigorously.",
        "Strain into a tall glass filled with crushed ice.",
        "Top up with sparkling water and garnish with a mint sprig."
      ],
      prepTimeMinutes: 5,
      cookTimeMinutes: 0,
      servings: 1,
      difficulty: "Easy",
      cuisine: "Indian",
      caloriesPerServing: 150,
      tags: ["Drinks", "Mocktail", "Cold"],
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600",
      rating: 4.8,
      reviewCount: 88,
      mealType: ["Lunch", "Dinner"],
      price: 7.99,
      category: "Drinks",
      is_available: true
    },
    {
      id: 203,
      name: "Smoked Rosemary Berry Mocktail",
      ingredients: ["Blackberry puree", "Fresh rosemary sprig", "Tonic water", "Lemon juice", "Honey syrup"],
      instructions: [
        "Torch a fresh rosemary sprig until smoking and cover with a glass to capture the aroma.",
        "Mix blackberry puree, lemon juice, and honey in a shaker with ice.",
        "Turn over the smoked glass, fill with ice, and pour the strained mixture.",
        "Top with tonic water and garnish with the charred rosemary."
      ],
      prepTimeMinutes: 7,
      cookTimeMinutes: 1,
      servings: 1,
      difficulty: "Hard",
      cuisine: "Fusion",
      caloriesPerServing: 95,
      tags: ["Drinks", "Mocktail", "Signature"],
      image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=600",
      rating: 5.0,
      reviewCount: 42,
      mealType: ["Dinner"],
      price: 11.99,
      category: "Drinks",
      is_available: true
    },
    {
      id: 204,
      name: "Iced Ceremonial Matcha Latte",
      ingredients: ["Ceremonial grade Uji Matcha", "Hot water (80°C)", "Almond milk", "Vanilla extract", "Honey"],
      instructions: [
        "Whisk matcha powder with hot water in a traditional bowl using a bamboo whisk until frothy.",
        "Stir vanilla extract and honey into cold almond milk.",
        "Fill a glass with ice cubes, pour the milk, and gently layer the whisked matcha on top."
      ],
      prepTimeMinutes: 4,
      cookTimeMinutes: 0,
      servings: 1,
      difficulty: "Medium",
      cuisine: "Japanese",
      caloriesPerServing: 80,
      tags: ["Drinks", "Matcha", "Cold"],
      image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=600",
      rating: 4.7,
      reviewCount: 96,
      mealType: ["Breakfast", "Snack"],
      price: 8.49,
      category: "Drinks",
      is_available: true
    },
    {
      id: 205,
      name: "Organic Ginger Lemongrass Iced Tea",
      ingredients: ["Fresh lemongrass stalk", "Ginger root slices", "Black tea leaves", "Lemon slices", "Wildflower honey"],
      instructions: [
        "Boil lemongrass and ginger slices in water for 10 minutes.",
        "Add black tea leaves, remove from heat, and let steep for 5 minutes.",
        "Strain, stir in honey, and let it cool completely.",
        "Serve over ice with fresh lemon wheels."
      ],
      prepTimeMinutes: 10,
      cookTimeMinutes: 10,
      servings: 2,
      difficulty: "Easy",
      cuisine: "Thai",
      caloriesPerServing: 60,
      tags: ["Drinks", "Tea", "Cold"],
      image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=600",
      rating: 4.6,
      reviewCount: 71,
      mealType: ["Lunch", "Dinner"],
      price: 6.99,
      category: "Drinks",
      is_available: true
    }
  ];

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService
  ) {}

  getAvailabilityOverrides(): Record<number, boolean> {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('fh_food_availability_map') || '{}');
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  setAvailability(id: number, isAvailable: boolean): void {
    if (typeof window !== 'undefined') {
      try {
        const overrides = this.getAvailabilityOverrides();
        overrides[id] = isAvailable;
        localStorage.setItem('fh_food_availability_map', JSON.stringify(overrides));
      } catch (e) {}
    }
    this.itemsChangedSubject.next();
  }

  // Helper to map and enrich recipes with Price and clean Category tags
  private enrichRecipe(recipe: any): Recipe {
    const baseTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
    const price = recipe.price !== undefined 
      ? Number(recipe.price) 
      : (baseTime > 0 ? parseFloat((baseTime * 0.22 + 7.99).toFixed(2)) : 12.99);

    let category = recipe.category || 'Others';
    const nameLower = (recipe.name || '').toLowerCase();
    const tagsLower = (recipe.tags || []).map((t: string) => t.toLowerCase());

    if (!recipe.category || recipe.category === 'Others') {
      if (tagsLower.includes('pizza') || nameLower.includes('pizza')) {
        category = 'Pizza';
      } else if (tagsLower.includes('burger') || nameLower.includes('burger') || nameLower.includes('sandwich')) {
        category = 'Burgers';
      } else if (tagsLower.includes('pasta') || nameLower.includes('pasta') || nameLower.includes('spaghetti') || nameLower.includes('macaroni')) {
        category = 'Pasta';
      } else if (tagsLower.includes('dessert') || tagsLower.includes('sweet') || nameLower.includes('dessert') || nameLower.includes('cake') || nameLower.includes('cookie') || nameLower.includes('pudding')) {
        category = 'Desserts';
      } else if (tagsLower.includes('beverage') || tagsLower.includes('drink') || nameLower.includes('drink') || nameLower.includes('shake') || nameLower.includes('smoothie')) {
        category = 'Drinks';
      }
    }

    const overrides = this.getAvailabilityOverrides();
    const isAvailable = overrides[recipe.id] !== undefined
      ? overrides[recipe.id]
      : (recipe.is_available !== false);

    return {
      id: Number(recipe.id),
      name: recipe.name || 'Delicious Dish',
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
      prepTimeMinutes: recipe.prep_time_minutes || recipe.prepTimeMinutes || 15,
      cookTimeMinutes: recipe.cook_time_minutes || recipe.cookTimeMinutes || 15,
      servings: recipe.servings || 2,
      difficulty: recipe.difficulty || 'Easy',
      cuisine: recipe.cuisine || 'International',
      caloriesPerServing: recipe.calories_per_serving || recipe.caloriesPerServing || 350,
      tags: Array.isArray(recipe.tags) ? recipe.tags : [category],
      image: recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
      rating: Number(recipe.rating || 4.8),
      reviewCount: Number(recipe.review_count || recipe.reviewCount || 10),
      mealType: Array.isArray(recipe.meal_type || recipe.mealType) ? (recipe.meal_type || recipe.mealType) : ['Lunch', 'Dinner'],
      price,
      category,
      is_available: isAvailable,
      is_featured: Boolean(recipe.is_featured)
    };
  }

  // Get all recipes (DummyJSON recipes + mock drinks + admin custom recipes from Supabase/Local)
  getRecipes(): Observable<Recipe[]> {
    return from(this.supabaseService.getCustomFoodItems()).pipe(
      switchMap(customItems => {
        const parsedCustom: Recipe[] = customItems.map(c => this.enrichRecipe(c));

        return this.http.get<{ recipes: any[] }>(`${this.apiUrl}?limit=100`).pipe(
          map(res => {
            const enriched = res.recipes.map(r => this.enrichRecipe(r));
            // Custom items first, then mock drinks, then dummyjson
            return [...parsedCustom, ...this.mockDrinks.map(d => this.enrichRecipe(d)), ...enriched];
          }),
          catchError(err => {
            console.warn('API error, returning custom and mock items', err);
            return of([...parsedCustom, ...this.mockDrinks.map(d => this.enrichRecipe(d))]);
          })
        );
      })
    );
  }

  // Get featured recipes (rating >= 4.8 or flagged as featured, prioritizing available items)
  getFeaturedRecipes(limit: number = 3): Observable<Recipe[]> {
    return this.getRecipes().pipe(
      map(recipes => {
        const availableFeatured = recipes.filter(r => r.is_available !== false && (r.is_featured || r.rating >= 4.8));
        if (availableFeatured.length >= limit) {
          return availableFeatured.slice(0, limit);
        }
        const available = recipes.filter(r => r.is_available !== false);
        return available.slice(0, limit);
      })
    );
  }

  // Get unique categories list
  getCategories(): Observable<string[]> {
    return this.getRecipes().pipe(
      map(recipes => {
        const base = ['All', 'Pizza', 'Burgers', 'Pasta', 'Desserts', 'Drinks'];
        const additional = recipes
          .map(r => r.category)
          .filter(c => c && !base.includes(c));
        return [...base, ...Array.from(new Set(additional))];
      })
    );
  }

  // Get recipes by category
  getRecipesByCategory(category: string): Observable<Recipe[]> {
    if (!category || category === 'All') {
      return this.getRecipes();
    }
    return this.getRecipes().pipe(
      map(recipes => recipes.filter(r => r.category.toLowerCase() === category.toLowerCase()))
    );
  }

  // Get recipe by ID
  getRecipeById(id: number): Observable<Recipe | undefined> {
    return from(this.supabaseService.getCustomFoodItems()).pipe(
      switchMap(customItems => {
        const foundCustom = customItems.find((c: any) => Number(c.id) === Number(id));
        if (foundCustom) {
          return of(this.enrichRecipe(foundCustom));
        }

        if (id >= 200 && id < 300) {
          const drink = this.mockDrinks.find(d => d.id === id);
          return of(drink);
        }

        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
          map(res => this.enrichRecipe(res)),
          catchError(err => {
            console.error(`Error fetching recipe ID ${id}`, err);
            return of(undefined);
          })
        );
      })
    );
  }

  // Get similar recipes based on category
  getSimilarRecipes(category: string, excludeId: number, limit: number = 4): Observable<Recipe[]> {
    return this.getRecipesByCategory(category).pipe(
      map(recipes => recipes.filter(r => r.id !== excludeId).slice(0, limit))
    );
  }

  // Search recipes
  searchRecipes(query: string): Observable<Recipe[]> {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) {
      return this.getRecipes();
    }
    return this.getRecipes().pipe(
      map(recipes => recipes.filter(r => 
        r.name.toLowerCase().includes(cleanQuery) || 
        r.cuisine.toLowerCase().includes(cleanQuery) ||
        r.category.toLowerCase().includes(cleanQuery) ||
        r.tags.some(t => t.toLowerCase().includes(cleanQuery))
      ))
    );
  }

  // Admin: Add new food item
  addFoodItem(item: Partial<Recipe>): Observable<Recipe> {
    return from(this.supabaseService.addCustomFoodItem(item)).pipe(
      map(saved => {
        this.itemsChangedSubject.next();
        return this.enrichRecipe(saved);
      })
    );
  }

  // Admin: Update food item
  updateFoodItem(id: number, item: Partial<Recipe>): Observable<Recipe> {
    if (item.is_available !== undefined) {
      this.setAvailability(id, item.is_available);
    }
    return from(this.supabaseService.updateCustomFoodItem(id, item)).pipe(
      map(updated => {
        this.itemsChangedSubject.next();
        return this.enrichRecipe(updated);
      })
    );
  }

  // Admin: Delete food item
  deleteFoodItem(id: number): Observable<boolean> {
    return from(this.supabaseService.deleteCustomFoodItem(id)).pipe(
      map(success => {
        this.itemsChangedSubject.next();
        return success;
      })
    );
  }
}

