import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './auth.service';
import { DataService } from './data.service';
import { COMPANY } from './catalog';
import { TopbarComponent } from './topbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TopbarComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  auth = inject(AuthService);
  data = inject(DataService);
  company = COMPANY;

  displayName(): string {
    const email = this.auth.user()?.email ?? '';
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim();
    return name ? name.replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'User';
  }

  getRouteKey(outlet: RouterOutlet) {
    return outlet.isActivated ? outlet.activatedRoute.snapshot.url.join('/') : '';
  }
}