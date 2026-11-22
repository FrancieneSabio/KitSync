import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../data.service';

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="rp">
      <h1>Distribution report</h1>
      <p class="sub">See everything that was issued, filter it, and export it.</p>

      <div class="tiles">
        <div class="stat-card">
          <div class="chip"><svg class="ic" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg></div>
          <div>
            <div class="label">Records</div>
            <div class="num">{{ rows().length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="chip"><svg class="ic" viewBox="0 0 24 24"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg></div>
          <div>
            <div class="label">Units issued</div>
            <div class="num">{{ units() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="chip"><svg class="ic" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div>
            <div class="label">Employees served</div>
            <div class="num">{{ served() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="chip" style="background:#fef3c7;color:#b45309"><svg class="ic" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg></div>
          <div>
            <div class="label">Replacements</div>
            <div class="num">{{ replacements() }}</div>
          </div>
        </div>
      </div>

      <div class="panel noprint">
        <div class="rp-filters">
          <input class="rp-search" placeholder="Search employee or item" [ngModel]="q()" (ngModelChange)="q.set($event)">
          <label class="rp-date">From <input type="date" [ngModel]="from()" (ngModelChange)="onFrom($event)"></label>
          <label class="rp-date">To <input type="date" [ngModel]="to()" (ngModelChange)="onTo($event)"></label>
          <span class="rp-gap"></span>
          <button type="button" class="ghost" (click)="csv()" [disabled]="rows().length === 0">Download CSV</button>
          <button type="button" (click)="print()">Print</button>
        </div>
        <div class="rp-chips">
          <button type="button" class="rp-chip" [class.on]="preset() === 'today'" (click)="setPreset('today')">Today</button>
          <button type="button" class="rp-chip" [class.on]="preset() === '7'" (click)="setPreset('7')">Last 7 days</button>
          <button type="button" class="rp-chip" [class.on]="preset() === '30'" (click)="setPreset('30')">Last 30 days</button>
          <button type="button" class="rp-chip" [class.on]="preset() === 'all'" (click)="setPreset('all')">All time</button>
          @if (hasFilters()) { <button type="button" class="rp-clear" (click)="clear()">Clear filters</button> }
        </div>
      </div>

      @if (top().length > 0) {
        <div class="panel">
          <div class="panel-head"><h2>Most issued items</h2><span class="muted" style="font-size:.85rem">by units</span></div>
          @for (t of top(); track t.name) {
            <div class="li">
              <div class="top"><span>{{ t.name }}</span><b>{{ t.qty }} units</b></div>
              <div class="bar"><i [style.width.%]="t.pct"></i></div>
            </div>
          }
        </div>
      }

      <div class="panel">
        <div class="panel-head">
          <h2>All distributions <span class="badge ok" style="margin-left:.4rem">{{ rows().length }}</span></h2>
        </div>
        @if (rows().length === 0) {
          <div class="empty">No records match.<br>Clear the search or widen the dates.</div>
        } @else {
          <div class="tablewrap"><table>
            <tr><th>Date</th><th>Employee</th><th>Item</th><th>Size</th><th>Qty</th><th>Type</th><th>Issued by</th></tr>
            @for (d of rows(); track d.id) {
              <tr>
                <td>{{ d.date | date:'MMM d, y, h:mm a' }}</td>
                <td>
                  <div class="who-cell">
                    <span class="mini-av">{{ initials(d.employeeName) }}</span>
                    <div>
                      <strong>{{ d.employeeName }}</strong>
                      <small class="rp-no">No. {{ d.empNo }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ d.itemName }}</td>
                <td>{{ d.size || '—' }}</td>
                <td><strong>{{ d.qty }}</strong></td>
                <td><span class="badge" [class.warn]="d.reissue" [class.ok]="!d.reissue">{{ d.reissue ? 'Replacement' : 'First issue' }}</span></td>
                <td>{{ by(d.issuedBy) }}</td>
              </tr>
            }
          </table></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .rp-filters { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; }
    .rp-search { width: 260px; max-width: 100%; }
    .rp-date { flex-direction: row; align-items: center; gap: .4rem; }
    .rp-gap { margin-left: auto; }
    .rp-chips { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .8rem; }
    .rp-chip { padding: .3rem .85rem; font-size: .82rem; background: #fff; color: var(--primary-dark); border: 1.5px solid var(--line); }
    .rp-chip.on { background: linear-gradient(135deg, #1d4ed8, #3b82f6); color: #fff; border-color: transparent; }
    .rp-clear { padding: .3rem .85rem; font-size: .82rem; background: transparent; color: var(--bad); border: 0; }
    .rp-no { display: block; color: var(--muted); font-size: .78rem; }
  `],
})
export class ReportsComponent {
  data = inject(DataService);
  q = signal(''); from = signal(''); to = signal(''); preset = signal('');

  constructor() {
    inject(ActivatedRoute).queryParamMap.subscribe(p => this.q.set(p.get('q') ?? ''));
  }

  rows = computed(() => {
    const s = this.q().trim().toLowerCase();
    const f = this.from() ? new Date(this.from() + 'T00:00:00').getTime() : 0;
    const t = this.to() ? new Date(this.to() + 'T23:59:59').getTime() : Infinity;
    return this.data.distributions()
      .filter(d => {
        const time = new Date(d.date).getTime();
        return time >= f && time <= t && `${d.employeeName} ${d.empNo} ${d.itemName}`.toLowerCase().includes(s);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  private qtyOf(d: { qty?: number; quantity?: number }) { return Number(d.qty ?? d.quantity ?? 0); }

  units = computed(() => this.rows().reduce((s, d) => s + this.qtyOf(d), 0));
  served = computed(() => new Set(this.rows().map(d => d.employeeId)).size);
  replacements = computed(() => this.rows().filter(d => d.reissue).length);

  top = computed(() => {
    const map = new Map<string, number>();
    for (const d of this.rows()) {
      const name = d.itemName ?? 'Unknown item';
      map.set(name, (map.get(name) ?? 0) + this.qtyOf(d));
    }
    const list = [...map.entries()].map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const max = Math.max(1, ...list.map(x => x.qty));
    return list.map(x => ({ ...x, pct: Math.max(6, Math.round((x.qty / max) * 100)) }));
  });

  hasFilters() { return !!(this.q() || this.from() || this.to()); }

  onFrom(v: string) { this.from.set(v); this.preset.set(''); }
  onTo(v: string) { this.to.set(v); this.preset.set(''); }

  setPreset(p: 'today' | '7' | '30' | 'all') {
    const now = new Date();
    this.preset.set(p);
    if (p === 'all') { this.from.set(''); this.to.set(''); return; }
    const start = new Date(now);
    if (p !== 'today') start.setDate(start.getDate() - (Number(p) - 1));
    this.from.set(ymd(start));
    this.to.set(ymd(now));
  }

  clear() { this.q.set(''); this.from.set(''); this.to.set(''); this.preset.set(''); }

  initials(name?: string) {
    return (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  }

  by(email?: string) { return (email ?? '').split('@')[0]; }

  print() { window.print(); }

  csv() {
    const head = ['Date', 'Emp no', 'Employee', 'Item', 'Size', 'Qty', 'Type', 'Issued by'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = this.rows().map(d =>
      [d.date, d.empNo, d.employeeName, d.itemName, d.size, this.qtyOf(d), d.reissue ? 'Replacement' : 'First issue', d.issuedBy].map(esc).join(','));
    const blob = new Blob(['\uFEFF' + [head.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'distribution-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}