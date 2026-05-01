# .NET Build & Test Commands

Commands to run during code review for .NET projects.

---

## Build & Test

```powershell
dotnet build --no-incremental
dotnet test
```

All must pass. Document any failures as Critical findings.

---

## Format & Vulnerability Check

```powershell
dotnet format --verify-no-changes
dotnet list package --vulnerable
```

All must pass. Document any failures as Critical findings.
