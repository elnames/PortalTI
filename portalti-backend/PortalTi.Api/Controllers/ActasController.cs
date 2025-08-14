using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using PortalTi.Api.Services;
using System.Text.Json;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ActasController : ControllerBase
    {
        private readonly PortalTiContext _db;
        private readonly ILogger<ActasController> _logger;
        private readonly PdfService _pdfService;

        public ActasController(PortalTiContext db, ILogger<ActasController> logger, PdfService pdfService)
        {
            _db = db;
            _logger = logger;
            _pdfService = pdfService;
        }

        [HttpGet("mis-actas")]
        public async Task<ActionResult<IEnumerable<object>>> GetMisActas()
        {
            try
            {
                // Obtener el ID del usuario desde el token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var userId = userIdClaim?.Value;
                if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int id))
                    return Unauthorized("Usuario no autenticado.");

                // Obtener el email del usuario
                var userEmailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
                var userEmail = userEmailClaim?.Value;
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Usuario no autenticado.");

                // Buscar el usuario en la nómina
                var usuario = await _db.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (usuario == null)
                    return NotFound("Usuario no encontrado en la nómina.");

                // Obtener actas del usuario
                var actas = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .Include(a => a.AprobadoPor)
                    .Where(a => a.Asignacion.UsuarioId == usuario.Id)
                    .OrderByDescending(a => a.FechaCreacion)
                    .ToListAsync();

                // Eliminar duplicados por AsignacionId, manteniendo solo el más reciente
                var actasUnicas = actas
                    .GroupBy(a => a.AsignacionId)
                    .Select(g => g.OrderByDescending(a => a.FechaCreacion).First())
                    .ToList();

                var result = actasUnicas.Select(a => new
                {
                    a.Id,
                    a.Estado,
                    a.MetodoFirma,
                    a.NombreArchivo,
                    a.Observaciones,
                    a.FechaCreacion,
                    a.FechaFirma,
                    a.FechaAprobacion,
                    a.ComentariosAprobacion,
                    Asignacion = new
                    {
                        a.Asignacion.Id,
                        a.Asignacion.FechaAsignacion,
                        Activo = new
                        {
                            a.Asignacion.Activo.Codigo,
                            a.Asignacion.Activo.Categoria,
                            a.Asignacion.Activo.NombreEquipo
                        }
                    },
                    AprobadoPor = a.AprobadoPor != null ? new
                    {
                        a.AprobadoPor.Username,
                        a.AprobadoPor.Role
                    } : null
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener mis actas");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/actas/usuario/{email} - Obtener actas de un usuario específico
        [HttpGet("usuario/{email}")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<ActionResult<IEnumerable<object>>> GetActasUsuario(string email)
        {
            try
            {
                // Buscar el usuario en la nómina
                var usuario = await _db.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Email == email);

                if (usuario == null)
                    return NotFound("Usuario no encontrado en la nómina.");

                // Obtener actas del usuario
                var actas = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .Include(a => a.AprobadoPor)
                    .Where(a => a.Asignacion.UsuarioId == usuario.Id)
                    .OrderByDescending(a => a.FechaCreacion)
                    .ToListAsync();

                var result = actas.Select(a => new
                {
                    a.Id,
                    titulo = $"Acta de entrega - {a.Asignacion.Activo.NombreEquipo}",
                    descripcion = $"Acta de entrega del activo {a.Asignacion.Activo.Codigo} ({a.Asignacion.Activo.Categoria})",
                    a.Estado,
                    tipo = "Acta de Entrega",
                    a.MetodoFirma,
                    a.Observaciones,
                    fechaCreacion = a.FechaCreacion,
                    a.FechaFirma,
                    a.FechaAprobacion,
                    a.ComentariosAprobacion,
                    Asignacion = new
                    {
                        a.Asignacion.Id,
                        a.Asignacion.FechaAsignacion,
                        Activo = new
                        {
                            a.Asignacion.Activo.Codigo,
                            a.Asignacion.Activo.Categoria,
                            a.Asignacion.Activo.NombreEquipo
                        }
                    },
                    AprobadoPor = a.AprobadoPor != null ? new
                    {
                        a.AprobadoPor.Username,
                        a.AprobadoPor.Role
                    } : null
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener actas del usuario");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("pendientes-aprobacion")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<ActionResult<IEnumerable<object>>> GetActasPendientesAprobacion()
        {
            try
            {
                var actas = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .Include(a => a.Asignacion.Usuario)
                    .Include(a => a.AprobadoPor)
                    .Where(a => a.Estado == "Firmada")
                    .OrderByDescending(a => a.FechaFirma)
                    .ToListAsync();

                var result = actas.Select(a => new
                {
                    a.Id,
                    a.Estado,
                    a.MetodoFirma,
                    a.NombreArchivo,
                    a.Observaciones,
                    a.FechaCreacion,
                    a.FechaFirma,
                    Asignacion = new
                    {
                        a.Asignacion.Id,
                        a.Asignacion.FechaAsignacion,
                        Activo = new
                        {
                            a.Asignacion.Activo.Codigo,
                            a.Asignacion.Activo.Categoria,
                            a.Asignacion.Activo.NombreEquipo
                        },
                        Usuario = new
                        {
                            a.Asignacion.Usuario.Nombre,
                            a.Asignacion.Usuario.Apellido,
                            a.Asignacion.Usuario.Email
                        }
                    }
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener actas pendientes de aprobación");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("todas")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<ActionResult<IEnumerable<object>>> GetTodasActas()
        {
            try
            {
                var actas = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .Include(a => a.Asignacion.Usuario)
                    .Include(a => a.AprobadoPor)
                    .OrderByDescending(a => a.FechaCreacion)
                    .ToListAsync();

                // Eliminar duplicados por AsignacionId, manteniendo solo el más reciente
                var actasUnicas = actas
                    .GroupBy(a => a.AsignacionId)
                    .Select(g => g.OrderByDescending(a => a.FechaCreacion).First())
                    .ToList();

                var result = actasUnicas.Select(a => new
                {
                    a.Id,
                    a.Estado,
                    a.MetodoFirma,
                    a.NombreArchivo,
                    a.Observaciones,
                    a.FechaCreacion,
                    a.FechaFirma,
                    a.FechaAprobacion,
                    a.ComentariosAprobacion,
                    Asignacion = new
                    {
                        a.Asignacion.Id,
                        a.Asignacion.FechaAsignacion,
                        Activo = new
                        {
                            a.Asignacion.Activo.Codigo,
                            a.Asignacion.Activo.Categoria,
                            a.Asignacion.Activo.NombreEquipo
                        },
                        Usuario = new
                        {
                            a.Asignacion.Usuario.Nombre,
                            a.Asignacion.Usuario.Apellido,
                            a.Asignacion.Usuario.Email
                        }
                    },
                    AprobadoPor = a.AprobadoPor != null ? new
                    {
                        a.AprobadoPor.Username,
                        a.AprobadoPor.Role
                    } : null
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todas las actas");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("firmar-digital")]
        public async Task<IActionResult> FirmarDigital([FromForm] int asignacionId, [FromForm] string observaciones = "")
        {
            try
            {
                _logger.LogInformation($"FirmarDigital llamado con asignacionId: {asignacionId}, observaciones: {observaciones}");
                
                // Verificar que el usuario esté autenticado
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var userId = userIdClaim?.Value;
                if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int id))
                    return Unauthorized("Usuario no autenticado.");

                _logger.LogInformation($"Usuario autenticado con ID: {id}");

                // Verificar que la asignación existe y pertenece al usuario
                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == asignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                _logger.LogInformation($"Asignación encontrada: {asignacion.Id} para usuario: {asignacion.Usuario.Email}");

                // Verificar que el usuario es el propietario de la asignación
                var userEmailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
                var userEmail = userEmailClaim?.Value;
                if (asignacion.Usuario.Email != userEmail)
                    return Forbid("No tienes permisos para firmar esta acta");

                _logger.LogInformation($"Usuario autorizado para firmar: {userEmail}");

                // Obtener la firma del perfil del usuario
                var currentUser = await _db.AuthUsers
                    .FirstOrDefaultAsync(u => u.Username == userEmail);
                
                _logger.LogInformation($"Buscando usuario con email: {userEmail}");
                _logger.LogInformation($"Usuario encontrado: {currentUser?.Username}, Role: {currentUser?.Role}, SignaturePath: '{currentUser?.SignaturePath}'");
                
                if (currentUser == null)
                    return NotFound("Usuario no encontrado");

                // Si el usuario no tiene firma, devolver error con opciones
                if (string.IsNullOrEmpty(currentUser.SignaturePath))
                {
                    _logger.LogInformation($"Usuario {userEmail} no tiene firma. Devolviendo mensaje con opciones.");
                    var errorResponse = new { 
                        message = "No tienes una firma subida en tu perfil.",
                        options = new {
                            uploadSignature = "Ve a 'Mi Perfil' para subir tu firma digital",
                            uploadPdf = "O puedes descargar el acta y subirlo firmado manualmente"
                        }
                    };
                    _logger.LogInformation($"Devolviendo respuesta: {System.Text.Json.JsonSerializer.Serialize(errorResponse)}");
                    return BadRequest(errorResponse);
                }

                // Verificar que el archivo de firma existe
                string signatureFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", currentUser.SignaturePath.TrimStart('/'));
                if (!System.IO.File.Exists(signatureFilePath))
                {
                    return BadRequest(new { 
                        message = "El archivo de firma no existe. Sube una nueva firma en tu perfil.",
                        options = new {
                            uploadSignature = "Ve a 'Mi Perfil' para subir tu firma digital",
                            uploadPdf = "O puedes descargar el acta y subirlo firmado manualmente"
                        }
                    });
                }

                // Crear o actualizar acta
                var acta = await _db.Actas.FirstOrDefaultAsync(a => a.AsignacionId == asignacionId);
                if (acta == null)
                {
                    acta = new Acta
                    {
                        AsignacionId = asignacionId,
                        Estado = "Firmada",
                        MetodoFirma = "Digital",
                        NombreArchivo = currentUser.SignaturePath.Split('/').Last(),
                        RutaArchivo = currentUser.SignaturePath,
                        FechaFirma = DateTime.Now,
                        FechaSubida = DateTime.Now,
                        Observaciones = string.IsNullOrEmpty(observaciones) ? "Firma digital del perfil aplicada por el usuario" : observaciones
                    };
                    _db.Actas.Add(acta);
                }
                else
                {
                    acta.Estado = "Firmada";
                    acta.MetodoFirma = "Digital";
                    acta.NombreArchivo = currentUser.SignaturePath.Split('/').Last();
                    acta.RutaArchivo = currentUser.SignaturePath;
                    acta.FechaFirma = DateTime.Now;
                    acta.FechaSubida = DateTime.Now;
                    acta.Observaciones = string.IsNullOrEmpty(observaciones) ? "Firma digital del perfil actualizada por el usuario" : observaciones;
                }

                await _db.SaveChangesAsync();

                // Notificar a admins que el usuario ha firmado el acta
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    
                    // Notificar a todos los admins/soporte que un usuario ha firmado un acta
                    await notificationService.CreateForAdminsAsync(new CreateNotificationDto
                    {
                        UserId = 0, // Se asignará a todos los admins
                        Tipo = "acta",
                        Titulo = "Acta firmada por usuario",
                        Mensaje = $"{asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido} ha firmado un acta para el activo: {asignacion.Activo.Codigo}",
                        RefTipo = "Acta",
                        RefId = acta.Id,
                        Ruta = $"/actas/{acta.Id}"
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando firma de acta a admins: {ex.Message}");
                }

                _logger.LogInformation($"Acta guardada exitosamente. ID: {acta.Id}, Estado: {acta.Estado}, Método: {acta.MetodoFirma}");

                return Ok(new { 
                    message = "Acta firmada digitalmente con tu firma del perfil",
                    fileName = currentUser.SignaturePath.Split('/').Last(),
                    actaId = acta.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir firma digital");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        private string GenerateActaFileName(NominaUsuario usuario, string categoria, bool isAdmin = false)
        {
            string baseName = $"Acta de entrega - {usuario.Nombre} {usuario.Apellido}";
            
            // Verificar si ya existe un acta para este usuario y categoría
            var existingActas = _db.Actas
                .Include(a => a.Asignacion)
                .ThenInclude(aa => aa.Activo)
                .Where(a => a.Asignacion.UsuarioId == usuario.Id && 
                           a.Asignacion.Activo.Categoria == categoria)
                .ToList();

            if (existingActas.Count == 0)
            {
                // Primer acta para este usuario y categoría
                return $"{baseName}.pdf";
            }
            else
            {
                // Ya existe al menos un acta, agregar fecha
                string dateSuffix = DateTime.Now.ToString("dd-MM-yyyy");
                return $"{baseName} {dateSuffix}.pdf";
            }
        }

        private string GetCategoriaFolder(string categoria)
        {
            // Normalizar nombre de categoría para usar como nombre de carpeta
            return categoria.Replace(" ", "_").Replace("/", "_").Replace("\\", "_");
        }

        [HttpPost("subir-pdf")]
        public async Task<IActionResult> SubirPdf(IFormFile acta, [FromForm] int asignacionId, [FromForm] string observaciones = "")
        {
            try
            {
                _logger.LogInformation($"SubirPdf llamado - asignacionId: {asignacionId}, acta: {(acta != null ? acta.FileName : "null")}, observaciones: {observaciones}");
                _logger.LogInformation($"Request.Form.Keys: {string.Join(", ", Request.Form.Keys)}");
                _logger.LogInformation($"Request.Form: {string.Join(", ", Request.Form.Select(kv => $"{kv.Key}={kv.Value}"))}");
                
                // Verificar que el usuario esté autenticado
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var userId = userIdClaim?.Value;
                if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int id))
                    return Unauthorized("Usuario no autenticado.");

                // Verificar que la asignación existe y pertenece al usuario
                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == asignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                // Verificar que el usuario es el propietario de la asignación
                var userEmailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
                var userEmail = userEmailClaim?.Value;
                if (asignacion.Usuario.Email != userEmail)
                    return Forbid("No tienes permisos para subir acta para esta asignación");

                if (acta == null || acta.Length == 0)
                    return BadRequest("No se proporcionó ningún archivo");

                if (!acta.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Solo se permiten archivos PDF");

                // Crear estructura de carpetas: wwwroot/actas/categoria/
                string categoriaFolder = GetCategoriaFolder(asignacion.Activo.Categoria);
                string uploadsDir = Path.Combine("wwwroot", "actas", categoriaFolder);
                Directory.CreateDirectory(uploadsDir);

                // Generar nombre de archivo según el formato especificado
                string fileName = GenerateActaFileName(asignacion.Usuario, asignacion.Activo.Categoria);
                string filePath = Path.Combine(uploadsDir, fileName);

                // Guardar archivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await acta.CopyToAsync(stream);
                }

                // Crear o actualizar acta
                var actaDb = await _db.Actas.FirstOrDefaultAsync(a => a.AsignacionId == asignacionId);
                if (actaDb == null)
                {
                    actaDb = new Acta
                    {
                        AsignacionId = asignacionId,
                        Estado = "Firmada",
                        MetodoFirma = "PDF_Subido",
                        NombreArchivo = fileName,
                        RutaArchivo = $"actas/{categoriaFolder}/{fileName}",
                        FechaFirma = DateTime.Now,
                        FechaSubida = DateTime.Now,
                        Observaciones = string.IsNullOrEmpty(observaciones) ? "PDF firmado subido por el usuario" : observaciones
                    };
                    _db.Actas.Add(actaDb);
                }
                else
                {
                    actaDb.Estado = "Firmada";
                    actaDb.MetodoFirma = "PDF_Subido";
                    actaDb.NombreArchivo = fileName;
                    actaDb.RutaArchivo = $"actas/{categoriaFolder}/{fileName}";
                    actaDb.FechaFirma = DateTime.Now;
                    actaDb.FechaSubida = DateTime.Now;
                    actaDb.Observaciones = string.IsNullOrEmpty(observaciones) ? "PDF firmado actualizado por el usuario" : observaciones;
                }

                await _db.SaveChangesAsync();

                // Notificar a admins que el usuario ha subido un acta firmado
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    
                    // Notificar a todos los admins/soporte que un usuario ha subido un acta firmado
                    await notificationService.CreateForAdminsAsync(new CreateNotificationDto
                    {
                        UserId = 0, // Se asignará a todos los admins
                        Tipo = "acta",
                        Titulo = "Acta firmada subida por usuario",
                        Mensaje = $"{asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido} ha subido un acta firmado para el activo: {asignacion.Activo.Codigo}",
                        RefTipo = "Acta",
                        RefId = actaDb.Id,
                        Ruta = $"/actas/{actaDb.Id}"
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando subida de acta a admins: {ex.Message}");
                }

                return Ok(new { 
                    message = "Acta PDF subida exitosamente",
                    fileName = fileName,
                    actaId = actaDb.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir acta PDF");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("subir-admin")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> SubirActaAdmin(IFormFile acta, [FromForm] int asignacionId, [FromForm] string observaciones = "")
        {
            try
            {
                _logger.LogInformation($"SubirActaAdmin llamado - asignacionId: {asignacionId}, acta: {(acta != null ? acta.FileName : "null")}, observaciones: {observaciones}");
                
                if (acta == null || acta.Length == 0)
                    return BadRequest("No se proporcionó ningún archivo");

                if (!acta.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Solo se permiten archivos PDF");

                // Verificar que la asignación existe
                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == asignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                // Crear estructura de carpetas: wwwroot/actas/categoria/
                string categoriaFolder = GetCategoriaFolder(asignacion.Activo.Categoria);
                string uploadsDir = Path.Combine("wwwroot", "actas", categoriaFolder);
                Directory.CreateDirectory(uploadsDir);

                // Generar nombre de archivo según el formato especificado
                string fileName = GenerateActaFileName(asignacion.Usuario, asignacion.Activo.Categoria, true);
                string filePath = Path.Combine(uploadsDir, fileName);

                // Guardar archivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await acta.CopyToAsync(stream);
                }

                // Obtener el usuario que sube la acta
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int? aprobadoPorId = null;
                if (int.TryParse(currentUserId, out int adminId))
                {
                    aprobadoPorId = adminId;
                }

                // Crear o actualizar acta
                var actaDb = await _db.Actas.FirstOrDefaultAsync(a => a.AsignacionId == asignacionId);
                if (actaDb == null)
                {
                    actaDb = new Acta
                    {
                        AsignacionId = asignacionId,
                        Estado = "Firmada",
                        MetodoFirma = "Admin_Subida",
                        NombreArchivo = fileName,
                        RutaArchivo = $"actas/{categoriaFolder}/{fileName}",
                        FechaFirma = DateTime.Now,
                        FechaSubida = DateTime.Now,
                        AprobadoPorId = aprobadoPorId,
                        Observaciones = observaciones
                    };
                    _db.Actas.Add(actaDb);
                }
                else
                {
                    actaDb.Estado = "Firmada";
                    actaDb.MetodoFirma = "Admin_Subida";
                    actaDb.NombreArchivo = fileName;
                    actaDb.RutaArchivo = $"actas/{categoriaFolder}/{fileName}";
                    actaDb.FechaFirma = DateTime.Now;
                    actaDb.FechaSubida = DateTime.Now;
                    actaDb.AprobadoPorId = aprobadoPorId;
                    actaDb.Observaciones = observaciones;
                }

                await _db.SaveChangesAsync();

                // Notificar al usuario que admin/soporte ha subido un acta
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    
                    await notificationService.CreateAsync(new CreateNotificationDto
                    {
                        UserId = asignacion.UsuarioId,
                        Tipo = "acta",
                        Titulo = "Acta subida por administrador",
                        Mensaje = $"Se ha subido un acta para el activo {asignacion.Activo?.Codigo} por parte del administrador/soporte.",
                        RefTipo = "Acta",
                        RefId = actaDb.Id,
                        Ruta = $"/actas/{actaDb.Id}"
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando subida de acta por admin: {ex.Message}");
                }

                return Ok(new { 
                    message = "Acta subida exitosamente",
                    fileName = fileName,
                    actaId = actaDb.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("{actaId}/aprobar")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> AprobarActa(int actaId, [FromBody] AprobarActaRequest request)
        {
            try
            {
                Console.WriteLine($"=== APROBAR ACTA INICIADO ===");
                Console.WriteLine($"DEBUG: AprobarActa llamado - actaId: {actaId}");
                Console.WriteLine($"DEBUG: AprobarActa - request.Aprobar: {request.Aprobar}");
                Console.WriteLine($"DEBUG: AprobarActa - request.Comentarios: {request.Comentarios}");
                Console.WriteLine($"DEBUG: AprobarActa - Usuario actual: {User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value}");
                
                _logger.LogInformation($"AprobarActa llamado - actaId: {actaId}, aprobar: {request.Aprobar}, comentarios: {request.Comentarios}");
                
                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Usuario)
                    .FirstOrDefaultAsync(a => a.Id == actaId);

                if (acta == null)
                {
                    Console.WriteLine($"DEBUG: Acta no encontrada con ID: {actaId}");
                    _logger.LogWarning($"Acta no encontrada con ID: {actaId}");
                    return NotFound("Acta no encontrada");
                }

                Console.WriteLine($"DEBUG: Acta encontrada - ID: {acta.Id}");
                Console.WriteLine($"DEBUG: Acta encontrada - Estado: {acta.Estado}");
                Console.WriteLine($"DEBUG: Acta encontrada - MetodoFirma: {acta.MetodoFirma}");
                Console.WriteLine($"DEBUG: Acta encontrada - UsuarioId: {acta.Asignacion?.UsuarioId}");
                
                _logger.LogInformation($"Acta encontrada - Estado: {acta.Estado}, MetodoFirma: {acta.MetodoFirma}");

                // Permitir aprobar/rechazar si:
                // 1. Es una acta firmada (estado "Firmada")
                // 2. O es una acta subida por admin/soporte (MetodoFirma "Admin_Subida")
                // 3. O es una acta ya rechazada (para actualizar comentarios)
                if (acta.Estado != "Firmada" && acta.MetodoFirma != "Admin_Subida" && acta.Estado != "Rechazada")
                {
                    _logger.LogWarning($"Acta con estado incorrecto: {acta.Estado}, MetodoFirma: {acta.MetodoFirma}. Se requiere 'Firmada', 'Admin_Subida' o 'Rechazada'");
                    return BadRequest("Solo se pueden aprobar actas firmadas, subidas por admin/soporte, o actualizar comentarios de actas rechazadas");
                }

                // Obtener el usuario que aprueba
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int? aprobadoPorId = null;
                if (int.TryParse(currentUserId, out int adminId))
                {
                    aprobadoPorId = adminId;
                }

                // Si el acta ya está rechazado, solo actualizar comentarios
                if (acta.Estado == "Rechazada" && !request.Aprobar)
                {
                    _logger.LogInformation($"Actualizando comentarios de acta rechazada - ActaId: {actaId}");
                    acta.ComentariosAprobacion = request.Comentarios;
                    // No cambiar estado ni fecha de aprobación
                }
                else
                {
                    // Cambiar estado solo si no estaba rechazado
                    acta.Estado = request.Aprobar ? "Aprobada" : "Rechazada";
                    acta.FechaAprobacion = DateTime.Now;
                    acta.AprobadoPorId = aprobadoPorId;
                    acta.ComentariosAprobacion = request.Comentarios;
                }

                await _db.SaveChangesAsync();

                // Notificar aprobación o rechazo
                try
                {
                    _logger.LogInformation($"Iniciando notificación - UsuarioId: {acta.Asignacion.UsuarioId}, Aprobar: {request.Aprobar}");
                    Console.WriteLine($"DEBUG: Iniciando notificación - UsuarioId: {acta.Asignacion.UsuarioId}, Aprobar: {request.Aprobar}");
                    
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    
                    if (request.Aprobar)
                    {
                        // Notificar aprobación al usuario
                        var notificationId = await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = acta.Asignacion.UsuarioId,
                            Tipo = "acta",
                            Titulo = "Acta aprobada",
                            Mensaje = $"Tu acta para el activo {acta.Asignacion.Activo?.Codigo} ha sido aprobada",
                            RefTipo = "Acta",
                            RefId = acta.Id,
                            Ruta = $"/actas/{acta.Id}"
                        });
                        
                        _logger.LogInformation($"Notificación de aprobación creada exitosamente - ID: {notificationId}");
                        Console.WriteLine($"DEBUG: Notificación de aprobación creada exitosamente - ID: {notificationId}");
                    }
                    else
                    {
                        // Notificar rechazo al usuario
                        var notificationId = await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = acta.Asignacion.UsuarioId,
                            Tipo = "acta",
                            Titulo = "Acta rechazada",
                            Mensaje = $"Tu acta para el activo {acta.Asignacion.Activo?.Codigo} ha sido rechazada: {request.Comentarios}",
                            RefTipo = "Acta",
                            RefId = acta.Id,
                            Ruta = $"/actas/{acta.Id}"
                        });
                        
                        _logger.LogInformation($"Notificación de rechazo creada exitosamente - ID: {notificationId}");
                        Console.WriteLine($"DEBUG: Notificación de rechazo creada exitosamente - ID: {notificationId}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error notificando aprobación/rechazo - UsuarioId: {acta.Asignacion.UsuarioId}, Aprobar: {request.Aprobar}");
                    Console.WriteLine($"ERROR: Error notificando aprobación/rechazo: {ex.Message}");
                    Console.WriteLine($"ERROR: Stack trace: {ex.StackTrace}");
                }

                return Ok(new { 
                    message = request.Aprobar ? "Acta aprobada exitosamente" : "Acta rechazada",
                    actaId = acta.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al aprobar/rechazar acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "ActasController funcionando correctamente" });
        }

        [HttpGet("previsualizar/{asignacionId}")]
        public async Task<IActionResult> PrevisualizarActa(int asignacionId)
        {
            try
            {
                // Verificar que el usuario esté autenticado
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var userId = userIdClaim?.Value;
                if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int id))
                    return Unauthorized("Usuario no autenticado.");

                // Verificar que la asignación existe
                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == asignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                // Verificar permisos: el propietario o admin/support pueden ver
                var userEmailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
                var userEmail = userEmailClaim?.Value;
                var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                
                // Solo el propietario, admin o soporte pueden previsualizar
                if (asignacion.Usuario.Email != userEmail && 
                    userRole != "admin" && userRole != "soporte")
                {
                    return Forbid("No tienes permisos para previsualizar esta acta");
                }

                // Obtener la firma de cualquier admin/support
                string? adminSignaturePath = null;
                
                // Buscar cualquier admin/support con firma
                var adminUser = await _db.AuthUsers
                    .FirstOrDefaultAsync(u => (u.Role == "admin" || u.Role == "soporte") && !string.IsNullOrEmpty(u.SignaturePath));
                
                _logger.LogInformation($"Admin encontrado para previsualización: {adminUser?.Username}, SignaturePath: {adminUser?.SignaturePath}");
                
                adminSignaturePath = adminUser?.SignaturePath;
                
                _logger.LogInformation($"Firma final del admin para previsualización: {adminSignaturePath}");

                // Generar PDF con la firma del admin/support usando el nuevo método
                byte[] pdfBytes = _pdfService.GenerateActaEntregaWithSignatures(asignacion, asignacion.Activo, asignacion.Usuario, adminSignaturePath, null, asignacion.FechaAsignacion);

                // Devolver PDF para previsualización en navegador
                string fileName = $"Acta de entrega - {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al previsualizar acta para asignación {AsignacionId}", asignacionId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("previsualizar-firmado/{actaId}")]
        public async Task<IActionResult> PrevisualizarActaFirmado(int actaId)
        {
            try
            {
                // Verificar que el acta existe
                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Usuario)
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .FirstOrDefaultAsync(a => a.Id == actaId);

                if (acta == null)
                    return NotFound("Acta no encontrada");

                // Verificar permisos: el propietario o admin/support pueden ver
                var userEmailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
                var userEmail = userEmailClaim?.Value;
                var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                
                // Solo el propietario, admin o soporte pueden previsualizar
                if (acta.Asignacion.Usuario.Email != userEmail && 
                    userRole != "admin" && userRole != "soporte")
                {
                    return Forbid("No tienes permisos para previsualizar esta acta");
                }

                // Verificar que el acta está firmado
                if (acta.Estado?.ToLower() != "firmada")
                    return BadRequest("El acta no está firmado");

                // Obtener la firma actual del usuario desde su perfil (no la guardada en el acta)
                string? userSignaturePath = null;
                var userAuth = await _db.AuthUsers
                    .FirstOrDefaultAsync(u => u.Username == acta.Asignacion.Usuario.Email);
                
                if (userAuth != null && !string.IsNullOrEmpty(userAuth.SignaturePath))
                {
                    userSignaturePath = userAuth.SignaturePath;
                }

                // Obtener la firma de cualquier admin/support para incluir en el PDF
                string? adminSignaturePath = null;
                var adminUser = await _db.AuthUsers
                    .FirstOrDefaultAsync(u => (u.Role == "admin" || u.Role == "soporte") && !string.IsNullOrEmpty(u.SignaturePath));
                
                adminSignaturePath = adminUser?.SignaturePath;
                _logger.LogInformation($"Firma de admin para incluir en PDF: {adminSignaturePath}");
                _logger.LogInformation($"Firma actual del usuario: {userSignaturePath}");

                // Generar PDF con ambas firmas usando el nuevo método
                byte[] pdfBytes = _pdfService.GenerateActaEntregaWithSignatures(acta.Asignacion, acta.Asignacion.Activo, acta.Asignacion.Usuario, adminSignaturePath, userSignaturePath, acta.Asignacion.FechaAsignacion);

                // Devolver PDF para previsualización en navegador
                string fileName = $"Acta de entrega - {acta.Asignacion.Usuario.Nombre} {acta.Asignacion.Usuario.Apellido}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al previsualizar acta firmado {ActaId}", actaId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("{actaId}/descargar")]
        public async Task<IActionResult> DescargarActa(int actaId)
        {
            try
            {
                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Usuario)
                    .FirstOrDefaultAsync(a => a.Id == actaId);

                if (acta == null)
                    return NotFound("Acta no encontrada");

                // Verificar permisos
                var userEmailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
                var userEmail = userEmailClaim?.Value;
                var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

                // Solo el propietario, admin o soporte pueden descargar
                if (acta.Asignacion.Usuario.Email != userEmail && 
                    userRole != "admin" && userRole != "soporte")
                {
                    return Forbid("No tienes permisos para descargar esta acta");
                }

                if (string.IsNullOrEmpty(acta.RutaArchivo))
                    return NotFound("Archivo no encontrado");

                string filePath = Path.Combine("wwwroot", acta.RutaArchivo);
                if (!System.IO.File.Exists(filePath))
                    return NotFound("Archivo no encontrado en el servidor");

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                
                // Generar nombre de archivo para descarga según el formato especificado
                string downloadFileName = acta.NombreArchivo ?? $"Acta de entrega - {acta.Asignacion.Usuario.Nombre} {acta.Asignacion.Usuario.Apellido}.pdf";

                return File(fileBytes, "application/pdf", downloadFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al descargar acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("previsualizar-personalizada/{id}")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> PrevisualizarActaPersonalizada(int id, [FromQuery] bool? incluirFirmaTI = true, [FromQuery] string? fechaEntrega = null)
        {
            try
            {
                _logger.LogInformation($"PrevisualizarActaPersonalizada - ID: {id}, IncluirFirmaTI: {incluirFirmaTI}, FechaEntrega: {fechaEntrega}");
                
                // Determinar si es un actaId o asignacionId
                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Usuario)
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (acta != null)
                {
                    _logger.LogInformation($"Encontrada acta con ID: {acta.Id}");
                    // Es un actaId - previsualizar acta existente
                    return await PrevisualizarActaFirmado(id);
                }
                else
                {
                    _logger.LogInformation($"No se encontró acta, buscando asignación con ID: {id}");
                    // Es un asignacionId - generar nueva acta
                    var asignacion = await _db.AsignacionesActivos
                        .Include(a => a.Usuario)
                        .Include(a => a.Activo)
                        .FirstOrDefaultAsync(a => a.Id == id);

                    if (asignacion == null)
                    {
                        _logger.LogWarning($"No se encontró asignación con ID: {id}");
                        return NotFound("Asignación no encontrada");
                    }

                    _logger.LogInformation($"Encontrada asignación: {asignacion.Id}, Usuario: {asignacion.Usuario.Nombre}, Activo: {asignacion.Activo.Codigo}");

                    // Obtener firma de admin/soporte solo si se solicita
                    string? adminSignaturePath = null;
                    if (incluirFirmaTI == true)
                    {
                        var adminUser = await _db.AuthUsers
                            .FirstOrDefaultAsync(u => u.Role == "admin" || u.Role == "soporte");

                        if (adminUser != null && !string.IsNullOrEmpty(adminUser.SignaturePath))
                        {
                            adminSignaturePath = adminUser.SignaturePath;
                            _logger.LogInformation($"Firma de admin encontrada: {adminSignaturePath}");
                        }
                        else
                        {
                            _logger.LogWarning("No se encontró usuario admin/soporte con firma");
                        }
                    }

                    // Usar fecha personalizada si se proporciona, sino usar fecha actual
                    DateTime fechaEntregaDate = DateTime.Now;
                    if (!string.IsNullOrEmpty(fechaEntrega) && DateTime.TryParse(fechaEntrega, out DateTime parsedDate))
                    {
                        fechaEntregaDate = parsedDate;
                        _logger.LogInformation($"Usando fecha personalizada: {fechaEntregaDate}");
                    }
                    else
                    {
                        _logger.LogInformation($"Usando fecha actual: {fechaEntregaDate}");
                    }

                    // Generar PDF con parámetros personalizados
                    _logger.LogInformation("Generando PDF con parámetros personalizados");
                    var pdfBytes = _pdfService.GenerateActaEntregaWithSignatures(
                        asignacion, 
                        asignacion.Activo, 
                        asignacion.Usuario, 
                        adminSignaturePath, 
                        null, // sin firma de usuario para nueva acta
                        fechaEntregaDate
                    );

                    _logger.LogInformation($"PDF generado exitosamente, tamaño: {pdfBytes.Length} bytes");
                    return File(pdfBytes, "application/pdf");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al previsualizar acta personalizada");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("marcar-pendiente-firma")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> MarcarPendienteFirma([FromBody] MarcarPendienteFirmaRequest request)
        {
            try
            {
                _logger.LogInformation($"MarcarPendienteFirma llamado - asignacionId: {request.AsignacionId}");
                
                // Verificar que la asignación existe y está activa
                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == request.AsignacionId);

                if (asignacion == null)
                {
                    _logger.LogWarning($"Asignación no encontrada con ID: {request.AsignacionId}");
                    return NotFound("Asignación no encontrada");
                }

                if (asignacion.Estado != "Activa")
                {
                    _logger.LogWarning($"Asignación {request.AsignacionId} no está activa. Estado: {asignacion.Estado}");
                    return BadRequest("Solo se pueden marcar como pendiente de firma las asignaciones activas");
                }

                // Verificar si ya existe un acta para esta asignación
                var actaExistente = await _db.Actas
                    .FirstOrDefaultAsync(a => a.AsignacionId == request.AsignacionId);

                if (actaExistente != null)
                {
                    _logger.LogWarning($"Ya existe un acta para la asignación {request.AsignacionId}. ID del acta: {actaExistente.Id}");
                    
                    // Si ya existe un acta, actualizar su estado a "Pendiente" en lugar de crear uno nuevo
                    actaExistente.Estado = "Pendiente";
                    actaExistente.MetodoFirma = "Pendiente";
                    actaExistente.FechaCreacion = DateTime.Now;
                    actaExistente.Observaciones = request.Observaciones ?? "Acta marcada como pendiente de firma por admin/soporte";
                    
                    await _db.SaveChangesAsync();
                    
                    _logger.LogInformation($"Acta existente actualizada a pendiente. ID: {actaExistente.Id}");
                    
                    return Ok(new { 
                        message = "Acta marcada como pendiente de firma exitosamente",
                        actaId = actaExistente.Id,
                        asignacionId = request.AsignacionId
                    });
                }

                // Crear nuevo acta pendiente
                var nuevaActa = new Acta
                {
                    AsignacionId = request.AsignacionId,
                    Estado = "Pendiente",
                    MetodoFirma = "Pendiente",
                    FechaCreacion = DateTime.Now,
                    Observaciones = request.Observaciones ?? "Acta marcada como pendiente de firma por admin/soporte"
                };

                _db.Actas.Add(nuevaActa);
                await _db.SaveChangesAsync();

                // Notificar al usuario que se ha marcado como pendiente de firma
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    
                    await notificationService.CreateAsync(new CreateNotificationDto
                    {
                        UserId = asignacion.UsuarioId,
                        Tipo = "acta",
                        Titulo = "Acta pendiente de firma",
                        Mensaje = $"Se ha marcado como pendiente de firma tu acta para el activo {asignacion.Activo?.Codigo}. Por favor, firma y sube el acta.",
                        RefTipo = "Acta",
                        RefId = nuevaActa.Id,
                        Ruta = $"/actas/{nuevaActa.Id}"
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando pendiente de firma: {ex.Message}");
                }

                _logger.LogInformation($"Acta pendiente creada exitosamente. ID: {nuevaActa.Id}");

                return Ok(new { 
                    message = "Acta marcada como pendiente de firma exitosamente",
                    actaId = nuevaActa.Id,
                    asignacionId = request.AsignacionId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar como pendiente de firma");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpDelete("{actaId}")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> EliminarActa(int actaId)
        {
            try
            {
                var acta = await _db.Actas.FindAsync(actaId);
                if (acta == null)
                    return NotFound("Acta no encontrada");

                // Eliminar archivo si existe
                if (!string.IsNullOrEmpty(acta.RutaArchivo))
                {
                    string filePath = Path.Combine("wwwroot", acta.RutaArchivo);
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }

                _db.Actas.Remove(acta);
                await _db.SaveChangesAsync();

                return Ok(new { message = "Acta eliminada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        public class AprobarActaRequest
        {
            public bool Aprobar { get; set; }
            public string? Comentarios { get; set; }
        }

        public class MarcarPendienteFirmaRequest
        {
            public int AsignacionId { get; set; }
            public string? Observaciones { get; set; }
        }

        [HttpPost("test-simple")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> TestSimple([FromBody] TestSimpleRequest request)
        {
            try
            {
                Console.WriteLine($"=== TEST SIMPLE INICIADO ===");
                Console.WriteLine($"DEBUG: TestSimple - actaId: {request.ActaId}");
                Console.WriteLine($"DEBUG: TestSimple - aprobar: {request.Aprobar}");
                Console.WriteLine($"DEBUG: TestSimple - comentarios: {request.Comentarios}");
                
                // Simular exactamente lo que hace AprobarActa pero sin validaciones complejas
                var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                
                var notificationId = await notificationService.CreateAsync(new CreateNotificationDto
                {
                    UserId = request.UserId,
                    Tipo = "test",
                    Titulo = request.Aprobar ? "Test Aprobación" : "Test Rechazo",
                    Mensaje = request.Aprobar ? "Test de aprobación simple" : $"Test de rechazo simple: {request.Comentarios}",
                    RefTipo = "Test",
                    RefId = request.ActaId,
                    Ruta = "/test"
                });
                
                Console.WriteLine($"DEBUG: TestSimple - Notificación creada exitosamente - ID: {notificationId}");
                
                return Ok(new { 
                    message = "Test simple completado exitosamente",
                    notificationId = notificationId,
                    actaId = request.ActaId,
                    aprobar = request.Aprobar
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: TestSimple - Error: {ex.Message}");
                Console.WriteLine($"ERROR: TestSimple - Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class TestSimpleRequest
        {
            public int ActaId { get; set; }
            public bool Aprobar { get; set; }
            public string Comentarios { get; set; } = "";
            public int UserId { get; set; }
        }
    }
} 