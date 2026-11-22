import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { supabase } from './supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  router = inject(Router);
  user = signal<any | null>(null);
  organization = computed<string>(() => this.user()?.user_metadata?.organization ?? '');
  logoutMessage = signal<string | null>(null);
  ready: Promise<void>;

  constructor(zone: NgZone) {
    this.ready = (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      zone.run(() => this.user.set(session?.user ?? null));

      supabase.auth.onAuthStateChange((_event, session) => {
        zone.run(() => this.user.set(session?.user ?? null));
      });
    })();
  }

  async login(email: string, password: string) {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    return result.data;
  }

  async register(email: string, password: string, organization: string) {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { organization } },
    });
    if (result.error) throw result.error;

    // If email confirmation is off, Supabase signs the new user in automatically.
    // Sign out so they land on the login page and log in themselves.
    if (result.data.session) await supabase.auth.signOut();

    return result.data;
  }

  async logout() {
    this.user.set(null);
    this.logoutMessage.set('Log out successfully!');
    this.router.navigate(['/login']);

    setTimeout(() => {
      this.logoutMessage.set(null);
    }, 1200);

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }
}

// Blocks every page except login and register until the person is signed in
export const authGuard: CanActivateFn = async () => {
  const a = inject(AuthService);
  const router = inject(Router);
  await a.ready;
  return a.user() ? true : router.createUrlTree(['/login']);
};