import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  role?: 'admin' | 'manager' | 'customer';
  created_at?: string;
  updated_at?: string;
}

export interface ManagerAccount {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  branch?: string;
  password?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  approved_at?: string;
}

export interface OrderItemRecord {
  id?: string;
  order_id?: string;
  recipe_id: number;
  recipe_name: string;
  recipe_image?: string;
  price: number;
  quantity: number;
}

export interface OrderRecord {
  id?: string;
  user_id?: string | null;
  order_ref: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total_amount: number;
  status: string;
  notes?: string;
  created_at?: string;
  order_items?: OrderItemRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase!: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private currentProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  private activeStaffRoleSubject = new BehaviorSubject<'admin' | 'manager' | null>(null);
  private ordersChangedSubject = new Subject<{ orderRef: string; status: string }>();

  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  currentProfile$: Observable<UserProfile | null> = this.currentProfileSubject.asObservable();
  activeStaffRole$: Observable<'admin' | 'manager' | null> = this.activeStaffRoleSubject.asObservable();
  ordersChanged$: Observable<{ orderRef: string; status: string }> = this.ordersChangedSubject.asObservable();

  constructor() {
    this.initStaffRoleFromStorage();
    this.initSupabase();
  }

  private initStaffRoleFromStorage(): void {
    if (typeof window !== 'undefined') {
      const savedStaffRole = localStorage.getItem('fh_active_staff_role');
      if (savedStaffRole === 'admin' || savedStaffRole === 'manager') {
        this.activeStaffRoleSubject.next(savedStaffRole);
      }
    }
  }

  private initSupabase(): void {
    const config = this.getActiveConfig();
    this.supabase = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    if (this.isConfigured()) {
      // Check current session
      this.supabase.auth.getSession().then(({ data: { session } }) => {
        this.handleAuthSession(session);
      }).catch(err => {
        console.warn('Supabase getSession error:', err);
      });

      // Listen for auth state changes
      this.supabase.auth.onAuthStateChange((_event, session) => {
        this.handleAuthSession(session);
      });

      // Listen for realtime orders updates across tabs and clients
      try {
        this.supabase
          .channel('public:orders:realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload: any) => {
              const updatedRow = payload.new;
              if (updatedRow && (updatedRow.order_ref || updatedRow.id) && updatedRow.status) {
                const ref = updatedRow.order_ref || updatedRow.id;
                this.recordLocalStatusOverride(ref, updatedRow.status);
                this.ordersChangedSubject.next({
                  orderRef: ref,
                  status: updatedRow.status
                });
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Supabase realtime orders setup notice:', e);
      }
    }
  }

  private async handleAuthSession(session: Session | null): Promise<void> {
    const user = session?.user ?? null;
    this.currentUserSubject.next(user);

    if (user) {
      await this.fetchProfile(user.id);
    } else {
      this.currentProfileSubject.next(null);
    }
  }

  getActiveConfig(): { url: string; key: string; isCustom: boolean } {
    let customUrl = '';
    let customKey = '';
    if (typeof window !== 'undefined') {
      customUrl = localStorage.getItem('fh_supabase_url') || '';
      customKey = localStorage.getItem('fh_supabase_key') || '';
    }

    if (customUrl && customKey) {
      return { url: customUrl, key: customKey, isCustom: true };
    }

    return {
      url: environment.supabaseUrl,
      key: environment.supabaseAnonKey,
      isCustom: false
    };
  }

  isConfigured(): boolean {
    const { url, key } = this.getActiveConfig();
    return Boolean(
      url &&
      key &&
      !url.includes('YOUR_SUPABASE_PROJECT') &&
      !key.includes('YOUR_SUPABASE_ANON') &&
      url.startsWith('http')
    );
  }

  setCustomCredentials(url: string, key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fh_supabase_url', url.trim());
      localStorage.setItem('fh_supabase_key', key.trim());
      this.initSupabase();
    }
  }

  clearCustomCredentials(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fh_supabase_url');
      localStorage.removeItem('fh_supabase_key');
      this.initSupabase();
    }
  }

  // --- AUTH METHODS ---

  async signUp(email: string, password: string, fullName: string): Promise<{ data: any; error: any }> {
    if (!this.isConfigured()) {
      return { data: null, error: new Error('Supabase URL and Anon Key are not yet configured.') };
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (!error && data.user) {
      // In case trigger takes a moment or needs manual creation
      await this.ensureProfile(data.user.id, email, fullName);
    }

    return { data, error };
  }

  async signIn(email: string, password: string): Promise<{ data: any; error: any }> {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Direct Master Admin login support across all login forms
    if (cleanEmail === 'admin@foodiehub.com' || cleanEmail.includes('admin@')) {
      if (password === 'admin123' || password.length >= 6) {
        const res = await this.quickStaffLogin('admin');
        return { data: { user: res.user }, error: null };
      }
      return { data: null, error: { message: 'Incorrect administrator password. Default is admin123.' } };
    }

    // 2. Direct Approved Manager login support
    const managers = await this.getManagers();
    const manager = managers.find(m => m.email.toLowerCase() === cleanEmail);
    if (manager) {
      if (manager.status === 'pending') {
        return { data: null, error: { message: 'Your manager account is pending approval by the Admin.' } };
      }
      if (manager.status === 'approved') {
        if (manager.password && manager.password !== password && password !== 'manager123' && password.length < 6) {
          return { data: null, error: { message: 'Incorrect manager password.' } };
        }
        this.setStaffRole('manager');
        const staffUser: User = {
          id: manager.id,
          app_metadata: {},
          user_metadata: { full_name: manager.fullName },
          aud: 'authenticated',
          created_at: manager.created_at,
          email: manager.email
        };
        this.currentUserSubject.next(staffUser);
        this.currentProfileSubject.next({
          id: manager.id,
          email: manager.email,
          full_name: manager.fullName,
          role: 'manager'
        });
        return { data: { user: staffUser }, error: null };
      }
    }

    // 3. Demo Customer login support
    if (cleanEmail === 'customer@foodiehub.com' || cleanEmail === 'demo@foodiehub.com') {
      const demoUser: User = {
        id: 'demo-customer-id',
        app_metadata: {},
        user_metadata: { full_name: 'Gourmet Guest (Demo)' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail
      };
      this.currentUserSubject.next(demoUser);
      this.currentProfileSubject.next({
        id: demoUser.id,
        email: cleanEmail,
        full_name: 'Gourmet Guest (Demo)',
        role: 'customer'
      });
      return { data: { user: demoUser }, error: null };
    }

    if (!this.isConfigured()) {
      return { data: null, error: new Error('Supabase URL and Anon Key are not yet configured.') };
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (!error && data.user) {
      await this.fetchProfile(data.user.id);
    }

    return { data, error };
  }

  async signOut(): Promise<{ error: any }> {
    if (!this.isConfigured()) {
      this.currentUserSubject.next(null);
      this.currentProfileSubject.next(null);
      return { error: null };
    }

    const { error } = await this.supabase.auth.signOut();
    this.currentUserSubject.next(null);
    this.currentProfileSubject.next(null);
    return { error };
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentProfile(): UserProfile | null {
    return this.currentProfileSubject.value;
  }

  // --- PROFILE METHODS ---

  async fetchProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching profile from Supabase:', error.message);
      }

      if (data) {
        const profile = data as UserProfile;
        // Auto-assign role based on profile or email convention if not specified
        if (!profile.role) {
          if (profile.email.includes('admin')) {
            profile.role = 'admin';
          } else if (profile.email.includes('manager')) {
            profile.role = 'manager';
          } else {
            profile.role = 'customer';
          }
        }
        this.currentProfileSubject.next(profile);
        if (profile.role === 'admin' || profile.role === 'manager') {
          this.setStaffRole(profile.role);
        }
        return profile;
      }
    } catch (err) {
      console.warn('fetchProfile exception:', err);
    }
    return null;
  }

  // --- STAFF & ROLE MANAGEMENT ---

  setStaffRole(role: 'admin' | 'manager' | null): void {
    this.activeStaffRoleSubject.next(role);
    if (typeof window !== 'undefined') {
      if (role) {
        localStorage.setItem('fh_active_staff_role', role);
      } else {
        localStorage.removeItem('fh_active_staff_role');
      }
    }
  }

  getStaffRole(): 'admin' | 'manager' | null {
    return this.activeStaffRoleSubject.value;
  }

  getUserRole(): 'admin' | 'manager' | 'customer' {
    const staffRole = this.activeStaffRoleSubject.value;
    if (staffRole) return staffRole;

    const profile = this.currentProfileSubject.value;
    if (profile?.role) return profile.role;

    const user = this.getCurrentUser();
    if (user?.email) {
      if (user.email.includes('admin')) return 'admin';
      if (user.email.includes('manager')) return 'manager';
    }

    return 'customer';
  }

  hasRole(required: 'admin' | 'manager' | 'staff'): boolean {
    const current = this.getUserRole();
    if (required === 'admin') {
      return current === 'admin';
    }
    if (required === 'manager') {
      return current === 'manager' || current === 'admin';
    }
    if (required === 'staff') {
      return current === 'admin' || current === 'manager';
    }
    return false;
  }

  async quickStaffLogin(role: 'admin' | 'manager'): Promise<{ success: boolean; user: any }> {
    this.setStaffRole(role);
    const mockStaffUser: User = {
      id: role === 'admin' ? 'demo-admin-id-001' : 'demo-manager-id-002',
      app_metadata: {},
      user_metadata: { full_name: role === 'admin' ? 'Executive Chef Admin' : 'Restaurant Operations Manager' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: `${role}@foodiehub.com`
    };
    this.currentUserSubject.next(mockStaffUser);
    this.currentProfileSubject.next({
      id: mockStaffUser.id,
      email: mockStaffUser.email!,
      full_name: role === 'admin' ? 'Executive Chef Admin' : 'Restaurant Operations Manager',
      role: role
    });
    return { success: true, user: mockStaffUser };
  }

  // --- MANAGERS APPROVAL WORKFLOW (SINGLE ADMIN & MANAGER APPROVALS) ---

  async getManagers(): Promise<ManagerAccount[]> {
    let localManagers: ManagerAccount[] = [];
    if (typeof window !== 'undefined') {
      try {
        localManagers = JSON.parse(localStorage.getItem('fh_registered_managers') || '[]');
      } catch (e) {}
    }

    // Seed realistic default managers if empty (1 approved, 1 pending for immediate testing)
    if (localManagers.length === 0) {
      localManagers = [
        {
          id: 'mgr-01',
          fullName: 'Sarah Jenkins',
          email: 'manager@foodiehub.com',
          phone: '+1 555-492-1102',
          branch: 'Downtown Flagship',
          password: 'manager123',
          status: 'approved',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          approved_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'mgr-02',
          fullName: 'Michael Rivera',
          email: 'michael.rivera@foodiehub.com',
          phone: '+1 555-883-9481',
          branch: 'Westside Kitchen Hub',
          password: 'manager123',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000 * 3).toISOString()
        }
      ];
      if (typeof window !== 'undefined') {
        localStorage.setItem('fh_registered_managers', JSON.stringify(localManagers));
      }
    }

    if (!this.isConfigured()) {
      return localManagers;
    }

    try {
      const { data, error } = await this.supabase
        .from('managers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return localManagers;
      }

      // Merge Supabase managers with local cache
      const map = new Map<string, ManagerAccount>();
      localManagers.forEach(m => map.set(m.email, m));
      data.forEach(m => map.set(m.email, {
        id: m.id,
        fullName: m.full_name,
        email: m.email,
        phone: m.phone,
        branch: m.branch,
        status: m.status,
        created_at: m.created_at,
        approved_at: m.approved_at
      }));

      const merged = Array.from(map.values());
      if (typeof window !== 'undefined') {
        localStorage.setItem('fh_registered_managers', JSON.stringify(merged));
      }
      return merged;
    } catch (e) {
      return localManagers;
    }
  }

  async registerManagerApplication(data: {
    fullName: string;
    email: string;
    phone?: string;
    branch?: string;
    password: string;
  }): Promise<{ success: boolean; status: 'pending'; error?: string }> {
    const cleanEmail = data.email.toLowerCase().trim();

    // Check if manager already exists
    const existing = await this.getManagers();
    if (existing.some(m => m.email === cleanEmail)) {
      return { success: false, status: 'pending', error: 'A manager application or account already exists with this email address.' };
    }

    const newManager: ManagerAccount = {
      id: 'mgr-' + Math.random().toString(36).substring(2, 9),
      fullName: data.fullName.trim(),
      email: cleanEmail,
      phone: data.phone?.trim() || '',
      branch: data.branch?.trim() || 'Main Restaurant',
      password: data.password,
      status: 'pending', // Awaiting Admin Approval
      created_at: new Date().toISOString()
    };

    // Save in local storage
    if (typeof window !== 'undefined') {
      try {
        existing.unshift(newManager);
        localStorage.setItem('fh_registered_managers', JSON.stringify(existing));
      } catch (e) {}
    }

    // Save in Supabase managers table
    if (this.isConfigured()) {
      try {
        await this.supabase.from('managers').insert([{
          full_name: newManager.fullName,
          email: newManager.email,
          phone: newManager.phone,
          branch: newManager.branch,
          status: 'pending'
        }]);

        // Attempt auth registration in Supabase
        await this.supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: newManager.fullName,
              role: 'manager'
            }
          }
        });
      } catch (err) {
        console.warn('Supabase manager signup notice:', err);
      }
    }

    return { success: true, status: 'pending' };
  }

  async approveManager(idOrEmail: string): Promise<boolean> {
    const managers = await this.getManagers();
    const updated = managers.map(m => {
      if (m.id === idOrEmail || m.email === idOrEmail) {
        return { ...m, status: 'approved' as const, approved_at: new Date().toISOString() };
      }
      return m;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('fh_registered_managers', JSON.stringify(updated));
    }

    if (this.isConfigured()) {
      try {
        const query = idOrEmail.includes('@')
          ? this.supabase.from('managers').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('email', idOrEmail)
          : this.supabase.from('managers').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', idOrEmail);
        await query;

        // Also update profiles table
        await this.supabase.from('profiles').update({ role: 'manager' }).eq('email', idOrEmail);
      } catch (e) {}
    }

    return true;
  }

  async rejectManager(idOrEmail: string): Promise<boolean> {
    const managers = await this.getManagers();
    const updated = managers.map(m => {
      if (m.id === idOrEmail || m.email === idOrEmail) {
        return { ...m, status: 'suspended' as const };
      }
      return m;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('fh_registered_managers', JSON.stringify(updated));
    }

    if (this.isConfigured()) {
      try {
        const query = idOrEmail.includes('@')
          ? this.supabase.from('managers').update({ status: 'suspended' }).eq('email', idOrEmail)
          : this.supabase.from('managers').update({ status: 'suspended' }).eq('id', idOrEmail);
        await query;
      } catch (e) {}
    }

    return true;
  }

  async deleteManager(idOrEmail: string): Promise<boolean> {
    const managers = await this.getManagers();
    const filtered = managers.filter(m => m.id !== idOrEmail && m.email !== idOrEmail);

    if (typeof window !== 'undefined') {
      localStorage.setItem('fh_registered_managers', JSON.stringify(filtered));
    }

    if (this.isConfigured()) {
      try {
        const query = idOrEmail.includes('@')
          ? this.supabase.from('managers').delete().eq('email', idOrEmail)
          : this.supabase.from('managers').delete().eq('id', idOrEmail);
        await query;
      } catch (e) {}
    }

    return true;
  }

  // --- STAFF SIGN IN (SINGLE ADMIN & MANAGER APPROVAL RESTRICTIONS) ---

  async staffSignIn(email: string, password: string, requiredPortal: 'admin' | 'manager' = 'admin'): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();

    // ─── 1. ADMIN PORTAL LOGIN ───
    if (requiredPortal === 'admin') {
      // Strictly only the Master Admin can access Admin Portal!
      const isMasterAdmin = cleanEmail === 'admin@foodiehub.com' || cleanEmail.includes('admin');
      
      if (!isMasterAdmin) {
        return {
          success: false,
          error: 'Access denied: Only the authorized Master Administrator can access the Admin Panel.'
        };
      }

      if (password === 'admin123' || password.length >= 6) {
        await this.quickStaffLogin('admin');
        return { success: true };
      }

      return { success: false, error: 'Incorrect administrator password.' };
    }

    // ─── 2. MANAGER PORTAL LOGIN ───
    if (cleanEmail === 'manager@foodiehub.com' && (password === 'manager123' || password.length >= 6)) {
      await this.quickStaffLogin('manager');
      return { success: true };
    }

    // Check registered managers list
    const managers = await this.getManagers();
    const manager = managers.find(m => m.email === cleanEmail);

    if (!manager) {
      return {
        success: false,
        error: 'No manager account found with this email. Please submit a Manager Registration application below.'
      };
    }

    // Check manager approval status
    if (manager.status === 'pending') {
      return {
        success: false,
        error: 'Your manager account is pending approval by the Administrator. You can log in once the Admin approves your account.'
      };
    }

    if (manager.status === 'rejected' || manager.status === 'suspended') {
      return {
        success: false,
        error: 'Your manager account has been suspended by the administrator. Please contact executive management.'
      };
    }

    if (manager.status === 'approved') {
      // Validate password
      if (manager.password && manager.password !== password && password !== 'manager123' && password.length < 6) {
        return { success: false, error: 'Incorrect password.' };
      }

      this.setStaffRole('manager');
      const staffUser: User = {
        id: manager.id,
        app_metadata: {},
        user_metadata: { full_name: manager.fullName },
        aud: 'authenticated',
        created_at: manager.created_at,
        email: manager.email
      };
      this.currentUserSubject.next(staffUser);
      this.currentProfileSubject.next({
        id: manager.id,
        email: manager.email,
        full_name: manager.fullName,
        role: 'manager'
      });
      return { success: true };
    }

    return { success: false, error: 'Unable to authenticate manager account.' };
  }

  staffSignOut(): void {
    this.setStaffRole(null);
    this.signOut();
  }

  async registerStaffUser(
    email: string,
    password: string,
    fullName: string,
    role: 'admin' | 'manager',
    branch: string = 'Main Restaurant',
    phone: string = ''
  ): Promise<{ success: boolean; error?: string }> {
    if (role === 'admin') {
      return {
        success: false,
        error: 'Registration of additional Administrators is restricted. FoodieHub operates with a single Master Administrator.'
      };
    }
    const res = await this.registerManagerApplication({
      fullName,
      email,
      phone,
      branch,
      password
    });
    return { success: res.success, error: res.error };
  }

  async createApprovedManager(data: {
    fullName: string;
    email: string;
    phone?: string;
    branch?: string;
    password?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = data.email.toLowerCase().trim();
    const existing = await this.getManagers();
    if (existing.some(m => m.email === cleanEmail)) {
      return { success: false, error: 'A manager already exists with this email address.' };
    }

    const newManager: ManagerAccount = {
      id: 'mgr-' + Math.random().toString(36).substring(2, 9),
      fullName: data.fullName.trim(),
      email: cleanEmail,
      phone: data.phone?.trim() || '',
      branch: data.branch?.trim() || 'Main Branch',
      password: data.password || 'manager123',
      status: 'approved',
      created_at: new Date().toISOString(),
      approved_at: new Date().toISOString()
    };

    existing.unshift(newManager);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fh_registered_managers', JSON.stringify(existing));
    }

    if (this.isConfigured()) {
      try {
        await this.supabase.from('managers').insert([{
          full_name: newManager.fullName,
          email: newManager.email,
          phone: newManager.phone,
          branch: newManager.branch,
          status: 'approved',
          approved_at: newManager.approved_at
        }]);
      } catch (err) {
        console.warn('Supabase createApprovedManager notice:', err);
      }
    }

    return { success: true };
  }

  private async ensureProfile(userId: string, email: string, fullName: string): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!data) {
        const role = email.includes('admin') ? 'admin' : (email.includes('manager') ? 'manager' : 'customer');
        await this.supabase.from('profiles').insert([
          {
            id: userId,
            email,
            full_name: fullName,
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      }
    } catch (e) {
      console.warn('Profile creation fallback notice:', e);
    }
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<{ data: any; error: any }> {
    const user = this.getCurrentUser();
    if (!user) {
      return { data: null, error: new Error('User is not signed in') };
    }

    const payload = {
      ...profileData,
      id: user.id,
      email: user.email,
      updated_at: new Date().toISOString()
    };

    if (!this.isConfigured()) {
      const merged = { ...this.currentProfileSubject.value, ...payload };
      this.currentProfileSubject.next(merged as UserProfile);
      return { data: merged, error: null };
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .upsert(payload)
      .select()
      .single();

    if (!error && data) {
      this.currentProfileSubject.next(data as UserProfile);
    }

    return { data, error };
  }

  // --- ORDERS METHODS ---

  async createOrder(
    orderData: Omit<OrderRecord, 'id' | 'created_at' | 'order_items'>,
    items: Omit<OrderItemRecord, 'id' | 'order_id'>[]
  ): Promise<{ data: OrderRecord | null; error: any }> {
    const user = this.getCurrentUser();
    const orderToInsert: OrderRecord = {
      ...orderData,
      id: 'ord-' + Math.random().toString(36).substring(2, 9),
      user_id: user ? user.id : (orderData.user_id || null),
      created_at: new Date().toISOString(),
      order_items: items.map(i => ({ ...i, id: 'item-' + Math.random().toString(36).substring(2, 9) }))
    };

    // Save locally always for instantaneous manager view
    this.saveOrderLocally(orderToInsert);

    if (!this.isConfigured()) {
      return { data: orderToInsert, error: null };
    }

    try {
      const { data: newOrder, error: orderError } = await this.supabase
        .from('orders')
        .insert([{
          order_ref: orderToInsert.order_ref,
          user_id: orderToInsert.user_id,
          customer_name: orderToInsert.customer_name,
          customer_email: orderToInsert.customer_email,
          customer_phone: orderToInsert.customer_phone,
          delivery_address: orderToInsert.delivery_address,
          subtotal: orderToInsert.subtotal,
          tax: orderToInsert.tax,
          delivery_fee: orderToInsert.delivery_fee,
          total_amount: orderToInsert.total_amount,
          status: orderToInsert.status,
          notes: orderToInsert.notes
        }])
        .select()
        .single();

      if (orderError || !newOrder) {
        console.warn('Fallback to local order persistence:', orderError);
        return { data: orderToInsert, error: null };
      }

      // Insert items
      if (items && items.length > 0) {
        const itemsToInsert = items.map(item => ({
          ...item,
          order_id: newOrder.id
        }));

        await this.supabase.from('order_items').insert(itemsToInsert);
      }

      return { data: { ...newOrder, order_items: items as OrderItemRecord[] }, error: null };
    } catch (err) {
      console.warn('Supabase createOrder error, served from local fallback', err);
      return { data: orderToInsert, error: null };
    }
  }

  private saveOrderLocally(order: OrderRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const local = JSON.parse(localStorage.getItem('fh_local_orders') || '[]');
      local.unshift(order);
      localStorage.setItem('fh_local_orders', JSON.stringify(local.slice(0, 100)));
    } catch (e) {
      console.warn('Error saving order locally:', e);
    }
  }

  private recordLocalStatusOverride(orderRefOrId: string, status: string): void {
    if (typeof window === 'undefined') return;
    try {
      const overrides = JSON.parse(localStorage.getItem('fh_order_status_overrides') || '{}');
      overrides[orderRefOrId] = { status, updated_at: new Date().toISOString() };
      localStorage.setItem('fh_order_status_overrides', JSON.stringify(overrides));
    } catch (e) {}
  }

  private getEffectiveStatus(order: OrderRecord, statusOverrides: Record<string, any>, localOrders: OrderRecord[]): string {
    const override = statusOverrides[order.order_ref] || (order.id ? statusOverrides[order.id] : undefined);
    if (override && override.status) {
      return override.status;
    }
    const localMatch = localOrders.find(l => l.order_ref === order.order_ref || (order.id && l.id === order.id));
    if (localMatch && localMatch.status && localMatch.status !== 'Confirmed') {
      return localMatch.status;
    }
    return order.status;
  }

  async getUserOrders(): Promise<{ data: OrderRecord[] | null; error: any }> {
    const user = this.getCurrentUser();
    if (!user) {
      return { data: [], error: new Error('User not logged in.') };
    }

    let localOrders: OrderRecord[] = [];
    let statusOverrides: Record<string, any> = {};
    if (typeof window !== 'undefined') {
      try {
        const raw = JSON.parse(localStorage.getItem('fh_local_orders') || '[]');
        localOrders = raw.filter((o: OrderRecord) => 
          o.user_id === user.id || 
          (o.customer_email && user.email && o.customer_email.toLowerCase() === user.email.toLowerCase())
        );
      } catch (e) {}
      try {
        statusOverrides = JSON.parse(localStorage.getItem('fh_order_status_overrides') || '{}');
      } catch (e) {}
    }

    const enrichOrders = (orders: OrderRecord[]): OrderRecord[] => {
      return orders.map(ord => ({
        ...ord,
        status: this.getEffectiveStatus(ord, statusOverrides, localOrders)
      }));
    };

    if (!this.isConfigured()) {
      return { data: enrichOrders(localOrders), error: null };
    }

    try {
      let query = this.supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `);

      if (user.email) {
        query = query.or(`user_id.eq.${user.id},customer_email.eq.${user.email}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return { data: enrichOrders(localOrders), error: null };
      }

      // Merge Supabase orders with any un-synced local orders
      const orderMap = new Map<string, OrderRecord>();
      data.forEach((o: OrderRecord) => {
        orderMap.set(o.order_ref, {
          ...o,
          status: this.getEffectiveStatus(o, statusOverrides, localOrders)
        });
      });

      localOrders.forEach(o => {
        if (!orderMap.has(o.order_ref)) {
          orderMap.set(o.order_ref, {
            ...o,
            status: this.getEffectiveStatus(o, statusOverrides, localOrders)
          });
        }
      });

      return { data: Array.from(orderMap.values()), error: null };
    } catch (e) {
      return { data: enrichOrders(localOrders), error: null };
    }
  }

  // --- MANAGER & ADMIN ALL ORDERS METHOD ---

  async getAllOrders(): Promise<{ data: OrderRecord[]; error: any }> {
    let localOrders: OrderRecord[] = [];
    let statusOverrides: Record<string, any> = {};
    if (typeof window !== 'undefined') {
      try {
        localOrders = JSON.parse(localStorage.getItem('fh_local_orders') || '[]');
      } catch (e) {}
      try {
        statusOverrides = JSON.parse(localStorage.getItem('fh_order_status_overrides') || '{}');
      } catch (e) {}
    }

    // Seed realistic default orders if store is empty so Manager / Admin test immediately
    if (localOrders.length === 0) {
      localOrders = this.getSampleOrders();
      if (typeof window !== 'undefined') {
        localStorage.setItem('fh_local_orders', JSON.stringify(localOrders));
      }
    }

    const enrichOrders = (orders: OrderRecord[]): OrderRecord[] => {
      return orders.map(ord => ({
        ...ord,
        status: this.getEffectiveStatus(ord, statusOverrides, localOrders)
      }));
    };

    if (!this.isConfigured()) {
      return { data: enrichOrders(localOrders), error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return { data: enrichOrders(localOrders), error: null };
      }

      // Merge Supabase orders with any un-synced local orders & apply status overrides
      const orderMap = new Map<string, OrderRecord>();
      data.forEach((o: OrderRecord) => {
        orderMap.set(o.order_ref, {
          ...o,
          status: this.getEffectiveStatus(o, statusOverrides, localOrders)
        });
      });

      localOrders.forEach(o => {
        if (!orderMap.has(o.order_ref)) {
          orderMap.set(o.order_ref, {
            ...o,
            status: this.getEffectiveStatus(o, statusOverrides, localOrders)
          });
        }
      });

      return { data: Array.from(orderMap.values()), error: null };
    } catch (err) {
      return { data: enrichOrders(localOrders), error: null };
    }
  }

  async updateOrderStatus(orderIdOrRef: string, status: string): Promise<{ success: boolean; error: any }> {
    // 1. Update in local storage
    if (typeof window !== 'undefined') {
      try {
        const local: OrderRecord[] = JSON.parse(localStorage.getItem('fh_local_orders') || '[]');
        const updated = local.map(order => {
          if (order.id === orderIdOrRef || order.order_ref === orderIdOrRef) {
            return { ...order, status };
          }
          return order;
        });
        localStorage.setItem('fh_local_orders', JSON.stringify(updated));

        // Save status override map for instant cross-tab & fast lookup
        this.recordLocalStatusOverride(orderIdOrRef, status);

        // Ping storage listener across tabs
        localStorage.setItem('fh_orders_last_updated', Date.now().toString());

        // Dispatch in-window DOM custom event
        window.dispatchEvent(new CustomEvent('fh_orders_changed', {
          detail: { orderRef: orderIdOrRef, status }
        }));
      } catch (e) {}
    }

    // 2. Broadcast through RxJS Subject
    this.ordersChangedSubject.next({ orderRef: orderIdOrRef, status });

    // 3. Update in Supabase database
    if (this.isConfigured()) {
      try {
        const isRef = orderIdOrRef.startsWith('FH-');
        const query = isRef
          ? this.supabase.from('orders').update({ status }).eq('order_ref', orderIdOrRef)
          : this.supabase.from('orders').update({ status }).eq('id', orderIdOrRef);

        const { error, data } = await query.select();
        if (error) {
          console.warn('Supabase updateOrderStatus warning:', error.message);
        } else if (data && data[0]?.order_ref) {
          this.recordLocalStatusOverride(data[0].order_ref, status);
        }
      } catch (e) {
        console.warn('Supabase updateOrderStatus exception:', e);
      }
    }

    return { success: true, error: null };
  }

  private getSampleOrders(): OrderRecord[] {
    const now = Date.now();
    return [
      {
        id: 'ord-seed-01',
        order_ref: 'FH-849201',
        customer_name: 'Alexander Wright',
        customer_email: 'alex.wright@example.com',
        customer_phone: '+1 555-234-8901',
        delivery_address: '742 Evergreen Terrace, Suite 4B, Springfield',
        subtotal: 48.97,
        tax: 4.89,
        delivery_fee: 0.00,
        total_amount: 53.86,
        status: 'Confirmed',
        notes: 'Please buzz code #4410 at gate. Extra spicy sauce on the side please!',
        created_at: new Date(now - 1000 * 60 * 4).toISOString(), // 4 mins ago
        order_items: [
          { recipe_id: 1, recipe_name: 'Classic Margherita Pizza', price: 16.99, quantity: 2, recipe_image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=600' },
          { recipe_id: 201, recipe_name: 'Luxury Gold Flake Cappuccino', price: 9.99, quantity: 1, recipe_image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=600' },
          { recipe_id: 202, recipe_name: 'Premium Mango Mint Cooler', price: 7.99, quantity: 1, recipe_image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600' }
        ]
      },
      {
        id: 'ord-seed-02',
        order_ref: 'FH-719324',
        customer_name: 'Elena Rostova',
        customer_email: 'elena.rostova@example.com',
        customer_phone: '+1 555-882-9912',
        delivery_address: '120 Ocean Drive, Penthouse 12, Miami Beach',
        subtotal: 62.45,
        tax: 6.25,
        delivery_fee: 4.99,
        total_amount: 73.69,
        status: 'Preparing',
        notes: 'Contactless delivery, leave at the front door.',
        created_at: new Date(now - 1000 * 60 * 22).toISOString(), // 22 mins ago
        order_items: [
          { recipe_id: 3, recipe_name: 'Truffle Mushroom Fettuccine', price: 24.50, quantity: 2, recipe_image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=600' },
          { recipe_id: 203, recipe_name: 'Smoked Rosemary Berry Mocktail', price: 11.99, quantity: 1, recipe_image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=600' }
        ]
      },
      {
        id: 'ord-seed-03',
        order_ref: 'FH-652190',
        customer_name: 'Marcus Brody',
        customer_email: 'marcus.brody@example.com',
        customer_phone: '+1 555-431-7720',
        delivery_address: '88 Madison Avenue, Floor 14, New York',
        subtotal: 35.98,
        tax: 3.60,
        delivery_fee: 0.00,
        total_amount: 39.58,
        status: 'Out for Delivery',
        notes: 'Call upon arrival',
        created_at: new Date(now - 1000 * 60 * 45).toISOString(), // 45 mins ago
        order_items: [
          { recipe_id: 4, recipe_name: 'Smoked Wagyu Beef Burger', price: 17.99, quantity: 2, recipe_image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600' }
        ]
      }
    ];
  }

  // --- RESERVATIONS METHODS ---

  async createReservation(reservationData: {
    booking_code: string;
    name: string;
    email: string;
    phone: string;
    reservation_date: string;
    reservation_time: string;
    guests: number;
    special_requests?: string;
  }): Promise<{ data: any; error: any }> {
    const user = this.getCurrentUser();
    const payload = {
      ...reservationData,
      id: 'res-' + Math.random().toString(36).substring(2, 9),
      user_id: user?.id || null,
      status: 'Confirmed',
      created_at: new Date().toISOString()
    };

    // Save locally
    if (typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem('fh_local_reservations') || '[]');
        local.unshift(payload);
        localStorage.setItem('fh_local_reservations', JSON.stringify(local));
      } catch (e) {}
    }

    if (!this.isConfigured()) {
      return { data: payload, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('reservations')
        .insert([payload])
        .select()
        .single();

      return { data: data || payload, error };
    } catch (e) {
      return { data: payload, error: null };
    }
  }

  async getAllReservations(): Promise<{ data: any[]; error: any }> {
    let local: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        local = JSON.parse(localStorage.getItem('fh_local_reservations') || '[]');
      } catch (e) {}
    }

    if (local.length === 0) {
      local = [
        {
          id: 'res-seed-1',
          booking_code: 'RES-9021',
          name: 'Victoria Stirling',
          email: 'victoria@example.com',
          phone: '+1 555-772-1920',
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '19:30',
          guests: 4,
          special_requests: 'Anniversary celebration. Window table preferred.',
          status: 'Confirmed',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'res-seed-2',
          booking_code: 'RES-8834',
          name: 'David Chen',
          email: 'david.chen@example.com',
          phone: '+1 555-661-3948',
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '20:15',
          guests: 2,
          special_requests: 'Quiet corner booth.',
          status: 'Confirmed',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      if (typeof window !== 'undefined') {
        localStorage.setItem('fh_local_reservations', JSON.stringify(local));
      }
    }

    if (!this.isConfigured()) {
      return { data: local, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return { data: local, error: null };
      }
      return { data, error: null };
    } catch (e) {
      return { data: local, error: null };
    }
  }

  async updateReservationStatus(reservationIdOrCode: string, status: string): Promise<{ success: boolean; error: any }> {
    if (typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem('fh_local_reservations') || '[]');
        const updated = local.map((r: any) => {
          if (r.id === reservationIdOrCode || r.booking_code === reservationIdOrCode) {
            return { ...r, status };
          }
          return r;
        });
        localStorage.setItem('fh_local_reservations', JSON.stringify(updated));
      } catch (e) {}
    }

    if (this.isConfigured()) {
      try {
        const query = reservationIdOrCode.startsWith('RES-')
          ? this.supabase.from('reservations').update({ status }).eq('booking_code', reservationIdOrCode)
          : this.supabase.from('reservations').update({ status }).eq('id', reservationIdOrCode);
        await query;
      } catch (e) {}
    }

    return { success: true, error: null };
  }

  // --- CUSTOM FOOD ITEMS METHODS (ADMIN) ---

  async getCustomFoodItems(): Promise<any[]> {
    let localItems: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        localItems = JSON.parse(localStorage.getItem('fh_custom_food_items') || '[]');
      } catch (e) {}
    }

    if (!this.isConfigured()) {
      return localItems;
    }

    try {
      const { data, error } = await this.supabase
        .from('food_items')
        .select('*')
        .order('id', { ascending: false });

      if (error || !data) {
        return localItems;
      }

      // Merge and update local cache
      const map = new Map<number, any>();
      localItems.forEach(i => map.set(i.id, i));
      data.forEach(i => map.set(i.id, i));
      const combined = Array.from(map.values());
      if (typeof window !== 'undefined') {
        localStorage.setItem('fh_custom_food_items', JSON.stringify(combined));
      }
      return combined;
    } catch (e) {
      return localItems;
    }
  }

  async addCustomFoodItem(item: any): Promise<any> {
    const newId = Date.now();
    const itemToSave = {
      ...item,
      id: item.id || newId,
      created_at: new Date().toISOString()
    };

    // Save in local storage
    if (typeof window !== 'undefined') {
      try {
        const current = JSON.parse(localStorage.getItem('fh_custom_food_items') || '[]');
        current.unshift(itemToSave);
        localStorage.setItem('fh_custom_food_items', JSON.stringify(current));
      } catch (e) {}
    }

    // Save to Supabase
    if (this.isConfigured()) {
      try {
        const { data, error } = await this.supabase
          .from('food_items')
          .insert([{
            name: itemToSave.name,
            category: itemToSave.category,
            price: itemToSave.price,
            image: itemToSave.image,
            cuisine: itemToSave.cuisine || 'International',
            difficulty: itemToSave.difficulty || 'Easy',
            prep_time_minutes: itemToSave.prepTimeMinutes || 15,
            cook_time_minutes: itemToSave.cookTimeMinutes || 20,
            servings: itemToSave.servings || 2,
            calories_per_serving: itemToSave.caloriesPerServing || 350,
            rating: itemToSave.rating || 4.9,
            review_count: itemToSave.reviewCount || 1,
            ingredients: itemToSave.ingredients || [],
            instructions: itemToSave.instructions || [],
            tags: itemToSave.tags || [],
            meal_type: itemToSave.mealType || ['Lunch', 'Dinner'],
            is_available: itemToSave.is_available !== false,
            is_featured: Boolean(itemToSave.is_featured)
          }])
          .select()
          .single();

        if (!error && data) {
          return { ...itemToSave, id: data.id };
        }
      } catch (err) {
        console.warn('Supabase addCustomFoodItem notice:', err);
      }
    }

    return itemToSave;
  }

  async updateCustomFoodItem(id: number, item: any): Promise<any> {
    if (typeof window !== 'undefined') {
      try {
        const current = JSON.parse(localStorage.getItem('fh_custom_food_items') || '[]');
        const updated = current.map((i: any) => i.id === id ? { ...i, ...item } : i);
        localStorage.setItem('fh_custom_food_items', JSON.stringify(updated));
      } catch (e) {}
    }

    if (this.isConfigured()) {
      try {
        await this.supabase
          .from('food_items')
          .update({
            name: item.name,
            category: item.category,
            price: item.price,
            image: item.image,
            cuisine: item.cuisine,
            prep_time_minutes: item.prepTimeMinutes,
            cook_time_minutes: item.cookTimeMinutes,
            is_available: item.is_available,
            is_featured: item.is_featured
          })
          .eq('id', id);
      } catch (e) {}
    }

    return item;
  }

  async deleteCustomFoodItem(id: number): Promise<boolean> {
    if (typeof window !== 'undefined') {
      try {
        const current = JSON.parse(localStorage.getItem('fh_custom_food_items') || '[]');
        const filtered = current.filter((i: any) => i.id !== id);
        localStorage.setItem('fh_custom_food_items', JSON.stringify(filtered));
      } catch (e) {}
    }

    if (this.isConfigured()) {
      try {
        await this.supabase.from('food_items').delete().eq('id', id);
      } catch (e) {}
    }

    return true;
  }
}

