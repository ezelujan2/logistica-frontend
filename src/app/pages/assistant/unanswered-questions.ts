import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AssistantService, UnansweredQuery } from '../../service/assistant.service';

@Component({
    selector: 'app-unanswered-questions',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="font-semibold text-xl mb-4">Preguntas sin resolver del Asistente</div>
            <p class="text-muted-color mb-4">Preguntas que el Asistente no pudo responder con las herramientas disponibles — revisalas para decidir si vale la pena agregar una nueva capacidad.</p>
            <p-table [value]="items" [loading]="loading" dataKey="id" [rows]="15" [paginator]="true">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Pregunta</th>
                        <th>Motivo</th>
                        <th>Usuario</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item>
                    <tr>
                        <td>{{ item.question }}</td>
                        <td>{{ item.reason }}</td>
                        <td>{{ item.user?.name || item.user?.email || '-' }}</td>
                        <td>{{ item.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                            <p-button label="Marcar resuelta" icon="pi pi-check" [text]="true" (click)="resolve(item)" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr><td colspan="5" class="text-center p-4">No hay preguntas pendientes de revisión.</td></tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class UnansweredQuestions implements OnInit {
    items: UnansweredQuery[] = [];
    loading = true;

    constructor(private assistantService: AssistantService, private messageService: MessageService) {}

    ngOnInit() {
        this.load();
    }

    async load() {
        this.loading = true;
        try {
            this.items = await this.assistantService.getUnanswered();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las preguntas' });
        } finally {
            this.loading = false;
        }
    }

    async resolve(item: UnansweredQuery) {
        try {
            await this.assistantService.resolveUnanswered(item.id);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Marcada como resuelta', life: 3000 });
            this.load();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
        }
    }
}
