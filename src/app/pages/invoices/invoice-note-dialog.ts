import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InvoiceService, NoteForm } from '../../service/invoice.service';

/**
 * Nota de crédito o débito de una factura de LECMA. Se emite en ARCA desde acá
 * (también para las facturas registradas a mano: lo que pide ARCA sale del
 * cliente y de los servicios) o se registra una que se hizo a mano en ARCA. La
 * de crédito puede anular la factura entera (sus servicios vuelven a "A
 * Facturar") o ser por un importe; la de débito, por un importe. Quien lo abre
 * pone el p-confirmDialog y el p-toast.
 */
@Component({
    selector: 'app-invoice-note-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, SelectModule, SelectButtonModule, InputNumberModule, InputTextModule, DatePickerModule],
    template: `
        <p-dialog [visible]="!!invoice" (visibleChange)="!$event && closed.emit()" [style]="{ width: '520px', 'max-width': '95vw' }" [header]="'Nota de ' + (note.kind === 'credit' ? 'crédito' : 'débito') + ' · ' + (invoice?.invoiceNumber ?? '')" [modal]="true" (onShow)="reset()">
            <div class="flex flex-col gap-4">
                <p-selectButton *ngIf="arcaEnabled" [options]="vias" [(ngModel)]="via" optionLabel="label" optionValue="value" [allowEmpty]="false" />
                <div *ngIf="!arcaEnabled" class="text-sm text-muted-color">ARCA no está conectado: registrá acá la nota que hiciste en "Comprobantes en línea".</div>
                <p-selectButton [options]="kinds" [(ngModel)]="note.kind" optionLabel="label" optionValue="value" [allowEmpty]="false" (onChange)="note.kind === 'debit' && (note.mode = 'amount')" />
                <p-selectButton *ngIf="note.kind === 'credit'" [options]="modes" [(ngModel)]="note.mode" optionLabel="label" optionValue="value" [allowEmpty]="false" (onChange)="note.mode === 'total' && (manual.total = toNumber(invoice?.total))" />
                <div *ngIf="note.mode === 'total'" class="text-sm">
                    Anula la factura entera por <b>{{ invoice?.total | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</b>. Sus servicios vuelven a <b>A Facturar</b> para facturarlos de nuevo.
                </div>

                <!-- Hecha a mano en ARCA: se registran sus datos -->
                <ng-container *ngIf="via === 'manual'">
                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-4 flex flex-col gap-2">
                            <label class="font-bold">Punto de venta</label>
                            <p-inputNumber [(ngModel)]="manual.pointOfSale" [useGrouping]="false" [min]="1" inputStyleClass="w-full" />
                        </div>
                        <div class="col-span-8 flex flex-col gap-2">
                            <label class="font-bold">Número</label>
                            <p-inputNumber [(ngModel)]="manual.number" [useGrouping]="false" [min]="1" inputStyleClass="w-full" placeholder="Ej: 1" />
                        </div>
                        <div class="col-span-7 flex flex-col gap-2">
                            <label class="font-bold">Importe total (con IVA)</label>
                            <p-inputNumber [(ngModel)]="manual.total" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" inputStyleClass="w-full" />
                        </div>
                        <div class="col-span-5 flex flex-col gap-2">
                            <label class="font-bold">Fecha</label>
                            <p-datepicker [(ngModel)]="manual.issueDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" />
                        </div>
                        <div class="col-span-12 flex flex-col gap-2">
                            <label class="font-bold">CAE <span class="font-normal text-muted-color">(opcional, 14 números)</span></label>
                            <input pInputText [(ngModel)]="manual.cae" maxlength="14" class="w-full" />
                        </div>
                        <div class="col-span-12 flex items-center gap-3">
                            <input #pdfInput type="file" accept="application/pdf" class="hidden" (change)="attach($event)" />
                            <p-button [label]="manual.pdfFile ? 'PDF adjunto' : 'Adjuntar el PDF de ARCA'" [icon]="manual.pdfFile ? 'pi pi-check' : 'pi pi-paperclip'" [outlined]="true" size="small" [loading]="uploading" (click)="pdfInput.click()" />
                            <span class="text-xs text-muted-color">Opcional: así se descarga desde el sistema.</span>
                        </div>
                    </div>
                </ng-container>

                <ng-container *ngIf="via === 'arca' && note.mode === 'amount'">
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
                <p-button *ngIf="via === 'arca'" label="Emitir en ARCA" icon="pi pi-send" severity="success" [loading]="busy" [disabled]="busy || (note.mode === 'amount' && (!note.net || !note.description.trim()))" (click)="confirm()" />
                <p-button *ngIf="via === 'manual'" label="Registrar la nota" icon="pi pi-check" [loading]="busy" [disabled]="busy || uploading || !manual.pointOfSale || !manual.number || !manual.total" (click)="confirm()" />
            </ng-template>
        </p-dialog>
    `
})
export class InvoiceNoteDialog {
    /** La factura a la que se le hace la nota; null = cerrado. */
    @Input() invoice: any = null;
    /** Con ARCA conectado se puede emitir desde acá; si no, sólo registrar una hecha a mano. */
    @Input() arcaEnabled = false;
    @Output() closed = new EventEmitter<void>();
    @Output() emitted = new EventEmitter<any>();

    note: NoteForm = { kind: 'credit', mode: 'total', net: null, rate: 10.5, description: '' };
    busy = false;
    uploading = false;
    via: 'arca' | 'manual' = 'arca';
    manual: { pointOfSale: number | null; number: number | null; total: number | null; cae: string; issueDate: Date | null; pdfFile: string | null } = { pointOfSale: null, number: null, total: null, cae: '', issueDate: null, pdfFile: null };
    readonly vias = [
        { label: 'Emitir en ARCA', value: 'arca' },
        { label: 'Ya la hice en ARCA', value: 'manual' }
    ];
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
        this.note = { kind: 'credit', mode: 'total', net: null, rate: Number(this.invoice?.arcaData?.lines?.[0]?.rate ?? 21), description: '' };
        this.via = this.arcaEnabled ? 'arca' : 'manual';
        this.manual = { pointOfSale: this.invoice?.pointOfSale ?? 1, number: null, total: this.toNumber(this.invoice?.total), cae: '', issueDate: new Date(), pdfFile: null };
    }

    toNumber(value: unknown): number | null {
        return value == null ? null : Number(value);
    }

    async attach(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024) {
            this.messageService.add({ severity: 'warn', summary: 'PDF', detail: 'Tiene que ser un PDF de hasta 5 MB.' });
            return;
        }
        this.uploading = true;
        try {
            this.manual.pdfFile = await this.invoiceService.uploadPdf(file);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'PDF', detail: 'No se pudo adjuntar el PDF.' });
        } finally {
            this.uploading = false;
        }
    }

    confirm() {
        if (this.via === 'manual') {
            const annul = this.note.kind === 'credit' && this.note.mode === 'total';
            this.confirmationService.confirm({
                header: 'Registrar la nota',
                message: annul
                    ? `Se registra la nota de crédito que anula la factura <b>${this.invoice.invoiceNumber}</b>: queda anulada y sus servicios vuelven a A Facturar.`
                    : `Se registra la nota de ${this.note.kind === 'credit' ? 'crédito' : 'débito'} de la factura <b>${this.invoice.invoiceNumber}</b>.`,
                acceptLabel: 'Registrar',
                rejectLabel: 'Cancelar',
                accept: () => this.register(annul)
            });
            return;
        }
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

    private async register(annul: boolean) {
        this.busy = true;
        try {
            const m = this.manual;
            const date = m.issueDate ? new Date(m.issueDate.getFullYear(), m.issueDate.getMonth(), m.issueDate.getDate(), 12) : null;
            const note = await this.invoiceService.registerNote(this.invoice.id, {
                kind: this.note.kind,
                pointOfSale: m.pointOfSale!,
                number: m.number!,
                total: m.total!,
                cae: m.cae.trim() || null,
                issueDate: date,
                pdfFile: m.pdfFile,
                annul
            });
            this.messageService.add({ severity: 'success', summary: 'Nota registrada', detail: note.invoiceNumber, life: 6000 });
            this.emitted.emit(note);
            this.closed.emit();
        } catch (error: any) {
            this.messageService.add({ severity: 'error', summary: 'No se pudo', detail: error?.error?.error ?? 'No se pudo registrar la nota.', life: 10000 });
        } finally {
            this.busy = false;
        }
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
