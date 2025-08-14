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

        #region CONSULTAS

        [HttpGet("mis-actas")]
        public async Task<ActionResult<IEnumerable<object>>> GetMisActas()
        {
            try
            {
                var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Usuario no autenticado.");

                var usuario = await _db.NominaUsuarios.FirstOrDefaultAsync(u => u.Email == userEmail);
                if (usuario == null)
                    return NotFound("Usuario no encontrado en la nómina.");

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

        [HttpGet("asignacion/{asignacionId}")]
        public async Task<ActionResult<object>> GetByAsignacionId(int asignacionId)
        {
            try
            {
                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .Include(a => a.Asignacion.Usuario)
                    .Include(a => a.AprobadoPor)
                    .Where(a => a.AsignacionId == asignacionId)
                    .OrderByDescending(a => a.FechaCreacion)
                    .FirstOrDefaultAsync();

                if (acta == null)
                    return NotFound("No se encontró acta para esta asignación");

                var result = new
                {
                    acta.Id,
                    acta.Estado,
                    acta.MetodoFirma,
                    acta.NombreArchivo,
                    acta.Observaciones,
                    acta.FechaCreacion,
                    acta.FechaFirma,
                    acta.FechaAprobacion,
                    acta.ComentariosAprobacion,
                    Asignacion = new
                    {
                        acta.Asignacion.Id,
                        acta.Asignacion.FechaAsignacion,
                        Activo = new
                        {
                            acta.Asignacion.Activo.Codigo,
                            acta.Asignacion.Activo.Categoria,
                            acta.Asignacion.Activo.NombreEquipo
                        },
                        Usuario = new
                        {
                            acta.Asignacion.Usuario.Nombre,
                            acta.Asignacion.Usuario.Apellido,
                            acta.Asignacion.Usuario.Email
                        }
                    },
                    AprobadoPor = acta.AprobadoPor != null ? new
                    {
                        acta.AprobadoPor.Username,
                        acta.AprobadoPor.Role
                    } : null
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener acta por asignación {AsignacionId}", asignacionId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        #endregion

        #region ACCIONES DE ACTA

        [HttpPost("marcar-pendiente-firma")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> MarcarPendienteFirma([FromBody] MarcarPendienteFirmaRequest request)
        {
            try
            {
                _logger.LogInformation($"MarcarPendienteFirma - asignacionId: {request.AsignacionId}");
                
                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == request.AsignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                if (asignacion.Estado != "Activa")
                    return BadRequest("Solo se pueden marcar como pendiente de firma las asignaciones activas");

                // Buscar acta existente o crear nueva
                var acta = await _db.Actas.FirstOrDefaultAsync(a => a.AsignacionId == request.AsignacionId);
                
                if (acta == null)
                {
                    acta = new Acta
                    {
                        AsignacionId = request.AsignacionId,
                        Estado = "Pendiente",
                        MetodoFirma = "Pendiente",
                        FechaCreacion = DateTime.Now,
                        Observaciones = request.Observaciones ?? "Acta marcada como pendiente de firma por admin/soporte"
                    };
                    _db.Actas.Add(acta);
                }
                else
                {
                    // Actualizar acta existente
                    acta.Estado = "Pendiente";
                    acta.MetodoFirma = "Pendiente";
                    acta.FechaCreacion = DateTime.Now;
                    acta.Observaciones = request.Observaciones ?? "Acta marcada como pendiente de firma por admin/soporte";
                }

                await _db.SaveChangesAsync();

                // Notificar al usuario
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
                        RefId = acta.Id,
                        Ruta = $"/actas/{acta.Id}"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al enviar notificación");
                }

                return Ok(new { 
                    message = "Acta marcada como pendiente de firma exitosamente",
                    actaId = acta.Id,
                    asignacionId = request.AsignacionId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar como pendiente de firma");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("firmar-digital")]
        public async Task<IActionResult> FirmarDigital([FromForm] int asignacionId, [FromForm] string observaciones = "")
        {
            try
            {
                _logger.LogInformation($"FirmarDigital - asignacionId: {asignacionId}");
                
                var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Usuario no autenticado.");

                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == asignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                if (asignacion.Usuario.Email != userEmail)
                    return Forbid("No tienes permisos para firmar esta acta");

                var currentUser = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Username == userEmail);
                if (currentUser == null || string.IsNullOrEmpty(currentUser.SignaturePath))
                {
                    return BadRequest(new { 
                        message = "No tienes una firma digital configurada. Sube una firma en tu perfil.",
                        options = new {
                            uploadSignature = "Ve a 'Mi Perfil' para subir tu firma digital",
                            uploadPdf = "O puedes descargar el acta y subirlo firmado manualmente"
                        }
                    });
                }

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

                // Buscar acta existente o crear nueva
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
                    // Actualizar acta existente
                    acta.Estado = "Firmada";
                    acta.MetodoFirma = "Digital";
                    acta.NombreArchivo = currentUser.SignaturePath.Split('/').Last();
                    acta.RutaArchivo = currentUser.SignaturePath;
                    acta.FechaFirma = DateTime.Now;
                    acta.FechaSubida = DateTime.Now;
                    acta.Observaciones = string.IsNullOrEmpty(observaciones) ? "Firma digital del perfil actualizada por el usuario" : observaciones;
                }

                await _db.SaveChangesAsync();

                // Notificar a admins
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    await notificationService.CreateForAdminsAsync(new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "acta",
                        Titulo = "Acta firmada por usuario",
                        Mensaje = $"El usuario {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido} ha firmado digitalmente el acta para el activo {asignacion.Activo?.Codigo}.",
                        RefTipo = "Acta",
                        RefId = acta.Id,
                        Ruta = $"/gestion-actas/{asignacionId}"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al enviar notificación a admins");
                }

                return Ok(new { 
                    message = "Acta firmada digitalmente exitosamente",
                    actaId = acta.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al firmar digitalmente");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("subir-pdf")]
        public async Task<IActionResult> SubirPdf(IFormFile acta, [FromForm] int asignacionId, [FromForm] string observaciones = "")
        {
            try
            {
                _logger.LogInformation($"SubirPdf - asignacionId: {asignacionId}");
                
                var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Usuario no autenticado.");

                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == asignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                if (asignacion.Usuario.Email != userEmail)
                    return Forbid("No tienes permisos para subir acta para esta asignación");

                if (acta == null || acta.Length == 0)
                    return BadRequest("No se proporcionó ningún archivo");

                if (!acta.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Solo se permiten archivos PDF");

                // Crear estructura de carpetas
                string categoriaFolder = GetCategoriaFolder(asignacion.Activo.Categoria);
                string uploadsDir = Path.Combine("wwwroot", "actas", categoriaFolder);
                Directory.CreateDirectory(uploadsDir);

                // Generar nombre de archivo
                string fileName = GenerateActaFileName(asignacion.Usuario, asignacion.Activo.Categoria);
                string filePath = Path.Combine(uploadsDir, fileName);

                // Guardar archivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await acta.CopyToAsync(stream);
                }

                // Buscar acta existente o crear nueva
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
                    // Actualizar acta existente
                    actaDb.Estado = "Firmada";
                    actaDb.MetodoFirma = "PDF_Subido";
                    actaDb.NombreArchivo = fileName;
                    actaDb.RutaArchivo = $"actas/{categoriaFolder}/{fileName}";
                    actaDb.FechaFirma = DateTime.Now;
                    actaDb.FechaSubida = DateTime.Now;
                    actaDb.Observaciones = string.IsNullOrEmpty(observaciones) ? "PDF firmado actualizado por el usuario" : observaciones;
                }

                await _db.SaveChangesAsync();

                // Notificar a admins
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    await notificationService.CreateForAdminsAsync(new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "acta",
                        Titulo = "Acta PDF subida por usuario",
                        Mensaje = $"El usuario {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido} ha subido un PDF firmado para el activo {asignacion.Activo?.Codigo}.",
                        RefTipo = "Acta",
                        RefId = actaDb.Id,
                        Ruta = $"/gestion-actas/{asignacionId}"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al enviar notificación a admins");
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
                _logger.LogInformation($"SubirActaAdmin - asignacionId: {asignacionId}");
                
                if (acta == null || acta.Length == 0)
                    return BadRequest("No se proporcionó ningún archivo");

                if (!acta.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Solo se permiten archivos PDF");

                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == asignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                // Crear estructura de carpetas
                string categoriaFolder = GetCategoriaFolder(asignacion.Activo.Categoria);
                string uploadsDir = Path.Combine("wwwroot", "actas", categoriaFolder);
                Directory.CreateDirectory(uploadsDir);

                // Generar nombre de archivo
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

                // Buscar acta existente o crear nueva
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
                    // Actualizar acta existente
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

                // Notificar al usuario
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
                    _logger.LogWarning(ex, "Error al enviar notificación al usuario");
                }

                return Ok(new { 
                    message = "Acta subida por administrador exitosamente",
                    fileName = fileName,
                    actaId = actaDb.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir acta por administrador");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("{actaId}/aprobar")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> AprobarActa(int actaId, [FromBody] AprobarActaRequest request)
        {
            try
            {
                _logger.LogInformation($"AprobarActa - actaId: {actaId}, aprobado: {request.Aprobar}");
                
                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Usuario)
                    .Include(a => a.Asignacion.Activo)
                    .FirstOrDefaultAsync(a => a.Id == actaId);

                if (acta == null)
                    return NotFound("Acta no encontrada");

                if (!acta.PuedeSerAprobada && !acta.PuedeSerRechazada)
                    return BadRequest("El acta no puede ser aprobada o rechazada en su estado actual");

                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int? aprobadoPorId = null;
                if (int.TryParse(currentUserId, out int adminId))
                {
                    aprobadoPorId = adminId;
                }

                if (request.Aprobar)
                {
                    acta.Estado = "Aprobada";
                    acta.FechaAprobacion = DateTime.Now;
                    acta.AprobadoPorId = aprobadoPorId;
                    acta.ComentariosAprobacion = request.Comentarios;

                    // Notificar al usuario
                    try
                    {
                        var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                        await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = acta.Asignacion.UsuarioId,
                            Tipo = "acta",
                            Titulo = "Acta aprobada",
                            Mensaje = $"Tu acta para el activo {acta.Asignacion.Activo?.Codigo} ha sido aprobada.",
                            RefTipo = "Acta",
                            RefId = acta.Id,
                            Ruta = $"/actas/{acta.Id}"
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error al enviar notificación de aprobación");
                    }
                }
                else
                {
                    acta.Estado = "Rechazada";
                    acta.FechaAprobacion = DateTime.Now;
                    acta.AprobadoPorId = aprobadoPorId;
                    acta.ComentariosAprobacion = request.Comentarios;

                    // Notificar al usuario
                    try
                    {
                        var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                        await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = acta.Asignacion.UsuarioId,
                            Tipo = "acta",
                            Titulo = "Acta rechazada",
                            Mensaje = $"Tu acta para el activo {acta.Asignacion.Activo?.Codigo} ha sido rechazada. Motivo: {request.Comentarios}",
                            RefTipo = "Acta",
                            RefId = acta.Id,
                            Ruta = $"/actas/{acta.Id}"
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error al enviar notificación de rechazo");
                    }
                }

                await _db.SaveChangesAsync();

                return Ok(new { 
                    message = $"Acta {(request.Aprobar ? "aprobada" : "rechazada")} exitosamente",
                    actaId = acta.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        #endregion

        #region PREVISUALIZACIÓN Y DESCARGA

        [HttpGet("previsualizar/{asignacionId}")]
        public async Task<IActionResult> PrevisualizarActa(int asignacionId)
        {
            try
            {
                _logger.LogInformation($"PrevisualizarActa - asignacionId: {asignacionId}");
                
                var asignacion = await _db.AsignacionesActivos
                    .Include(a => a.Usuario)
                    .Include(a => a.Activo)
                    .FirstOrDefaultAsync(a => a.Id == asignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                // Obtener firma de admin/soporte
                string? adminSignaturePath = null;
                var adminUser = await _db.AuthUsers
                    .FirstOrDefaultAsync(u => (u.Role == "admin" || u.Role == "soporte") && !string.IsNullOrEmpty(u.SignaturePath));
                
                adminSignaturePath = adminUser?.SignaturePath;

                // Generar PDF
                byte[] pdfBytes = _pdfService.GenerateActaEntregaWithSignatures(asignacion, asignacion.Activo, asignacion.Usuario, adminSignaturePath, null, asignacion.FechaAsignacion);

                string fileName = $"Acta de entrega - {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al previsualizar acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("previsualizar-firmado/{actaId}")]
        public async Task<IActionResult> PrevisualizarActaFirmado(int actaId)
        {
            try
            {
                _logger.LogInformation($"PrevisualizarActaFirmado - actaId: {actaId}");
                
                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Usuario)
                    .Include(a => a.Asignacion.Activo)
                    .FirstOrDefaultAsync(a => a.Id == actaId);

                if (acta == null)
                    return NotFound("Acta no encontrada");

                // Obtener la firma actual del usuario
                string? userSignaturePath = null;
                var userAuth = await _db.AuthUsers
                    .FirstOrDefaultAsync(u => u.Username == acta.Asignacion.Usuario.Email);
                
                if (userAuth != null && !string.IsNullOrEmpty(userAuth.SignaturePath))
                {
                    userSignaturePath = userAuth.SignaturePath;
                }

                // Obtener la firma de admin/soporte
                string? adminSignaturePath = null;
                var adminUser = await _db.AuthUsers
                    .FirstOrDefaultAsync(u => (u.Role == "admin" || u.Role == "soporte") && !string.IsNullOrEmpty(u.SignaturePath));
                
                adminSignaturePath = adminUser?.SignaturePath;

                // Generar PDF con ambas firmas
                byte[] pdfBytes = _pdfService.GenerateActaEntregaWithSignatures(acta.Asignacion, acta.Asignacion.Activo, acta.Asignacion.Usuario, adminSignaturePath, userSignaturePath, acta.Asignacion.FechaAsignacion);

                string fileName = $"Acta de entrega - {acta.Asignacion.Usuario.Nombre} {acta.Asignacion.Usuario.Apellido}.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al previsualizar acta firmado");
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
                    .Include(a => a.Asignacion.Activo)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (acta != null)
                {
                    // Es un actaId - previsualizar acta existente
                    return await PrevisualizarActaFirmado(id);
                }
                else
                {
                    // Es un asignacionId - generar nueva acta
                    var asignacion = await _db.AsignacionesActivos
                        .Include(a => a.Usuario)
                        .Include(a => a.Activo)
                        .FirstOrDefaultAsync(a => a.Id == id);

                    if (asignacion == null)
                        return NotFound("Asignación no encontrada");

                    // Obtener firma de admin/soporte solo si se solicita
                    string? adminSignaturePath = null;
                    if (incluirFirmaTI == true)
                    {
                        var adminUser = await _db.AuthUsers
                            .FirstOrDefaultAsync(u => u.Role == "admin" || u.Role == "soporte");

                        if (adminUser != null && !string.IsNullOrEmpty(adminUser.SignaturePath))
                        {
                            adminSignaturePath = adminUser.SignaturePath;
                        }
                    }

                    // Generar PDF
                    byte[] pdfBytes = _pdfService.GenerateActaEntregaWithSignatures(asignacion, asignacion.Activo, asignacion.Usuario, adminSignaturePath, null, asignacion.FechaAsignacion);

                    string fileName = $"Acta de entrega - {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}.pdf";
                    return File(pdfBytes, "application/pdf", fileName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al previsualizar acta personalizada");
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
                var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
                var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

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
                string downloadFileName = acta.NombreArchivo ?? $"Acta de entrega - {acta.Asignacion.Usuario.Nombre} {acta.Asignacion.Usuario.Apellido}.pdf";

                return File(fileBytes, "application/pdf", downloadFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al descargar acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        #endregion

        #region UTILIDADES

        [HttpPost("subir-firma")]
        public async Task<IActionResult> SubirFirma(IFormFile firma)
        {
            try
            {
                var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Usuario no autenticado.");

                if (firma == null || firma.Length == 0)
                    return BadRequest("No se proporcionó ningún archivo");

                // Validar tipo de archivo (imagen)
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
                if (!allowedTypes.Contains(firma.ContentType.ToLower()))
                    return BadRequest("Solo se permiten archivos de imagen (JPEG, PNG, GIF)");

                var currentUser = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Username == userEmail);
                if (currentUser == null)
                    return NotFound("Usuario no encontrado");

                // Crear directorio de firmas si no existe
                string uploadsDir = Path.Combine("wwwroot", "signatures");
                Directory.CreateDirectory(uploadsDir);

                // Generar nombre de archivo único
                string fileName = $"signature_{currentUser.Id}_{DateTime.Now:yyyyMMddHHmmss}{Path.GetExtension(firma.FileName)}";
                string filePath = Path.Combine(uploadsDir, fileName);

                // Guardar archivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await firma.CopyToAsync(stream);
                }

                // Actualizar firma del usuario
                currentUser.SignaturePath = $"signatures/{fileName}";
                await _db.SaveChangesAsync();

                return Ok(new { 
                    message = "Firma subida exitosamente",
                    signaturePath = currentUser.SignaturePath
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir firma");
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

        #endregion

        #region MÉTODOS PRIVADOS

        private string GetCategoriaFolder(string categoria)
        {
            return categoria?.ToLower() switch
            {
                "laptop" => "Equipos",
                "desktop" => "Equipos",
                "monitor" => "Equipos",
                "teclado" => "Accesorios",
                "mouse" => "Accesorios",
                "impresora" => "Equipos",
                "scanner" => "Equipos",
                "tablet" => "Móviles",
                "celular" => "Móviles",
                "accesorio" => "Accesorios",
                _ => "Otros"
            };
        }

        private string GenerateActaFileName(NominaUsuario usuario, string categoria, bool isAdmin = false)
        {
            string prefix = isAdmin ? "Admin" : "Usuario";
            string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            return $"Acta de entrega - {usuario.Nombre} {usuario.Apellido} - {categoria} - {prefix}_{timestamp}.pdf";
        }

        #endregion
    }

    #region DTOs

    public class MarcarPendienteFirmaRequest
    {
        public int AsignacionId { get; set; }
        public string? Observaciones { get; set; }
    }

    public class AprobarActaRequest
    {
        public bool Aprobar { get; set; }
        public string? Comentarios { get; set; }
    }

    #endregion
} 