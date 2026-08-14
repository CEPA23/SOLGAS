# Portal de socios

Login empresarial para socios/distribuidores, con frontend React/Vite y API ASP.NET Core.

## Desarrollo

```powershell
cd frontend
npm install
npm run dev
```

En otra terminal:

```powershell
dotnet run --project backend/src/PartnerPortal.Api
```

La API escucha en `http://localhost:5080` y el frontend en `http://localhost:5173`.

La persistencia actual es en memoria para que el proyecto funcione sin infraestructura externa; los contratos de repositorio están listos para sustituirse por EF Core/SQL.
