import { CURRENT_RELEASE } from './changelog';

// Recuerda, por navegador, la última versión cuyas novedades vio el usuario,
// para mostrar el aviso de "qué hay de nuevo" una sola vez por versión. Es
// sólo una comodidad: si el navegador no deja guardar, el aviso no aparece.
const KEY = 'lecma.ultimaVersionVista';

export function hasUnseenRelease(): boolean {
    try {
        return localStorage.getItem(KEY) !== CURRENT_RELEASE.version;
    } catch {
        return false;
    }
}

export function markReleaseSeen(): void {
    try {
        localStorage.setItem(KEY, CURRENT_RELEASE.version);
    } catch {
        // sin almacenamiento disponible: no pasa nada
    }
}
