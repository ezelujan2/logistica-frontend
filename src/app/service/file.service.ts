import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export type FileKind = 'reports' | 'settlements' | 'uploads';

// Los PDFs y archivos subidos sólo se bajan con login, así que no alcanza con
// abrir la URL en otra pestaña (no llevaría el token): se piden por HttpClient,
// que le agrega el token, y se abre el archivo ya descargado.
@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = `${environment.apiUrl}files`;

  constructor(private http: HttpClient) {}

  async open(kind: FileKind, name: string): Promise<void> {
    // La pestaña se abre ya, mientras dura el click; si se abre después de la
    // descarga, el navegador la bloquea como popup.
    const win = window.open('', '_blank');
    try {
      const blob = await firstValueFrom(this.http.get(this.apiUrl, { params: { kind, name }, responseType: 'blob' }));
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url;
      else window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      win?.close();
      throw err;
    }
  }

  /** Nombre del archivo a partir de una URL guardada (/api/uploads/x.jpg, http://.../REP-0001.pdf, ...). */
  fileName(url: string): string {
    return url.split('?')[0].split('/').pop() ?? '';
  }
}
