# Push to GitHub

Run these commands in **PowerShell** from the project root `c:\Users\Dell\Documents\Afrilauch_v1.0`.

## 1. Unstage everything and re-add (so .gitignore applies)

```powershell
cd "c:\Users\Dell\Documents\Afrilauch_v1.0"
git reset HEAD .
git add .
```

## 2. Check that .pnpm-store and node_modules are NOT listed

```powershell
git status --short
```

If you see `.pnpm-store/` or `node_modules/` in the list, they are not ignored. The root `.gitignore` should exclude them.

## 3. Commit

```powershell
git commit -m "Initial commit: AfriLaunch Hub MVP"
```

## 4. Set remote and push

```powershell
git remote remove origin 2>$null; git remote add origin https://github.com/ugochukwuhenry/Afrilauch_v1.0.git
git branch -M main
git push -u origin main
```

If GitHub asks for auth, use a **Personal Access Token** (Settings → Developer settings → Personal access tokens) as the password, or sign in with GitHub CLI (`gh auth login`).
