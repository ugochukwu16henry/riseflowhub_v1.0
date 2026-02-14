# Backend build

## Normal build

```bash
pnpm run build
```

Runs: clear Prisma client (to reduce Windows lock issues) → `prisma generate` → `tsc`.

## Windows EPERM on `prisma generate`

If you see:

```text
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...' -> '...query_engine-windows.dll.node'
```

something on your machine is locking the Prisma engine file (Node, IDE, antivirus, or OneDrive).

**Try in order:**

1. **Close all backend processes**  
   Stop any terminal where you ran `pnpm run dev` or `tsx watch`. Close Cursor/VS Code if it’s using the backend folder.

2. **Fresh terminal**  
   Open a new terminal, `cd backend`, then run `pnpm run build` again.

3. **Only compile TypeScript**  
   If the Prisma client was already generated before, you can skip generate and just compile:
   ```bash
   pnpm run build:tsc
   ```

4. **Clean reinstall**  
   From the `backend` folder:
   ```powershell
   Remove-Item -Recurse -Force node_modules\.pnpm\@prisma*
   pnpm install
   pnpm run build
   ```

5. **Run as Administrator**  
   Open PowerShell or CMD as Administrator, `cd` to the repo’s `backend` folder, then run `pnpm run build`.

CI (e.g. GitHub Actions, Railway) uses a clean environment and normally does not hit this.

## Railway: P3009 failed migration

If the deploy fails with:

```text
Error: P3009
migrate found failed migrations in the target database
The `20250203120000_add_security_and_support_tables` migration ... failed
```

1. **Mark the migration as rolled back** (so the next deploy can run it again). From your machine, with Railway CLI linked to the backend service:

   ```bash
   cd backend
   railway run pnpm run db:migrate:resolve-rollback
   ```

2. **Redeploy** (push to Git or run `railway up`). The migration has been made idempotent, so it’s safe to run again even if it partially applied before.
