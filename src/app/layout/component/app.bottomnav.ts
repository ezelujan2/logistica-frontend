import { Component, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LayoutService } from '../service/layout.service';

interface NavItem {
    label: string;
    icon: string;
    route?: string;
    action?: () => void;
}

@Component({
    selector: 'app-bottom-nav',
    standalone: true,
    imports: [RouterModule],
    template: `
        @if (isMobile) {
            <nav class="bottom-nav">
                @for (item of navItems; track item.label) {
                    <a class="bottom-nav-item"
                       [class.bottom-nav-item--active]="item.route && isActive(item.route)"
                       (click)="item.action ? item.action() : null"
                       [routerLink]="item.route ? [item.route] : null">
                        <i [class]="'pi ' + item.icon + ' bottom-nav-icon'"></i>
                        <span class="bottom-nav-label">{{ item.label }}</span>
                    </a>
                }
            </nav>
        }
    `,
    styles: [`
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 999;
            display: flex;
            background: var(--surface-card);
            border-top: 1px solid var(--surface-border);
            box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
            padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .bottom-nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px 4px;
            gap: 3px;
            cursor: pointer;
            text-decoration: none;
            color: var(--text-color-secondary);
            transition: color 0.15s;
            -webkit-tap-highlight-color: transparent;
        }

        .bottom-nav-item--active {
            color: var(--primary-color);
        }

        .bottom-nav-icon {
            font-size: 20px;
            transition: transform 0.15s;
        }

        .bottom-nav-item--active .bottom-nav-icon {
            transform: scale(1.1);
        }

        .bottom-nav-label {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.02em;
        }
    `]
})
export class AppBottomNav {
    isMobile = window.innerWidth < 992;
    navItems: NavItem[] = [];

    @HostListener('window:resize')
    onResize() { this.isMobile = window.innerWidth < 992; }

    constructor(public router: Router, private layoutService: LayoutService) {
        this.navItems = [
            { label: 'Inicio',      icon: 'pi-home',       route: '/app' },
            { label: 'Servicios',   icon: 'pi-briefcase',  route: '/app/services/pending' },
            { label: 'Calendario',  icon: 'pi-calendar',   route: '/app/services/calendar' },
            { label: 'Gastos',      icon: 'pi-money-bill', route: '/app/expenses' }
        ];
    }

    isActive(route: string): boolean {
        return this.router.url === route || this.router.url.startsWith(route + '/') ||
               (route === '/app/services/pending' && this.router.url.startsWith('/app/services'));
    }

    toggleMenu() {
        this.layoutService.onMenuToggle();
    }
}
