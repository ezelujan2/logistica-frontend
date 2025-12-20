import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { AuthGuard } from './app/service/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [AuthGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'services', redirectTo: 'services/all', pathMatch: 'full' },
            { path: 'services/:status', loadComponent: () => import('./app/pages/service-list/service-list').then((m) => m.ServiceList) },
            { path: 'advances', loadComponent: () => import('./app/pages/advances/advance-list').then(m => m.AdvanceList) },
            { path: 'settlements', loadComponent: () => import('./app/pages/settlements/settlement-list').then(m => m.SettlementList) },
            { path: 'clients', loadComponent: () => import('./app/pages/client-list/client-list').then((m) => m.ClientList) },
            { path: 'drivers', loadComponent: () => import('./app/pages/driver-list/driver-list').then((m) => m.DriverList) },
            { path: 'vehicles', loadComponent: () => import('./app/pages/vehicle-list/vehicle-list').then((m) => m.VehicleList) },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'statistics', loadComponent: () => import('./app/pages/statistics/statistics').then(m => m.StatisticsComponent) }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
