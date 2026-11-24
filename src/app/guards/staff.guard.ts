import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  if (supabaseService.hasRole('admin')) {
    return true;
  }

  // Redirect to staff login with return URL
  return router.createUrlTree(['/staff-login'], {
    queryParams: { returnUrl: state.url, role: 'admin' }
  });
};

export const managerGuard: CanActivateFn = (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // Both managers and admins can access manager portals
  if (supabaseService.hasRole('manager') || supabaseService.hasRole('admin')) {
    return true;
  }

  return router.createUrlTree(['/staff-login'], {
    queryParams: { returnUrl: state.url, role: 'manager' }
  });
};

export const staffGuard: CanActivateFn = (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  if (supabaseService.hasRole('staff')) {
    return true;
  }

  return router.createUrlTree(['/staff-login'], {
    queryParams: { returnUrl: state.url }
  });
};
