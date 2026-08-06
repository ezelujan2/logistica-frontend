import { Component } from '@angular/core';
import { AssistantChat } from './assistant-chat';

@Component({
    selector: 'app-analyst-page',
    standalone: true,
    imports: [AssistantChat],
    template: `<app-assistant-chat chatType="analyst" title="Analista" [allowFileUpload]="false"></app-assistant-chat>`
})
export class AnalystPage {}
