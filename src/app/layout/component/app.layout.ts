import { Component, Renderer2, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { AppFooter } from './app.footer';
import { LayoutService } from '../service/layout.service';
import { AppReauthModal } from './app.reauth';
import { AppBottomNav } from './app.bottomnav';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, RouterModule, AppFooter, AppReauthModal, AppBottomNav],
    template: `<div class="layout-wrapper" [ngClass]="containerClass">

        <!-- Banner offline -->
        @if (!isOnline) {
            <div class="offline-banner">
                <i class="pi pi-wifi" style="text-decoration:line-through"></i>
                Sin conexión — los cambios no se guardarán
            </div>
        }

        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">

            <!-- Indicador pull-to-refresh -->
            @if (pullDistance > 0) {
                <div class="ptr-indicator" [style.opacity]="pullOpacity">
                    <i class="pi" [class.pi-refresh]="!isRefreshing" [class.pi-spin]="isRefreshing"
                       [class.pi-refresh]="isRefreshing"
                       [style.transform]="'rotate(' + pullDistance * 2 + 'deg)'"></i>
                </div>
            }

            <div class="layout-main"
                 (touchstart)="onPtrTouchStart($event)"
                 (touchmove)="onPtrTouchMove($event)"
                 (touchend)="onPtrTouchEnd()">
                <router-outlet></router-outlet>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
        <app-reauth-modal></app-reauth-modal>
        <app-bottom-nav></app-bottom-nav>
    </div> `
})
export class AppLayout {
    overlayMenuOpenSubscription: Subscription;

    menuOutsideClickListener: any;

    @ViewChild(AppSidebar) appSidebar!: AppSidebar;
    @ViewChild(AppTopbar) appTopBar!: AppTopbar;

    // ── Offline indicator ──
    isOnline = navigator.onLine;

    @HostListener('window:online')  onOnline()  { this.isOnline = true; }
    @HostListener('window:offline') onOffline() { this.isOnline = false; }

    // ── Pull-to-refresh ──
    pullDistance = 0;
    isRefreshing = false;
    private _ptrStartY = 0;
    private _ptrActive = false;
    private readonly PTR_THRESHOLD = 70;

    get pullOpacity(): number { return Math.min(this.pullDistance / this.PTR_THRESHOLD, 1); }

    onPtrTouchStart(e: TouchEvent) {
        const el = e.currentTarget as HTMLElement;
        if (el.scrollTop > 0) return;
        this._ptrStartY = e.touches[0].clientY;
        this._ptrActive = true;
    }

    onPtrTouchMove(e: TouchEvent) {
        if (!this._ptrActive || this.isRefreshing) return;
        const delta = e.touches[0].clientY - this._ptrStartY;
        if (delta > 0) {
            this.pullDistance = Math.min(delta * 0.5, this.PTR_THRESHOLD + 20);
        } else {
            this._ptrActive = false;
            this.pullDistance = 0;
        }
    }

    onPtrTouchEnd() {
        if (!this._ptrActive) return;
        this._ptrActive = false;
        if (this.pullDistance >= this.PTR_THRESHOLD) {
            this.isRefreshing = true;
            setTimeout(() => { window.location.reload(); }, 500);
        } else {
            this.pullDistance = 0;
        }
    }

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router
    ) {
        this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
            if (!this.menuOutsideClickListener) {
                this.menuOutsideClickListener = this.renderer.listen('document', 'click', (event) => {
                    if (this.isOutsideClicked(event)) {
                        this.hideMenu();
                    }
                });
            }

            if (this.layoutService.layoutState().staticMenuMobileActive) {
                this.blockBodyScroll();
            }
        });

        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this.hideMenu();
        });
    }

    isOutsideClicked(event: MouseEvent) {
        const sidebarEl = document.querySelector('.layout-sidebar');
        const topbarEl = document.querySelector('.layout-menu-button');
        const eventTarget = event.target as Node;

        return !(sidebarEl?.isSameNode(eventTarget) || sidebarEl?.contains(eventTarget) || topbarEl?.isSameNode(eventTarget) || topbarEl?.contains(eventTarget));
    }

    hideMenu() {
        this.layoutService.layoutState.update((prev) => ({ ...prev, overlayMenuActive: false, staticMenuMobileActive: false, menuHoverActive: false }));
        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }
        this.unblockBodyScroll();
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    get containerClass() {
        return {
            'layout-overlay': this.layoutService.layoutConfig().menuMode === 'overlay',
            'layout-static': this.layoutService.layoutConfig().menuMode === 'static',
            'layout-static-inactive': this.layoutService.layoutState().staticMenuDesktopInactive && this.layoutService.layoutConfig().menuMode === 'static',
            'layout-overlay-active': this.layoutService.layoutState().overlayMenuActive,
            'layout-mobile-active': this.layoutService.layoutState().staticMenuMobileActive
        };
    }

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }
}
