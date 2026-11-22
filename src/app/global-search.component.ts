import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from './data.service';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="gs">
      <div class="gs-wrap">
        <div class="gs-box">
          <svg class="gs-ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input #box type="text" name="gsearch" autocomplete="off"
                 placeholder="Search items, employees, distributions…  ( / )"
                 [ngModel]="q()" (ngModelChange)="q.set($event); open.set(true)"
                 (focus)="open.set(true)" (keydown.escape)="close()" (keydown.enter)="openFirst()">
          @if (q()) {
            <button type="button" class="gs-x" (click)="clear()" aria-label="Clear search">×</button>
          }
        </div>

        @if (open() && q().trim()) {
          <div class="gs-panel">
            @if (total() === 0) {
              <p class="gs-empty">No matches found.</p>
            }

            @if (items().length) {
              <div class="gs-h">Inventory</div>
              @for (i of items(); track i.id) {
                <button type="button" class="gs-row" (click)="go('/inventory')">
                  <span>{{ i.name }} · {{ i.size }} · {{ i.color }}</span>
                  <small>{{ i.quantity }} in stock</small>
                </button>
              }
            }

            @if (employees().length) {
              <div class="gs-h">Employees</div>
              @for (e of employees(); track e.id) {
                <button type="button" class="gs-row" (click)="go('/employees')">
                  <span>{{ e.empNo }} · {{ e.name }}</span>
                  <small>{{ e.department || e.position }}</small>
                </button>
              }
            }

            @if (dists().length) {
              <div class="gs-h">Distributions</div>
              @for (d of dists(); track d.id) {
                <button type="button" class="gs-row" (click)="go('/distribution')">
                  <span>{{ d.employeeName }} · {{ d.itemName }} ({{ d.size }})</span>
                  <small>qty {{ d.qty }}</small>
                </button>
              }
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; position: sticky; top: 0; z-index: 30; }
    .gs { padding: 10px 0 14px; background: linear-gradient(180deg, #eef4ff 70%, rgba(238, 244, 255, 0)); }
    .gs-wrap { position: relative; max-width: 560px; margin: 0 auto; }
    .gs-box { position: relative; }
    .gs-ic { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px;
             fill: none; stroke: #64748b; stroke-width: 2; stroke-linecap: round; pointer-events: none; }
    .gs-box input { width: 100%; box-sizing: border-box; height: 44px; padding: 0 44px 0 44px; border-radius: 999px;
                    border: 1px solid #d5e0f5; background: #fff; font-size: 15px; outline: none;
                    box-shadow: 0 6px 20px rgba(29, 78, 216, .08); transition: border-color .15s, box-shadow .15s; }
    .gs-box input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, .15); }
    .gs-x { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; padding: 0;
            border: 0; border-radius: 50%; background: #eaf1ff; color: #2563eb; font-size: 18px; line-height: 1; cursor: pointer; box-shadow: none; }

    .gs-panel { position: absolute; top: 100%; left: 0; right: 0; margin-top: 6px; padding: 8px; max-height: 60vh; overflow: auto;
                background: #fff; border: 1px solid #e3ebfa; border-radius: 16px; box-shadow: 0 18px 50px rgba(29, 78, 216, .18); }
    .gs-h { padding: 8px 12px 4px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #64748b; }
    .gs-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 10px 12px;
              border: 0; border-radius: 10px; background: transparent; color: #0b1b4d; font: inherit; font-weight: 500;
              text-align: left; cursor: pointer; box-shadow: none; }
    .gs-row:hover { background: #eef4ff; }
    .gs-row small { color: #64748b; font-weight: 400; white-space: nowrap; }
    .gs-empty { margin: 0; padding: 14px 12px; color: #64748b; }

    @media print { :host { display: none; } }
  `],
})
export class GlobalSearchComponent {
  private data = inject(DataService);
  private router = inject(Router);
  private host = inject(ElementRef);

  @ViewChild('box') box?: ElementRef<HTMLInputElement>;

  q = signal('');
  open = signal(false);

  private has(fields: unknown[]) {
    const s = this.q().trim().toLowerCase();
    return !!s && fields.map(f => String(f ?? '')).join(' ').toLowerCase().includes(s);
  }

  items = computed(() => this.data.items()
    .filter(i => this.has([i.name, i.category, i.size, i.color])).slice(0, 5));

  employees = computed(() => this.data.employees()
    .filter(e => this.has([e.empNo, e.name, e.department, e.position])).slice(0, 5));

  dists = computed(() => this.data.distributions()
    .filter(d => this.has([d.employeeName, d.itemName, d.empNo, d.size, d.issuedBy])).slice(0, 5));

  total = computed(() => this.items().length + this.employees().length + this.dists().length);

  go(path: string) {
    this.router.navigate([path], { queryParams: { q: this.q().trim() } });
    this.close();
  }

  openFirst() {
    if (this.items().length) this.go('/inventory');
    else if (this.employees().length) this.go('/employees');
    else if (this.dists().length) this.go('/distribution');
  }

  close() { this.open.set(false); }
  clear() { this.q.set(''); this.close(); this.box?.nativeElement.focus(); }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    const typing = !!t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable);
    if (e.key === '/' && !typing) {
      e.preventDefault();
      this.box?.nativeElement.focus();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target as Node)) this.close();
  }
}