import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Client } from '../../service/client.service';
import { InvoiceService } from '../../service/invoice.service';
import { IVA_CONDITION_LABELS, optionsOf } from '../../service/labels';

/** Mismo control que hace ARCA: 11 dígitos con el verificador correcto. */
export function cuitOk(text: string | null | undefined): boolean {
    const d = (text ?? '').replace(/\D/g, '');
    if (d.length !== 11) return false;
    const sum = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2].reduce((acc, w, i) => acc + w * Number(d[i]), 0);
    const check = 11 - (sum % 11);
    return (check === 11 ? 0 : check === 10 ? 9 : check) === Number(d[10]);
}

/** Secciones con título e ícono, campos con su aclaración abajo y opciones como interruptores. Lo comparten los formularios de cliente y chofer. */
export const FORM_STYLES = `
    .form-sections { display: flex; flex-direction: column; gap: 1.75rem; }
    .section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--p-text-muted-color); padding-bottom: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--p-content-border-color); }
    .section-title .pi { color: var(--p-primary-color); font-size: 0.9rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field > label { font-size: 0.875rem; font-weight: 500; }
    .field > small:not(.p-error):not(.text-orange-600), .option small { color: var(--p-text-muted-color); font-size: 0.75rem; }
    .options { border: 1px solid var(--p-content-border-color); border-radius: var(--p-content-border-radius, 6px); }
    .option { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; cursor: pointer; }
    .option + .option { border-top: 1px solid var(--p-content-border-color); }
`;

/** Los datos del cliente: el diálogo de "Nuevo" y la pestaña Datos de la ficha. Edita el objeto que recibe; guarda quien lo usa. */
@Component({
    selector: 'app-client-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, ToggleSwitchModule, InputNumberModule, SelectModule, TooltipModule],
    styles: [FORM_STYLES],
    template: `
        <div class="form-sections">
            <section>
                <div class="section-title"><i class="pi pi-building"></i>Empresa</div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="field col-span-12 md:col-span-6">
                        <label for="name">Nombre <span class="text-red-500">*</span></label>
                        <input type="text" pInputText id="name" [(ngModel)]="client.name" placeholder="Como lo llaman en LECMA" [invalid]="submitted && !client.name" autofocus />
                        <small class="p-error" *ngIf="submitted && !client.name">El nombre es obligatorio.</small>
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="legal_name">Razón social</label>
                        <input type="text" pInputText id="legal_name" [(ngModel)]="client.legal_name" />
                        <small>La que sale en la factura. Vacía, va el nombre.</small>
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="cuit">CUIT</label>
                        <div class="flex gap-2">
                            <input type="text" pInputText id="cuit" [(ngModel)]="client.cuit" class="flex-1 min-w-0" placeholder="30-12345678-9" />
                            <p-button icon="pi pi-search" label="ARCA" [outlined]="true" [disabled]="!client.cuit || !cuitOk(client.cuit)" [loading]="padronLoading" (click)="lookupPadron()" pTooltip="Completa razón social, domicilio y condición frente al IVA" tooltipPosition="top" />
                        </div>
                        <small *ngIf="client.cuit && !cuitOk(client.cuit)" class="text-orange-600">No parece un CUIT válido: ARCA va a rechazar sus facturas A.</small>
                        <small *ngIf="!client.cuit || cuitOk(client.cuit)">Con el CUIT, "ARCA" completa los datos fiscales.</small>
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="iva_condition">Condición frente al IVA</label>
                        <p-select inputId="iva_condition" [options]="ivaConditions" [(ngModel)]="client.iva_condition" optionLabel="label" optionValue="value" placeholder="Según el tipo de facturación" [showClear]="true" appendTo="body" styleClass="w-full" />
                        <small *ngIf="client.iva_condition === 'EXENTO' || client.iva_condition === 'CONSUMIDOR_FINAL'">Factura B: mismo precio, con el IVA incluido sin discriminar.</small>
                    </div>
                    <div class="field col-span-12">
                        <label for="address">Domicilio</label>
                        <input type="text" pInputText id="address" [(ngModel)]="client.address" placeholder="Calle 123 - Localidad, Provincia" />
                        <small>Obligatorio para facturar en ARCA.</small>
                    </div>
                </div>
            </section>

            <section>
                <div class="section-title"><i class="pi pi-phone"></i>Contacto general</div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="field col-span-12 md:col-span-6">
                        <label for="phone">Teléfono</label>
                        <input type="text" pInputText id="phone" [(ngModel)]="client.phone" />
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="email">Email</label>
                        <input type="email" pInputText id="email" [(ngModel)]="client.email" />
                    </div>
                </div>
                <small class="block mt-2 text-muted-color" *ngIf="!client.id">Las personas de contacto (quién compra, quién paga) se cargan después, en la ficha.</small>
            </section>

            <section>
                <div class="section-title"><i class="pi pi-file"></i>Facturación y cobro</div>
                <div class="options">
                    <label class="option" for="send_details">
                        <div><div class="font-medium">Enviar detalles</div><small>Se le mandan los detalles de cada servicio.</small></div>
                        <p-toggleswitch [(ngModel)]="client.send_details" inputId="send_details" />
                    </label>
                    <label class="option" for="send_invoices">
                        <div><div class="font-medium">Enviar facturas</div><small>Se le mandan las facturas por email.</small></div>
                        <p-toggleswitch [(ngModel)]="client.send_invoices" inputId="send_invoices" />
                    </label>
                    <label class="option" for="requires_purchase_order">
                        <div><div class="font-medium">Pide orden de compra</div><small>Cada reporte necesita su OC para poder facturarse.</small></div>
                        <p-toggleswitch [(ngModel)]="client.requires_purchase_order" inputId="requires_purchase_order" />
                    </label>
                    <label class="option" for="receives_fce">
                        <div><div class="font-medium">Empresa del registro de FCE</div><small>Desde el monto mínimo se le factura con FCE A.</small></div>
                        <p-toggleswitch [(ngModel)]="client.receives_fce" inputId="receives_fce" />
                    </label>
                </div>
                <div class="grid grid-cols-12 gap-4 mt-4">
                    <div class="field col-span-12 md:col-span-6">
                        <label for="billing_cycle_days">Días hasta facturar</label>
                        <p-inputNumber inputId="billing_cycle_days" [(ngModel)]="client.billing_cycle_days" [min]="0" [max]="120" suffix=" días" placeholder="15 días (general)" styleClass="w-full" />
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="payment_terms_days">Días hasta que paga</label>
                        <p-inputNumber inputId="payment_terms_days" [(ngModel)]="client.payment_terms_days" [min]="0" [max]="180" suffix=" días" placeholder="30 días (general)" styleClass="w-full" />
                    </div>
                </div>
                <small class="block mt-2 text-muted-color">Para clientes con facturación mensual: evita que sus servicios y facturas se marquen como estancados antes de tiempo.</small>
            </section>

            <section>
                <div class="section-title"><i class="pi pi-dollar"></i>Precios por defecto</div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="field col-span-12 md:col-span-6">
                        <label for="default_km_price">Precio por km</label>
                        <p-inputNumber inputId="default_km_price" [(ngModel)]="client.default_km_price" mode="currency" currency="USD" locale="en-US" styleClass="w-full" />
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="default_extra_km_price">Precio por km extra</label>
                        <p-inputNumber inputId="default_extra_km_price" [(ngModel)]="client.default_extra_km_price" mode="currency" currency="USD" locale="en-US" styleClass="w-full" />
                    </div>
                </div>
            </section>

            <section>
                <div class="section-title"><i class="pi pi-pencil"></i>Notas</div>
                <textarea id="notes" pTextarea [(ngModel)]="client.notes" rows="3" class="w-full" placeholder="Lo que haya que tener en cuenta con este cliente"></textarea>
            </section>
        </div>
    `
})
export class ClientForm {
    @Input({ required: true }) client!: Client;
    @Input() submitted = false;

    readonly ivaConditions = optionsOf(IVA_CONDITION_LABELS);
    readonly cuitOk = cuitOk;
    padronLoading = false;

    constructor(private invoiceService: InvoiceService, private messageService: MessageService) {}

    /** Trae de ARCA razón social, domicilio fiscal y condición frente al IVA. */
    async lookupPadron() {
        if (!this.client.cuit) return;
        this.padronLoading = true;
        try {
            const p = await this.invoiceService.padron(this.client.cuit);
            if (p.legalName) this.client.legal_name = p.legalName;
            if (p.address) this.client.address = p.address;
            if (p.ivaCondition) this.client.iva_condition = p.ivaCondition as Client['iva_condition'];
            if (p.legalName || p.address || p.ivaCondition) {
                this.messageService.add({ severity: 'success', summary: 'Datos de ARCA', detail: 'Se completaron razón social, domicilio y condición frente al IVA. Revisalos y guardá.', life: 5000 });
            }
            if (p.warning) this.messageService.add({ severity: 'warn', summary: 'Aviso de ARCA', detail: p.warning, life: 8000 });
        } catch (e: any) {
            this.messageService.add({ severity: 'error', summary: 'ARCA', detail: e?.error?.error ?? 'No se pudo consultar ARCA.' });
        } finally {
            this.padronLoading = false;
        }
    }
}
