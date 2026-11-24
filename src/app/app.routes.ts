import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MenuComponent } from './pages/menu/menu.component';
import { FoodDetailsComponent } from './pages/food-details/food-details.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ReservationComponent } from './pages/reservation/reservation.component';
import { CartComponent } from './pages/cart/cart.component';
import { AuthComponent } from './pages/auth/auth.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { StaffLoginComponent } from './pages/staff-login/staff-login.component';
import { ManagerComponent } from './pages/manager/manager.component';
import { AdminComponent } from './pages/admin/admin.component';
import { adminGuard, managerGuard } from './guards/staff.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'food/:id', component: FoodDetailsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'reservation', component: ReservationComponent },
  { path: 'cart', component: CartComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'login', component: AuthComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'orders', component: ProfileComponent },
  { path: 'staff-login', component: StaffLoginComponent },
  { path: 'admin/login', redirectTo: 'staff-login?role=admin', pathMatch: 'full' },
  { path: 'manager/login', redirectTo: 'staff-login?role=manager', pathMatch: 'full' },
  { path: 'manager', component: ManagerComponent, canActivate: [managerGuard] },
  { path: 'manager/orders', component: ManagerComponent, canActivate: [managerGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

