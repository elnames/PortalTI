# 🚀 Guía de Deploy para PortalTI

## 📋 **Preparación para Producción**

### **1. Configuración de Base de Datos**

#### **Opción A: PostgreSQL (Recomendado - Gratis)**
```csharp
// En appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=portalti;Username=user;Password=pass"
  }
}
```

#### **Opción B: SQL Server (Si prefieres mantener)**
```csharp
// En appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:server.database.windows.net,1433;Database=portalti;User ID=user;Password=pass;Encrypt=true;"
  }
}
```

### **2. Variables de Entorno Necesarias**

```bash
# JWT Configuration
JWT_SECRET_KEY=tu_clave_secreta_muy_larga_y_segura_aqui
JWT_ISSUER=PortalTI
JWT_AUDIENCE=PortalTI-Users
JWT_EXPIRATION_MINUTES=480

# Database
CONNECTION_STRING=tu_connection_string_aqui

# CORS
ALLOWED_ORIGINS=https://tu-frontend.vercel.app,https://tu-frontend.onrender.com
```

### **3. Archivo Dockerfile (Para Railway/Render)**

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["PortalTi.Api/PortalTi.Api.csproj", "PortalTi.Api/"]
RUN dotnet restore "PortalTi.Api/PortalTi.Api.csproj"
COPY . .
WORKDIR "/src/PortalTi.Api"
RUN dotnet build "PortalTi.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PortalTi.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "PortalTi.Api.dll"]
```

### **4. Configuración de CORS para Producción**

```csharp
// En Program.cs - Actualizar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionCorsPolicy", policy =>
        policy
          .WithOrigins(
              "https://tu-frontend.vercel.app",
              "https://tu-frontend.onrender.com",
              "https://tu-dominio.com"
          )
          .AllowAnyMethod()
          .AllowAnyHeader()
          .AllowCredentials()
    );
});
```

## 🎯 **Pasos para Deploy**

### **Opción 1: Railway (Recomendado)**

1. **Subir a GitHub:**
   ```bash
   git add .
   git commit -m "Preparado para deploy"
   git push origin main
   ```

2. **Conectar Railway:**
   - Ve a [railway.app](https://railway.app)
   - Conecta tu cuenta GitHub
   - Selecciona tu repositorio
   - Railway detectará automáticamente que es .NET

3. **Configurar Variables:**
   - JWT_SECRET_KEY
   - CONNECTION_STRING
   - ALLOWED_ORIGINS

4. **Deploy Frontend:**
   - Usa Vercel para el frontend React
   - Conecta con el mismo repositorio
   - Configura build command: `npm run build`

### **Opción 2: Render**

1. **Crear servicio Web:**
   - Ve a [render.com](https://render.com)
   - New Web Service
   - Conecta GitHub

2. **Configurar Build:**
   ```
   Build Command: dotnet publish -c Release -o ./publish
   Start Command: dotnet ./publish/PortalTi.Api.dll
   ```

3. **Base de Datos:**
   - Crear PostgreSQL Database
   - Copiar connection string

### **Opción 3: Azure**

1. **Azure App Service:**
   - Crear App Service en Azure
   - Deployment Center → GitHub
   - Configurar variables de entorno

2. **Azure SQL:**
   - Crear Azure SQL Database
   - Configurar firewall
   - Actualizar connection string

## 🔧 **Scripts de Deploy**

### **package.json (Frontend)**
```json
{
  "scripts": {
    "build": "react-scripts build",
    "deploy": "npm run build && vercel --prod"
  }
}
```

### **Railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "dotnet PortalTi.Api.dll",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 🌐 **URLs de Demo**

Después del deploy tendrás:
- **Frontend**: `https://tu-proyecto.vercel.app`
- **Backend**: `https://tu-proyecto.railway.app`
- **Swagger**: `https://tu-proyecto.railway.app/swagger`

## 🔐 **Credenciales de Demo**

- **Admin**: `admin / admin`
- **Usuario Demo**: Crear uno desde el panel admin

## 📝 **Notas Importantes**

1. **Cambiar contraseña admin** en producción
2. **Configurar HTTPS** (automático en las plataformas)
3. **Monitorear logs** para debugging
4. **Backup de base de datos** regular
5. **Actualizar variables de entorno** según el entorno

---

**¡Tu demo estará lista en menos de 30 minutos!** 🚀
