import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

/**
 * MAQUETA (sin funcionalidad real): reserva de asiento en una Hiace, vista
 * desde arriba, con la identidad "Propuesta B-2" (azul, dorado, beige).
 * No llama al backend ni guarda nada; sirve para ver cómo se vería.
 */

type SeatState = 'free' | 'taken' | 'driver';
type Place = 'Ventanilla' | 'Pasillo' | 'Centro' | 'Adelante';

interface Seat {
    code: string; // fila + letra, como en un avión: 3A, 5C...
    x: number;
    y: number;
    w: number;
    side: 'izq' | 'der';
    place: Place;
    state: SeatState;
}

// Medidas del dibujo (unidades del SVG). La camioneta mira hacia arriba.
const SEAT_H = 52;
const VAN_X = 80; // margen a cada lado para el señalador del asiento
const VIEW_W = 300 + 2 * VAN_X;
const VIEW_H = 600;

function buildSeats(): Seat[] {
    const s: Seat[] = [];
    const add = (row: number, letter: string, x: number, y: number, w: number, side: Seat['side'], place: Place, state: SeatState = 'free') =>
        s.push({ code: state === 'driver' ? 'Chofer' : `${row}${letter}`, x: x + VAN_X, y, w, side, place, state });
    // A = ventanilla izquierda, B = pasillo izquierdo, C = centro, D = ventanilla derecha.
    add(1, '', 66, 160, 46, 'izq', 'Adelante', 'driver');
    add(1, 'D', 188, 160, 46, 'der', 'Adelante');
    add(2, 'A', 66, 258, 46, 'izq', 'Ventanilla');
    add(2, 'B', 114, 258, 46, 'izq', 'Pasillo');
    add(3, 'A', 66, 330, 46, 'izq', 'Ventanilla');
    add(3, 'B', 114, 330, 46, 'izq', 'Pasillo');
    add(3, 'D', 188, 330, 46, 'der', 'Ventanilla');
    add(4, 'A', 66, 402, 46, 'izq', 'Ventanilla');
    add(4, 'B', 114, 402, 46, 'izq', 'Pasillo');
    add(4, 'D', 188, 402, 46, 'der', 'Ventanilla');
    add(5, 'A', 66, 480, 40, 'izq', 'Ventanilla');
    add(5, 'B', 108, 480, 40, 'izq', 'Centro');
    add(5, 'C', 150, 480, 40, 'der', 'Centro');
    add(5, 'D', 192, 480, 40, 'der', 'Ventanilla');
    // Algunos ya reservados por otros pasajeros, para ver cómo se ve.
    for (const code of ['2A', '3D', '4B', '5C']) s.find((x) => x.code === code)!.state = 'taken';
    return s;
}

const MAX_SEATS = 4;

@Component({
    selector: 'app-seat-booking',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="sb">
            <header class="sb-top">
                <a routerLink="/" class="sb-brand" aria-label="LECMA, volver al inicio">
                    <span class="sb-brand-name">LECMA</span>
                    <span class="sb-brand-tag">Movilidad corporativa</span>
                </a>
                <span class="sb-mock">Maqueta<span class="sb-mock-long"> · no guarda reservas</span></span>
            </header>

            <main class="sb-main">
                <!-- ───────── Panel: viaje, referencias y pase ───────── -->
                <section class="sb-panel">
                    <div class="sb-eyebrow"><span class="rule"></span>Reserva de asiento</div>
                    <h1 class="sb-title">Elegí tu asiento</h1>
                    <p class="sb-lead">Seleccioná tu lugar en el plano. Podés reservar hasta {{ max }} asientos por vez.</p>

                    <div class="sb-trip">
                        <div class="sb-trip-head">
                            <span class="sb-badge">Servicio ejecutivo</span>
                            <span class="sb-trip-date">Lunes 10 de noviembre</span>
                        </div>
                        <div class="sb-itinerary">
                            <div class="stop">
                                <span class="time">06:30</span>
                                <span class="city">Rosario</span>
                                <span class="where">Bv. Oroño y Pellegrini</span>
                            </div>
                            <div class="track" aria-hidden="true">
                                <span class="pt"></span><span class="ln"></span><span class="dur">1 h 10 min</span><span class="ln"></span><span class="pt end"></span>
                            </div>
                            <div class="stop right">
                                <span class="time">07:40</span>
                                <span class="city">San Nicolás</span>
                                <span class="where">Planta industrial</span>
                            </div>
                        </div>
                        <div class="sb-trip-foot">
                            <span>Toyota Hiace · {{ totalSeats }} asientos</span>
                            <span><strong>{{ freeCount() }}</strong> disponibles</span>
                        </div>
                    </div>

                    <ul class="sb-legend" aria-label="Referencias">
                        <li><span class="dot free"></span>Disponible</li>
                        <li><span class="dot sel"></span>Tu selección</li>
                        <li><span class="dot taken"></span>Reservado</li>
                    </ul>

                    <!-- Pase: lo elegido -->
                    <div class="sb-pass" [class.empty]="!selected().length">
                        <div class="sb-pass-main">
                            <div class="lbl">Asientos</div>
                            <div *ngIf="!selected().length" class="sb-pass-empty">Elegí un asiento en el plano</div>
                            <div class="sb-codes">
                                <button *ngFor="let s of selectedSeats()" type="button" class="sb-code-chip" (click)="toggle(s)" [attr.aria-label]="'Quitar asiento ' + s.code">
                                    <span class="c">{{ s.code }}</span>
                                    <span class="p">{{ s.place }}</span>
                                    <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.4" /></svg>
                                </button>
                            </div>
                            <div *ngIf="limitHit()" class="sb-warn">Podés reservar hasta {{ max }} asientos por vez.</div>
                        </div>
                        <div class="sb-pass-stub" aria-hidden="true">
                            <div class="lbl">Salida</div>
                            <div class="big">06:30</div>
                            <div class="lbl mt">Unidad</div>
                            <div class="small">Hiace 07</div>
                        </div>
                    </div>

                    <label class="sb-field">
                        <span>Pasajero</span>
                        <input type="text" [(ngModel)]="passenger" placeholder="Nombre y apellido" autocomplete="name" />
                    </label>

                    <button type="button" class="sb-cta" [disabled]="!selected().length || !passenger.trim()" (click)="confirm()">
                        <span>{{ selected().length > 1 ? 'Confirmar ' + selected().length + ' asientos' : 'Confirmar reserva' }}</span>
                        <svg viewBox="0 0 20 10" aria-hidden="true"><path d="M0 5h17M13 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.4" /></svg>
                    </button>
                </section>

                <!-- ───────── La camioneta vista desde arriba ───────── -->
                <section class="sb-van-wrap" aria-label="Plano de asientos de la camioneta">
                    <svg class="sb-van" [attr.viewBox]="'0 0 ' + viewW + ' ' + viewH" role="group">
                        <defs>
                            <filter id="vShadow" x="-30%" y="-10%" width="160%" height="125%">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="16" />
                                <feOffset dy="14" />
                                <feComponentTransfer><feFuncA type="linear" slope="0.10" /></feComponentTransfer>
                                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                            <!-- Asientos en volumen: luz de arriba y sombra abajo, por estado -->
                            <linearGradient id="fPan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fafaf8" /><stop offset="0.55" stop-color="#e4e4e1" /><stop offset="1" stop-color="#c9c9c5" /></linearGradient>
                            <linearGradient id="fBol" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d6d6d2" /><stop offset="0.5" stop-color="#f2f2ef" /><stop offset="1" stop-color="#c4c4c0" /></linearGradient>
                            <linearGradient id="fBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e8e8a" /><stop offset="0.35" stop-color="#c2c2be" /><stop offset="1" stop-color="#dcdcd9" /></linearGradient>
                            <linearGradient id="fHead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c7c78" /><stop offset="1" stop-color="#a9a9a5" /></linearGradient>
                            <linearGradient id="sPan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e3a8" /><stop offset="0.55" stop-color="#e3c97d" /><stop offset="1" stop-color="#c2a262" /></linearGradient>
                            <linearGradient id="sBol" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8975a" /><stop offset="0.5" stop-color="#e9d293" /><stop offset="1" stop-color="#a88a52" /></linearGradient>
                            <linearGradient id="sBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e5530" /><stop offset="0.35" stop-color="#9a7b46" /><stop offset="1" stop-color="#b8975a" /></linearGradient>
                            <linearGradient id="sHead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c4626" /><stop offset="1" stop-color="#7d643a" /></linearGradient>
                            <linearGradient id="tPan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c7591" /><stop offset="0.55" stop-color="#4a5476" /><stop offset="1" stop-color="#353e60" /></linearGradient>
                            <linearGradient id="tBol" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f3858" /><stop offset="0.5" stop-color="#55607f" /><stop offset="1" stop-color="#2a3352" /></linearGradient>
                            <linearGradient id="tBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2340" /><stop offset="0.35" stop-color="#2c3555" /><stop offset="1" stop-color="#3a4466" /></linearGradient>
                            <linearGradient id="tHead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a33" /><stop offset="1" stop-color="#222b4a" /></linearGradient>
                            <linearGradient id="benchBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d9d6" /><stop offset="1" stop-color="#b9b9b5" /></linearGradient>
                            <filter id="seatShadow" x="-25%" y="-20%" width="150%" height="160%">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" />
                                <feOffset dy="2.5" />
                                <feComponentTransfer><feFuncA type="linear" slope="0.38" /></feComponentTransfer>
                                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                            <!-- Rayado de los asientos reservados -->
                            <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <rect width="5" height="5" fill="#eceef1" />
                                <line x1="0" y1="0" x2="0" y2="5" stroke="#c4c8d0" stroke-width="2" />
                            </pattern>
                        </defs>

                        <!-- Número de fila, a la izquierda, como en los planos de avión -->
                        <g class="rows" aria-hidden="true">
                            <text *ngFor="let r of rowLabels" [attr.x]="vanX + 30" [attr.y]="r.y" text-anchor="middle">{{ r.n }}</text>
                        </g>

                        <g [attr.transform]="'translate(' + vanX + ',0)'" class="van">
                            <!-- Espejos: brazo corto y espejo inclinado hacia afuera -->
                            <path d="M55 112 L44 104" class="detail" />
                            <path d="M44 104 l-9 -15 q-2 -4 2 -6 l3 -1.5 q4 -1.5 6 2.5 l7 16 z" class="body" />
                            <path d="M245 112 L256 104" class="detail" />
                            <path d="M256 104 l9 -15 q2 -4 -2 -6 l-3 -1.5 q-4 -1.5 -6 2.5 l-7 16 z" class="body" />
                            <!-- Carrocería: frente angosto que se abre hasta los costados -->
                            <path
                                filter="url(#vShadow)"
                                d="M84 30 Q150 18 216 30 Q236 34 240 60 L246 112 Q252 128 252 150 L252 552 Q252 574 230 576 L70 576 Q48 574 48 552 L48 150 Q48 128 54 112 L60 60 Q64 34 84 30 Z"
                                class="body"
                            />
                            <!-- Doble línea: el capot y los costados -->
                            <path d="M68 62 Q72 42 90 39 Q150 29 210 39 Q228 42 232 62" class="detail" />
                            <path d="M57 150 L57 550 Q57 566 72 567 L228 567 Q243 566 243 550 L243 150" class="detail" />
                            <!-- Parabrisas en banda y tablero curvo -->
                            <path d="M64 74 Q150 56 236 74 L243 112 Q150 96 57 112 Z" class="glass" />
                            <path d="M57 130 Q150 112 243 130" class="detail" />
                            <!-- Volante -->
                            <ellipse cx="92" cy="138" rx="13" ry="4.5" class="detail thick" />
                            <!-- Pasillo -->
                            <path d="M174 240 V460" class="aisle" />
                            <!-- Acceso (puerta corrediza) -->
                            <path d="M252 226 v84" class="door" />
                            <text x="236" y="268" class="sb-door" text-anchor="middle" transform="rotate(90 236 268)">ACCESO</text>
                        </g>

                        <!-- Butacas y banquetas: un contorno por grupo de asientos -->
                        <rect *ngFor="let g of groups" [attr.x]="g.x - 3" [attr.y]="g.y - 2" [attr.width]="g.w + 6" [attr.height]="seatH + 2" rx="9" class="bench" filter="url(#seatShadow)" />

                        <!-- Asientos -->
                        <g
                            *ngFor="let s of seats"
                            class="seat"
                            [class.free]="s.state === 'free' && !isSelected(s)"
                            [class.sel]="isSelected(s)"
                            [class.taken]="s.state === 'taken'"
                            [class.driver]="s.state === 'driver'"
                            [attr.transform]="'translate(' + s.x + ',' + s.y + ')'"
                            [attr.role]="s.state === 'free' ? 'button' : 'img'"
                            [attr.tabindex]="s.state === 'free' ? 0 : -1"
                            [attr.aria-pressed]="s.state === 'free' ? isSelected(s) : null"
                            [attr.aria-label]="seatLabel(s)"
                            (click)="toggle(s)"
                            (keydown.enter)="toggle(s)"
                            (keydown.space)="$event.preventDefault(); toggle(s)"
                            (mouseenter)="hovered.set(s)"
                            (mouseleave)="hovered.set(null)"
                            (focus)="hovered.set(s)"
                            (blur)="hovered.set(null)"
                        >
                            <!-- Zona de toque más grande que el asiento -->
                            <rect x="-4" y="-4" [attr.width]="s.w + 8" [attr.height]="seatH + 10" fill="transparent" />
                            <!-- Asiento visto desde arriba, con volumen: laterales, almohadón, respaldo y apoyacabezas.
                                 La camioneta mira hacia arriba, así que el respaldo va abajo. -->
                            <g filter="url(#seatShadow)">
                                <!-- Laterales (más anchos en las butacas de adelante) -->
                                <rect x="0" y="1" [attr.width]="s.w" [attr.height]="seatH - 9" [attr.rx]="front(s) ? 11 : 8" class="bol" />
                                <!-- Almohadón -->
                                <rect [attr.x]="front(s) ? 7 : 4" y="3" [attr.width]="s.w - (front(s) ? 14 : 8)" [attr.height]="seatH - 20" [attr.rx]="front(s) ? 8 : 6" class="pan" />
                                <!-- Costura del almohadón -->
                                <path [attr.d]="'M' + (front(s) ? 11 : 8) + ' ' + (seatH - 26) + ' H' + (s.w - (front(s) ? 11 : 8))" class="seam" />
                                <!-- Respaldo -->
                                <rect x="1.5" [attr.y]="seatH - 19" [attr.width]="s.w - 3" height="13" rx="6" class="bk" />
                                <rect x="5" [attr.y]="seatH - 17.5" [attr.width]="s.w - 10" height="2.5" rx="1.25" class="shine" />
                                <!-- Apoyacabezas -->
                                <rect [attr.x]="s.w / 2 - s.w * 0.2" [attr.y]="seatH - 7" [attr.width]="s.w * 0.4" height="6" rx="2.5" class="hd" />
                            </g>
                            <text *ngIf="s.state !== 'driver'" [attr.x]="s.w / 2" y="20" text-anchor="middle" class="code">{{ s.code }}</text>
                        </g>

                        <!-- Señalador del último asiento elegido: anillo + línea + etiqueta -->
                        <g *ngIf="pointer() as p" class="pointer" aria-hidden="true">
                            <circle [attr.cx]="p.cx" [attr.cy]="p.cy" r="38" class="ring-soft" />
                            <circle [attr.cx]="p.cx" [attr.cy]="p.cy" r="33" class="ring" />
                            <path [attr.d]="p.line" class="line" />
                            <path [attr.d]="p.diamond" class="diamond" />
                            <g [attr.transform]="'translate(' + p.lx + ',' + (p.cy - 46) + ')'">
                                <rect x="0" y="0" width="64" height="34" rx="6" class="tag" />
                                <text x="32" y="17" text-anchor="middle" class="tag-code">{{ p.code }}</text>
                                <text x="32" y="28" text-anchor="middle" class="tag-place">{{ p.place }}</text>
                            </g>
                        </g>

                        <!-- Ficha al pasar el mouse por un asiento -->
                        <g *ngIf="tooltip() as t" class="tip" aria-hidden="true" [attr.transform]="'translate(' + t.x + ',' + t.y + ')'">
                            <rect x="-48" y="-30" width="96" height="24" rx="5" />
                            <path d="M-5 -6 L0 0 L5 -6 Z" />
                            <text x="0" y="-14" text-anchor="middle">{{ t.text }}</text>
                        </g>
                    </svg>
                    <div class="sb-van-foot">
                        <span class="sb-foot-line"></span>
                        <span class="sb-foot-tag">Frente de la unidad hacia arriba</span>
                        <span class="sb-foot-line"></span>
                    </div>
                </section>
            </main>

            <!-- Confirmación (simulada), como pase de embarque -->
            <div *ngIf="done" class="sb-modal" role="dialog" aria-modal="true" aria-labelledby="sbDoneTitle" (click)="done = null">
                <div class="sb-ticket" (click)="$event.stopPropagation()">
                    <div class="sb-ticket-head">
                        <span class="sb-brand-name small">LECMA</span>
                        <span class="sb-badge">Reserva confirmada</span>
                    </div>
                    <div class="sb-ticket-body">
                        <h2 id="sbDoneTitle" class="sb-ticket-title">Buen viaje, {{ done.name }}</h2>
                        <div class="sb-ticket-route">
                            <div><span class="time">06:30</span><span class="city">Rosario</span></div>
                            <svg viewBox="0 0 40 10" aria-hidden="true"><path d="M0 5h36M31 1l5 4-5 4" fill="none" stroke="currentColor" stroke-width="1.2" /></svg>
                            <div class="right"><span class="time">07:40</span><span class="city">San Nicolás</span></div>
                        </div>
                        <div class="sb-ticket-grid">
                            <div><span class="lbl">Fecha</span><span>Lun 10/11</span></div>
                            <div><span class="lbl">{{ done.seats.length > 1 ? 'Asientos' : 'Asiento' }}</span><span class="gold">{{ done.seats.join(' · ') }}</span></div>
                            <div><span class="lbl">Unidad</span><span>Hiace 07</span></div>
                        </div>
                    </div>
                    <div class="sb-ticket-perf" aria-hidden="true"></div>
                    <div class="sb-ticket-foot">
                        <div><span class="lbl">Código</span><span class="code">{{ done.code }}</span></div>
                        <button type="button" class="sb-cta compact" (click)="reset()">Listo</button>
                    </div>
                    <p class="sb-ticket-note">Maqueta: no se guardó ninguna reserva.</p>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                --navy: #15224d;
                --navy-2: #1b2a5c;
                --navy-3: #0b1330;
                --gold-1: #e3c97d;
                --gold-2: #967945;
                --gold: #c2a262;
                --beige: #d7cdc1;
                --paper: #efede8;
                --ink-2: #5b6170;
                --muted: #8a8d8f;
                --line: #dcd7cd;
            }
            .sb {
                min-height: 100vh;
                font-family: 'DM Sans', system-ui, sans-serif;
                color: var(--navy);
                background:
                    radial-gradient(60% 70% at 72% 45%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0) 70%),
                    linear-gradient(180deg, #f4f2ee 0%, var(--paper) 60%, #e6e2da 100%);
                display: flex;
                flex-direction: column;
                overflow-x: hidden;
            }
            .sb-panel,
            .sb-van-wrap {
                min-width: 0;
            }
            .sb-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 22px clamp(16px, 4vw, 56px);
                border-bottom: 1px solid rgba(21, 34, 77, 0.08);
            }
            .sb-brand {
                display: inline-flex;
                flex-direction: column;
                text-decoration: none;
                color: var(--navy);
                line-height: 1;
            }
            .sb-brand-name {
                font-family: 'Dovens', 'DM Sans', sans-serif;
                font-weight: 900;
                font-size: 26px;
                letter-spacing: 0.02em;
            }
            .sb-brand-name.small {
                font-size: 20px;
                color: #fff;
            }
            .sb-brand-tag {
                margin-top: 5px;
                font-size: 8.5px;
                letter-spacing: 0.42em;
                text-transform: uppercase;
                color: var(--muted);
            }
            .sb-mock {
                font-size: 10.5px;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: var(--gold-2);
                border: 1px solid rgba(194, 162, 98, 0.6);
                border-radius: 999px;
                padding: 6px 12px;
                white-space: nowrap;
            }

            .sb-main {
                flex: 1;
                display: grid;
                grid-template-columns: minmax(300px, 440px) minmax(280px, 520px);
                justify-content: center;
                align-items: center;
                gap: clamp(24px, 7vw, 112px);
                padding: 32px clamp(16px, 4vw, 56px) 48px;
            }

            /* ── Panel ── */
            .sb-eyebrow {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 10.5px;
                font-weight: 700;
                letter-spacing: 0.34em;
                text-transform: uppercase;
                color: var(--gold-2);
            }
            .sb-eyebrow .rule {
                width: 28px;
                height: 1px;
                background: var(--gold);
            }
            .sb-title {
                font-family: 'Dovens', 'DM Sans', sans-serif;
                font-weight: 800;
                font-size: clamp(30px, 4.4vw, 42px);
                line-height: 1.04;
                text-transform: uppercase;
                margin: 14px 0 12px;
            }
            .sb-lead {
                color: var(--ink-2);
                margin: 0 0 26px;
                line-height: 1.55;
                font-size: 15px;
            }

            .sb-trip {
                position: relative;
                background: linear-gradient(160deg, var(--navy-2) 0%, var(--navy) 55%, #101b40 100%);
                color: #fff;
                border-radius: 14px;
                padding: 18px 22px 16px;
                box-shadow: 0 22px 40px -26px rgba(21, 34, 77, 0.9);
                overflow: hidden;
            }
            .sb-trip::before {
                content: '';
                position: absolute;
                inset: 0 0 auto 0;
                height: 2px;
                background: linear-gradient(90deg, var(--gold-1), var(--gold-2));
            }
            .sb-trip-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 16px;
            }
            .sb-badge {
                font-size: 9.5px;
                font-weight: 700;
                letter-spacing: 0.22em;
                text-transform: uppercase;
                color: var(--navy);
                background: linear-gradient(135deg, var(--gold-1), var(--gold));
                border-radius: 4px;
                padding: 4px 8px;
                white-space: nowrap;
            }
            .sb-trip-date {
                font-size: 12px;
                color: var(--beige);
            }
            .sb-itinerary {
                display: grid;
                grid-template-columns: auto 1fr auto;
                align-items: center;
                gap: 14px;
            }
            .stop {
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-width: 0;
            }
            .stop.right {
                text-align: right;
            }
            .stop .time {
                font-size: 24px;
                font-weight: 700;
                letter-spacing: 0.01em;
                line-height: 1.1;
            }
            .stop .city {
                font-size: 14px;
                font-weight: 500;
            }
            .stop .where {
                font-size: 11px;
                color: var(--beige);
                opacity: 0.75;
            }
            .track {
                display: flex;
                align-items: center;
                gap: 6px;
                color: var(--gold-1);
                min-width: 60px;
            }
            .track .ln {
                flex: 1;
                height: 1px;
                background: repeating-linear-gradient(90deg, rgba(227, 201, 125, 0.7) 0 4px, transparent 4px 8px);
            }
            .track .pt {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                border: 1.5px solid var(--gold-1);
                flex-shrink: 0;
            }
            .track .pt.end {
                background: var(--gold-1);
            }
            .track .dur {
                font-size: 10px;
                letter-spacing: 0.08em;
                white-space: nowrap;
            }
            .sb-trip-foot {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid rgba(255, 255, 255, 0.12);
                font-size: 12px;
                color: var(--beige);
            }
            .sb-trip-foot strong {
                color: var(--gold-1);
                font-size: 14px;
            }

            .sb-legend {
                list-style: none;
                display: flex;
                flex-wrap: wrap;
                gap: 8px 22px;
                padding: 0;
                margin: 22px 0 18px;
                font-size: 12.5px;
                color: var(--ink-2);
            }
            .sb-legend li {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .dot {
                width: 15px;
                height: 15px;
                border-radius: 4px;
                display: inline-block;
                background: linear-gradient(#fafaf8, #c9c9c5);
                box-shadow: inset 0 -4px 0 #a9a9a5, 0 1px 2px rgba(0, 0, 0, 0.2);
            }
            .dot.sel {
                background: linear-gradient(#f6e3a8, #c2a262);
                box-shadow: inset 0 -4px 0 #7d643a, 0 1px 2px rgba(0, 0, 0, 0.2);
            }
            .dot.taken {
                background: linear-gradient(#6c7591, #353e60);
                box-shadow: inset 0 -4px 0 #1b2340, 0 1px 2px rgba(0, 0, 0, 0.2);
            }

            /* Pase */
            .sb-pass {
                display: grid;
                grid-template-columns: 1fr auto;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 14px 30px -24px rgba(21, 34, 77, 0.55), 0 0 0 1px rgba(21, 34, 77, 0.06);
                margin-bottom: 18px;
                overflow: hidden;
            }
            .sb-pass-main {
                padding: 14px 16px;
                min-width: 0;
            }
            .sb-pass-stub {
                position: relative;
                padding: 14px 18px;
                background: #faf8f4;
                border-left: 1.5px dashed var(--line);
                text-align: right;
            }
            .sb-pass-stub::before,
            .sb-pass-stub::after {
                content: '';
                position: absolute;
                left: -8px;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: var(--paper);
            }
            .sb-pass-stub::before {
                top: -7px;
            }
            .sb-pass-stub::after {
                bottom: -7px;
            }
            .lbl {
                font-size: 9.5px;
                font-weight: 700;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: var(--muted);
            }
            .lbl.mt {
                margin-top: 8px;
            }
            .sb-pass-stub .big {
                font-size: 20px;
                font-weight: 700;
                color: var(--navy);
            }
            .sb-pass-stub .small {
                font-size: 13px;
                font-weight: 500;
            }
            .sb-pass-empty {
                margin-top: 8px;
                font-size: 14px;
                color: var(--muted);
            }
            .sb-codes {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 8px;
            }
            .sb-code-chip {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                border: 0;
                border-radius: 8px;
                background: var(--navy);
                color: #fff;
                padding: 6px 10px 6px 8px;
                font: inherit;
                cursor: pointer;
            }
            .sb-code-chip .c {
                font-size: 15px;
                font-weight: 700;
                color: var(--gold-1);
                min-width: 22px;
            }
            .sb-code-chip .p {
                font-size: 11px;
                letter-spacing: 0.06em;
                color: var(--beige);
            }
            .sb-code-chip svg {
                width: 9px;
                height: 9px;
                color: rgba(255, 255, 255, 0.5);
            }
            .sb-code-chip:hover svg {
                color: #fff;
            }
            .sb-warn {
                margin-top: 10px;
                font-size: 12.5px;
                color: #a15c1b;
            }

            .sb-field {
                display: flex;
                flex-direction: column;
                gap: 7px;
                font-size: 9.5px;
                font-weight: 700;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: var(--muted);
                margin-bottom: 16px;
            }
            .sb-field input {
                font: inherit;
                font-size: 15px;
                font-weight: 400;
                letter-spacing: 0;
                text-transform: none;
                color: var(--navy);
                background: #fff;
                border: 1px solid var(--line);
                border-radius: 10px;
                padding: 13px 14px;
                outline: none;
                transition: border-color 0.15s ease, box-shadow 0.15s ease;
            }
            .sb-field input::placeholder {
                color: #a4a7ad;
            }
            .sb-field input:focus {
                border-color: var(--gold);
                box-shadow: 0 0 0 3px rgba(194, 162, 98, 0.22);
            }
            .sb-cta {
                width: 100%;
                display: inline-flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                border: 0;
                border-radius: 10px;
                padding: 16px 20px;
                font: inherit;
                font-weight: 700;
                font-size: 13px;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: var(--gold-1);
                background: var(--navy);
                cursor: pointer;
                transition: background 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
                box-shadow: 0 16px 30px -20px rgba(21, 34, 77, 0.9);
            }
            .sb-cta svg {
                width: 22px;
                transition: transform 0.15s ease;
            }
            .sb-cta:hover:not(:disabled) {
                background: var(--navy-2);
            }
            .sb-cta:hover:not(:disabled) svg {
                transform: translateX(3px);
            }
            .sb-cta:disabled {
                opacity: 0.35;
                cursor: not-allowed;
                box-shadow: none;
            }
            .sb-cta.compact {
                width: auto;
                padding: 12px 22px;
            }
            .sb-cta:focus-visible,
            .sb-code-chip:focus-visible {
                outline: 2px solid var(--gold);
                outline-offset: 2px;
            }

            /* ── Camioneta ── */
            .sb-van-wrap {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .sb-van {
                width: 100%;
                max-width: 470px;
                height: auto;
                max-height: 80vh;
                overflow: visible;
            }
            .van .body {
                fill: #ffffff;
                stroke: #2b2f3a;
                stroke-width: 1.2;
                stroke-linejoin: round;
            }
            .van .detail {
                fill: none;
                stroke: #2b2f3a;
                stroke-width: 0.8;
            }
            .van .detail.thick {
                stroke-width: 1.6;
            }
            .van .glass {
                fill: #ffffff;
                stroke: #2b2f3a;
                stroke-width: 1;
            }
            .van .aisle {
                stroke: var(--gold);
                stroke-width: 1;
                stroke-dasharray: 1 6;
                stroke-linecap: round;
            }
            .van .door {
                stroke: var(--gold);
                stroke-width: 2.5;
                stroke-linecap: round;
            }
            .sb-door {
                font-size: 7px;
                letter-spacing: 0.34em;
                fill: var(--gold-2);
            }
            .rows text {
                font-size: 10px;
                font-weight: 700;
                fill: #a4a7ad;
                letter-spacing: 0.05em;
            }
            .seat {
                outline: none;
            }
            .bench {
                fill: url(#benchBase);
            }
            .seat .bol {
                fill: url(#fBol);
            }
            .seat .pan {
                fill: url(#fPan);
                transition: opacity 0.15s ease;
            }
            .seat .bk {
                fill: url(#fBack);
            }
            .seat .hd {
                fill: url(#fHead);
            }
            .seat .seam {
                fill: none;
                stroke: rgba(0, 0, 0, 0.12);
                stroke-width: 0.8;
            }
            .seat .shine {
                fill: rgba(255, 255, 255, 0.35);
            }
            .seat .code {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.04em;
                fill: var(--navy);
                pointer-events: none;
            }
            .seat.free {
                cursor: pointer;
            }
            .seat.free:hover .pan {
                fill: url(#sPan);
                opacity: 0.55;
            }
            .seat.free:focus-visible .bol {
                stroke: var(--gold-2);
                stroke-width: 1.5;
            }
            .seat.sel {
                cursor: pointer;
            }
            .seat.sel .bol {
                fill: url(#sBol);
            }
            .seat.sel .pan {
                fill: url(#sPan);
            }
            .seat.sel .bk {
                fill: url(#sBack);
            }
            .seat.sel .hd {
                fill: url(#sHead);
            }
            .seat.taken .bol {
                fill: url(#tBol);
            }
            .seat.taken .pan {
                fill: url(#tPan);
            }
            .seat.taken .bk {
                fill: url(#tBack);
            }
            .seat.taken .hd {
                fill: url(#tHead);
            }
            .seat.taken .seam {
                stroke: rgba(255, 255, 255, 0.08);
            }
            .seat.taken .shine {
                fill: rgba(255, 255, 255, 0.08);
            }
            .seat.taken .code {
                fill: rgba(255, 255, 255, 0.45);
            }
            .seat.driver {
                opacity: 0.55;
            }
            .seat .wheel-icon {
                fill: none;
                stroke: #8a8e98;
                stroke-width: 1.6;
            }

            .pointer .ring {
                fill: none;
                stroke: var(--gold-1);
                stroke-width: 1.6;
            }
            .pointer .ring-soft {
                fill: none;
                stroke: var(--gold-1);
                stroke-opacity: 0.3;
                stroke-width: 1;
                animation: sb-pulse 2.8s ease-out infinite;
                transform-box: fill-box;
                transform-origin: center;
            }
            .pointer .line {
                fill: none;
                stroke: var(--gold);
                stroke-width: 1.4;
            }
            .pointer .diamond {
                fill: var(--gold);
            }
            .pointer .tag {
                fill: var(--navy);
                stroke: var(--gold);
                stroke-width: 1;
            }
            .pointer .tag-code {
                font-size: 14px;
                font-weight: 700;
                fill: var(--gold-1);
            }
            .pointer .tag-place {
                font-size: 6.5px;
                letter-spacing: 0.24em;
                text-transform: uppercase;
                fill: var(--beige);
            }
            @keyframes sb-pulse {
                0% {
                    transform: scale(0.9);
                    opacity: 1;
                }
                100% {
                    transform: scale(1.25);
                    opacity: 0;
                }
            }

            .tip {
                pointer-events: none;
            }
            .tip rect,
            .tip path {
                fill: #fff;
                filter: drop-shadow(0 4px 8px rgba(21, 34, 77, 0.25));
            }
            .tip text {
                font-size: 9.5px;
                font-weight: 600;
                fill: var(--navy);
            }

            .sb-van-foot {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-top: 14px;
                width: min(320px, 90%);
            }
            .sb-foot-line {
                flex: 1;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(150, 121, 69, 0.5), transparent);
            }
            .sb-foot-tag {
                font-size: 9px;
                letter-spacing: 0.3em;
                text-transform: uppercase;
                color: var(--muted);
                white-space: nowrap;
            }

            /* ── Confirmación: pase de embarque ── */
            .sb-modal {
                position: fixed;
                inset: 0;
                display: grid;
                place-items: center;
                padding: 16px;
                background: rgba(11, 19, 48, 0.62);
                backdrop-filter: blur(4px);
                z-index: 50;
            }
            .sb-ticket {
                width: min(430px, 100%);
                background: #fff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.6);
                animation: sb-in 0.25s ease-out;
            }
            @keyframes sb-in {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
            }
            .sb-ticket-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 22px;
                background: var(--navy);
                border-bottom: 2px solid var(--gold);
            }
            .sb-ticket-body {
                padding: 22px 22px 18px;
            }
            .sb-ticket-title {
                font-family: 'Dovens', 'DM Sans', sans-serif;
                font-weight: 800;
                font-size: 22px;
                text-transform: uppercase;
                margin: 0 0 18px;
            }
            .sb-ticket-route {
                display: grid;
                grid-template-columns: auto 1fr auto;
                align-items: center;
                gap: 14px;
                color: var(--gold-2);
            }
            .sb-ticket-route div {
                display: flex;
                flex-direction: column;
                color: var(--navy);
            }
            .sb-ticket-route .right {
                text-align: right;
            }
            .sb-ticket-route .time {
                font-size: 26px;
                font-weight: 700;
                line-height: 1.1;
            }
            .sb-ticket-route .city {
                font-size: 13px;
                color: var(--ink-2);
            }
            .sb-ticket-route svg {
                width: 100%;
                height: 10px;
            }
            .sb-ticket-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-top: 18px;
            }
            .sb-ticket-grid div {
                display: flex;
                flex-direction: column;
                gap: 3px;
                font-size: 14px;
                font-weight: 600;
            }
            .sb-ticket-grid .gold {
                color: var(--gold-2);
            }
            .sb-ticket-perf {
                position: relative;
                height: 0;
                border-top: 1.5px dashed var(--line);
                margin: 0 18px;
            }
            .sb-ticket-perf::before,
            .sb-ticket-perf::after {
                content: '';
                position: absolute;
                top: -9px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: rgba(11, 19, 48, 0.62);
            }
            .sb-ticket-perf::before {
                left: -28px;
            }
            .sb-ticket-perf::after {
                right: -28px;
            }
            .sb-ticket-foot {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 16px 22px 8px;
            }
            .sb-ticket-foot div {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .sb-ticket-foot .code {
                font-size: 20px;
                font-weight: 700;
                letter-spacing: 0.24em;
            }
            .sb-ticket-note {
                font-size: 11px;
                color: var(--muted);
                margin: 0;
                padding: 0 22px 16px;
            }

            @media (max-width: 860px) {
                .sb-main {
                    grid-template-columns: minmax(0, 1fr);
                    justify-items: center;
                    align-items: start;
                    padding-top: 20px;
                }
                .sb-panel {
                    width: 100%;
                    max-width: 520px;
                }
                /* En el celular, primero la camioneta y después los datos. */
                .sb-van-wrap {
                    order: -1;
                    width: 100%;
                }
                .sb-van {
                    max-height: none;
                }
            }
            @media (max-width: 480px) {
                .sb-mock-long {
                    display: none;
                }
                .sb-title {
                    font-size: 28px;
                }
                .stop .time {
                    font-size: 20px;
                }
                .track .dur {
                    display: none;
                }
                .sb-ticket-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
            @media (prefers-reduced-motion: reduce) {
                .pointer .ring-soft,
                .sb-ticket {
                    animation: none;
                }
                .sb-cta,
                .sb-cta svg {
                    transition: none;
                }
            }
        `
    ]
})
export class SeatBooking implements OnInit, OnDestroy {
    readonly seats = buildSeats();
    readonly seatH = SEAT_H;
    readonly vanX = VAN_X;
    readonly viewW = VIEW_W;
    readonly viewH = VIEW_H;
    readonly max = MAX_SEATS;
    readonly totalSeats = this.seats.filter((s) => s.state !== 'driver').length;
    /** Las butacas de adelante tienen los laterales más marcados. */
    front(s: Seat): boolean {
        return s.place === 'Adelante';
    }

    /** Butacas y banquetas: asientos de la misma fila y del mismo lado van juntos; la última fila es una sola banqueta. */
    readonly groups = Object.values(
        this.seats.reduce<Record<string, { x: number; y: number; w: number }>>((acc, s) => {
            const row = s.state === 'driver' ? 'chofer' : s.code.slice(0, -1);
            const key = row === '5' ? row : `${row}-${s.side}`;
            const g = acc[key];
            if (!g) acc[key] = { x: s.x, y: s.y, w: s.w };
            else {
                const right = Math.max(g.x + g.w, s.x + s.w);
                g.x = Math.min(g.x, s.x);
                g.w = right - g.x;
            }
            return acc;
        }, {})
    );
    /** Número de cada fila, a la altura de sus asientos. */
    readonly rowLabels = [...new Set(this.seats.filter((s) => s.state !== 'driver').map((s) => s.code.slice(0, -1)))].map((n) => ({
        n,
        y: this.seats.find((s) => s.code.startsWith(n))!.y + 40
    }));

    readonly selected = signal<string[]>([]);
    readonly hovered = signal<Seat | null>(null);
    readonly limitHit = signal(false);
    passenger = '';
    done: { name: string; seats: string[]; code: string } | null = null;

    readonly selectedSeats = computed(() => this.selected().map((code) => this.seats.find((s) => s.code === code)!));
    readonly freeCount = computed(() => this.seats.filter((s) => s.state === 'free').length - this.selected().length);

    /** Anillo y línea hacia afuera de la camioneta, del lado más cercano al asiento. */
    readonly pointer = computed(() => {
        const code = this.selected().slice(-1)[0];
        const s = code ? this.seats.find((x) => x.code === code) : null;
        if (!s) return null;
        const cx = s.x + s.w / 2;
        const cy = s.y + SEAT_H / 2 - 2;
        const left = s.side === 'izq';
        const start = left ? cx - 33 : cx + 33;
        const end = left ? 34 : VIEW_W - 34;
        const d = 4;
        return {
            code: s.code,
            place: s.place,
            cx,
            cy,
            line: `M${start} ${cy} L${end} ${cy}`,
            diamond: `M${end} ${cy - d} L${end + d} ${cy} L${end} ${cy + d} L${end - d} ${cy} Z`,
            // La etiqueta queda arriba de la punta de la línea.
            lx: left ? end - 30 : end - 34
        };
    });

    /** Ficha del asiento bajo el mouse (no se muestra sobre el que tiene el señalador). */
    readonly tooltip = computed(() => {
        const s = this.hovered();
        if (!s || s.state === 'driver') return null;
        const state = s.state === 'taken' ? 'Reservado' : this.isSelected(s) ? 'Tu selección' : 'Disponible';
        return { x: s.x + s.w / 2, y: s.y - 4, text: `${s.code} · ${s.place} · ${state}` };
    });

    constructor(
        private meta: Meta,
        private title: Title
    ) {}

    ngOnInit() {
        this.title.setTitle('Reservá tu asiento · LECMA');
        // Es una maqueta: que no aparezca en Google.
        this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    }

    ngOnDestroy() {
        this.meta.removeTag("name='robots'");
    }

    isSelected(s: Seat): boolean {
        return this.selected().includes(s.code);
    }

    seatLabel(s: Seat): string {
        if (s.state === 'driver') return 'Chofer';
        const what = `Asiento ${s.code}, ${s.place.toLowerCase()}`;
        if (s.state === 'taken') return `${what}, reservado`;
        return this.isSelected(s) ? `${what}, elegido` : `${what}, disponible`;
    }

    toggle(s: Seat) {
        if (s.state !== 'free') return;
        const cur = this.selected();
        if (cur.includes(s.code)) {
            this.selected.set(cur.filter((c) => c !== s.code));
            this.limitHit.set(false);
            return;
        }
        if (cur.length >= MAX_SEATS) {
            this.limitHit.set(true);
            return;
        }
        this.limitHit.set(false);
        this.selected.set([...cur, s.code]);
    }

    confirm() {
        const code = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
        const order = (c: string) => this.seats.findIndex((s) => s.code === c);
        this.done = { name: this.passenger.trim().split(' ')[0]!, seats: [...this.selected()].sort((a, b) => order(a) - order(b)), code };
    }

    reset() {
        this.done = null;
        this.selected.set([]);
        this.passenger = '';
    }
}
