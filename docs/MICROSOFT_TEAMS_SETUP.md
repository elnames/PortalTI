# Configuración de Microsoft Teams para el Calendario

## Requisitos Previos

1. **Cuenta de Microsoft 365** con licencia de Teams
2. **Registro de aplicación** en Azure Active Directory
3. **Permisos de Microsoft Graph API**

## Pasos de Configuración

### 1. Registrar la Aplicación en Azure AD

1. Ve a [Azure Portal](https://portal.azure.com)
2. Navega a **Azure Active Directory** > **Registros de aplicaciones**
3. Haz clic en **Nuevo registro**
4. Configura:
   - **Nombre**: Portal TI Calendar
   - **Tipos de cuenta**: Cuentas en cualquier directorio organizacional
   - **URI de redirección**: `http://localhost:3000/auth/microsoft/callback`

### 2. Configurar Permisos de API

1. En tu aplicación, ve a **Permisos de API**
2. Agrega los siguientes permisos de Microsoft Graph:
   - `Calendars.ReadWrite` (Aplicación)
   - `User.Read` (Delegado)
   - `OnlineMeetings.ReadWrite` (Aplicación)

### 3. Crear un Secreto de Cliente

1. Ve a **Certificados y secretos**
2. Haz clic en **Nuevo secreto de cliente**
3. Copia el valor del secreto (se mostrará solo una vez)

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Configuración de Microsoft Graph
REACT_APP_MICROSOFT_CLIENT_ID=tu-client-id-aqui
REACT_APP_MICROSOFT_TENANT_ID=common
REACT_APP_MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/microsoft/callback
```

### 5. Configurar el Backend (Opcional)

Si quieres manejar la autenticación desde el backend, crea un endpoint `/api/microsoft/token` que:

1. Reciba el código de autorización
2. Intercambie el código por un token de acceso
3. Devuelva el token al frontend

Ejemplo de implementación en C#:

```csharp
[HttpPost("microsoft/token")]
public async Task<IActionResult> ExchangeCodeForToken([FromBody] MicrosoftTokenRequest request)
{
    var client = new HttpClient();
    var tokenRequest = new FormUrlEncodedContent(new[]
    {
        new KeyValuePair<string, string>("client_id", _configuration["Microsoft:ClientId"]),
        new KeyValuePair<string, string>("client_secret", _configuration["Microsoft:ClientSecret"]),
        new KeyValuePair<string, string>("code", request.Code),
        new KeyValuePair<string, string>("redirect_uri", request.RedirectUri),
        new KeyValuePair<string, string>("grant_type", "authorization_code")
    });

    var response = await client.PostAsync("https://login.microsoftonline.com/common/oauth2/v2.0/token", tokenRequest);
    var content = await response.Content.ReadAsStringAsync();
    
    return Ok(JsonSerializer.Deserialize<object>(content));
}
```

## Funcionalidades Implementadas

### ✅ Creación Automática de Reuniones
- Las reuniones se crean automáticamente en el calendario de Microsoft
- Se generan enlaces de Teams para unirse a la reunión
- Se envían invitaciones a los participantes

### ✅ Gestión de Participantes
- Asignación automática de participantes
- Envío de invitaciones por email
- Gestión de permisos de la reunión

### ✅ Sincronización de Calendarios
- Los eventos se sincronizan con Outlook/Teams
- Actualizaciones en tiempo real
- Eliminación automática de reuniones canceladas

## Uso en el Calendario

1. **Conectar cuenta Microsoft**: Haz clic en "Conectar con Microsoft" en el sidebar
2. **Crear reunión de Teams**: Selecciona "Reunión de Teams" al crear un evento
3. **Asignar participantes**: Agrega usuarios que recibirán invitaciones
4. **Unirse a la reunión**: Haz clic en el enlace de Teams en el evento

## Solución de Problemas

### Error: "No se encontró el token de acceso"
- Verifica que la autenticación se haya completado correctamente
- Revisa que las variables de entorno estén configuradas

### Error: "Permisos insuficientes"
- Verifica que la aplicación tenga los permisos necesarios en Azure AD
- Asegúrate de que el usuario haya dado consentimiento a la aplicación

### Error: "No se pudo crear la reunión"
- Verifica que la cuenta tenga licencia de Teams
- Revisa que los participantes tengan cuentas válidas de Microsoft

## Notas Importantes

- Las reuniones se crean en el calendario del usuario autenticado
- Los participantes deben tener cuentas de Microsoft válidas
- La aplicación requiere permisos de administrador para algunos escenarios
- Los enlaces de Teams son válidos hasta que se cancele la reunión
