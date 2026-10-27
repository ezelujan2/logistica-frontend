import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';
import { CURRENT_RELEASE } from './app/pages/novedades/changelog';

// Activa Sentry en el navegador si el backend tiene configurado el DSN del
// frontend (SENTRY_DSN_FRONTEND). Se pide al arrancar para poder activarlo o
// cambiarlo sin volver a compilar la app. Si no responde, la app arranca igual.
export async function initSentry(): Promise<void> {
    try {
        const res = await fetch(`${environment.apiUrl}client-config`);
        if (!res.ok) return;
        const config = await res.json();
        if (!config?.sentryDsn) return;
        Sentry.init({
            dsn: config.sentryDsn,
            environment: config.environment,
            release: `logistica-frontend@${CURRENT_RELEASE.version}`,
            tracesSampleRate: 0,
            // Igual que en el backend: sin cuerpos de pedidos, cookies,
            // cabeceras ni parámetros de URL. Del usuario, sólo id y rol.
            dataCollection: {
                userInfo: false,
                cookies: false,
                httpHeaders: false,
                httpBodies: [],
                urlQueryParams: false
            }
        });
    } catch {
        // sin Sentry: no es motivo para no abrir la app
    }
}
