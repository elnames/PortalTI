# 🚀 Railway Full Stack Setup - PortalTI

## 📋 **Configuración Completa para Railway (Backend + Frontend + DB)**

### **1. Configuración en Railway**

#### **Paso 1: Crear Proyecto**
1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona `elnames/PortalTI`

#### **Paso 2: Configurar Base de Datos**
1. En tu proyecto Railway → "+ New" → "Database" → "PostgreSQL"
2. Railway creará automáticamente la base de datos
3. Copia la `DATABASE_URL` (la necesitarás después)

#### **Paso 3: Configurar Backend**
1. En tu proyecto Railway → "+ New" → "GitHub Repo"
2. Selecciona `elnames/PortalTI`
3. Railway detectará automáticamente que es .NET
4. **Configurar Variables de Entorno:**
   ```bash
   # Base de Datos
   DATABASE_URL=postgresql://postgres:password@containers-us-west-xyz.railway.app:5432/railway
   
   # JWT Configuration
   JWT_SECRET_KEY=tu_clave_secreta_muy_larga_y_segura_aqui_para_produccion_2024
   
   # Environment
   ASPNETCORE_ENVIRONMENT=Production
   
   # CORS (actualizar después con la URL del frontend)
   ALLOWED_ORIGINS=https://tu-frontend.railway.app
   ```

#### **Paso 4: Configurar Frontend**
1. En tu proyecto Railway → "+ New" → "GitHub Repo"
2. Selecciona `elnames/PortalTI` (mismo repo)
3. Railway detectará automáticamente que es React
4. **Configurar Variables de Entorno:**
   ```bash
   # Backend URL (copiar del servicio backend)
   REACT_APP_API_URL=https://tu-backend.railway.app
   
   # Environment
   NODE_ENV=production
   ```

### **2. URLs que Tendrás**

Después del deploy:
- **Frontend**: `https://tu-frontend.railway.app`
- **Backend**: `https://tu-backend.railway.app`
- **Swagger**: `https://tu-backend.railway.app/swagger`
- **Base de Datos**: Automática (PostgreSQL)

### **3. Configuración de CORS**

Una vez que tengas ambas URLs, actualiza:
1. **Backend CORS**: Actualizar `ALLOWED_ORIGINS` con la URL del frontend
2. **Frontend API**: Actualizar `REACT_APP_API_URL` con la URL del backend

### **4. Deploy Automático**

Railway hará:
- ✅ **Deploy automático** en cada push a GitHub
- ✅ **Build automático** del frontend y backend
- ✅ **Base de datos** conectada automáticamente
- ✅ **SSL automático** para HTTPS
- ✅ **Logs en tiempo real** para debugging

## 🔧 **Configuración Adicional**

### **Variables de Entorno Completas**

#### **Backend (.NET)**
```bash
DATABASE_URL=postgresql://postgres:password@containers-us-west-xyz.railway.app:5432/railway
JWT_SECRET_KEY=tu_clave_secreta_muy_larga_y_segura_aqui_para_produccion_2024
ASPNETCORE_ENVIRONMENT=Production
ALLOWED_ORIGINS=https://tu-frontend.railway.app
```

#### **Frontend (React)**
```bash
REACT_APP_API_URL=https://tu-backend.railway.app
NODE_ENV=production
```

### **Actualizar src/config.js para Producción**

```javascript
// src/config.js
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5266',
  environment: process.env.NODE_ENV || 'development'
};

export default config;
```

## 🚨 **Troubleshooting**

### **Si el backend no conecta a la DB:**
1. Verificar `DATABASE_URL` en variables del backend
2. Comprobar que PostgreSQL esté activo
3. Verificar logs del backend en Railway

### **Si el frontend no conecta al backend:**
1. Verificar `REACT_APP_API_URL` en variables del frontend
2. Actualizar `ALLOWED_ORIGINS` en el backend
3. Verificar que ambos servicios estén activos

### **Si CORS falla:**
1. Actualizar `ALLOWED_ORIGINS` con la URL exacta del frontend
2. Reiniciar ambos servicios
3. Verificar que no haya trailing slash en las URLs

## 📝 **Pasos de Deploy**

### **1. Push a GitHub (Ya hecho)**
```bash
git add .
git commit -m "feat: Configuración full stack para Railway"
git push origin main
```

### **2. Configurar en Railway**
1. Crear proyecto en Railway
2. Agregar base de datos PostgreSQL
3. Agregar servicio backend (.NET)
4. Agregar servicio frontend (React)
5. Configurar variables de entorno
6. ¡Deploy automático!

### **3. URLs Finales**
- **Frontend**: `https://portal-ti-frontend-production.up.railway.app`
- **Backend**: `https://portal-ti-backend-production.up.railway.app`
- **Swagger**: `https://portal-ti-backend-production.up.railway.app/swagger`

## 🎯 **Credenciales de Demo**

- **Admin**: `admin / admin` (se crea automáticamente)
- **Base de datos**: PostgreSQL (gestionada por Railway)

---

**¡Tu demo full stack estará lista en 10 minutos!** 🚀
