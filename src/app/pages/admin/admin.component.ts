import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FoodService, Recipe } from '../../services/food.service';
import { SupabaseService, OrderRecord, ManagerAccount } from '../../services/supabase.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {
  activeTab: 'menu' | 'managers' | 'orders' | 'reservations' | 'analytics' | 'staff' = 'menu';

  // Managers & Approvals State
  managers: ManagerAccount[] = [];
  isLoadingManagers = false;
  managerFilterStatus: 'all' | 'pending' | 'approved' | 'suspended' = 'all';
  managerSearchQuery = '';
  managerToastMessage = '';
  managerToastType: 'success' | 'warning' | 'danger' = 'success';

  // Direct Onboard Manager State
  showDirectAddManagerModal = false;
  directManagerName = '';
  directManagerEmail = '';
  directManagerPhone = '';
  directManagerBranch = 'Downtown Flagship';
  directManagerPassword = '';
  directManagerError = '';
  directManagerSuccess = '';
  isDirectAddingManager = false;

  // Menu items state
  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  categories: string[] = ['All', 'Pizza', 'Burgers', 'Pasta', 'Desserts', 'Drinks', 'Steaks', 'Salads', 'Seafood', 'Mains'];
  selectedCategory = 'All';
  searchFoodQuery = '';
  foodAvailabilityFilter: 'all' | 'available' | 'unavailable' = 'all';
  isLoadingFood = true;

  // Add / Edit Modal state
  showFoodModal = false;
  isEditMode = false;
  editingRecipeId: number | null = null;
  foodForm!: FormGroup;
  isSavingFood = false;
  foodActionSuccess = '';
  foodActionError = '';

  // Delete confirmation modal
  showDeleteModal = false;
  recipeToDelete: Recipe | null = null;
  isDeletingFood = false;

  // Orders & Reservations state
  orders: OrderRecord[] = [];
  reservations: any[] = [];
  isLoadingOrders = false;
  orderActionSuccess = '';
  private ordersSub?: Subscription;

  // SQL Script Helper copied state
  sqlCopied = false;

  // Presets for quick photo filling
  photoPresets = [
    {
      name: 'Woodfired Pizza',
      url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600',
      category: 'Pizza',
      cuisine: 'Italian'
    },
    {
      name: 'Wagyu Burger',
      url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
      category: 'Burgers',
      cuisine: 'American'
    },
    {
      name: 'Truffle Pasta',
      url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=600',
      category: 'Pasta',
      cuisine: 'Italian'
    },
    {
      name: 'Ribeye Steak',
      url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
      category: 'Steaks',
      cuisine: 'French'
    },
    {
      name: 'Sushi Platter',
      url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600',
      category: 'Seafood',
      cuisine: 'Japanese'
    },
    {
      name: 'Lava Cake',
      url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600',
      category: 'Desserts',
      cuisine: 'French'
    },
    {
      name: 'Artisan Cocktail',
      url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600',
      category: 'Drinks',
      cuisine: 'International'
    },
    {
      name: 'Caesar Salad',
      url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&q=80&w=600',
      category: 'Salads',
      cuisine: 'Mediterranean'
    }
  ];

  private itemsSub!: Subscription;
  Number = Number;

  constructor(
    private fb: FormBuilder,
    private foodService: FoodService,
    public supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    this.initFoodForm();
    this.loadFoodItems();
    this.loadOrdersAndReservations();
    this.loadManagers();

    this.itemsSub = this.foodService.itemsChanged$.subscribe(() => {
      this.loadFoodItems();
    });

    this.ordersSub = this.supabaseService.ordersChanged$.subscribe(() => {
      this.loadOrdersAndReservations();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'fh_orders_last_updated' || e.key === 'fh_local_orders') {
          this.loadOrdersAndReservations();
        }
      });
      window.addEventListener('fh_orders_changed', () => {
        this.loadOrdersAndReservations();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.itemsSub) {
      this.itemsSub.unsubscribe();
    }
    if (this.ordersSub) {
      this.ordersSub.unsubscribe();
    }
  }

  private initFoodForm(): void {
    this.foodForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['Pizza', [Validators.required]],
      price: [14.99, [Validators.required, Validators.min(0.5)]],
      image: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600', [Validators.required]],
      cuisine: ['International', [Validators.required]],
      difficulty: ['Easy'],
      prepTimeMinutes: [15, [Validators.required, Validators.min(1)]],
      cookTimeMinutes: [20, [Validators.required, Validators.min(0)]],
      servings: [2, [Validators.required, Validators.min(1)]],
      caloriesPerServing: [350, [Validators.min(0)]],
      rating: [4.9, [Validators.min(1), Validators.max(5)]],
      ingredients: ['Fresh mozzarella, basil leaves, crushed tomatoes, extra virgin olive oil'],
      instructions: ['Preheat oven to high heat. Roll dough thin, spoon sauce evenly, top with fresh cheese and bake until blistered.'],
      tags: ['Chef Signature, Fresh, Gourmet'],
      is_available: [true],
      is_featured: [false]
    });
  }

  loadFoodItems(): void {
    this.isLoadingFood = true;
    this.foodService.getRecipes().subscribe({
      next: items => {
        this.recipes = items;
        this.isLoadingFood = false;
        this.applyFoodFilters();
      },
      error: err => {
        console.error('Error loading food items:', err);
        this.isLoadingFood = false;
      }
    });
  }

  loadOrdersAndReservations(): void {
    this.supabaseService.getAllOrders().then(res => {
      this.orders = res.data || [];
    });
    this.supabaseService.getAllReservations().then(res => {
      this.reservations = res.data || [];
    });
  }

  async onAdminUpdateOrderStatus(order: OrderRecord, newStatus: string): Promise<void> {
    order.status = newStatus;
    await this.supabaseService.updateOrderStatus(order.order_ref, newStatus);
    this.orderActionSuccess = `Order #${order.order_ref} status changed to "${newStatus}"`;
    setTimeout(() => {
      this.orderActionSuccess = '';
    }, 3500);
  }

  applyFoodFilters(): void {
    let result = [...this.recipes];

    if (this.selectedCategory !== 'All') {
      result = result.filter(r => r.category.toLowerCase() === this.selectedCategory.toLowerCase());
    }

    if (this.foodAvailabilityFilter === 'available') {
      result = result.filter(r => r.is_available !== false);
    } else if (this.foodAvailabilityFilter === 'unavailable') {
      result = result.filter(r => r.is_available === false);
    }

    const q = this.searchFoodQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    this.filteredRecipes = result;
  }

  setAvailabilityFilter(filter: 'all' | 'available' | 'unavailable'): void {
    this.foodAvailabilityFilter = filter;
    this.applyFoodFilters();
  }

  getAvailableDishesCount(): number {
    return this.recipes.filter(r => r.is_available !== false).length;
  }

  getUnavailableDishesCount(): number {
    return this.recipes.filter(r => r.is_available === false).length;
  }

  onCategorySelect(cat: string): void {
    this.selectedCategory = cat;
    this.applyFoodFilters();
  }

  onFoodSearch(): void {
    this.applyFoodFilters();
  }

  // --- ADD / EDIT FOOD MODAL ---

  openAddFoodModal(): void {
    this.isEditMode = false;
    this.editingRecipeId = null;
    this.foodActionSuccess = '';
    this.foodActionError = '';
    this.foodForm.reset({
      name: '',
      category: 'Pizza',
      price: 15.99,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600',
      cuisine: 'Italian',
      difficulty: 'Easy',
      prepTimeMinutes: 15,
      cookTimeMinutes: 15,
      servings: 2,
      caloriesPerServing: 420,
      rating: 4.9,
      ingredients: 'Organic flour, San Marzano tomatoes, buffalo mozzarella, fresh basil',
      instructions: 'Hand-stretch dough, spread sauce gently, layer mozzarella, and bake at 450°C.',
      tags: 'Chef Special, Woodfired, Handmade',
      is_available: true,
      is_featured: false
    });
    this.showFoodModal = true;
  }

  openEditFoodModal(recipe: Recipe): void {
    this.isEditMode = true;
    this.editingRecipeId = recipe.id;
    this.foodActionSuccess = '';
    this.foodActionError = '';

    const ingredientsStr = Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : '';
    const instructionsStr = Array.isArray(recipe.instructions) ? recipe.instructions.join('. ') : '';
    const tagsStr = Array.isArray(recipe.tags) ? recipe.tags.join(', ') : '';

    this.foodForm.patchValue({
      name: recipe.name,
      category: recipe.category,
      price: recipe.price,
      image: recipe.image,
      cuisine: recipe.cuisine || 'International',
      difficulty: recipe.difficulty || 'Easy',
      prepTimeMinutes: recipe.prepTimeMinutes || 15,
      cookTimeMinutes: recipe.cookTimeMinutes || 15,
      servings: recipe.servings || 2,
      caloriesPerServing: recipe.caloriesPerServing || 350,
      rating: recipe.rating || 4.8,
      ingredients: ingredientsStr,
      instructions: instructionsStr,
      tags: tagsStr,
      is_available: recipe.is_available !== false,
      is_featured: Boolean(recipe.is_featured)
    });

    this.showFoodModal = true;
  }

  closeFoodModal(): void {
    this.showFoodModal = false;
    this.editingRecipeId = null;
  }

  applyPhotoPreset(preset: { name: string; url: string; category: string; cuisine: string }): void {
    this.foodForm.patchValue({
      image: preset.url,
      category: preset.category,
      cuisine: preset.cuisine
    });
    if (!this.foodForm.get('name')?.value) {
      this.foodForm.patchValue({ name: preset.name });
    }
  }

  async saveFoodItem(): Promise<void> {
    if (this.foodForm.invalid) {
      this.foodForm.markAllAsTouched();
      return;
    }

    this.isSavingFood = true;
    this.foodActionError = '';

    const val = this.foodForm.value;
    const ingredientsArray = val.ingredients
      ? val.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    const instructionsArray = val.instructions
      ? [val.instructions.trim()]
      : [];
    const tagsArray = val.tags
      ? val.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [val.category];

    const foodPayload: Partial<Recipe> = {
      name: val.name.trim(),
      category: val.category,
      price: Number(val.price),
      image: val.image.trim(),
      cuisine: val.cuisine,
      difficulty: val.difficulty,
      prepTimeMinutes: Number(val.prepTimeMinutes),
      cookTimeMinutes: Number(val.cookTimeMinutes),
      servings: Number(val.servings),
      caloriesPerServing: Number(val.caloriesPerServing),
      rating: Number(val.rating || 4.9),
      reviewCount: 15,
      ingredients: ingredientsArray,
      instructions: instructionsArray,
      tags: tagsArray,
      mealType: ['Lunch', 'Dinner'],
      is_available: val.is_available !== false,
      is_featured: Boolean(val.is_featured)
    };

    if (this.isEditMode && this.editingRecipeId) {
      this.foodService.updateFoodItem(this.editingRecipeId, foodPayload).subscribe({
        next: () => {
          this.isSavingFood = false;
          this.foodActionSuccess = 'Dish updated successfully!';
          setTimeout(() => this.closeFoodModal(), 600);
          this.loadFoodItems();
        },
        error: err => {
          this.isSavingFood = false;
          this.foodActionError = 'Failed to update dish. Please try again.';
        }
      });
    } else {
      this.foodService.addFoodItem(foodPayload).subscribe({
        next: () => {
          this.isSavingFood = false;
          this.foodActionSuccess = 'New food item added to restaurant menu!';
          setTimeout(() => this.closeFoodModal(), 600);
          this.loadFoodItems();
        },
        error: err => {
          this.isSavingFood = false;
          this.foodActionError = 'Failed to add dish. Please try again.';
        }
      });
    }
  }

  // --- DELETE FOOD MODAL ---

  openDeleteModal(recipe: Recipe): void {
    this.recipeToDelete = recipe;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.recipeToDelete = null;
  }

  confirmDelete(): void {
    if (!this.recipeToDelete) return;

    this.isDeletingFood = true;
    this.foodService.deleteFoodItem(this.recipeToDelete.id).subscribe({
      next: () => {
        this.isDeletingFood = false;
        this.closeDeleteModal();
        this.loadFoodItems();
      },
      error: () => {
        this.isDeletingFood = false;
        this.closeDeleteModal();
      }
    });
  }

  // Availability toggle
  async toggleAvailability(recipe: Recipe): Promise<void> {
    const updatedStatus = recipe.is_available === false ? true : false;
    recipe.is_available = updatedStatus;
    this.foodService.setAvailability(recipe.id, updatedStatus);
    this.foodService.updateFoodItem(recipe.id, { is_available: updatedStatus }).subscribe({
      next: () => {
        this.applyFoodFilters();
      }
    });
  }

  // --- ANALYTICS STATS ---

  getTotalRevenue(): number {
    return this.orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }

  getDeliveredCount(): number {
    return this.orders.filter(o => o.status === 'Delivered').length;
  }

  getPendingOrdersCount(): number {
    return this.orders.filter(o => o.status === 'Confirmed' || o.status === 'Preparing').length;
  }

  getAverageOrderValue(): number {
    const valid = this.orders.filter(o => o.status !== 'Cancelled');
    if (valid.length === 0) return 0;
    return this.getTotalRevenue() / valid.length;
  }

  getCategoryCount(cat: string): number {
    return this.recipes.filter(r => r.category.toLowerCase() === cat.toLowerCase()).length;
  }

  // --- MANAGERS & APPROVALS WORKFLOW ---

  async loadManagers(): Promise<void> {
    this.isLoadingManagers = true;
    try {
      this.managers = await this.supabaseService.getManagers();
    } catch (e) {
      console.warn('Error loading managers:', e);
    } finally {
      this.isLoadingManagers = false;
    }
  }

  getPendingManagersCount(): number {
    return this.managers.filter(m => m.status === 'pending').length;
  }

  getApprovedManagersCount(): number {
    return this.managers.filter(m => m.status === 'approved').length;
  }

  getSuspendedManagersCount(): number {
    return this.managers.filter(m => m.status === 'suspended' || m.status === 'rejected').length;
  }

  getFilteredManagers(): ManagerAccount[] {
    let list = [...this.managers];
    if (this.managerFilterStatus !== 'all') {
      list = list.filter(m => {
        if (this.managerFilterStatus === 'suspended') {
          return m.status === 'suspended' || m.status === 'rejected';
        }
        return m.status === this.managerFilterStatus;
      });
    }
    const q = this.managerSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(m =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.branch && m.branch.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q))
      );
    }
    return list;
  }

  showManagerToast(message: string, type: 'success' | 'warning' | 'danger' = 'success'): void {
    this.managerToastMessage = message;
    this.managerToastType = type;
    setTimeout(() => {
      this.managerToastMessage = '';
    }, 4500);
  }

  async approveManager(m: ManagerAccount): Promise<void> {
    const success = await this.supabaseService.approveManager(m.id || m.email);
    if (success) {
      m.status = 'approved';
      m.approved_at = new Date().toISOString();
      this.showManagerToast(`Approved manager ${m.fullName}! They can now log into the Kitchen & Orders Desk.`, 'success');
      await this.loadManagers();
    }
  }

  async rejectManager(m: ManagerAccount): Promise<void> {
    const success = await this.supabaseService.rejectManager(m.id || m.email);
    if (success) {
      m.status = 'suspended';
      this.showManagerToast(`Suspended manager ${m.fullName}. Access to the Manager Desk has been revoked.`, 'warning');
      await this.loadManagers();
    }
  }

  async deleteManager(m: ManagerAccount): Promise<void> {
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to delete manager account for ${m.fullName} (${m.email})?`)) {
      return;
    }
    const success = await this.supabaseService.deleteManager(m.id || m.email);
    if (success) {
      this.managers = this.managers.filter(item => item.id !== m.id && item.email !== m.email);
      this.showManagerToast(`Removed manager ${m.fullName} from registry.`, 'danger');
    }
  }

  async onboardManagerDirectly(): Promise<void> {
    if (!this.directManagerName || !this.directManagerEmail || !this.directManagerPassword) {
      this.directManagerError = 'Please fill out Full Name, Email, and Password.';
      return;
    }
    if (this.directManagerPassword.length < 6) {
      this.directManagerError = 'Password must be at least 6 characters.';
      return;
    }

    this.isDirectAddingManager = true;
    this.directManagerError = '';
    this.directManagerSuccess = '';

    const res = await this.supabaseService.createApprovedManager({
      fullName: this.directManagerName,
      email: this.directManagerEmail,
      phone: this.directManagerPhone,
      branch: this.directManagerBranch,
      password: this.directManagerPassword
    });

    this.isDirectAddingManager = false;

    if (res.success) {
      this.directManagerSuccess = `Manager ${this.directManagerName} created with pre-approved status!`;
      this.directManagerName = '';
      this.directManagerEmail = '';
      this.directManagerPhone = '';
      this.directManagerPassword = '';
      await this.loadManagers();
      setTimeout(() => {
        this.directManagerSuccess = '';
        this.showDirectAddManagerModal = false;
      }, 1500);
    } else {
      this.directManagerError = res.error || 'Failed to onboard manager.';
    }
  }

  // Quick switch role
  switchRole(role: 'admin' | 'manager'): void {
    this.supabaseService.quickStaffLogin(role);
    if (role === 'manager') {
      this.router.navigate(['/manager']);
    }
  }

  signOut(): void {
    this.supabaseService.staffSignOut();
    this.router.navigate(['/staff-login']);
  }

  copySqlSchema(): void {
    const sql = `-- FOOD ITEMS SCHEMA
CREATE TABLE IF NOT EXISTS public.food_items (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT NOT NULL,
  cuisine TEXT DEFAULT 'International',
  difficulty TEXT DEFAULT 'Easy',
  prep_time_minutes INTEGER DEFAULT 15,
  cook_time_minutes INTEGER DEFAULT 20,
  servings INTEGER DEFAULT 2,
  calories_per_serving INTEGER DEFAULT 350,
  rating NUMERIC(3, 1) DEFAULT 4.8,
  review_count INTEGER DEFAULT 12,
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  meal_type JSONB DEFAULT '["Lunch", "Dinner"]'::jsonb,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`;
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(sql);
      this.sqlCopied = true;
      setTimeout(() => this.sqlCopied = false, 3000);
    }
  }
}
