import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { DataService } from '../data.service';

@Component({
  selector: 'app-distribution',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink],
  template: `
    <div class="ds">
      <h1>Issue supplies</h1>
      <p class="sub">Record what each employee receives. Stock is deducted automatically.</p>

      <div class="ds-cols">
        <form class="panel" (ngSubmit)="issue()">
          <div class="panel-head"><h2>New distribution</h2></div>

          @if (data.employees().length === 0) {
            <div class="ds-hint">No employees yet. <a routerLink="/employees">Add one first</a>.</div>
          }

          <div class="ds-fields">
            <div class="ds-emp">
              <span class="ds-title">Employee</span>

              <input type="search" name="empSearch" [(ngModel)]="empSearch"
                     (keydown.enter)="onEnter($event)"
                     placeholder="Type a name or employee number to search…" autocomplete="off">

              @if (empSearch.trim()) {
                <div class="ds-results">
                  @for (e of results(); track e.id) {
                    <button type="button" class="ds-result" [class.sel]="e.id === empId" (click)="pick(e)">
                      <span class="mini-av">{{ initials(e.name) }}</span>
                      <span>
                        <strong>{{ e.name }}</strong>
                        <small>{{ e.empNo }}@if (e.position) { · {{ e.position }} }</small>
                      </span>
                    </button>
                  } @empty {
                    <div class="ds-none">No employee matches "{{ empSearch }}".</div>
                  }
                </div>
              }

              <select name="emp" [(ngModel)]="empId" required>
                <option value="" disabled>Choose employee</option>
                @for (e of data.employees(); track e.id) {
                  <option [value]="e.id">{{ e.empNo }} · {{ e.name }}</option>
                }
              </select>
            </div>

            <label>Item
              <select name="item" [(ngModel)]="itemId" required>
                <option value="" disabled>Choose item</option>
                @for (i of data.items(); track i.id) {
                  <option [value]="i.id" [disabled]="i.quantity <= 0">{{ i.name }} · {{ i.size }} · {{ i.color }} ({{ i.quantity }} left)</option>
                }
              </select>
            </label>
            <label>Quantity
              <input type="number" min="1" name="qty" [(ngModel)]="qty" required>
            </label>
          </div>

          <label class="ds-check">
            <input type="checkbox" name="reissue" [(ngModel)]="reissue">
            <span>This is a replacement (allow a second issue)</span>
          </label>

          <div class="ds-preview">
            @if (selEmp(); as e) {
              <div class="ds-who">
                <span class="mini-av ds-av">{{ initials(e.name) }}</span>
                <div>
                  <strong>{{ e.name }}</strong>
                  <small>{{ e.empNo }}@if (e.position) { · {{ e.position }} }</small>
                </div>
              </div>
            } @else {
              <p class="muted" style="margin:0">Choose an employee to see their details.</p>
            }

            @if (selItem(); as it) {
              <div class="ds-line"><span class="muted">In stock</span><b>{{ it.quantity }}</b></div>
              <div class="ds-line"><span class="muted">After this issue</span><b [class.ds-bad]="after() < 0">{{ after() }}</b></div>
              <div class="bar" [class.low]="isLowAfter()"><i [style.width.%]="afterPct()"></i></div>
              @if (after() < 0) {
                <small class="ds-bad">Not enough stock for that quantity.</small>
              } @else if (isLowAfter()) {
                <small style="color:var(--warn);font-weight:600">This will leave the item running low.</small>
              }
            }
          </div>

          @if (msg) { <div class="msg" [class.err]="msg.err" [class.good]="!msg.err">{{ msg.text }}</div> }

          <button type="submit" class="ds-submit" [disabled]="busy">{{ busy ? 'Recording…' : 'Record distribution' }}</button>
        </form>

        <div class="panel">
          <div class="panel-head">
            <h2>Latest distributions</h2>
            @if (data.distributions().length > 0) { <a routerLink="/reports">View all</a> }
          </div>
          @if (recent().length === 0) {
            <div class="empty">Nothing issued yet.<br>Fill in the form to record the first one.</div>
          } @else {
            <div class="tablewrap"><table>
              <tr><th>Date</th><th>Employee</th><th>Item</th><th>Qty</th><th>Issued by</th></tr>
              @for (d of recent(); track d.id) {
                <tr>
                  <td>{{ d.date | date:'MMM d, h:mm a' }}</td>
                  <td><div class="who-cell"><span class="mini-av">{{ initials(d.employeeName) }}</span>{{ d.employeeName }}</div></td>
                  <td>{{ d.itemName }}@if (d.size) { ({{ d.size }}) }@if (d.reissue) { <span class="badge warn" style="margin-left:.4rem">Replacement</span> }</td>
                  <td>{{ d.qty }}</td>
                  <td>{{ by(d.issuedBy) }}</td>
                </tr>
              }
            </table></div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ds-cols { display: grid; gap: 1rem; grid-template-columns: minmax(320px, 1fr) minmax(0, 1.5fr); align-items: start; }
    @media (max-width: 1000px) { .ds-cols { grid-template-columns: 1fr; } }
    .ds-fields { display: grid; gap: .85rem; }

    .ds-emp { display: flex; flex-direction: column; gap: .3rem; }
    .ds-title { font-size: .85rem; color: var(--muted); font-weight: 600; }
    .ds-results { border: 1px solid var(--line); border-radius: 12px; background: #fff; box-shadow: var(--shadow);
                  max-height: 260px; overflow: auto; padding: .3rem; margin: .1rem 0 .3rem; }
    .ds-result { display: flex; align-items: center; gap: .7rem; width: 100%; text-align: left; padding: .55rem .7rem;
                 background: #fff; color: var(--ink); border: 0; border-radius: 10px; font-weight: 500; cursor: pointer; }
    .ds-result:hover { background: #eef5ff; filter: none; }
    .ds-result.sel { background: #e0ecff; }
    .ds-result small { display: block; color: var(--muted); font-weight: 400; }
    .ds-none { padding: .7rem; color: var(--muted); font-size: .9rem; }

    .ds-check { flex-direction: row; align-items: center; gap: .6rem; margin-top: .85rem; padding: .65rem .8rem;
                border: 1.5px dashed var(--line); border-radius: 10px; cursor: pointer; }
    .ds-check span { font-weight: 500; color: var(--ink); }
    .ds-preview { margin: 1rem 0; padding: .9rem 1rem; border-radius: 12px; background: #f4f8ff; border: 1px solid var(--line); display: grid; gap: .6rem; }
    .ds-who { display: flex; align-items: center; gap: .7rem; }
    .ds-who small { display: block; color: var(--muted); }
    .ds-av { width: 38px; height: 38px; flex: 0 0 38px; font-size: 13px; }
    .ds-line { display: flex; justify-content: space-between; font-size: .92rem; }
    .ds-bad { color: var(--bad); font-weight: 700; }
    .ds-hint { margin-bottom: .85rem; padding: .65rem .8rem; border-radius: 10px; background: #fef3c7; color: var(--warn); font-size: .9rem; }
    .ds-submit { width: 100%; padding: .75rem 1rem; }
  `],
})
export class DistributionComponent {
  data = inject(DataService);
  private auth = inject(AuthService);
  empId = ''; itemId = ''; qty = 1; reissue = false; busy = false;
  empSearch = '';
  msg: { text: string; err: boolean } | null = null;

  recent = computed(() =>
    [...this.data.distributions()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
  );

  // employees whose name or number contains the typed text (shown right under the search box)
  results() {
    const s = this.empSearch.trim().toLowerCase();
    if (!s) return [];
    return this.data.employees()
      .filter(e => `${e.name ?? ''} ${e.empNo ?? ''}`.toLowerCase().includes(s))
      .slice(0, 8);
  }

  pick(e: { id?: string }) {
    this.empId = e.id ?? '';
    this.empSearch = '';
  }

  // Enter in the search box: pick the employee if only one matches (never submits the form)
  onEnter(ev: Event) {
    ev.preventDefault();
    const r = this.results();
    if (r.length === 1) this.pick(r[0]);
  }

  selEmp() { return this.data.employees().find(e => e.id === this.empId); }
  selItem() { return this.data.items().find(i => i.id === this.itemId); }

  after() {
    const it = this.selItem();
    return it ? it.quantity - Number(this.qty || 0) : 0;
  }

  afterPct() {
    const it = this.selItem();
    if (!it || it.quantity <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((this.after() / it.quantity) * 100)));
  }

  isLowAfter() {
    const it = this.selItem();
    return !!it && this.after() <= it.minStock;
  }

  initials(name?: string) {
    return (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  }

  by(email?: string) { return (email ?? '').split('@')[0]; }

  async issue() {
    const emp = this.selEmp();
    const item = this.selItem();
    if (!emp || !item) {
      this.msg = { err: true, text: 'Choose an employee and an item first. No employees yet? Add one on the Employees page.' };
      return;
    }
    this.busy = true; this.msg = null;
    try {
      await this.data.distribute(emp, item, Number(this.qty), this.auth.user()?.email ?? 'unknown', this.reissue);
      const left = item.quantity - Number(this.qty);
      this.msg = {
        err: false,
        text: `Recorded: ${item.name} (${item.size}) issued to ${emp.name}.` +
          (left <= item.minStock ? ` Warning: only ${left} left, running low!` : '')
      };
      this.itemId = ''; this.qty = 1; this.reissue = false;
    } catch (e: any) {
      if (e.message === 'DUPLICATE') this.msg = { err: true, text: `${emp.name} already received ${item.name} (${item.size}). Tick "replacement" if this is a re-issue.` };
      else if (e.message === 'NOSTOCK') this.msg = { err: true, text: `Not enough stock. Only ${item.quantity} left.` };
      else this.msg = { err: true, text: 'Could not save: ' + (e?.message ?? e) };
    }
    this.busy = false;
  }
}