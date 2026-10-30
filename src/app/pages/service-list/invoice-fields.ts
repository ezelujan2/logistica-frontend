import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InvoiceForm, InvoiceService } from '../../service/invoice.service';
import { VOUCHER_TYPES, formatInvoiceNumber } from '../../service/labels';

/**
 * Los datos de una factura: tipo, punto de venta y número del comprobante de
 * LECMA (o el texto libre de una "otra"). Se usa
 * al facturar y al editar; trabaja directo sobre `form`.
 */
@Component({
    selector: 'app-invoice-fields',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule, InputNumberModule, InputTextModule, DatePickerModule, ButtonModule, TooltipModule],
    template: `
        <div class="flex flex-col gap-4">
            <ng-container *ngIf="form.issuer === 'LECMA'; else other">
                <div class="grid grid-cols-12 gap-3">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-bold">Comprobante</label>
                        <p-select [options]="arca ? arcaVoucherTypes : voucherTypes" [(ngModel)]="form.voucherType" optionLabel="label" optionValue="value" (onChange)="refreshNumber()" appendTo="body" styleClass="w-full" />
                    </div>
                    <div *ngIf="!arca" class="col-span-4 md:col-span-2 flex flex-col gap-2">
                        <label class="font-bold">Pto. venta</label>
                        <p-inputNumber [(ngModel)]="form.pointOfSale" [useGrouping]="false" [min]="1" [max]="99999" (onBlur)="refreshNumber()" inputStyleClass="w-full" />
                    </div>
                    <div *ngIf="!arca" class="col-span-8 md:col-span-4 flex flex-col gap-2">
                        <label class="font-bold">Número</label>
                        <p-inputNumber [(ngModel)]="form.number" [useGrouping]="false" [min]="1" [max]="99999999" inputStyleClass="w-full" />
                    </div>
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-bold">Fecha de emisión</label>
                        <p-datepicker [(ngModel)]="form.issueDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" />
                    </div>
                    <div class="col-span-12 md:col-span-6 flex flex-col justify-end text-sm text-muted-color pb-2">
                        <span *ngIf="arca">El número lo da ARCA al emitir.</span>
                        <span *ngIf="!arca && preview">Queda como <b class="text-color">{{ preview }}</b></span>
                    </div>
                </div>
                <div *ngIf="!arca" class="flex flex-col gap-2">
                    <label class="font-bold">CAE <span class="font-normal text-muted-color">(opcional)</span></label>
                    <input pInputText [(ngModel)]="form.cae" maxlength="20" placeholder="14 dígitos, está al pie de la factura de ARCA" class="w-full" />
                </div>
                <ng-container *ngIf="!arca" [ngTemplateOutlet]="pdf" />
                <small *ngIf="!arca" class="text-muted-color">
                    <i class="pi pi-info-circle mr-1"></i>Los datos de la factura que hiciste en ARCA. El número que sigue se propone solo.
                    <a class="cursor-pointer text-primary ml-1" (click)="setIssuer('OTHER')">¿Es una factura personal?</a>
                </small>
            </ng-container>
            <ng-template #other>
                <div class="flex flex-col gap-2">
                    <label class="font-bold">Número de factura (texto libre)</label>
                    <input pInputText [(ngModel)]="form.invoiceNumber" placeholder="Ej: F349" class="w-full" />
                    <ng-container [ngTemplateOutlet]="pdf" />
                    <small class="text-muted-color">
                        <i class="pi pi-info-circle mr-1"></i>Para facturas a título personal o casos raros.
                        <a class="cursor-pointer text-primary ml-1" (click)="setIssuer('LECMA')">Volver a factura de LECMA</a>
                    </small>
                </div>
            </ng-template>

            <ng-template #pdf>
                <div class="flex flex-col gap-2">
                    <label class="font-bold">PDF de la factura <span class="font-normal text-muted-color">(opcional)</span></label>
                    <div class="flex items-center gap-2">
                        <input #file type="file" accept="application/pdf" class="hidden" (change)="attach(file)" />
                        <p-button [label]="form.pdfFile ? 'Cambiar PDF' : 'Adjuntar PDF'" icon="pi pi-paperclip" [outlined]="true" size="small" [loading]="uploading" (click)="file.click()" />
                        <span *ngIf="form.pdfFile" class="text-sm"><i class="pi pi-file-pdf text-red-500 mr-1"></i>Adjunto</span>
                        <p-button *ngIf="form.pdfFile" icon="pi pi-times" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Quitar" (click)="form.pdfFile = null" />
                    </div>
                    <small *ngIf="uploadError" class="text-red-500">{{ uploadError }}</small>
                </div>
            </ng-template>
        </div>
    `
})
export class InvoiceFields implements OnChanges {
    @Input({ required: true }) form!: InvoiceForm;
    @Input() clientId: number | null = null;
    /** Al facturar se propone tipo, punto de venta y número; al editar se respeta lo cargado. */
    @Input() suggest = false;
    /** Se emite en ARCA: el número lo da ARCA y sólo se elige factura A, B o FCE. */
    @Input() arca = false;

    uploading = false;
    uploadError: string | null = null;

    /** Sube el PDF de ARCA y lo deja en el formulario. */
    async attach(input: HTMLInputElement) {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        this.uploadError = null;
        if (file.type !== 'application/pdf') {
            this.uploadError = 'Tiene que ser un PDF.';
            return;
        }
        if (file.size > 5_000_000) {
            this.uploadError = 'El PDF supera los 5 MB.';
            return;
        }
        this.uploading = true;
        try {
            this.form.pdfFile = await this.invoiceService.uploadPdf(file);
        } catch (e: any) {
            this.uploadError = e?.error?.message ?? 'No se pudo subir el PDF.';
        } finally {
            this.uploading = false;
        }
    }

    readonly voucherTypes = VOUCHER_TYPES;
    readonly arcaVoucherTypes = VOUCHER_TYPES.filter((t) => [1, 6, 201].includes(t.value));

    constructor(private invoiceService: InvoiceService) {}

    get preview(): string | null {
        return this.form.number ? formatInvoiceNumber(this.form.voucherType, this.form.pointOfSale, this.form.number) : null;
    }

    async ngOnChanges(changes: SimpleChanges) {
        if (!this.suggest || !(changes['clientId'] || changes['form'])) return;
        try {
            const s = await this.invoiceService.suggest(this.clientId);
            Object.assign(this.form, { voucherType: s.voucherType, pointOfSale: s.pointOfSale, number: s.number });
        } catch {
            // Sin sugerencia se carga a mano.
        }
    }

    /** Al cambiar tipo o punto de venta, el número que sigue en esa numeración. */
    async refreshNumber() {
        if (this.arca || (!this.suggest && this.form.number)) return;
        try {
            this.form.number = (await this.invoiceService.suggest(this.clientId, this.form.voucherType, this.form.pointOfSale)).number;
        } catch {
            // Se carga a mano.
        }
    }

    setIssuer(issuer: 'LECMA' | 'OTHER') {
        this.form.issuer = issuer;
        if (issuer === 'LECMA' && !this.form.number) this.refreshNumber();
    }
}
