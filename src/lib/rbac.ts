import type { AdminUser, Permission, Role, RolePermission } from "@prisma/client";

export const PERMISSIONS = {
  DASHBOARD_READ: "dashboard:read",
  PRODUCTS_MANAGE: "products:manage",
  ORDERS_MANAGE: "orders:manage",
  SETTINGS_MANAGE: "settings:manage",
  ADMINS_MANAGE: "admins:manage",
  AUDIT_READ: "audit:read"
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type AdminPrincipal = AdminUser & {
  role: Role & {
    permissions: Array<RolePermission & { permission: Permission }>;
  };
};

export function hasPermission(admin: AdminPrincipal, permission: PermissionKey) {
  if (!admin.active) return false;
  if (admin.role.name === "Super Admin") return true;
  return admin.role.permissions.some((entry) => entry.permission.key === permission);
}
