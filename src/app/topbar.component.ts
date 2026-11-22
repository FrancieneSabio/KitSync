import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { DataService } from './data.service';
import { COMPANY } from './catalog';

type Menu = 'settings' | 'bell' | 'user' | null;

const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="tb noprint">
      <div class="tb-search">
        <input #box type="text" name="tbsearch" autocomplete="off" placeholder="Search items, employees…  ( / )"
               [ngModel]="q()" (ngModelChange)="onSearch($event)"
               (focus)="menu.set(null); searchOpen.set(true)"
               (keydown.escape)="searchOpen.set(false)" (keydown.enter)="openFirst()">
        @if (q()) { <button type="button" class="tb-clear" (click)="clearSearch()" aria-label="Clear search">×</button> }
        <svg class="tb-search-ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

        @if (searchOpen() && q().trim()) {
          <div class="tb-results">
            @if (total() === 0) { <p class="tb-empty">No matches found.</p> }
            @if (items().length) {
              <div class="tb-h">Inventory</div>
              @for (i of items(); track i.id) {
                <button type="button" class="tb-row" (click)="go('/inventory')">
                  <span>{{ i.name }} · {{ i.size }} · {{ i.color }}</span><small>{{ i.quantity }} in stock</small>
                </button>
              }
            }
            @if (employees().length) {
              <div class="tb-h">Employees</div>
              @for (e of employees(); track e.id) {
                <button type="button" class="tb-row" (click)="go('/employees')">
                  <span>{{ e.empNo }} · {{ e.name }}</span><small>{{ e.department || e.position }}</small>
                </button>
              }
            }
            @if (dists().length) {
              <div class="tb-h">Distributions</div>
              @for (d of dists(); track d.id) {
                <button type="button" class="tb-row" (click)="go('/reports')">
                  <span>{{ d.employeeName }} · {{ d.itemName }} ({{ d.size }})</span><small>qty {{ d.qty }}</small>
                </button>
              }
            }
          </div>
        }
      </div>

      <span class="tb-gap"></span>

      <div class="tb-dd">
        <button type="button" class="tb-icon" (click)="toggle('settings')" aria-label="Settings">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        @if (menu() === 'settings') {
          <div class="tb-pop">
            <button type="button" class="tb-opt" (click)="refresh()"><span>Refresh data</span></button>
            <button type="button" class="tb-opt" (click)="print()"><span>Print this page</span></button>
            <div class="tb-sep"></div>
            <button type="button" class="tb-opt out" (click)="logout()"><span>Log out</span></button>
          </div>
        }
      </div>

      <div class="tb-dd">
        <button type="button" class="tb-icon" (click)="toggle('bell')" aria-label="Notifications">
          <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          @if (unread()) { <span class="tb-dot"></span> }
        </button>
        @if (menu() === 'bell') {
          <div class="tb-pop wide">
            <div class="tb-pop-h">Notifications <span class="badge" [class.low]="low().length" [class.ok]="!low().length">{{ low().length }}</span></div>
            @if (low().length === 0) {
              <p class="tb-empty">You're all caught up. Nothing is running low.</p>
            } @else {
              @for (i of low().slice(0, 6); track i.id) {
                <button type="button" class="tb-row" (click)="openItem(i.name)">
                  <span>{{ i.name }} · {{ i.size }} · {{ i.color }}</span>
                  <span class="badge" [class.low]="i.quantity === 0" [class.warn]="i.quantity > 0">{{ i.quantity }} left</span>
                </button>
              }
              @if (low().length > 6) { <p class="tb-more">+ {{ low().length - 6 }} more</p> }
              <div class="tb-sep"></div>
              <button type="button" class="tb-opt" (click)="goPlain('/inventory')"><span>View inventory</span></button>
            }
          </div>
        }
      </div>

      <div class="tb-dd">
        <button type="button" class="tb-user" (click)="toggle('user')">
          <span class="tb-hi">Hi, {{ firstName() }}</span>
          <span class="tb-av">{{ initials() }}</span>
        </button>
        @if (menu() === 'user') {
          <div class="tb-pop wide">
            <div class="tb-me">
              <span class="tb-av big">{{ initials() }}</span>
              <div>
                <strong>{{ fullName() }}</strong>
                <small>{{ auth.user()?.email }}</small>
                <small class="co">{{ auth.organization() || company.name }}</small>
              </div>
            </div>
            <div class="tb-sep"></div>
            <button type="button" class="tb-opt out" (click)="logout()"><span>Log out</span></button>
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; position: sticky; top: 0; z-index: 40; }
    .tb { display: flex; align-items: center; gap: 10px; padding: 10px 0 16px; background: linear-gradient(180deg, var(--soft) 78%, transparent); }
    .tb svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .tb-gap { flex: 1; }
    .tb-dd { position: relative; }

    .tb-search { position: relative; flex: 0 1 340px; min-width: 170px; }
    .tb-search input { width: 100%; height: 46px; padding: 0 50px 0 20px; border: 0; border-radius: 999px; background: var(--tint);
                       color: var(--ink); font-size: 14px; outline: none; transition: background .15s, box-shadow .15s; }
    .tb-search input::placeholder { color: #8f9bb5; }
    .tb-search input:focus { background: #fff; box-shadow: 0 0 0 3px var(--ring); }
    .tb-search-ic { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; color: var(--primary); pointer-events: none; }
    .tb-clear { position: absolute; right: 42px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%;
                background: #fff; color: var(--primary); font-size: 16px; line-height: 1; box-shadow: none; cursor: pointer; }
    .tb-clear:hover { filter: none; background: var(--tint); }

    .tb-icon:hover, .tb-user:hover { filter: none; background: var(--tint); }

    .tb-icon { position: relative; display: grid; place-items: center; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 50%;
               background: transparent; color: var(--primary-dark); box-shadow: none; cursor: pointer; }
    .tb-icon svg { width: 21px; height: 21px; }
    .tb-dot { position: absolute; top: 8px; right: 9px; width: 10px; height: 10px; border-radius: 50%; background: #ef4444; border: 2px solid var(--soft); }

    .tb-user { display: flex; align-items: center; gap: 10px; padding: 3px 4px 3px 12px; border: 0; border-radius: 999px; background: transparent;
               color: var(--ink); font-weight: 600; font-size: 14px; white-space: nowrap; box-shadow: none; cursor: pointer; }
    .tb-hi { white-space: nowrap; }
    .tb-av { display: grid; place-items: center; flex: 0 0 38px; width: 38px; height: 38px; border-radius: 50%; background: var(--grad-btn);
             color: #fff; font-size: 13px; font-weight: 700; border: 2px solid #fff; box-shadow: 0 2px 8px var(--ring); }
    .tb-av.big { width: 44px; height: 44px; flex-basis: 44px; font-size: 15px; }

    .tb-pop { position: absolute; top: calc(100% + 8px); right: 0; min-width: 200px; padding: 6px; z-index: 50; background: #fff;
              border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 18px 50px color-mix(in srgb, var(--brand) 18%, transparent); }
    .tb-pop.wide { width: 320px; }
    .tb-pop-h { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px 6px; font-weight: 700; font-size: .92rem; }

    .tb-opt, .tb-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; padding: .55rem .7rem; border: 0;
                       border-radius: 9px; background: transparent; color: var(--ink); font: inherit; font-size: .9rem; font-weight: 500;
                       text-align: left; box-shadow: none; cursor: pointer; }
    .tb-opt:hover:not(:disabled), .tb-row:hover { filter: none; background: var(--tint); }
    .tb-opt small, .tb-row small { color: var(--muted); font-weight: 400; white-space: nowrap; }
    .tb-opt.out { color: var(--orange); font-weight: 600; }
    .tb-sep { height: 1px; margin: 6px 4px; background: var(--line); }
    .tb-empty, .tb-more { margin: 0; padding: 12px 10px; color: var(--muted); font-size: .88rem; }
    .tb-more { padding: 4px 10px 8px; }

    .tb-results { position: absolute; top: calc(100% + 8px); left: 0; right: 0; max-height: 60vh; overflow: auto; padding: 6px; z-index: 50;
                  background: #fff; border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 18px 50px color-mix(in srgb, var(--brand) 18%, transparent); }
    .tb-h { padding: 8px 10px 4px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }

    .tb-me { display: flex; align-items: center; gap: 12px; padding: 8px 8px 4px; }
    .tb-me strong { display: block; font-size: .95rem; }
    .tb-me small { display: block; color: var(--muted); font-size: .78rem; overflow-wrap: anywhere; }
    .tb-me small.co { color: var(--primary-dark); font-weight: 600; margin-top: 2px; }

    @media (max-width: 700px) {
      .tb-hi { display: none; }
      .tb-user { padding: 3px; }
      .tb-search { flex-basis: 100%; }
      .tb { flex-wrap: wrap; }
      .tb-gap { display: none; }
    }
    @media print { :host { display: none; } }
  `],
})
export class TopbarComponent {
  auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  private host = inject(ElementRef);
  company = COMPANY;

  @ViewChild('box') box?: ElementRef<HTMLInputElement>;

  menu = signal<Menu>(null);
  searchOpen = signal(false);
  q = signal('');

  private seenSig = signal(store.get('kitsync-seen-low') ?? '');

  // ----- who is logged in -----
  fullName = computed<string>(() => {
    const email: string = this.auth.user()?.email ?? '';
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim();
    return name ? name.replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'User';
  });
  firstName = computed<string>(() => this.fullName().split(' ')[0]);
  initials = computed<string>(() =>
    this.fullName().split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'U'
  );

  // ----- notifications: low stock -----
  low = computed(() =>
    this.data.items()
      .filter(i => i.quantity <= i.minStock)
      .sort((a, b) => a.quantity / Math.max(a.minStock, 1) - b.quantity / Math.max(b.minStock, 1))
  );
  private sig = computed(() => this.low().map(i => `${i.id}:${i.quantity}`).join('|'));
  unread = computed(() => this.low().length > 0 && this.sig() !== this.seenSig());

  // ----- search -----
  private has(fields: unknown[]) {
    const s = this.q().trim().toLowerCase();
    return !!s && fields.map(f => String(f ?? '')).join(' ').toLowerCase().includes(s);
  }
  items = computed(() => this.data.items().filter(i => this.has([i.name, i.category, i.size, i.color])).slice(0, 5));
  employees = computed(() => this.data.employees().filter(e => this.has([e.empNo, e.name, e.department, e.position])).slice(0, 5));
  dists = computed(() => this.data.distributions().filter(d => this.has([d.employeeName, d.itemName, d.empNo, d.size, d.issuedBy])).slice(0, 5));
  total = computed(() => this.items().length + this.employees().length + this.dists().length);

  onSearch(v: string) { this.q.set(v); this.searchOpen.set(true); this.menu.set(null); }
  clearSearch() { this.q.set(''); this.searchOpen.set(false); this.box?.nativeElement.focus(); }

  go(path: string) {
    this.router.navigate([path], { queryParams: { q: this.q().trim() } });
    this.searchOpen.set(false);
  }
  openFirst() {
    if (this.items().length) this.go('/inventory');
    else if (this.employees().length) this.go('/employees');
    else if (this.dists().length) this.go('/reports');
  }

  // ----- menus -----
  toggle(m: Exclude<Menu, null>) {
    this.searchOpen.set(false);
    const next = this.menu() === m ? null : m;
    this.menu.set(next);
    if (next === 'bell') {
      this.seenSig.set(this.sig());
      store.set('kitsync-seen-low', this.sig());
    }
  }

  openItem(name: string) {
    this.router.navigate(['/inventory'], { queryParams: { q: name } });
    this.menu.set(null);
  }
  goPlain(path: string) { this.router.navigate([path]); this.menu.set(null); }

  async refresh() { this.menu.set(null); await this.data.loadData(); }
  print() { this.menu.set(null); setTimeout(() => window.print(), 50); }
  logout() { this.menu.set(null); this.auth.logout(); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target as Node)) {
      this.menu.set(null);
      this.searchOpen.set(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') { this.menu.set(null); this.searchOpen.set(false); return; }
    const t = e.target as HTMLElement | null;
    const typing = !!t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable);
    if (e.key === '/' && !typing) {
      e.preventDefault();
      this.box?.nativeElement.focus();
    }
  }
}