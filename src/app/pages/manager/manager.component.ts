import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupabaseService, OrderRecord } from '../../services/supabase.service';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit, OnDestroy {
  orders: OrderRecord[] = [];
  filteredOrders: OrderRecord[] = [];
  reservations: any[] = [];
  filteredReservations: any[] = [];

  activeTab: 'orders' | 'reservations' = 'orders';
  selectedStatusFilter: string = 'All';
  searchQuery: string = '';

  isLoading = true;
  isSyncing = false;
  soundAlertEnabled = true;

  // Selected order for modal / receipt
  activeReceiptOrder: OrderRecord | null = null;
  showReceiptModal = false;

  // Polling & sync
  private syncTimer: any;
  countdownSeconds = 12;
  private countdownTimer: any;
  private previousOrderCount = 0;
  private ordersSub?: Subscription;

  // Audio Context for sound alerts without external files
  private audioCtx: AudioContext | null = null;
  Number = Number;

  constructor(
    public supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    this.loadOrders();
    this.loadReservations();
    this.startAutoSync();

    this.ordersSub = this.supabaseService.ordersChanged$.subscribe(() => {
      this.loadOrders(true);
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'fh_orders_last_updated' || e.key === 'fh_local_orders') {
          this.loadOrders(true);
        }
      });
      window.addEventListener('fh_orders_changed', () => {
        this.loadOrders(true);
      });
    }
  }

  ngOnDestroy(): void {
    this.stopAutoSync();
    if (this.ordersSub) {
      this.ordersSub.unsubscribe();
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
    }
  }

  private startAutoSync(): void {
    this.countdownSeconds = 12;
    this.countdownTimer = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        this.countdownSeconds = 12;
        this.refreshData(true);
      }
    }, 1000);
  }

  private stopAutoSync(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.syncTimer) clearInterval(this.syncTimer);
  }

  async loadOrders(isSilent = false): Promise<void> {
    if (!isSilent) this.isLoading = true;
    this.isSyncing = true;

    const { data } = await this.supabaseService.getAllOrders();
    this.isLoading = false;
    this.isSyncing = false;

    if (data) {
      // Check for newly incoming order to play chime
      if (this.previousOrderCount > 0 && data.length > this.previousOrderCount && this.soundAlertEnabled) {
        this.playOrderChime();
      }
      this.previousOrderCount = data.length;
      this.orders = data;
      this.applyFilters();
    }
  }

  async loadReservations(): Promise<void> {
    const { data } = await this.supabaseService.getAllReservations();
    if (data) {
      this.reservations = data;
      this.filteredReservations = [...data];
    }
  }

  refreshData(isSilent = false): void {
    this.loadOrders(isSilent);
    this.loadReservations();
  }

  applyFilters(): void {
    let result = [...this.orders];

    // Status filter
    if (this.selectedStatusFilter !== 'All') {
      result = result.filter(o => o.status.toLowerCase() === this.selectedStatusFilter.toLowerCase());
    }

    // Search query filter
    const query = this.searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(o =>
        o.order_ref.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_phone.toLowerCase().includes(query) ||
        o.delivery_address.toLowerCase().includes(query)
      );
    }

    this.filteredOrders = result;
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter = status;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  async updateOrderStatus(order: OrderRecord, newStatus: string): Promise<void> {
    order.status = newStatus;
    await this.supabaseService.updateOrderStatus(order.order_ref, newStatus);
    this.applyFilters();
    if (this.soundAlertEnabled) {
      this.playStatusSound();
    }
  }

  async updateReservationStatus(resId: string, newStatus: string): Promise<void> {
    const res = this.reservations.find(r => r.id === resId || r.booking_code === resId);
    if (res) {
      res.status = newStatus;
    }
    await this.supabaseService.updateReservationStatus(resId, newStatus);
  }

  // --- AUDIO NOTIFICATION (Web Audio API Chime) ---

  toggleSound(): void {
    this.soundAlertEnabled = !this.soundAlertEnabled;
    if (this.soundAlertEnabled) {
      this.playOrderChime();
    }
  }

  private playOrderChime(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      // High pleasant restaurant chime (2 tones)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.2); // A5
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.9);
    } catch (e) {
      console.warn('Audio chime playback issue:', e);
    }
  }

  private playStatusSound(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) this.audioCtx = new AudioContextClass();
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // --- STATS COUNTERS ---

  getCount(status: string): number {
    if (status === 'All') return this.orders.length;
    return this.orders.filter(o => o.status.toLowerCase() === status.toLowerCase()).length;
  }

  getTotalRevenue(): number {
    return this.orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }

  // --- THERMAL INVOICE / RECEIPT MODAL ---

  openReceipt(order: OrderRecord): void {
    this.activeReceiptOrder = order;
    this.showReceiptModal = true;
  }

  closeReceipt(): void {
    this.showReceiptModal = false;
    this.activeReceiptOrder = null;
  }

  printReceipt(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  // Formatting helpers
  formatTimeAgo(isoString?: string): string {
    if (!isoString) return 'Just now';
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} day ago`;
  }

  signOut(): void {
    this.supabaseService.staffSignOut();
    this.router.navigate(['/staff-login']);
  }
}
