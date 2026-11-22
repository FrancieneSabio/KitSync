import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService, Item } from '../data.service';
import { CATEGORIES, COLORS } from '../catalog';
import { SelectComponent } from '../select.component';

const blank = (): Item => ({ name: '', category: CATEGORIES[0].name, size: '', color: '', quantity: 0, minStock: 5 });
const PALETTE = ['#2563eb', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule, SelectComponent],
  template: `
    <div class="inv">
      <h1>Inventory</h1>
      <p class="sub">Add stock, edit items, and keep an eye on what is running low.</p>

      <div class="tiles">
        <div class="stat-card">
          <div class="chip"><svg class="ic" viewBox="0 0 24 24"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/></svg></div>
          <div>
            <div class="label">Item types</div>
            <div class="num">{{ data.items().length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="chip"><svg class="ic" viewBox="0 0 24 24"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg></div>
          <div>
            <div class="label">Total units in stock</div>
            <div class="num">{{ totalUnits() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="chip" style="background:#fef3c7;color:#b45309"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>
          <div>
            <div class="label">Running low</div>
            <div class="num">{{ lowCount() }}</div>
            @if (lowCount() > 0) { <div class="note warn">Needs restocking</div> }
          </div>
        </div>
      </div>

      <form class="panel inv-form" [class.editing]="editingId" (ngSubmit)="save()">
        <div class="panel-head">
          <h2>{{ editingId ? 'Edit item' : 'Add item' }}</h2>
          @if (editingId) { <span class="badge warn">Editing</span> }
        </div>
        <div class="grid">
          <label>Category
            <app-select [options]="categoryNames" [value]="form.category" (valueChange)="onCategory($event)" />
          </label>

          <label>Name
            <div class="inv-wrap">
              <input name="name" [(ngModel)]="form.name" required autocomplete="off" placeholder="Pick or type a name"
                     (focus)="nameOpen = true" (blur)="nameOpen = false" (input)="nameOpen = true">
              @if (nameOpen && filteredNames().length) {
                <div class="inv-pop">
                  @for (n of filteredNames(); track n) {
                    <div class="inv-opt" (mousedown)="pickName(n, $event)">{{ n }}</div>
                  }
                </div>
              }
            </div>
          </label>

          <label>Size
            <app-select [options]="sizes()" [value]="form.size ?? ''" (valueChange)="form.size = $event" placeholder="Choose size" />
          </label>

          <label>Color
            <app-select [options]="colorOptions()" [value]="form.color ?? ''" (valueChange)="form.color = $event"
                        clearLabel="No color" placeholder="Choose color" />
          </label>

          <label>Quantity
            <input type="number" min="0" name="quantity" [(ngModel)]="form.quantity" required>
          </label>
          <label>Minimum stock
            <input type="number" min="0" name="minStock" [(ngModel)]="form.minStock" required>
            <small class="inv-hint">Warn me when stock drops to this number</small>
          </label>
        </div>
        <div class="row">
          <button type="submit">{{ editingId ? 'Save changes' : 'Add item' }}</button>
          @if (editingId) { <button type="button" class="ghost" (click)="reset()">Cancel</button> }
        </div>
      </form>

      <div class="panel">
        <div class="panel-head">
          <h2>All items <span class="badge ok" style="margin-left:.4rem">{{ shown().length }}</span></h2>
          <input class="inv-search" placeholder="Search name, size, color" [ngModel]="q()" (ngModelChange)="q.set($event)">
        </div>
        @if (shown().length === 0) {
          <div class="empty">No items found.<br>Add one using the form above.</div>
        } @else {
          <div class="tablewrap"><table>
            <tr><th>Item</th><th>Category</th><th>Size</th><th>Color</th><th>Stock</th><th></th></tr>
            @for (i of shown(); track i.id) {
              <tr [class.inv-editing]="i.id === editingId">
                <td><strong>{{ i.name }}</strong></td>
                <td>
                  <span class="inv-tag" [style.color]="catColor(i.category)" [style.background]="catColor(i.category) + '1f'">{{ i.category }}</span>
                </td>
                <td>{{ i.size }}</td>
                <td>{{ i.color }}</td>
                <td>
                  <div class="inv-stock">
                    <span class="badge" [class.low]="level(i) === 'low'" [class.warn]="level(i) === 'warn'" [class.ok]="level(i) === 'ok'">{{ i.quantity }}</span>
                    <div class="bar" [class.low]="level(i) === 'low'" [class.warn]="level(i) === 'warn'"><i [style.width.%]="pct(i)"></i></div>
                    <small class="muted">min {{ i.minStock }}</small>
                  </div>
                </td>
                <td>
                  <div class="inv-actions">
                    <button type="button" class="ghost" (click)="edit(i)">Edit</button>
                    <button type="button" class="danger" (click)="remove(i)">Delete</button>
                  </div>
                </td>
              </tr>
            }
          </table></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .inv-form.editing { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, .12); }
    .inv-hint { font-weight: 400; color: var(--muted); font-size: .75rem; }
    .inv-search { width: 260px; max-width: 100%; }
    .inv-tag { display: inline-block; padding: .15rem .65rem; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .inv-stock { display: flex; align-items: center; gap: .6rem; min-width: 190px; }
    .inv-stock .bar { flex: 1; min-width: 60px; }
    .inv-actions { display: flex; gap: .4rem; }
    .inv-actions button { padding: .35rem .85rem; font-size: .85rem; }
    tr.inv-editing td { background: #eff5ff; }

    .inv-wrap { position: relative; }
    .inv-wrap input { width: 100%; }
    .inv-pop { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30; max-height: 240px; overflow: auto; padding: 4px;
               background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 14px 36px rgba(29, 78, 216, .18); }
    .inv-opt { padding: .5rem .7rem; border-radius: 8px; font-size: .9rem; font-weight: 500; color: var(--ink); cursor: pointer; }
    .inv-opt:hover { background: #eff5ff; }
  `],
})
export class InventoryComponent {
  data = inject(DataService);
  categoryNames = CATEGORIES.map(c => c.name);
  form: Item = blank();
  editingId: string | null = null;
  q = signal('');
  nameOpen = false;

shown = computed(() => {
  const s = this.q().trim().toLowerCase();
  const made = (i: Item) => (i.created_at ? new Date(i.created_at).getTime() : 0);
  return this.data.items()
    .map((item, idx) => ({ item, idx }))
    .filter(({ item: i }) => `${i.name} ${i.size} ${i.color} ${i.category}`.toLowerCase().includes(s))
    .sort((a, b) => made(b.item) - made(a.item) || b.idx - a.idx)
    .map(({ item }) => item);
});

  totalUnits = computed(() => this.data.items().reduce((s, i) => s + Number(i.quantity), 0));
  lowCount = computed(() => this.data.items().filter(i => i.quantity <= i.minStock).length);

  constructor() {
    inject(ActivatedRoute).queryParamMap.subscribe(p => this.q.set(p.get('q') ?? ''));
  }

  private def() { return CATEGORIES.find(c => c.name === this.form.category); }

  names() { return this.def()?.items ?? []; }

  filteredNames() {
    const s = (this.form.name ?? '').trim().toLowerCase();
    return this.names().filter(n => n.toLowerCase().includes(s));
  }

  pickName(n: string, e: Event) {
    e.preventDefault();
    this.form.name = n;
    this.nameOpen = false;
  }

  sizes() {
    const list = this.def()?.sizes ?? [];
    return this.form.size && !list.includes(this.form.size) ? [this.form.size, ...list] : list;
  }

  colorOptions() {
    return this.form.color && !COLORS.includes(this.form.color) ? [this.form.color, ...COLORS] : COLORS;
  }

  onCategory(name: string) {
    this.form.category = name;
    const sizes = this.def()?.sizes ?? [];
    this.form.size = sizes.length === 1 ? sizes[0] : '';
  }

  catColor(name: string) {
    const i = CATEGORIES.findIndex(c => c.name === name);
    return PALETTE[(i < 0 ? CATEGORIES.length - 1 : i) % PALETTE.length];
  }

  private ratio(i: Item) { return i.quantity / Math.max(i.minStock, 1); }

  level(i: Item): 'low' | 'warn' | 'ok' {
    if (i.quantity > i.minStock) return 'ok';
    return i.quantity === 0 || this.ratio(i) <= 0.5 ? 'low' : 'warn';
  }

  pct(i: Item) {
    return Math.max(4, Math.min(100, Math.round((i.quantity / Math.max(i.minStock * 2, 1)) * 100)));
  }

  async save() {
    if (!(this.form.name ?? '').trim()) { alert('Enter an item name.'); return; }
    if (!this.form.size) { alert('Choose a size.'); return; }

    const item = { ...this.form, name: this.form.name.trim(), quantity: Number(this.form.quantity), minStock: Number(this.form.minStock) };
    try {
      if (this.editingId) await this.data.updateItem(this.editingId, item);
      else await this.data.addItem(item);
      this.reset();
    } catch (err: any) {
      alert('Could not save: ' + (err?.message ?? err));
    }
  }

  edit(i: Item) {
    this.form = { ...i };
    this.editingId = i.id!;
    window.scrollTo({ top: 0 });
  }

  reset() {
    this.form = blank();
    this.editingId = null;
  }

  async remove(i: Item) {
    if (confirm(`Delete ${i.name} (${i.size})? Past distribution records are kept.`)) {
      try {
        await this.data.deleteItem(i.id!);
      } catch (err: any) {
        alert('Could not delete: ' + (err?.message ?? err));
      }
    }
  }
}