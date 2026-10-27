import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

import { initSentry } from './sentry';

initSentry().finally(() => bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err)));
