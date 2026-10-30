import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InvoiceService, NoteForm } from '../../service/invoice.service';

/**
 * Nota de crédito o débito de una factura emitida en ARCA. La de crédito puede
 * anular la factura entera (sus servicios vuelven a "A Facturar") o ser por un
 * importe; la de débito, por un importe. Quien lo abre pone el p-confirmDialog
 * y el p-toast.
 */
@Component({
    selector: 'app-invoice-note-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, SelectModule, SelectButtonModule, InputNumberModule, InputTextModule],
    template: `
        <p-dialog [visible]="!!invoice" (visibleChange)="!$event && closed.emit()" [style]="{ width: '520px', 'max-width': '95vw' }" [header]="'Nota de ' + (note.kind === 'credit' ? 'crédito' : 'débito') + ' · ' + (invoice?.invoiceNumber ?? '')" [modal]="true" (onShow)="reset()">
            <div class="flex flex-col gap-4">
                <p-selectButton [options]="kinds" [(ngModel)]="note.kind" optionLabel="label" optionValue="value" [allowEmpty]="false" (onChange)="note.kind === 'debit' && (note.mode = 'amount')" />
                <p-selectButton *ngIf="note.kind === 'credit'" [options]="modes" [(ngModel)]="note.mode" optionLabel="label" optionValue="value" [allowEmpty]="false" />
                <div *ngIf="note.mode === 'total'" class="text-sm">
                    Anula la factura entera por <b>{{ invoice?.total | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</b>. Sus servicios vuelven a <b>A Facturar</b> para facturarlos de nuevo.
                </div>
                <ng-container *ngIf="note.mode === 'amount'">
                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-7 flex flex-col gap-2">
                            <label class="font-bold">Importe neto (sin IVA)</label>
                            <p-inputNumber [(ngModel)]="note.net" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" inputStyleClass="w-full" />
                        </div>
                        <div class="col-span-5 flex flex-col gap-2">
                            <label class="font-bold">IVA</label>
                            <p-select [options]="rates" [(ngModel)]="note.rate" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" />
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-bold">Motivo</label>
                        <input pInputText [(ngModel)]="note.description" placeholder="Ej: Diferencia de km del viaje del 15/10" class="w-full" />
                    </div>
                    <div *ngIf="note.net" class="text-sm text-muted-color">Total con IVA: <b class="text-color">{{ note.net * (1 + note.rate / 100) | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</b></div>
                </ng-container>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (click)="closed.emit()" />
                <p-button label="Emitir en ARCA" icon="pi pi-send" severity="success" [loading]="busy" [disabled]="busy || (note.mode === 'amount' && (!note.net || !note.description.trim()))" (click)="confirm()" />
            </ng-template>
        </p-dialog>
    `
})
export class InvoiceNoteDialog {
    /** La factura a la que se le hace la nota; null = cerrado. */
    @Input() invoice: any = null;
    @Output() closed = new EventEmitter<void>();
    @Output() emitted = new EventEmitter<any>();

    note: NoteForm = { kind: 'credit', mode: 'total', net: null, rate: 10.5, description: '' };
    busy = false;
    readonly kinds = [
        { label: 'Nota de crédito', value: 'credit' },
        { label: 'Nota de débito', value: 'debit' }
    ];
    readonly modes = [
        { label: 'Anular la factura', value: 'total' },
        { label: 'Por un importe', value: 'amount' }
    ];
    readonly rates = [
        { label: '10,5%', value: 10.5 },
        { label: '21%', value: 21 }
    ];

    constructor(
        private invoiceService: InvoiceService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    reset() {
        this.note = { kind: 'credit', mode: 'total', net: null, rate: Number(this.invoice?.arcaData?.lines?.[0]?.rate ?? 10.5), description: '' };
    }

    confirm() {
        const what =
            this.note.mode === 'total'
                ? `anular la factura <b>${this.invoice.invoiceNumber}</b> con una nota de crédito`
                : `emitir una nota de ${this.note.kind === 'credit' ? 'crédito' : 'débito'} de la factura <b>${this.invoice.invoiceNumber}</b>`;
        this.confirmationService.confirm({
            header: 'Emitir en ARCA',
            message: `Se va a ${what}. No se puede deshacer.`,
            acceptLabel: 'Emitir',
            rejectLabel: 'Cancelar',
            accept: () => this.emit()
        });
    }

    private async emit() {
        this.busy = true;
        try {
            const note = await this.invoiceService.emitNote(this.invoice.id, this.note);
            this.messageService.add({ severity: 'success', summary: 'Nota emitida', detail: `${note.invoiceNumber} · CAE ${note.cae}`, life: 8000 });
            this.invoiceService.downloadPdf(note.id, note.invoiceNumber).catch(() => {});
            this.emitted.emit(note);
            this.closed.emit();
        } catch (error: any) {
            this.messageService.add({ severity: 'error', summary: 'ARCA', detail: error?.error?.error ?? 'No se pudo emitir la nota.', life: 12000 });
        } finally {
            this.busy = false;
        }
    }
}
