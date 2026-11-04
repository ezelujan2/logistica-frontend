import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

import { initSentry } from './sentry';

/** Avisa a la pantalla de carga (index.html) que el sistema terminó de cargar: ahí presenta el nombre y se va. */
const splashReady = () => (window as unknown as { __lecmaReady?: () => void }).__lecmaReady?.();

initSentry().finally(() =>
    bootstrapApplication(AppComponent, appConfig)
        // Espera a que termine de dibujar la primera pantalla, como mucho 1,5 s (si algo queda corriendo de fondo).
        .then((app) => Promise.race([app.whenStable(), new Promise((resolve) => setTimeout(resolve, 1500))]))
        .then(splashReady)
        .catch((err) => {
            console.error(err);
            splashReady();
        })
);
