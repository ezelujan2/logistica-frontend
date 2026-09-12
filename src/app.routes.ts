import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { LecmaLanding } from './app/pages/landing/lecma-landing';
import { Notfound } from './app/pages/notfound/notfound';
import { Login } from './app/pages/auth/login';
import { AuthGuard } from './app/service/auth.guard';

export const appRoutes: Routes = [
    { path: '', component: LecmaLanding },
    { path: 'login', component: Login },
    { path: 'encuesta/:token', loadComponent: () => import('./app/pages/survey/service-survey').then(m => m.ServiceSurvey) },
    {
        path: 'app',
        component: AppLayout,
        canActivate: [AuthGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'services', redirectTo: 'services/all', pathMatch: 'full' },
            { path: 'services/:status', loadComponent: () => import('./app/pages/service-list/service-list').then((m) => m.ServiceList) },
            { path: 'advances', loadComponent: () => import('./app/pages/advances/advance-list').then(m => m.AdvanceList) },
            { path: 'settlements', loadComponent: () => import('./app/pages/settlements/settlement-list').then(m => m.SettlementList) },
            { path: 'clients', loadComponent: () => import('./app/pages/client-list/client-list').then((m) => m.ClientList) },
            { path: 'clients/:id/stats', loadComponent: () => import('./app/pages/client-stats/client-stats').then((m) => m.ClientStats), canActivate: [AuthGuard], data: { permission: 'viewStatistics' } },
            { path: 'drivers', loadComponent: () => import('./app/pages/driver-list/driver-list').then((m) => m.DriverList) },
            { path: 'vehicles', loadComponent: () => import('./app/pages/vehicle-list/vehicle-list').then((m) => m.VehicleList) },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'statistics', loadComponent: () => import('./app/pages/statistics/statistics').then(m => m.StatisticsComponent), canActivate: [AuthGuard], data: { permission: 'viewStatistics' } },
            { path: 'surveys', loadComponent: () => import('./app/pages/survey-results/survey-results').then(m => m.SurveyResults), canActivate: [AuthGuard], data: { permission: 'viewStatistics' } },
            { path: 'expenses', loadComponent: () => import('./app/pages/expense-list/expense-list').then(m => m.ExpenseList) },
            { path: 'users', loadComponent: () => import('./app/pages/admin/users/admin-users').then(m => m.AdminUsers), canActivate: [AuthGuard], data: { permission: 'manageUsers' } },
            { path: 'assistant', loadComponent: () => import('./app/pages/assistant/assistant-page').then(m => m.AssistantPage), canActivate: [AuthGuard], data: { permission: 'useAssistant' } },
            { path: 'assistant/unanswered', loadComponent: () => import('./app/pages/assistant/unanswered-questions').then(m => m.UnansweredQuestions), canActivate: [AuthGuard], data: { permission: 'manageUsers' } },
            { path: 'analyst', loadComponent: () => import('./app/pages/assistant/analyst-page').then(m => m.AnalystPage), canActivate: [AuthGuard], data: { permission: 'useAnalyst' } },
            { path: 'reminders', loadComponent: () => import('./app/pages/reminder-list/reminder-list').then(m => m.ReminderList), canActivate: [AuthGuard], data: { permission: 'manageOperations' } }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
