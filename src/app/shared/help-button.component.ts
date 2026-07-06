import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { HELP_CONTENT, HelpPage } from './help-content';

@Component({
    selector: 'app-help-button',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, DividerModule],
    template: `
        <p-button
            icon="pi pi-question-circle"
            [rounded]="true"
            [text]="true"
            severity="secondary"
            (click)="showHelp()"
            pTooltip="Ayuda"
            tooltipPosition="top"
            [style]="{'width': '2rem', 'height': '2rem'}"
        />

        <p-dialog
            [(visible)]="visible"
            [style]="{ width: '550px', maxHeight: '80vh' }"
            [header]="helpData?.title || 'Ayuda'"
            [modal]="true"
            [draggable]="false"
            [resizable]="false"
            position="right"
            styleClass="help-dialog"
        >
            <ng-template pTemplate="content">
                @if (helpData) {
                    <p class="text-gray-600 dark:text-gray-400 mb-4">{{ helpData.description }}</p>
                    <p-divider />
                    @for (section of helpData.sections; track section.title; let last = $last) {
                        <div class="mb-3">
                            <div class="flex items-center gap-2 mb-2">
                                <i class="pi pi-info-circle text-blue-500"></i>
                                <span class="font-semibold text-gray-900 dark:text-white">{{ section.title }}</span>
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-6" [innerHTML]="section.content"></p>
                        </div>
                        @if (!last) {
                            <p-divider />
                        }
                    }
                }
            </ng-template>
        </p-dialog>
    `
})
export class HelpButtonComponent {
    @Input() pageKey: string = '';

    visible: boolean = false;
    helpData: HelpPage | null = null;

    showHelp() {
        this.helpData = HELP_CONTENT[this.pageKey] || null;
        this.visible = true;
    }
}
