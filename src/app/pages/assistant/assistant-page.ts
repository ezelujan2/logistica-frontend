import { Component } from '@angular/core';
import { AssistantChat } from './assistant-chat';

@Component({
    selector: 'app-assistant-page',
    standalone: true,
    imports: [AssistantChat],
    template: `<app-assistant-chat chatType="assistant" title="Asistente" [allowFileUpload]="true"></app-assistant-chat>`
})
export class AssistantPage {}
