import { Component, AfterViewInit, OnDestroy, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-lecma-landing',
    standalone: true,
    imports: [FormsModule],
    styles: [`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .lp {
            font-family: 'Montserrat', sans-serif;
            background: #F7F5F2;
            color: #1A1A1A;
            overflow-x: hidden;
        }

        /* ── SCROLL ANIMATIONS ── */
        .aos {
            opacity: 0;
            transform: translateY(40px);
            transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .aos.is-visible { opacity: 1; transform: translateY(0); }

        .aos-left {
            opacity: 0;
            transform: translateX(-50px);
            transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .aos-left.is-visible { opacity: 1; transform: translateX(0); }

        .aos-right {
            opacity: 0;
            transform: translateX(50px);
            transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .aos-right.is-visible { opacity: 1; transform: translateX(0); }

        .d1 { transition-delay: 0.1s; }
        .d2 { transition-delay: 0.2s; }
        .d3 { transition-delay: 0.3s; }
        .d4 { transition-delay: 0.4s; }
        .d5 { transition-delay: 0.5s; }

        /* ── NAV ── */
        .nav {
            position: sticky;
            top: 0;
            z-index: 100;
            background: #0C2340;
            padding: 0 48px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 64px;
            border-bottom: 1px solid rgba(201,168,76,0.25);
        }
        .nav-logo {
            font-size: 22px;
            font-weight: 900;
            color: #fff;
            letter-spacing: 0.08em;
            flex-shrink: 0;
        }
        .nav-logo span { color: #C9A84C; }

        .nav-links {
            display: flex;
            gap: 32px;
            list-style: none;
        }
        .nav-links a {
            color: rgba(255,255,255,0.65);
            text-decoration: none;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            transition: color 0.2s;
        }
        .nav-links a:hover { color: #C9A84C; }

        .nav-cta {
            background: transparent;
            border: 1px solid #C9A84C;
            color: #C9A84C;
            padding: 8px 20px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
            font-family: 'Montserrat', sans-serif;
            flex-shrink: 0;
        }
        .nav-cta:hover { background: #C9A84C; color: #0C2340; }

        .nav-burger {
            display: none;
            flex-direction: column;
            gap: 5px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 6px;
            z-index: 101;
        }
        .nav-burger span {
            display: block;
            width: 24px;
            height: 2px;
            background: #fff;
            transition: transform 0.3s, opacity 0.3s;
            transform-origin: center;
        }
        .nav-burger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .nav-burger.open span:nth-child(2) { opacity: 0; }
        .nav-burger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

        /* ── HERO ── */
        .hero {
            background: #0C2340;
            min-height: 100vh;
            display: flex;
            align-items: center;
            padding: 80px 48px;
            position: relative;
            overflow: hidden;
        }
        .hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at 70% 50%, rgba(201,168,76,0.06) 0%, transparent 70%);
            pointer-events: none;
        }
        .hero-content { position: relative; z-index: 2; max-width: 600px; }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(201,168,76,0.1);
            border: 1px solid rgba(201,168,76,0.3);
            padding: 6px 16px;
            margin-bottom: 32px;
        }
        .hero-badge-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #C9A84C;
            animation: pulse 2s infinite;
            flex-shrink: 0;
        }
        .hero-badge-text {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #C9A84C;
        }

        .hero-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #C9A84C;
            margin-bottom: 24px;
        }
        .hero-title {
            font-size: 58px;
            font-weight: 900;
            color: #fff;
            line-height: 1.0;
            margin-bottom: 28px;
            letter-spacing: -0.02em;
        }
        .hero-title em {
            font-style: normal;
            color: #C9A84C;
        }
        .hero-subtitle {
            font-size: 16px;
            font-weight: 400;
            color: rgba(255,255,255,0.6);
            line-height: 1.75;
            margin-bottom: 48px;
            max-width: 480px;
        }
        .hero-subtitle strong { color: rgba(255,255,255,0.85); font-weight: 600; }

        .hero-actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }

        .btn-primary {
            background: #C9A84C;
            color: #0C2340;
            border: none;
            padding: 16px 36px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            cursor: pointer;
            font-family: 'Montserrat', sans-serif;
            transition: opacity 0.2s, transform 0.2s;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-2px); }

        .btn-ghost {
            background: transparent;
            color: rgba(255,255,255,0.7);
            border: none;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.08em;
            cursor: pointer;
            font-family: 'Montserrat', sans-serif;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: color 0.2s;
        }
        .btn-ghost:hover { color: #fff; }

        .hero-visual {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
            pointer-events: none;
        }
        .hero-route {
            opacity: 0.15;
            width: 100%;
            height: auto;
            max-width: 520px;
        }

        /* ── STATS ── */
        .stats {
            background: #fff;
            border-top: 3px solid #C9A84C;
            padding: 40px 48px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
        }
        .stat-item {
            padding: 0 32px;
            border-right: 1px solid #E8E6E1;
            text-align: center;
        }
        .stat-item:first-child { padding-left: 16px; }
        .stat-item:last-child { border-right: none; }
        .stat-number {
            font-size: 34px;
            font-weight: 900;
            color: #0C2340;
            letter-spacing: -0.02em;
            line-height: 1;
            margin-bottom: 8px;
        }
        .stat-number span { color: #C9A84C; }
        .stat-label {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #8A8D8F;
        }

        /* ── SECTIONS ── */
        .section { padding: 96px 48px; }
        .section-alt { background: #fff; }
        .section-dark { background: #0C2340; }

        .section-header { margin-bottom: 60px; }
        .section-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #C9A84C;
            margin-bottom: 16px;
        }
        .section-eyebrow-light {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #C9A84C;
            margin-bottom: 16px;
        }
        .section-title {
            font-size: 36px;
            font-weight: 900;
            color: #0C2340;
            letter-spacing: -0.02em;
            line-height: 1.1;
            max-width: 520px;
        }
        .section-title-light {
            font-size: 36px;
            font-weight: 900;
            color: #fff;
            letter-spacing: -0.02em;
            line-height: 1.1;
            max-width: 520px;
        }

        /* ── SERVICIOS ── */
        .services-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2px;
            background: #E8E6E1;
            border: 2px solid #E8E6E1;
        }
        .service-card {
            background: #F7F5F2;
            padding: 40px 32px;
            transition: background 0.25s, transform 0.25s;
            cursor: default;
        }
        .service-card:hover { background: #fff; transform: translateY(-4px); }
        .service-icon { width: 44px; height: 44px; margin-bottom: 28px; }
        .service-name {
            font-size: 17px;
            font-weight: 800;
            color: #0C2340;
            margin-bottom: 12px;
            letter-spacing: -0.01em;
        }
        .service-desc {
            font-size: 13px;
            font-weight: 400;
            color: #8A8D8F;
            line-height: 1.75;
        }
        .service-destinations {
            margin-top: 16px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .dest-tag {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #0C2340;
            background: #E8E6E1;
            padding: 3px 10px;
        }
        .service-tag {
            display: inline-block;
            margin-top: 20px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #C9A84C;
        }

        /* ── FLOTA ── */
        .fleet-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
        }
        .fleet-card {
            background: #F7F5F2;
            border: 1px solid #E8E6E1;
            padding: 36px 24px 28px;
            text-align: center;
            transition: background 0.25s, border-color 0.25s, transform 0.25s;
            cursor: default;
        }
        .fleet-card:hover { background: #fff; border-color: #C9A84C; transform: translateY(-4px); }
        .fleet-car-icon { margin: 0 auto 20px; display: block; }
        .fleet-model {
            font-size: 15px;
            font-weight: 800;
            color: #0C2340;
            margin-bottom: 4px;
            letter-spacing: -0.01em;
        }
        .fleet-type {
            font-size: 12px;
            color: #8A8D8F;
            margin-bottom: 16px;
            font-weight: 400;
        }
        .fleet-cap {
            font-size: 10px;
            font-weight: 700;
            color: #C9A84C;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            padding-top: 16px;
            border-top: 1px solid #E8E6E1;
        }

        /* ── WHY ── */
        .why-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 64px;
            align-items: center;
        }
        .why-visual {
            background: #0C2340;
            padding: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 380px;
        }
        .why-points { display: flex; flex-direction: column; gap: 32px; }
        .why-point { display: flex; gap: 20px; align-items: flex-start; }
        .why-number {
            font-size: 11px;
            font-weight: 900;
            color: #C9A84C;
            letter-spacing: 0.1em;
            min-width: 28px;
            padding-top: 2px;
        }
        .why-point-title {
            font-size: 14px;
            font-weight: 800;
            color: #0C2340;
            margin-bottom: 6px;
        }
        .why-point-text {
            font-size: 13px;
            font-weight: 400;
            color: #8A8D8F;
            line-height: 1.7;
        }

        /* Coverage visual SVG text classes */
        .city-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            font-weight: 700;
            fill: rgba(255,255,255,0.5);
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .city-name {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            font-weight: 800;
            fill: #fff;
        }
        .km-number {
            font-family: 'Montserrat', sans-serif;
            font-size: 32px;
            font-weight: 900;
            fill: #C9A84C;
        }
        .km-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 9px;
            font-weight: 600;
            fill: rgba(255,255,255,0.4);
            letter-spacing: 0.12em;
        }

        /* ── CTA ── */
        .cta-section {
            background: #0C2340;
            padding: 96px 48px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .cta-section::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%);
            pointer-events: none;
        }
        .cta-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #C9A84C;
            margin-bottom: 20px;
        }
        .cta-title {
            font-size: 44px;
            font-weight: 900;
            color: #fff;
            letter-spacing: -0.02em;
            margin-bottom: 16px;
            line-height: 1.1;
        }
        .cta-sub {
            font-size: 15px;
            color: rgba(255,255,255,0.5);
            margin-bottom: 48px;
            font-weight: 400;
            max-width: 480px;
            margin-left: auto;
            margin-right: auto;
        }
        .cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .btn-outline {
            background: transparent;
            border: 1px solid rgba(255,255,255,0.25);
            color: rgba(255,255,255,0.7);
            padding: 16px 36px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            cursor: pointer;
            font-family: 'Montserrat', sans-serif;
            transition: border-color 0.2s, color 0.2s;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.6); color: #fff; }

        /* ── FOOTER ── */
        .footer {
            background: #081929;
            padding: 32px 48px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid rgba(201,168,76,0.15);
            flex-wrap: wrap;
            gap: 16px;
        }
        .footer-logo {
            font-size: 18px;
            font-weight: 900;
            color: rgba(255,255,255,0.4);
            letter-spacing: 0.08em;
        }
        .footer-logo span { color: #C9A84C; }
        .footer-copy {
            font-size: 11px;
            color: rgba(255,255,255,0.25);
            font-weight: 400;
            letter-spacing: 0.05em;
        }
        .footer-tagline {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.25);
        }

        /* ── ROUTE ANIMATION ── */
        .route-path {
            stroke-dasharray: 800;
            stroke-dashoffset: 800;
            animation: drawRoute 3s ease forwards 0.3s;
        }
        .route-path-2 {
            stroke-dasharray: 500;
            stroke-dashoffset: 500;
            animation: drawRoute 2.5s ease forwards 1s;
        }
        .route-dot {
            opacity: 0;
            animation: fadeInDot 0.4s ease forwards;
        }
        .dot-a { animation-delay: 0.3s; }
        .dot-b { animation-delay: 1.8s; }
        .dot-c { animation-delay: 2.5s; }
        .dot-d { animation-delay: 3s; }
        @keyframes drawRoute { to { stroke-dashoffset: 0; } }
        @keyframes fadeInDot { to { opacity: 1; } }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        /* ── COVERAGE STRIP ── */
        .coverage-header {
            background: #0C2340;
            padding: 20px 48px 0;
        }
        .coverage-header-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.3);
            display: block;
        }
        .coverage-strip {
            background: #0C2340;
            padding: 12px 0 20px;
            display: flex;
            align-items: center;
            overflow: hidden;
        }
        .coverage-track {
            display: flex;
            gap: 32px;
            animation: scrollTrack 20s linear infinite;
            white-space: nowrap;
        }
        .coverage-city {
            font-size: 12px;
            font-weight: 700;
            color: rgba(255,255,255,0.45);
            letter-spacing: 0.1em;
            text-transform: uppercase;
            flex-shrink: 0;
        }
        .coverage-sep {
            color: #C9A84C;
            font-size: 10px;
            flex-shrink: 0;
            opacity: 0.5;
        }
        @keyframes scrollTrack {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }

        /* ── DIVIDER ── */
        .gold-line {
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(201,168,76,0.5), transparent);
            margin: 0 48px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
            .hero-title { font-size: 48px; }
            .fleet-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
            .services-grid { grid-template-columns: 1fr 1fr; }
            .why-grid { grid-template-columns: 1fr; }
            .why-visual { min-height: 260px; }
            .stats { grid-template-columns: repeat(2, 1fr); padding: 32px 24px; }
            .stat-item:nth-child(2) { border-right: none; }
            .stat-item:nth-child(3) { border-right: 1px solid #E8E6E1; border-top: 1px solid #E8E6E1; }
            .stat-item:nth-child(4) { border-top: 1px solid #E8E6E1; }
            .stat-item { padding: 24px 16px; }
        }

        @media (max-width: 768px) {
            .nav { padding: 0 20px; }
            .nav-links {
                position: absolute;
                top: 64px;
                left: 0;
                right: 0;
                background: #0A1E36;
                flex-direction: column;
                gap: 0;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.35s ease, padding 0.35s ease;
                padding: 0;
                border-bottom: 0px solid rgba(201,168,76,0.25);
            }
            .nav-links.open {
                max-height: 320px;
                padding: 8px 0 16px;
                border-bottom: 1px solid rgba(201,168,76,0.25);
            }
            .nav-links li { padding: 12px 24px; }
            .nav-links a { font-size: 13px; }
            .nav-cta { display: none; }
            .nav-burger { display: flex; }

            .hero {
                padding: 60px 24px 80px;
                min-height: auto;
                align-items: flex-start;
            }
            .hero-visual { display: none; }
            .hero-title { font-size: 38px; }
            .hero-subtitle { font-size: 14px; }
            .hero-content { max-width: 100%; }

            .section { padding: 64px 24px; }
            .section-title, .section-title-light { font-size: 28px; }
            .services-grid { grid-template-columns: 1fr; }
            .fleet-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .cta-section { padding: 64px 24px; }
            .cta-title { font-size: 30px; }
            .cta-sub { font-size: 14px; }
            .cta-actions { flex-direction: column; align-items: stretch; }
            .cta-actions button { width: 100%; }
            .footer { padding: 28px 24px; flex-direction: column; text-align: center; }
            .coverage-header { padding: 16px 24px 0; }
            .coverage-strip { padding: 8px 0 16px; }
            .gold-line { margin: 0 24px; }
        }

        @media (max-width: 480px) {
            .hero-title { font-size: 30px; }
            .hero-badge-text { font-size: 9px; }
            .hero-actions { flex-direction: column; align-items: stretch; }
            .hero-actions button { width: 100%; justify-content: center; }
            .btn-ghost { justify-content: center; }
            .fleet-grid { grid-template-columns: 1fr; }
            .stats { grid-template-columns: 1fr; }
            .stat-item { border-right: none !important; border-bottom: 1px solid #E8E6E1; padding: 20px 16px; }
            .stat-item:last-child { border-bottom: none; }
            .services-grid { gap: 0; }
        }

        /* ── MODALS ── */
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(8,25,41,0.85);
            backdrop-filter: blur(4px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-box {
            background: #fff;
            width: 100%;
            max-width: 680px;
            max-height: 90vh;
            overflow-y: auto;
            border-top: 4px solid #C9A84C;
            animation: modalIn 0.25s ease;
            scrollbar-width: thin;
        }
        .modal-box-sm { max-width: 480px; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .modal-header {
            background: #0C2340;
            padding: 24px 28px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
        }
        .modal-eyebrow {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #C9A84C;
            margin-bottom: 4px;
        }
        .modal-title {
            font-size: 20px;
            font-weight: 900;
            color: #fff;
            letter-spacing: -0.01em;
            margin: 0;
        }
        .modal-close {
            background: rgba(255,255,255,0.1);
            border: none;
            color: rgba(255,255,255,0.6);
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            flex-shrink: 0;
            transition: background 0.2s, color 0.2s;
        }
        .modal-close:hover { background: rgba(255,255,255,0.2); color: #fff; }

        .modal-form { padding: 28px; display: flex; flex-direction: column; gap: 16px; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .form-group { display: flex; flex-direction: column; gap: 6px; }

        .form-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #0C2340;
        }
        .req { color: #C9A84C; }

        .form-input {
            border: 1px solid #E8E6E1;
            background: #F7F5F2;
            padding: 11px 14px;
            font-size: 13px;
            font-family: 'Montserrat', sans-serif;
            color: #1A1A1A;
            outline: none;
            transition: border-color 0.2s, background 0.2s;
            width: 100%;
        }
        .form-input:focus { border-color: #C9A84C; background: #fff; }
        .form-input::placeholder { color: #B0B0B0; }

        .form-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238A8D8F' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }

        .form-textarea { resize: vertical; min-height: 96px; }

        .form-error {
            background: #FFF0F0;
            border: 1px solid #FFCCCC;
            color: #C0392B;
            padding: 10px 14px;
            font-size: 12px;
            font-weight: 600;
        }

        .form-submit {
            width: 100%;
            padding: 15px;
            font-size: 12px;
            margin-top: 4px;
        }
        .form-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

        .form-note {
            font-size: 11px;
            color: #8A8D8F;
            text-align: center;
            letter-spacing: 0.04em;
            margin-top: -4px;
        }

        .modal-success {
            padding: 48px 28px;
            text-align: center;
        }
        .success-icon {
            width: 56px;
            height: 56px;
            background: #C9A84C;
            color: #0C2340;
            font-size: 22px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }
        .modal-success h4 {
            font-size: 20px;
            font-weight: 900;
            color: #0C2340;
            margin-bottom: 10px;
        }
        .modal-success p {
            font-size: 14px;
            color: #8A8D8F;
            line-height: 1.65;
            max-width: 320px;
            margin: 0 auto;
        }

        @media (max-width: 600px) {
            .modal-box { max-height: 100vh; border-radius: 0; }
            .form-row { grid-template-columns: 1fr; }
            .modal-form { padding: 20px; }
        }
    `],
    template: `
        <div class="lp">

            <!-- NAV -->
            <nav class="nav">
                <div class="nav-logo">LEC<span>MA</span></div>

                <button class="nav-burger" [class.open]="menuOpen" (click)="toggleMenu()" aria-label="Menu">
                    <span></span><span></span><span></span>
                </button>

                <ul class="nav-links" [class.open]="menuOpen">
                    <li><a (click)="scrollTo('servicios')">Servicios</a></li>
                    <li><a (click)="scrollTo('flota')">Flota</a></li>
                    <li><a (click)="scrollTo('empresa')">Empresa</a></li>
                    <li><a (click)="scrollTo('contacto')">Contacto</a></li>
                </ul>

                <button class="nav-cta" (click)="openQuote()">Solicitar cotización</button>
            </nav>

            <!-- HERO -->
            <section class="hero">
                <div class="hero-content">
                    <div class="hero-badge">
                        <div class="hero-badge-dot"></div>
                        <span class="hero-badge-text">Servicio activo · Buenos Aires · Argentina</span>
                    </div>
                    <p class="hero-eyebrow">Movilidad corporativa de élite</p>
                    <h1 class="hero-title">
                        Movilidad ejecutiva<br>
                        <em>sin límites</em><br>
                        ni fronteras.
                    </h1>
                    <p class="hero-subtitle">
                        Conectamos <strong>Buenos Aires</strong>, Rosario, San Nicolás y todo el país.
                        También cubrimos países limítrofes. Movilidad profesional diseñada para empresas que no se detienen.
                    </p>
                    <div class="hero-actions">
                        <button class="btn-primary" (click)="openQuote()">Solicitar servicio</button>
                        <button class="btn-ghost" (click)="scrollToServices()">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
                                <path d="M6 5.5l4 2.5-4 2.5V5.5z" fill="rgba(255,255,255,0.6)"/>
                            </svg>
                            Ver nuestros servicios
                        </button>
                    </div>
                </div>

                <!-- Animated route network SVG -->
                <div class="hero-visual">
                    <svg class="hero-route" viewBox="0 0 480 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <!-- Grid lines -->
                        <line x1="0" y1="100" x2="480" y2="100" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                        <line x1="0" y1="200" x2="480" y2="200" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                        <line x1="0" y1="300" x2="480" y2="300" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                        <line x1="0" y1="400" x2="480" y2="400" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                        <line x1="120" y1="0" x2="120" y2="500" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                        <line x1="240" y1="0" x2="240" y2="500" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                        <line x1="360" y1="0" x2="360" y2="500" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>

                        <!-- Main route: Buenos Aires → Rosario → San Nicolás → Córdoba -->
                        <path class="route-path"
                            d="M 80 420 C 100 380, 130 320, 160 270 C 190 220, 220 180, 260 140 C 300 100, 340 70, 390 50"
                            stroke="#C9A84C" stroke-width="1.5" stroke-linecap="round" fill="none"/>

                        <!-- Branch route to Mendoza/NOA -->
                        <path class="route-path-2"
                            d="M 260 140 C 300 130, 350 120, 420 90"
                            stroke="rgba(201,168,76,0.5)" stroke-width="1" stroke-linecap="round" stroke-dasharray="4 4" fill="none"/>

                        <!-- Branch route to coast -->
                        <path class="route-path-2"
                            d="M 160 270 C 180 290, 220 310, 260 330"
                            stroke="rgba(201,168,76,0.5)" stroke-width="1" stroke-linecap="round" stroke-dasharray="4 4" fill="none"/>

                        <!-- City dots -->
                        <circle cx="80" cy="420" r="7" fill="#C9A84C" class="route-dot dot-a"/>
                        <circle cx="80" cy="420" r="16" stroke="#C9A84C" stroke-width="1" opacity="0.3" class="route-dot dot-a"/>
                        <text x="96" y="416" class="city-label" style="font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;fill:rgba(255,255,255,0.5);letter-spacing:0.08em;">BUENOS AIRES</text>

                        <circle cx="160" cy="270" r="5" fill="rgba(255,255,255,0.7)" class="route-dot dot-b"/>
                        <circle cx="160" cy="270" r="12" stroke="white" stroke-width="0.5" opacity="0.2" class="route-dot dot-b"/>
                        <text x="172" y="266" class="city-label" style="font-family:'Montserrat',sans-serif;font-size:9px;font-weight:700;fill:rgba(255,255,255,0.4);letter-spacing:0.08em;">SAN NICOLÁS</text>

                        <circle cx="260" cy="140" r="5" fill="rgba(255,255,255,0.7)" class="route-dot dot-c"/>
                        <circle cx="260" cy="140" r="12" stroke="white" stroke-width="0.5" opacity="0.2" class="route-dot dot-c"/>
                        <text x="272" y="136" class="city-label" style="font-family:'Montserrat',sans-serif;font-size:9px;font-weight:700;fill:rgba(255,255,255,0.4);letter-spacing:0.08em;">ROSARIO</text>

                        <circle cx="390" cy="50" r="6" fill="white" class="route-dot dot-d"/>
                        <circle cx="390" cy="50" r="14" stroke="white" stroke-width="0.5" opacity="0.15" class="route-dot dot-d"/>
                        <text x="405" y="46" class="city-label" style="font-family:'Montserrat',sans-serif;font-size:9px;font-weight:700;fill:rgba(255,255,255,0.4);letter-spacing:0.08em;">CÓRDOBA</text>
                    </svg>
                </div>
            </section>

            <!-- COVERAGE TICKER -->
            <div class="coverage-header">
                <span class="coverage-header-label">Cobertura</span>
            </div>
            <div class="coverage-strip">
                <div class="coverage-track">
                    <span class="coverage-city">Buenos Aires</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Rosario</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">San Nicolás</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Córdoba</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Mendoza</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Tucumán</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Neuquén</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Uruguay</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Chile</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Paraguay</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Bolivia</span>
                    <span class="coverage-sep">·</span>
                    <!-- Duplicate for seamless loop -->
                    <span class="coverage-city">Buenos Aires</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Rosario</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">San Nicolás</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Córdoba</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Mendoza</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Tucumán</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Neuquén</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Uruguay</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Chile</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Paraguay</span>
                    <span class="coverage-sep">·</span>
                    <span class="coverage-city">Bolivia</span>
                    <span class="coverage-sep">·</span>
                </div>
            </div>

            <!-- STATS STRIP -->
            <div class="stats" id="stats-section">
                <div class="stat-item aos d1">
                    <div class="stat-number">{{ stat0 }}<span>k</span></div>
                    <div class="stat-label">km/año recorridos</div>
                </div>
                <div class="stat-item aos d2">
                    <div class="stat-number">{{ stat1 }}<span>%</span></div>
                    <div class="stat-label">Puntualidad comprometida</div>
                </div>
                <div class="stat-item aos d3">
                    <div class="stat-number">{{ stat2 }}<span>+</span></div>
                    <div class="stat-label">Modelos de flota premium</div>
                </div>
                <div class="stat-item aos d4">
                    <div class="stat-number">{{ stat3 }}<span>/7</span></div>
                    <div class="stat-label">Coordinación operativa</div>
                </div>
            </div>

            <!-- SERVICIOS -->
            <section class="section" id="servicios">
                <div class="section-header aos">
                    <p class="section-eyebrow">Lo que ofrecemos</p>
                    <h2 class="section-title">Servicios diseñados para la operación corporativa</h2>
                </div>
                <div class="services-grid">

                    <div class="service-card aos d1">
                        <svg class="service-icon" viewBox="0 0 44 44" fill="none">
                            <!-- Route indicator -->
                            <circle cx="5" cy="9" r="2.5" fill="#C9A84C" opacity="0.9"/>
                            <line x1="7.5" y1="9" x2="33.5" y2="9" stroke="#C9A84C" stroke-width="1" stroke-dasharray="3 2.5" opacity="0.5"/>
                            <circle cx="37" cy="9" r="3" fill="#C9A84C"/>
                            <circle cx="37" cy="9" r="1.2" fill="#fff"/>
                            <!-- Car body -->
                            <path d="M3 32 L3 26 Q3.5 24.5 5.5 24.5 L9 24.5 L14 17 Q15.5 15 18 15 L26 15 Q28.5 15 30 17 L35 24.5 L39 24.5 Q41 24.5 41 26 L41 32 Z" stroke="#0C2340" stroke-width="1.5" fill="rgba(12,35,64,0.06)" stroke-linejoin="round"/>
                            <!-- Windows -->
                            <path d="M14 24.5 L17.5 17 L26.5 17 L30 24.5 Z" fill="rgba(201,168,76,0.13)" stroke="#0C2340" stroke-width="1"/>
                            <line x1="22" y1="17" x2="22" y2="24.5" stroke="#8A8D8F" stroke-width="0.9"/>
                            <!-- Wheels -->
                            <circle cx="12.5" cy="34" r="4" stroke="#C9A84C" stroke-width="1.5" fill="rgba(201,168,76,0.08)"/>
                            <circle cx="12.5" cy="34" r="1.6" fill="#C9A84C" opacity="0.8"/>
                            <circle cx="31.5" cy="34" r="4" stroke="#C9A84C" stroke-width="1.5" fill="rgba(201,168,76,0.08)"/>
                            <circle cx="31.5" cy="34" r="1.6" fill="#C9A84C" opacity="0.8"/>
                            <!-- Headlight -->
                            <rect x="39.5" y="26" width="3" height="2.5" rx="0.8" fill="#C9A84C" opacity="0.75"/>
                        </svg>
                        <div class="service-name">Traslados Buenos Aires (Principal)</div>
                        <div class="service-desc">Nuestro servicio más activo. AMBA, Rosario, San Nicolás y principales corredores industriales. Servicio diario con horarios acordados.</div>
                        <div class="service-destinations">
                            <span class="dest-tag">AMBA</span>
                            <span class="dest-tag">Rosario</span>
                            <span class="dest-tag">San Nicolás</span>
                            <span class="dest-tag">ZIM Campana</span>
                        </div>
                        <span class="service-tag">Servicio principal →</span>
                    </div>

                    <div class="service-card aos d2">
                        <svg class="service-icon" viewBox="0 0 44 44" fill="none">
                            <!-- Hub center -->
                            <circle cx="22" cy="22" r="4.5" fill="#C9A84C" opacity="0.9"/>
                            <circle cx="22" cy="22" r="2" fill="#fff"/>
                            <!-- Spokes -->
                            <line x1="22" y1="5" x2="22" y2="17.5" stroke="#0C2340" stroke-width="1.2" stroke-dasharray="3 2"/>
                            <line x1="22" y1="26.5" x2="22" y2="39" stroke="#0C2340" stroke-width="1.2" stroke-dasharray="3 2"/>
                            <line x1="5" y1="22" x2="17.5" y2="22" stroke="#0C2340" stroke-width="1.2" stroke-dasharray="3 2"/>
                            <line x1="26.5" y1="22" x2="39" y2="22" stroke="#0C2340" stroke-width="1.2" stroke-dasharray="3 2"/>
                            <line x1="10" y1="10" x2="17.5" y2="17.5" stroke="#C9A84C" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
                            <line x1="26.5" y1="26.5" x2="34" y2="34" stroke="#C9A84C" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
                            <line x1="34" y1="10" x2="26.5" y2="17.5" stroke="#C9A84C" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
                            <line x1="10" y1="34" x2="17.5" y2="26.5" stroke="#C9A84C" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
                            <!-- Peripheral nodes -->
                            <circle cx="22" cy="5" r="2.5" stroke="#0C2340" stroke-width="1.2" fill="rgba(12,35,64,0.08)"/>
                            <circle cx="22" cy="39" r="2.5" stroke="#0C2340" stroke-width="1.2" fill="rgba(12,35,64,0.08)"/>
                            <circle cx="5" cy="22" r="2.5" stroke="#0C2340" stroke-width="1.2" fill="rgba(12,35,64,0.08)"/>
                            <circle cx="39" cy="22" r="2.5" stroke="#0C2340" stroke-width="1.2" fill="rgba(12,35,64,0.08)"/>
                            <circle cx="10" cy="10" r="2" stroke="#C9A84C" stroke-width="1" fill="rgba(201,168,76,0.08)" opacity="0.6"/>
                            <circle cx="34" cy="34" r="2" stroke="#C9A84C" stroke-width="1" fill="rgba(201,168,76,0.08)" opacity="0.6"/>
                            <circle cx="34" cy="10" r="2" stroke="#C9A84C" stroke-width="1" fill="rgba(201,168,76,0.08)" opacity="0.6"/>
                            <circle cx="10" cy="34" r="2" stroke="#C9A84C" stroke-width="1" fill="rgba(201,168,76,0.08)" opacity="0.6"/>
                        </svg>
                        <div class="service-name">Cobertura nacional</div>
                        <div class="service-desc">Interior del país sin restricciones. NOA, NEA, Cuyo, Patagonia y todos los destinos corporativos. Planificamos el traslado que tu empresa necesite.</div>
                        <div class="service-destinations">
                            <span class="dest-tag">Córdoba</span>
                            <span class="dest-tag">Mendoza</span>
                            <span class="dest-tag">Tucumán</span>
                            <span class="dest-tag">Neuquén</span>
                        </div>
                        <span class="service-tag">Todo Argentina →</span>
                    </div>

                    <div class="service-card aos d3">
                        <svg class="service-icon" viewBox="0 0 44 44" fill="none">
                            <!-- Globe outline -->
                            <circle cx="22" cy="22" r="17" stroke="#0C2340" stroke-width="1.5"/>
                            <!-- Meridian ellipse -->
                            <ellipse cx="22" cy="22" rx="9" ry="17" stroke="#8A8D8F" stroke-width="0.8" opacity="0.45"/>
                            <!-- Vertical center line -->
                            <line x1="22" y1="5" x2="22" y2="39" stroke="#8A8D8F" stroke-width="0.8" opacity="0.3"/>
                            <!-- Parallels -->
                            <path d="M6.5 15 Q22 19.5 37.5 15" stroke="#8A8D8F" stroke-width="0.8" opacity="0.35" fill="none"/>
                            <line x1="5" y1="22" x2="39" y2="22" stroke="#8A8D8F" stroke-width="0.8" opacity="0.35"/>
                            <path d="M6.5 29 Q22 24.5 37.5 29" stroke="#8A8D8F" stroke-width="0.8" opacity="0.35" fill="none"/>
                            <!-- Route arc across globe -->
                            <path d="M9 28 Q16 13 35 16" stroke="#C9A84C" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                            <!-- Origin dot -->
                            <circle cx="9" cy="28" r="2.8" fill="#C9A84C" opacity="0.85"/>
                            <!-- Destination dot -->
                            <circle cx="35" cy="16" r="2.8" fill="#C9A84C" opacity="0.85"/>
                            <circle cx="35" cy="16" r="1.1" fill="#fff"/>
                        </svg>
                        <div class="service-name">Países limítrofes</div>
                        <div class="service-desc">Cruzamos fronteras con toda la documentación en orden. Uruguay, Chile, Paraguay y Bolivia para traslados internacionales corporativos.</div>
                        <div class="service-destinations">
                            <span class="dest-tag">Uruguay</span>
                            <span class="dest-tag">Chile</span>
                            <span class="dest-tag">Paraguay</span>
                            <span class="dest-tag">Bolivia</span>
                        </div>
                        <span class="service-tag">Internacional →</span>
                    </div>

                </div>
            </section>

            <div class="gold-line"></div>

            <!-- FLOTA -->
            <section class="section section-alt" id="flota">
                <div class="section-header aos">
                    <p class="section-eyebrow">Nuestra flota</p>
                    <h2 class="section-title">Vehículos premium para cada necesidad</h2>
                </div>
                <div class="fleet-grid">

                    <div class="fleet-card aos d1">
                        <!-- Toyota Corolla sedan icon -->
                        <svg class="fleet-car-icon" width="80" height="40" viewBox="0 0 80 40" fill="none">
                            <!-- Body (filled) -->
                            <path d="M7 30 L7 24 L13 24 L18 15 Q20 13 23 13 L55 13 Q58 13 60 15 L65 24 L73 24 L73 30 Z" fill="#0C2340"/>
                            <!-- Glass area -->
                            <path d="M19 24 L22 14.5 L54 14.5 L58 24 Z" fill="#1E3F6E"/>
                            <!-- Front window -->
                            <path d="M22 23 L24.5 15.5 L37 15.5 L37 23 Z" fill="rgba(201,168,76,0.15)"/>
                            <!-- Rear window -->
                            <path d="M39 15.5 L52.5 15.5 L56 23 L39 23 Z" fill="rgba(201,168,76,0.15)"/>
                            <!-- B-pillar -->
                            <rect x="37" y="15" width="2" height="8.5" fill="#0C2340"/>
                            <!-- Door line -->
                            <line x1="38" y1="24" x2="38" y2="30" stroke="#162d4d" stroke-width="1.5"/>
                            <!-- Wheel arch cutouts -->
                            <circle cx="21" cy="31" r="8" fill="#F7F5F2"/>
                            <circle cx="59" cy="31" r="8" fill="#F7F5F2"/>
                            <!-- Wheels -->
                            <circle cx="21" cy="31" r="6.5" fill="#1a1a2e" stroke="#C9A84C" stroke-width="1.5"/>
                            <circle cx="21" cy="31" r="3.5" stroke="#C9A84C" stroke-width="0.7" fill="none" opacity="0.4"/>
                            <circle cx="21" cy="31" r="1.8" fill="#C9A84C" opacity="0.6"/>
                            <circle cx="59" cy="31" r="6.5" fill="#1a1a2e" stroke="#C9A84C" stroke-width="1.5"/>
                            <circle cx="59" cy="31" r="3.5" stroke="#C9A84C" stroke-width="0.7" fill="none" opacity="0.4"/>
                            <circle cx="59" cy="31" r="1.8" fill="#C9A84C" opacity="0.6"/>
                            <!-- Headlight -->
                            <rect x="71" y="25" width="3" height="2.5" rx="0.8" fill="#C9A84C" opacity="0.7"/>
                            <!-- Taillight -->
                            <rect x="6" y="25" width="2.5" height="2.5" rx="0.5" fill="#C9A84C" opacity="0.35"/>
                        </svg>
                        <div class="fleet-model">Toyota Corolla</div>
                        <div class="fleet-type">Sedán ejecutivo</div>
                        <div class="fleet-cap">Hasta 4 pasajeros</div>
                    </div>

                    <div class="fleet-card aos d2">
                        <!-- Honda Civic sedan icon (sportier profile) -->
                        <svg class="fleet-car-icon" width="80" height="40" viewBox="0 0 80 40" fill="none">
                            <!-- Body (lower/sportier roofline) -->
                            <path d="M7 30 L7 24 L14 24 L20 13 Q22.5 11 26 11 L52 11 Q55.5 11 58 13 L65 24 L73 24 L73 30 Z" fill="#0C2340"/>
                            <!-- Glass area -->
                            <path d="M21 24 L25 12.5 L53 12.5 L58 24 Z" fill="#1E3F6E"/>
                            <!-- Front window -->
                            <path d="M25 23 L28 13.5 L39 13.5 L39 23 Z" fill="rgba(201,168,76,0.15)"/>
                            <!-- Rear window -->
                            <path d="M41 13.5 L51 13.5 L55.5 23 L41 23 Z" fill="rgba(201,168,76,0.15)"/>
                            <!-- B-pillar -->
                            <rect x="39" y="13" width="2" height="10.5" fill="#0C2340"/>
                            <!-- Door line -->
                            <line x1="40" y1="24" x2="40" y2="30" stroke="#162d4d" stroke-width="1.5"/>
                            <!-- Sport accent line -->
                            <line x1="30" y1="27.5" x2="62" y2="27.5" stroke="#C9A84C" stroke-width="0.6" opacity="0.2"/>
                            <!-- Wheel arch cutouts -->
                            <circle cx="22" cy="31" r="8" fill="#F7F5F2"/>
                            <circle cx="59" cy="31" r="8" fill="#F7F5F2"/>
                            <!-- Wheels -->
                            <circle cx="22" cy="31" r="6.5" fill="#1a1a2e" stroke="#C9A84C" stroke-width="1.5"/>
                            <circle cx="22" cy="31" r="3.5" stroke="#C9A84C" stroke-width="0.7" fill="none" opacity="0.4"/>
                            <circle cx="22" cy="31" r="1.8" fill="#C9A84C" opacity="0.6"/>
                            <circle cx="59" cy="31" r="6.5" fill="#1a1a2e" stroke="#C9A84C" stroke-width="1.5"/>
                            <circle cx="59" cy="31" r="3.5" stroke="#C9A84C" stroke-width="0.7" fill="none" opacity="0.4"/>
                            <circle cx="59" cy="31" r="1.8" fill="#C9A84C" opacity="0.6"/>
                            <!-- Headlight -->
                            <rect x="71" y="24.5" width="3" height="2.5" rx="0.8" fill="#C9A84C" opacity="0.7"/>
                            <!-- Taillight -->
                            <rect x="6" y="24.5" width="2.5" height="2.5" rx="0.5" fill="#C9A84C" opacity="0.35"/>
                        </svg>
                        <div class="fleet-model">Honda Civic</div>
                        <div class="fleet-type">Sedán premium</div>
                        <div class="fleet-cap">Hasta 4 pasajeros</div>
                    </div>

                    <div class="fleet-card aos d3">
                        <!-- Toyota Hiace van icon -->
                        <svg class="fleet-car-icon" width="80" height="40" viewBox="0 0 80 40" fill="none">
                            <!-- Van body (taller, boxy) -->
                            <path d="M5 31 L5 11 Q5 10 6 10 L56 10 L63 10 L69 15 L75 15 L75 31 Z" fill="#0C2340"/>
                            <!-- Driver cabin glass -->
                            <path d="M57 15 L63 10.5 L69 10.5 L69 15 Z" fill="#1E3F6E"/>
                            <path d="M57.5 14.5 L63 11 L67.5 11 L67.5 14.5 Z" fill="rgba(201,168,76,0.15)"/>
                            <!-- Passenger windows -->
                            <rect x="9" y="13.5" width="13" height="8" rx="0.8" fill="rgba(201,168,76,0.14)" stroke="#1E3F6E" stroke-width="0.8"/>
                            <rect x="25" y="13.5" width="13" height="8" rx="0.8" fill="rgba(201,168,76,0.14)" stroke="#1E3F6E" stroke-width="0.8"/>
                            <rect x="41" y="13.5" width="12" height="8" rx="0.8" fill="rgba(201,168,76,0.14)" stroke="#1E3F6E" stroke-width="0.8"/>
                            <!-- Sliding door lines -->
                            <line x1="23" y1="21.5" x2="23" y2="31" stroke="#162d4d" stroke-width="1.5"/>
                            <line x1="39" y1="21.5" x2="39" y2="31" stroke="#162d4d" stroke-width="1.5"/>
                            <!-- Door handle -->
                            <line x1="27" y1="27" x2="31" y2="27" stroke="#C9A84C" stroke-width="0.8" opacity="0.45"/>
                            <!-- Wheel arch cutouts -->
                            <circle cx="17" cy="32" r="8" fill="#F7F5F2"/>
                            <circle cx="62" cy="32" r="8" fill="#F7F5F2"/>
                            <!-- Wheels -->
                            <circle cx="17" cy="32" r="6.5" fill="#1a1a2e" stroke="#C9A84C" stroke-width="1.5"/>
                            <circle cx="17" cy="32" r="3.5" stroke="#C9A84C" stroke-width="0.7" fill="none" opacity="0.4"/>
                            <circle cx="17" cy="32" r="1.8" fill="#C9A84C" opacity="0.6"/>
                            <circle cx="62" cy="32" r="6.5" fill="#1a1a2e" stroke="#C9A84C" stroke-width="1.5"/>
                            <circle cx="62" cy="32" r="3.5" stroke="#C9A84C" stroke-width="0.7" fill="none" opacity="0.4"/>
                            <circle cx="62" cy="32" r="1.8" fill="#C9A84C" opacity="0.6"/>
                            <!-- Headlight -->
                            <rect x="73" y="16.5" width="3" height="3" rx="0.8" fill="#C9A84C" opacity="0.7"/>
                            <!-- Taillight -->
                            <rect x="4" y="16.5" width="2.5" height="3" rx="0.5" fill="#C9A84C" opacity="0.35"/>
                        </svg>
                        <div class="fleet-model">Toyota Hiace</div>
                        <div class="fleet-type">Van corporativa</div>
                        <div class="fleet-cap">Hasta 8 pasajeros</div>
                    </div>

                    <div class="fleet-card aos d4">
                        <!-- Expandable fleet icon -->
                        <svg class="fleet-car-icon" width="80" height="40" viewBox="0 0 80 40" fill="none">
                            <!-- Background car silhouette (faded) -->
                            <path d="M3 28 L3 23 L7.5 23 L11 17 Q12.5 15.5 14.5 15.5 L28.5 15.5 Q30.5 15.5 32 17 L35.5 23 L40 23 L40 28 Z" fill="#0C2340" opacity="0.15"/>
                            <circle cx="10" cy="29.5" r="4.5" fill="#0C2340" opacity="0.1" stroke="#C9A84C" stroke-width="1" opacity-stroke="0.3"/>
                            <circle cx="33" cy="29.5" r="4.5" fill="#0C2340" opacity="0.1" stroke="#C9A84C" stroke-width="1" opacity-stroke="0.3"/>
                            <!-- Plus badge -->
                            <circle cx="58" cy="19" r="14" stroke="#C9A84C" stroke-width="1.5" fill="rgba(201,168,76,0.06)"/>
                            <circle cx="58" cy="19" r="10" stroke="#C9A84C" stroke-width="0.6" fill="none" opacity="0.3" stroke-dasharray="3 3"/>
                            <line x1="58" y1="12" x2="58" y2="26" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"/>
                            <line x1="51" y1="19" x2="65" y2="19" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <div class="fleet-model">Y más</div>
                        <div class="fleet-type">Según necesidad</div>
                        <div class="fleet-cap">Flota ampliable</div>
                    </div>

                </div>
            </section>

            <!-- WHY LECMA -->
            <section class="section" id="empresa">
                <div class="why-grid">
                    <div class="why-visual aos-left">
                        <svg width="260" height="300" viewBox="0 0 260 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Top city -->
                            <text x="130" y="38" text-anchor="middle" style="font-family:'Montserrat',sans-serif;font-size:11px;font-weight:800;fill:#fff;letter-spacing:0.05em;">BUENOS AIRES</text>
                            <circle cx="130" cy="54" r="5" fill="#C9A84C"/>
                            <circle cx="130" cy="54" r="12" stroke="#C9A84C" stroke-width="1" opacity="0.2"/>

                            <!-- Line down -->
                            <line x1="130" y1="66" x2="130" y2="110" stroke="rgba(201,168,76,0.3)" stroke-width="1" stroke-dasharray="4 4"/>

                            <!-- km label -->
                            <text x="130" y="92" text-anchor="middle" style="font-family:'Montserrat',sans-serif;font-size:26px;font-weight:900;fill:#C9A84C;">360k</text>
                            <text x="130" y="108" text-anchor="middle" style="font-family:'Montserrat',sans-serif;font-size:9px;font-weight:600;fill:rgba(255,255,255,0.35);letter-spacing:0.12em;">km/año promedio</text>

                            <circle cx="130" cy="122" r="4" fill="rgba(255,255,255,0.5)"/>

                            <!-- Branch lines -->
                            <line x1="130" y1="122" x2="60" y2="172" stroke="rgba(201,168,76,0.2)" stroke-width="1" stroke-dasharray="3 3"/>
                            <line x1="130" y1="122" x2="130" y2="187" stroke="rgba(201,168,76,0.3)" stroke-width="1" stroke-dasharray="4 4"/>
                            <line x1="130" y1="122" x2="200" y2="172" stroke="rgba(201,168,76,0.2)" stroke-width="1" stroke-dasharray="3 3"/>

                            <!-- City nodes -->
                            <circle cx="60" cy="177" r="4" fill="rgba(255,255,255,0.4)"/>
                            <text x="60" y="192" text-anchor="middle" style="font-family:'Montserrat',sans-serif;font-size:9px;font-weight:700;fill:rgba(255,255,255,0.45);letter-spacing:0.05em;">ROSARIO</text>

                            <circle cx="130" cy="192" r="4" fill="rgba(255,255,255,0.4)"/>
                            <text x="130" y="207" text-anchor="middle" style="font-family:'Montserrat',sans-serif;font-size:9px;font-weight:700;fill:rgba(255,255,255,0.45);letter-spacing:0.05em;">SAN NICOLÁS</text>

                            <circle cx="200" cy="177" r="4" fill="rgba(255,255,255,0.4)"/>
                            <text x="200" y="192" text-anchor="middle" style="font-family:'Montserrat',sans-serif;font-size:9px;font-weight:700;fill:rgba(255,255,255,0.45);letter-spacing:0.05em;">CÓRDOBA</text>

                            <!-- International label -->
                            <line x1="60" y1="207" x2="200" y2="207" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
                            <text x="130" y="230" text-anchor="middle" style="font-family:'Montserrat',sans-serif;font-size:9px;font-weight:600;fill:rgba(255,255,255,0.25);letter-spacing:0.1em;text-transform:uppercase;">+ todo el país</text>
                            <text x="130" y="246" text-anchor="middle" style="font-family:'Montserrat',sans-serif;font-size:9px;font-weight:600;fill:rgba(255,255,255,0.2);letter-spacing:0.1em;text-transform:uppercase;">y países limítrofes</text>

                            <text x="130" y="282" text-anchor="middle" style="font-family:'Montserrat',sans-serif;font-size:9px;font-weight:700;fill:#C9A84C;letter-spacing:0.1em;">LECMA · MOVILIDAD CORPORATIVA</text>
                        </svg>
                    </div>

                    <div class="aos-right">
                        <div class="section-header" style="margin-bottom: 40px;">
                            <p class="section-eyebrow">Por qué LECMA</p>
                            <h2 class="section-title">Conocimiento, flota y gestión en un solo proveedor</h2>
                        </div>
                        <div class="why-points">
                            <div class="why-point aos d1">
                                <span class="why-number">01</span>
                                <div>
                                    <div class="why-point-title">Conocemos el país</div>
                                    <div class="why-point-text">Buenos Aires, Rosario, San Nicolás y más. Conocemos los tiempos reales, condiciones viales y alternativas en cada corredor.</div>
                                </div>
                            </div>
                            <div class="why-point aos d2">
                                <span class="why-number">02</span>
                                <div>
                                    <div class="why-point-title">Flota versátil y premium</div>
                                    <div class="why-point-text">Toyota Corolla, Honda Civic, Toyota Hiace y más. Elegimos el vehículo adecuado para cada tipo de traslado y cantidad de pasajeros.</div>
                                </div>
                            </div>
                            <div class="why-point aos d3">
                                <span class="why-number">03</span>
                                <div>
                                    <div class="why-point-title">360.000 km anuales de experiencia</div>
                                    <div class="why-point-text">Promediamos 360 mil kilómetros por año. Detrás de cada traslado hay un equipo logístico que gestiona, coordina y responde.</div>
                                </div>
                            </div>
                            <div class="why-point aos d4">
                                <span class="why-number">04</span>
                                <div>
                                    <div class="why-point-title">Discreción y puntualidad garantizadas</div>
                                    <div class="why-point-text">Tus pasajeros son ejecutivos. Silencio cuando hace falta, puntualidad siempre, y trato que cuida la imagen de tu empresa en cada viaje.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- CTA FINAL -->
            <section class="cta-section" id="contacto">
                <p class="cta-eyebrow aos">Sumá a LECMA a tu empresa</p>
                <h2 class="cta-title aos d1">Empezá sin complicaciones</h2>
                <p class="cta-sub aos d2">Contanos cuántas personas, qué días y qué horarios. En 24 horas te enviamos una propuesta a medida.</p>
                <div class="cta-actions aos d3">
                    <button class="btn-primary" (click)="openQuote()">Solicitar cotización</button>
                    <button class="btn-outline" (click)="openContact()">Hablar con el equipo</button>
                </div>
            </section>

            <!-- FOOTER -->
            <footer class="footer">
                <div class="footer-logo">LEC<span>MA</span></div>
                <span class="footer-copy">© 2025 LECMA · Buenos Aires, Argentina</span>
                <span class="footer-tagline">Movilidad corporativa profesional</span>
            </footer>

        </div>

        <!-- ── MODAL: COTIZACIÓN ── -->
        @if (quoteOpen) {
        <div class="modal-overlay" (click)="closeQuote()">
            <div class="modal-box" (click)="$event.stopPropagation()">
                <div class="modal-header">
                    <div>
                        <p class="modal-eyebrow">Solicitud de cotización</p>
                        <h3 class="modal-title">Contanos sobre tu empresa</h3>
                    </div>
                    <button class="modal-close" (click)="closeQuote()" aria-label="Cerrar">✕</button>
                </div>

                @if (quoteSuccess) {
                <div class="modal-success">
                    <div class="success-icon">✓</div>
                    <h4>¡Cotización enviada!</h4>
                    <p>Recibimos tu solicitud. En las próximas 24 horas te contactamos con una propuesta a medida.</p>
                    <button class="btn-primary" style="margin-top:24px;width:100%;" (click)="closeQuote()">Cerrar</button>
                </div>
                } @else {
                <form class="modal-form" (ngSubmit)="submitQuote()">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Nombre completo <span class="req">*</span></label>
                            <input class="form-input" type="text" placeholder="Tu nombre" [(ngModel)]="quote.nombre" name="qNombre"/>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Empresa <span class="req">*</span></label>
                            <input class="form-input" type="text" placeholder="Nombre de la empresa" [(ngModel)]="quote.empresa" name="qEmpresa"/>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Email corporativo <span class="req">*</span></label>
                            <input class="form-input" type="email" placeholder="email@empresa.com" [(ngModel)]="quote.email" name="qEmail"/>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Teléfono</label>
                            <input class="form-input" type="tel" placeholder="+54 11 0000-0000" [(ngModel)]="quote.telefono" name="qTelefono"/>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Origen del traslado <span class="req">*</span></label>
                            <input class="form-input" type="text" placeholder="Ej: Buenos Aires" [(ngModel)]="quote.origen" name="qOrigen"/>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Destino <span class="req">*</span></label>
                            <input class="form-input" type="text" placeholder="Ej: Rosario" [(ngModel)]="quote.destino" name="qDestino"/>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Cantidad de pasajeros <span class="req">*</span></label>
                            <select class="form-input form-select" [(ngModel)]="quote.pasajeros" name="qPasajeros">
                                <option value="" disabled>Seleccioná</option>
                                <option>1 - 2 pasajeros</option>
                                <option>3 - 4 pasajeros</option>
                                <option>5 - 8 pasajeros</option>
                                <option>9+ pasajeros (múltiples vehículos)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Frecuencia <span class="req">*</span></label>
                            <select class="form-input form-select" [(ngModel)]="quote.frecuencia" name="qFrecuencia">
                                <option value="" disabled>Seleccioná</option>
                                <option>Diaria</option>
                                <option>Semanal</option>
                                <option>Mensual</option>
                                <option>Traslado puntual</option>
                                <option>A definir</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notas adicionales</label>
                        <textarea class="form-input form-textarea" placeholder="Horarios estimados, días de la semana, requerimientos especiales..." [(ngModel)]="quote.mensaje" name="qMensaje"></textarea>
                    </div>
                    @if (quoteError) {
                    <div class="form-error">{{ quoteError }}</div>
                    }
                    <button class="btn-primary form-submit" type="submit" [disabled]="quoteLoading">
                        {{ quoteLoading ? 'Enviando...' : 'Enviar solicitud' }}
                    </button>
                    <p class="form-note">Respondemos en menos de 24 horas hábiles.</p>
                </form>
                }
            </div>
        </div>
        }

        <!-- ── MODAL: CONTACTO ── -->
        @if (contactOpen) {
        <div class="modal-overlay" (click)="closeContact()">
            <div class="modal-box modal-box-sm" (click)="$event.stopPropagation()">
                <div class="modal-header">
                    <div>
                        <p class="modal-eyebrow">Contacto directo</p>
                        <h3 class="modal-title">Hablemos</h3>
                    </div>
                    <button class="modal-close" (click)="closeContact()" aria-label="Cerrar">✕</button>
                </div>

                @if (contactSuccess) {
                <div class="modal-success">
                    <div class="success-icon">✓</div>
                    <h4>¡Mensaje enviado!</h4>
                    <p>Recibimos tu consulta. En breve nos ponemos en contacto.</p>
                    <button class="btn-primary" style="margin-top:24px;width:100%;" (click)="closeContact()">Cerrar</button>
                </div>
                } @else {
                <form class="modal-form" (ngSubmit)="submitContact()">
                    <div class="form-group">
                        <label class="form-label">Nombre <span class="req">*</span></label>
                        <input class="form-input" type="text" placeholder="Tu nombre" [(ngModel)]="contact.nombre" name="cNombre"/>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Email <span class="req">*</span></label>
                            <input class="form-input" type="email" placeholder="tu@email.com" [(ngModel)]="contact.email" name="cEmail"/>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Teléfono</label>
                            <input class="form-input" type="tel" placeholder="+54 11 0000-0000" [(ngModel)]="contact.telefono" name="cTelefono"/>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Mensaje <span class="req">*</span></label>
                        <textarea class="form-input form-textarea" placeholder="¿En qué podemos ayudarte?" [(ngModel)]="contact.mensaje" name="cMensaje"></textarea>
                    </div>
                    @if (contactError) {
                    <div class="form-error">{{ contactError }}</div>
                    }
                    <button class="btn-primary form-submit" type="submit" [disabled]="contactLoading">
                        {{ contactLoading ? 'Enviando...' : 'Enviar mensaje' }}
                    </button>
                </form>
                }
            </div>
        </div>
        }
    `
})
export class LecmaLanding implements AfterViewInit, OnDestroy {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;
    private zone = inject(NgZone);
    private cdr = inject(ChangeDetectorRef);

    menuOpen = false;
    private observer: IntersectionObserver | null = null;
    private statsObserver: IntersectionObserver | null = null;

    // ── Counters ──
    stat0 = 0;   // 360k km/año
    stat1 = 0;   // 100%
    stat2 = 0;   // 4+
    stat3 = 0;   // 24/7
    private countersStarted = false;

    // ── Quote modal ──
    quoteOpen = false;
    quoteLoading = false;
    quoteSuccess = false;
    quoteError = '';
    quote = { nombre: '', empresa: '', email: '', telefono: '', origen: '', destino: '', pasajeros: '', frecuencia: '', mensaje: '' };

    // ── Contact modal ──
    contactOpen = false;
    contactLoading = false;
    contactSuccess = false;
    contactError = '';
    contact = { nombre: '', email: '', telefono: '', mensaje: '' };

    ngAfterViewInit() {
        // rAF ensures layout is complete before we measure positions
        requestAnimationFrame(() => {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            this.observer!.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
            );

            document.querySelectorAll('.aos, .aos-left, .aos-right').forEach(el => {
                const rect = el.getBoundingClientRect();
                // Already visible on load — show immediately, no need to observe
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    el.classList.add('is-visible');
                } else {
                    this.observer!.observe(el);
                }
            });

            // Counter animation observer
            const statsEl = document.getElementById('stats-section');
            if (statsEl) {
                this.statsObserver = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting && !this.countersStarted) {
                        this.countersStarted = true;
                        this.startCounters();
                        this.statsObserver!.disconnect();
                    }
                }, { threshold: 0.4 });
                this.statsObserver.observe(statsEl);
            }
        });
    }

    ngOnDestroy() {
        this.observer?.disconnect();
        this.statsObserver?.disconnect();
    }

    private startCounters() {
        const duration = 1800;
        const targets = [
            { setter: (v: number) => { this.stat0 = v; }, to: 360 },
            { setter: (v: number) => { this.stat1 = v; }, to: 100 },
            { setter: (v: number) => { this.stat2 = v; }, to: 4 },
            { setter: (v: number) => { this.stat3 = v; }, to: 24 },
        ];

        const startTime = performance.now();

        this.zone.runOutsideAngular(() => {
            const tick = (now: number) => {
                const elapsed = now - startTime;
                const t = Math.min(elapsed / duration, 1);
                // ease-out cubic: decelerates toward the end
                const ease = 1 - Math.pow(1 - t, 3);

                targets.forEach(c => c.setter(Math.round(c.to * ease)));
                this.cdr.detectChanges();

                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }

    toggleMenu() { this.menuOpen = !this.menuOpen; }

    scrollTo(id: string) {
        this.menuOpen = false;
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }

    scrollToServices() {
        this.scrollTo('servicios');
    }

    scrollToCta() {
        this.scrollTo('contacto');
    }

    openQuote() {
        this.quoteSuccess = false;
        this.quoteError = '';
        this.quoteOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeQuote() {
        this.quoteOpen = false;
        document.body.style.overflow = '';
    }

    submitQuote() {
        if (!this.quote.nombre || !this.quote.empresa || !this.quote.email || !this.quote.origen || !this.quote.destino || !this.quote.pasajeros || !this.quote.frecuencia) {
            this.quoteError = 'Por favor completá todos los campos obligatorios.';
            return;
        }
        this.quoteLoading = true;
        this.quoteError = '';
        this.http.post(`${this.apiUrl}contact/quote`, this.quote).subscribe({
            next: () => {
                this.quoteLoading = false;
                this.quoteSuccess = true;
                this.quote = { nombre: '', empresa: '', email: '', telefono: '', origen: '', destino: '', pasajeros: '', frecuencia: '', mensaje: '' };
            },
            error: (err) => {
                this.quoteLoading = false;
                this.quoteError = err?.error?.error || 'No se pudo enviar. Intentá de nuevo más tarde.';
            }
        });
    }

    openContact() {
        this.contactSuccess = false;
        this.contactError = '';
        this.contactOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeContact() {
        this.contactOpen = false;
        document.body.style.overflow = '';
    }

    submitContact() {
        if (!this.contact.nombre || !this.contact.email || !this.contact.mensaje) {
            this.contactError = 'Por favor completá todos los campos obligatorios.';
            return;
        }
        this.contactLoading = true;
        this.contactError = '';
        this.http.post(`${this.apiUrl}contact/message`, this.contact).subscribe({
            next: () => {
                this.contactLoading = false;
                this.contactSuccess = true;
                this.contact = { nombre: '', email: '', telefono: '', mensaje: '' };
            },
            error: (err) => {
                this.contactLoading = false;
                this.contactError = err?.error?.error || 'No se pudo enviar. Intentá de nuevo más tarde.';
            }
        });
    }
}
