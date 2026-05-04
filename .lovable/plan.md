## Doel
Admin kan vanuit `/admin/users` een gebruiker volledig verwijderen (auth.users + gerelateerde data via cascade).

## Wijzigingen

### 1. Edge function `manage-user-roles/index.ts`
Nieuwe `action: 'delete'` toevoegen:
- Valideert admin (al aanwezig)
- Voorkomt dat admin zichzelf verwijdert (`userId === user.id` → 400)
- Roept `supabaseAdmin.auth.admin.deleteUser(userId)` aan
- Bestaande `user_roles`/`profiles` rijen worden via foreign-key cascade opgeruimd (al ingericht in DB)

### 2. Hook `src/hooks/useUserManagement.ts`
- Nieuwe functie `deleteUser(userId: string)` met dezelfde session/header pattern als `assignRole`
- Toast feedback (success/error) + `fetchUsers()` refresh
- Exporteren in return object

### 3. Component `src/components/admin/UserManagementTable.tsx`
- Nieuwe prop `onDeleteUser: (userId: string) => Promise<boolean>`
- In dropdown menu (na rol-acties): `DropdownMenuSeparator` + rode "Delete user" item met `Trash2` icon
- Aparte `AlertDialog` met duidelijke waarschuwing ("Dit verwijdert de gebruiker en alle scans permanent. Niet ongedaan te maken.")
- Confirm-knop in destructive variant

### 4. Pagina `src/pages/admin/Users.tsx` (of waar de tabel gebruikt wordt)
- `deleteUser` uit hook doorgeven aan `<UserManagementTable onDeleteUser={...} />`

## Notities
- Geen DB-migratie nodig (cascade staat).
- Self-delete wordt server-side geblokkeerd om lockout te voorkomen.
