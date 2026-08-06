export type Role = 'USER' | 'ADMIN' | 'ADMIN_OPERATIVO' | 'DIRECTOR';

// Debe reflejar exactamente PERMISSIONS en logistica-backend/src/middlewares/permission.middleware.ts
export const PERMISSIONS = {
  viewStatistics: ['ADMIN', 'DIRECTOR'],
  manageOperations: ['ADMIN', 'ADMIN_OPERATIVO', 'DIRECTOR'],
  manageTariffs: ['ADMIN', 'DIRECTOR'],
  forceServiceStatus: ['ADMIN'],
  viewAudits: ['ADMIN'],
  manageUsers: ['ADMIN', 'DIRECTOR'],
  useAssistant: ['ADMIN', 'ADMIN_OPERATIVO', 'DIRECTOR'],
  useAnalyst: ['ADMIN', 'DIRECTOR'],
} as const;

export type Permission = keyof typeof PERMISSIONS;
