import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { Driver } from '../../service/driver.service';
import { FORM_STYLES } from '../client-list/client-form';

/** Los 22 dígitos del CBU con sus dos verificadores (el del banco y el de la cuenta). */
export function cbuOk(text: string | null | undefined): boolean {
    const d = (text ?? '').replace(/\D/g, '');
    if (d.length !== 22) return false;
    const check = (digits: string, weights: number[]) => (10 - (weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0) % 10)) % 10;
    return check(d.slice(0, 7), [7, 1, 3, 9, 7, 1, 3]) === Number(d[7]) && check(d.slice(8, 21), [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]) === Number(d[21]);
}

/** Una fecha sin hora que viene de la base ("1990-05-10T00:00:00.000Z") como día local, sin correrse al día anterior. */
export function dateOnly(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** Los datos del chofer: el diálogo de "Nuevo" y la pestaña Datos de la ficha. Edita el objeto que recibe; guarda quien lo usa. */
@Component({
    selector: 'app-driver-form',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, DatePickerModule],
    styles: [FORM_STYLES],
    template: `
        <div class="form-sections">
            <section>
                <div class="section-title"><i class="pi pi-user"></i>Datos personales</div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="field col-span-12">
                        <label for="name">Nombre y apellido <span class="text-red-500">*</span></label>
                        <input type="text" pInputText id="name" [(ngModel)]="driver.name" [invalid]="submitted && !driver.name" autofocus />
                        <small class="p-error" *ngIf="submitted && !driver.name">El nombre es obligatorio.</small>
                    </div>
                    <div class="field col-span-12 md:col-span-4">
                        <label for="dni">DNI</label>
                        <input type="text" pInputText id="dni" [(ngModel)]="driver.dni" />
                    </div>
                    <div class="field col-span-12 md:col-span-4">
                        <label for="cuit">CUIT</label>
                        <input type="text" pInputText id="cuit" [(ngModel)]="driver.cuit" placeholder="20-12345678-9" />
                    </div>
                    <div class="field col-span-12 md:col-span-4">
                        <label for="birth_date">Fecha de nacimiento</label>
                        <p-datepicker inputId="birth_date" [(ngModel)]="driver.birth_date" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" appendTo="body" styleClass="w-full" placeholder="dd/mm/aaaa" />
                    </div>
                    <div class="field col-span-12">
                        <label for="address">Domicilio</label>
                        <input type="text" pInputText id="address" [(ngModel)]="driver.address" placeholder="Calle 123 - Localidad" />
                    </div>
                </div>
            </section>

            <section>
                <div class="section-title"><i class="pi pi-phone"></i>Contacto</div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="field col-span-12 md:col-span-6">
                        <label for="phone">Teléfono</label>
                        <input type="text" pInputText id="phone" [(ngModel)]="driver.phone" />
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="email">Email</label>
                        <input type="email" pInputText id="email" [(ngModel)]="driver.email" />
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="emergency_name">Contacto de emergencia</label>
                        <input type="text" pInputText id="emergency_name" [(ngModel)]="driver.emergency_contact_name" placeholder="Ej. María (esposa)" />
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="emergency_phone">Teléfono de emergencia</label>
                        <input type="text" pInputText id="emergency_phone" [(ngModel)]="driver.emergency_contact_phone" />
                    </div>
                </div>
            </section>

            <section>
                <div class="section-title"><i class="pi pi-car"></i>Licencia y calendario</div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="field col-span-12 md:col-span-6">
                        <label for="license">Número de licencia</label>
                        <input type="text" pInputText id="license" [(ngModel)]="driver.license_number" />
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="carnet">Vencimiento del carnet</label>
                        <p-datepicker inputId="carnet" [(ngModel)]="driver.carnetVencimiento" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" appendTo="body" styleClass="w-full" placeholder="dd/mm/aaaa" />
                        <small>Avisa 30 días antes.</small>
                    </div>
                    <div class="field col-span-12">
                        <label for="googleCalendar">Calendario de Google</label>
                        <input type="text" pInputText id="googleCalendar" [(ngModel)]="driver.google_calendar_id" placeholder="…@group.calendar.google.com" />
                        <small>Opcional. Con el ID de su calendario, el sistema le copia ahí sus servicios y sus días no disponibles (manual, sección 13).</small>
                    </div>
                </div>
            </section>

            <section>
                <div class="section-title"><i class="pi pi-wallet"></i>Datos para pagarle</div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="field col-span-12 md:col-span-7">
                        <label for="cbu">CBU / CVU</label>
                        <input type="text" pInputText id="cbu" [(ngModel)]="driver.cbu" inputmode="numeric" placeholder="22 dígitos" />
                        <small *ngIf="driver.cbu && !cbuOk(driver.cbu)" class="text-orange-600">No parece un CBU válido. Revisalo antes de transferir.</small>
                    </div>
                    <div class="field col-span-12 md:col-span-5">
                        <label for="cbu_alias">Alias</label>
                        <input type="text" pInputText id="cbu_alias" [(ngModel)]="driver.cbu_alias" />
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="bank">Banco o billetera</label>
                        <input type="text" pInputText id="bank" [(ngModel)]="driver.bank" />
                    </div>
                    <div class="field col-span-12 md:col-span-6">
                        <label for="account_holder">Titular de la cuenta</label>
                        <input type="text" pInputText id="account_holder" [(ngModel)]="driver.account_holder" />
                        <small>Sólo si no es el chofer.</small>
                    </div>
                </div>
            </section>
        </div>
    `
})
export class DriverForm {
    @Input({ required: true }) driver!: Driver;
    @Input() submitted = false;

    readonly cbuOk = cbuOk;
}
