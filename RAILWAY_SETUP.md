# 🚀 Configuración de Railway para PortalTI

## 📋 **Pasos para Deploy en Railway**

### **1. Conectar con GitHub**
1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con tu cuenta GitHub
3. Haz clic en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Busca y selecciona `elnames/PortalTI`

### **2. Configurar Variables de Entorno**

En Railway, ve a tu proyecto → Variables y agrega:

```bash
# JWT Configuration
JWT_SECRET_KEY=tu_clave_secreta_muy_larga_y_segura_aqui_para_produccion_2024

# Database (Railway generará automáticamente)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xyz.railway.app:5432/railway

# CORS (actualizar con tu dominio de Vercel)
ALLOWED_ORIGINS=https://portalti-demo.vercel.app,https://tu-dominio.vercel.app

# Environment
ASPNETCORE_ENVIRONMENT=Production
```

### **3. Configurar Base de Datos**

1. En Railway, ve a tu proyecto
2. Haz clic en "+ New" → "Database" → "PostgreSQL"
3. Railway creará automáticamente la base de datos
4. Copia la `DATABASE_URL` y úsala como variable de entorno

### **4. Deploy Automático**

Railway detectará automáticamente:
- ✅ Que es un proyecto .NET
- ✅ El Dockerfile en la raíz
- ✅ La configuración en railway.json
- ✅ Deploy automático desde GitHub

### **5. URLs que Tendrás**

Después del deploy:
- **Backend API**: `https://tu-proyecto.railway.app`
- **Swagger**: `https://tu-proyecto.railway.app/swagger`
- **Health Check**: `https://tu-proyecto.railway.app/health`

## 🔧 **Configuración Adicional**

### **Actualizar Connection String para PostgreSQL**

Si usas PostgreSQL en lugar de SQL Server, actualiza el `appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=${DATABASE_URL};Database=portalti;Username=postgres;Password=${DB_PASSWORD};"
  }
}
```

### **Configurar Dominio Personalizado**

1. En Railway → Settings → Domains
2. Agregar dominio personalizado
3. Configurar DNS apuntando a Railway

## 🚨 **Troubleshooting**

### **Si el deploy falla:**
1. Verificar logs en Railway Dashboard
2. Comprobar variables de entorno
3. Verificar que la base de datos esté conectada

### **Si CORS falla:**
1. Actualizar `ALLOWED_ORIGINS` con tu dominio de Vercel
2. Reiniciar el servicio en Railway

### **Si la base de datos no conecta:**
1. Verificar `DATABASE_URL` en variables
2. Comprobar que PostgreSQL esté activo
3. Ejecutar migraciones manualmente si es necesario

## 📝 **Notas Importantes**

- ✅ **Railway detecta automáticamente** el proyecto .NET
- ✅ **Deploy automático** en cada push a GitHub
- ✅ **Base de datos incluida** (PostgreSQL)
- ✅ **SSL automático** para HTTPS
- ✅ **Logs en tiempo real** para debugging

---

**¡Tu backend estará listo en 5 minutos!** 🎉
