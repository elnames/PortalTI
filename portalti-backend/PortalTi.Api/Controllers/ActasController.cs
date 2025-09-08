using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using PortalTi.Api.Services;
using PortalTi.Api.Filters;
using System.Text.Json;
using System.Globalization;
using System.Text;

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
        private readonly IConfiguration _configuration;

        public ActasController(PortalTiContext db, ILogger<ActasController> logger, PdfService pdfService, IConfiguration configuration)
        {
            _db = db;
            _logger = logger;
            _pdfService = pdfService;
            _configuration = configuration;
        }

        // Health check para compatibilidad con el frontend
        [HttpGet("test")]
        [AllowAnonymous]
        public ActionResult<object> HealthTest()
        {
            return Ok(new {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                service = "Actas API"
            });
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
        [Authorize(Policy = "CanManageActas")]
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
        [Authorize(Policy = "CanManageActas")]
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

        [HttpPost("generar")]
        [Authorize(Policy = "CanManageActas")]
        [AuditAction("generar_acta", "Acta", true, true)]
        public async Task<IActionResult> GenerarActa([FromBody] GenerarActaRequest request)
        {
            Console.WriteLine("=== ENDPOINT GENERAR ACTA LLAMADO ===");
            Console.WriteLine($"Request recibido: AsignacionId={request?.AsignacionId}, IncluirFirmaTI={request?.IncluirFirmaTI}");
            
            // Debug de autenticación
            Console.WriteLine($"User.Identity.IsAuthenticated: {User.Identity?.IsAuthenticated}");
            Console.WriteLine($"User.Identity.Name: {User.Identity?.Name}");
            Console.WriteLine($"User Claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");
            
            try
            {
                if (request == null || request.AsignacionId <= 0)
                    return BadRequest("Datos inválidos para generar acta");

                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == request.AsignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                // Firma TI opcional - usar la firma del usuario actual (admin/soporte) que está generando el acta
                string? adminSignaturePath = null;
                if (request.IncluirFirmaTI == true)
                {
                    // Obtener firma de admin/soporte (cualquier admin/soporte, como en previsualización personalizada)
                    var adminUser = await _db.AuthUsers
                        .FirstOrDefaultAsync(u => (u.Role == "admin" || u.Role == "soporte") && !string.IsNullOrEmpty(u.SignaturePath));

                    if (adminUser != null)
                    {
                        adminSignaturePath = adminUser.SignaturePath;
                        Console.WriteLine($"CONTROLLER - IncluirFirmaTI: {request.IncluirFirmaTI}");
                        Console.WriteLine($"CONTROLLER - AdminUser: {adminUser.Username}");
                        Console.WriteLine($"CONTROLLER - AdminSignaturePath: {adminSignaturePath}");
                        
                        _logger.LogInformation("GenerarActa - IncluirFirmaTI: {IncluirFirmaTI}, AdminUser: {AdminUser}, SignaturePath: {SignaturePath}", 
                            request.IncluirFirmaTI, adminUser.Username, adminSignaturePath);
                    }
                    else
                    {
                        Console.WriteLine("CONTROLLER - No se encontró firma de admin/soporte");
                        _logger.LogWarning("GenerarActa - No se encontró firma de admin/soporte");
                    }
                }
                else
                {
                    Console.WriteLine($"CONTROLLER - IncluirFirmaTI es false o null: {request.IncluirFirmaTI}");
                }

                var fechaEntrega = !string.IsNullOrWhiteSpace(request.FechaEntrega)
                    && DateTime.TryParse(request.FechaEntrega, out var fecha)
                        ? fecha
                        : asignacion.FechaAsignacion;

                // Generar PDF (con o sin firma TI)
                byte[] pdfBytes = _pdfService.GenerateActaEntregaWithSignatures(
                    asignacion,
                    asignacion.Activo,
                    asignacion.Usuario,
                    adminSignaturePath,
                    null,
                    fechaEntrega
                );

                // Guardar PDF en Storage/actas/<categoria>
                var storageRoot = _configuration["Storage:Root"] ?? "Storage";
                
                // Si es una ruta relativa, resolverla desde el directorio del proyecto
                if (!Path.IsPathRooted(storageRoot))
                {
                    storageRoot = Path.Combine(Directory.GetCurrentDirectory(), storageRoot);
                }
                string categoriaFolder = GetCategoriaFolder(asignacion.Activo.Categoria);
                string uploadsDir = Path.Combine(storageRoot, "actas", categoriaFolder);
                Directory.CreateDirectory(uploadsDir);

                string fileName = GenerateHumanReadableActaFileName(asignacion.Usuario, fechaEntrega);
                string filePath = Path.Combine(uploadsDir, fileName);
                await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);

                // Crear/actualizar Acta
                var acta = await _db.Actas.FirstOrDefaultAsync(a => a.AsignacionId == request.AsignacionId);
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int? aprobadoPorId = null;
                if (int.TryParse(currentUserId, out int adminId))
                {
                    aprobadoPorId = adminId;
                }

                if (acta == null)
                {
                    acta = new Acta
                    {
                        AsignacionId = request.AsignacionId,
                        Estado = request.IncluirFirmaTI == true ? "Firmada" : "Pendiente",
                        MetodoFirma = "Admin_Subida",
                        NombreArchivo = fileName,
                        RutaArchivo = $"storage/actas/{categoriaFolder}/{fileName}",
                        FechaFirma = DateTime.Now,
                        FechaSubida = DateTime.Now,
                        AprobadoPorId = null,
                        Observaciones = request.Observaciones ?? string.Empty,
                        ComentariosAprobacion = null
                    };
                    _db.Actas.Add(acta);
                }
                else
                {
                    acta.Estado = request.IncluirFirmaTI == true ? "Firmada" : "Pendiente";
                    acta.MetodoFirma = "Admin_Subida";
                    acta.NombreArchivo = fileName;
                    acta.RutaArchivo = $"storage/actas/{categoriaFolder}/{fileName}";
                    acta.FechaFirma = DateTime.Now;
                    acta.FechaSubida = DateTime.Now;
                    acta.AprobadoPorId = null;
                    acta.Observaciones = request.Observaciones ?? string.Empty;
                    acta.ComentariosAprobacion = null;
                }

                await _db.SaveChangesAsync();

                return Ok(new {
                    message = "Acta generada y marcada como pendiente de firma",
                    actaId = acta.Id,
                    fileName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("{actaId}/rechazar")]
        [Authorize(Policy = "CanRejectActa")]
        [AuditAction("rechazar_acta", "Acta", true, true)]
        public async Task<IActionResult> RechazarActa(int actaId, [FromBody] MotivoRequest req)
        {
            try
            {
                // Motivo opcional

                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Usuario)
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .FirstOrDefaultAsync(a => a.Id == actaId);

                if (acta == null)
                    return NotFound("Acta no encontrada");

                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int? aprobadoPorId = null;
                if (int.TryParse(currentUserId, out int adminId))
                {
                    aprobadoPorId = adminId;
                }

                acta.Estado = "Rechazada";
                acta.FechaAprobacion = DateTime.Now;
                acta.AprobadoPorId = aprobadoPorId;
                acta.ComentariosAprobacion = string.IsNullOrWhiteSpace(req?.Motivo) ? null : req.Motivo;
                try
                {
                    await _db.SaveChangesAsync();
                }
                catch (Exception saveEx)
                {
                    _logger.LogError(saveEx, "Error guardando cambios al rechazar acta {ActaId}", actaId);
                    return StatusCode(400, new { message = "No se pudo actualizar el estado del acta", error = saveEx.Message });
                }

                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    var authUser = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Username == acta.Asignacion.Usuario.Email);
                    if (authUser != null)
                    {
                        await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = authUser.Id,
                            Tipo = "acta",
                            Titulo = "Acta rechazada",
                            Mensaje = $"Tu acta para el activo {acta.Asignacion.Activo?.Codigo} ha sido rechazada. Motivo: {req.Motivo}",
                            RefTipo = "Acta",
                            RefId = acta.Id,
                            Ruta = $"/actas/{acta.Id}"
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al enviar notificación de rechazo");
                }

                return Ok(new { message = "Acta rechazada", actaId = acta.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al rechazar acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("{actaId}/pendiente")]
        [Authorize(Policy = "CanManageActas")]
        public async Task<IActionResult> MarcarPendiente(int actaId)
        {
            try
            {
                var acta = await _db.Actas.FirstOrDefaultAsync(a => a.Id == actaId);
                if (acta == null)
                    return NotFound("Acta no encontrada");

                acta.Estado = "Pendiente";
                acta.MetodoFirma = "Pendiente";
                await _db.SaveChangesAsync();
                return Ok(new { message = "Acta marcada como pendiente de firma", actaId = acta.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar pendiente el acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("{actaId}/upload-pdf-ti")]
        [Authorize(Policy = "CanManageActas")]
        public async Task<IActionResult> UploadPdfTI(int actaId, IFormFile pdf, [FromForm] string observaciones = "")
        {
            try
            {
                if (pdf == null || pdf.Length == 0)
                    return BadRequest("No se proporcionó ningún archivo");

                var isPdfMime = pdf.ContentType != null && pdf.ContentType.ToLower().Contains("application/pdf");
                var isPdfExt = Path.GetExtension(pdf.FileName)?.ToLower() == ".pdf";
                if (!isPdfMime && !isPdfExt)
                    return BadRequest("Solo se permiten archivos PDF");

                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Usuario)
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .FirstOrDefaultAsync(a => a.Id == actaId);

                if (acta == null)
                    return NotFound("Acta no encontrada");

                string categoriaFolder = GetCategoriaFolder(acta.Asignacion.Activo.Categoria);
                var storageRoot2 = _configuration["Storage:Root"] ?? Directory.GetCurrentDirectory();
                string uploadsDir = Path.Combine(storageRoot2, "actas", categoriaFolder);
                Directory.CreateDirectory(uploadsDir);

                string fileName = GenerateHumanReadableActaFileName(acta.Asignacion.Usuario, DateTime.Now);
                string filePath = Path.Combine(uploadsDir, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await pdf.CopyToAsync(stream);
                }

                acta.Estado = "Firmada";
                acta.MetodoFirma = "Admin_Subida";
                acta.NombreArchivo = fileName;
                acta.RutaArchivo = $"storage/actas/{categoriaFolder}/{fileName}";
                acta.FechaFirma = DateTime.Now;
                acta.FechaSubida = DateTime.Now;
                acta.Observaciones = observaciones;
                await _db.SaveChangesAsync();

                return Ok(new { message = "PDF subido por TI", actaId = acta.Id, fileName });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir PDF TI");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("{actaId}/anular")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> AnularActa(int actaId, [FromBody] MotivoRequest req)
        {
            try
            {
                // Motivo opcional

                var acta = await _db.Actas.FirstOrDefaultAsync(a => a.Id == actaId);
                if (acta == null)
                    return NotFound("Acta no encontrada");

                acta.Estado = "Anulada";
                acta.ComentariosAprobacion = string.IsNullOrWhiteSpace(req?.Motivo) ? null : req.Motivo;
                acta.FechaAprobacion = DateTime.Now;
                await _db.SaveChangesAsync();
                return Ok(new { message = "Acta anulada", actaId = acta.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al anular acta");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("{actaId}/preview-auto")]
        public async Task<IActionResult> PrevisualizarAuto(int actaId)
        {
            try
            {
                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Usuario)
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .FirstOrDefaultAsync(a => a.Id == actaId);

                if (acta == null)
                    return NotFound("Acta no encontrada");

                // Prioridad: PDF_Usuario (MetodoFirma=PDF_Subido) > PDF_Admin (Admin_Subida) > Digital_Signed (Digital) > Plantilla
                if (!string.IsNullOrEmpty(acta.RutaArchivo) &&
                    (acta.MetodoFirma?.ToLower() == "pdf_subido" || acta.MetodoFirma?.ToLower() == "admin_subida"))
                {
                    var storageRoot = _configuration["Storage:Root"] ?? Directory.GetCurrentDirectory();
                    string filePath = Path.Combine(storageRoot, acta.RutaArchivo.Replace("storage/", string.Empty));
                    
                    _logger.LogInformation($"PreviewAuto - Intentando leer archivo: {filePath}");
                    _logger.LogInformation($"PreviewAuto - StorageRoot: {storageRoot}");
                    _logger.LogInformation($"PreviewAuto - RutaArchivo: {acta.RutaArchivo}");
                    _logger.LogInformation($"PreviewAuto - MetodoFirma: {acta.MetodoFirma}");
                    
                    if (System.IO.File.Exists(filePath))
                    {
                        _logger.LogInformation($"PreviewAuto - Archivo encontrado, leyendo: {filePath}");
                        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                        return File(fileBytes, "application/pdf", acta.NombreArchivo ?? "acta.pdf");
                    }
                    else
                    {
                        _logger.LogWarning($"PreviewAuto - Archivo NO encontrado: {filePath}");
                    }
                }

                if (acta.MetodoFirma?.ToLower() == "digital")
                {
                    // Generar con firmas
                    string? userSig = null;
                    var userAuth = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Username == acta.Asignacion.Usuario.Email);
                    if (userAuth != null && !string.IsNullOrEmpty(userAuth.SignaturePath)) userSig = userAuth.SignaturePath;

                    string? adminSig = null;
                    var adminUser = await _db.AuthUsers.FirstOrDefaultAsync(u => (u.Role == "admin" || u.Role == "soporte") && !string.IsNullOrEmpty(u.SignaturePath));
                    adminSig = adminUser?.SignaturePath;

                    byte[] pdfBytes = _pdfService.GenerateActaEntregaWithSignatures(acta.Asignacion, acta.Asignacion.Activo, acta.Asignacion.Usuario, adminSig, userSig, acta.Asignacion.FechaAsignacion);
                    return File(pdfBytes, "application/pdf", acta.NombreArchivo ?? "acta.pdf");
                }

                // Plantilla por defecto
                byte[] plantillaBytes = _pdfService.GenerateActaEntregaWithSignatures(acta.Asignacion, acta.Asignacion.Activo, acta.Asignacion.Usuario, null, null, acta.Asignacion.FechaAsignacion);
                return File(plantillaBytes, "application/pdf", acta.NombreArchivo ?? "acta.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en previsualización auto");
                return StatusCode(500, "Error interno del servidor");
            }
        }
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

                // Permitir marcar pendiente bajo cualquier estado de la asignación

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
                    var authUser = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Username == asignacion.Usuario.Email);
                    if (authUser != null)
                    {
                        await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = authUser.Id,
                            Tipo = "acta",
                            Titulo = "Acta pendiente de firma",
                            Mensaje = $"Se ha marcado como pendiente de firma tu acta para el activo {asignacion.Activo?.Codigo}. Por favor, firma y sube el acta.",
                            RefTipo = "Acta",
                            RefId = acta.Id,
                            Ruta = $"/actas/{acta.Id}"
                        });
                    }
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
                        message = "No tienes una firma digital configurada.",
                        options = new {
                            createSignature = "¿No tienes firma? Créala ahora",
                            uploadSignature = "Ve a 'Mi Perfil' para subir tu firma digital",
                            uploadPdf = "O puedes descargar el acta y subirlo firmado manualmente"
                        }
                    });
                }

                // Obtener la ruta de almacenamiento desde configuración
                var storageRoot = _configuration["Storage:Root"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Storage");
                string signatureFilePath = currentUser.SignaturePath.StartsWith("/storage/")
                    ? Path.Combine(storageRoot, currentUser.SignaturePath.Replace("/storage/", string.Empty))
                    : Path.Combine(storageRoot, currentUser.SignaturePath.TrimStart('/'));
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

                // Obtener firma de admin/soporte (si existe) para incluirla en el PDF
                string? adminSignaturePath = null;
                var adminUser = await _db.AuthUsers
                    .FirstOrDefaultAsync(u => (u.Role == "admin" || u.Role == "soporte") && !string.IsNullOrEmpty(u.SignaturePath));
                adminSignaturePath = adminUser?.SignaturePath;

                // Generar PDF con ambas firmas
                byte[] pdfBytes = _pdfService.GenerateActaEntregaWithSignatures(
                    asignacion,
                    asignacion.Activo,
                    asignacion.Usuario,
                    adminSignaturePath,
                    currentUser.SignaturePath,
                    asignacion.FechaAsignacion
                );

                // Guardar PDF en Storage/actas/<categoria>
                var storageRootSig = _configuration["Storage:Root"] ?? Directory.GetCurrentDirectory();
                string categoriaFolder = GetCategoriaFolder(asignacion.Activo.Categoria);
                string uploadsDir = Path.Combine(storageRootSig, "actas", categoriaFolder);
                Directory.CreateDirectory(uploadsDir);

                // Versionado y hash
                string baseName = GenerateHumanReadableActaFileName(asignacion.Usuario, asignacion.FechaAsignacion).Replace(".pdf", "");
                string fileName = GetNextVersionedFileName(uploadsDir, baseName);
                string filePath = Path.Combine(uploadsDir, fileName);
                await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);
                string sha256 = ComputeSha256(pdfBytes);

                // Buscar acta existente o crear nueva y actualizar metadatos con el PDF generado
                var acta = await _db.Actas.FirstOrDefaultAsync(a => a.AsignacionId == asignacionId);
                if (acta == null)
                {
                    acta = new Acta
                    {
                        AsignacionId = asignacionId,
                        Estado = "Firmada",
                        MetodoFirma = "Digital",
                        NombreArchivo = fileName,
                        RutaArchivo = $"storage/actas/{categoriaFolder}/{fileName}",
                        FechaFirma = DateTime.Now,
                        FechaSubida = DateTime.Now,
                        Observaciones = string.IsNullOrEmpty(observaciones) ? "Firma digital aplicada" : observaciones
                    };
                    _db.Actas.Add(acta);
                }
                else
                {
                    acta.Estado = "Firmada";
                    acta.MetodoFirma = "Digital";
                    acta.NombreArchivo = fileName;
                    acta.RutaArchivo = $"storage/actas/{categoriaFolder}/{fileName}";
                    acta.FechaFirma = DateTime.Now;
                    acta.FechaSubida = DateTime.Now;
                    acta.Observaciones = string.IsNullOrEmpty(observaciones) ? "Firma digital aplicada" : observaciones;
                }

                await _db.SaveChangesAsync();

                // Notificar a admins y soporte
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    var payload = new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "acta",
                        Titulo = "Acta firmada por usuario",
                        Mensaje = $"El usuario {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido} ha firmado digitalmente el acta para el activo {asignacion.Activo?.Codigo}.",
                        RefTipo = "Acta",
                        RefId = acta.Id,
                        Ruta = $"/gestion-actas/{asignacionId}"
                    };
                    await notificationService.CreateForRoleAsync("admin", payload);
                    await notificationService.CreateForRoleAsync("soporte", payload);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al enviar notificación a admins");
                }

                return Ok(new { 
                    message = "Acta firmada digitalmente exitosamente",
                    actaId = acta.Id,
                    hash = sha256,
                    fileName
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

                var isPdfByMimeUser = acta.ContentType != null && acta.ContentType.ToLower().Contains("application/pdf");
                var isPdfByExtUser = Path.GetExtension(acta.FileName)?.ToLower() == ".pdf";
                if (!isPdfByMimeUser && !isPdfByExtUser)
                    return BadRequest("Solo se permiten archivos PDF");

                // Crear estructura de carpetas en almacenamiento privado
                var storageRootUpload = _configuration["Storage:Root"] ?? Directory.GetCurrentDirectory();
                string categoriaFolder = GetCategoriaFolder(asignacion.Activo.Categoria);
                string uploadsDir = Path.Combine(storageRootUpload, "actas", categoriaFolder);
                Directory.CreateDirectory(uploadsDir);

                // Generar nombre de archivo legible
                string fileName = GenerateHumanReadableActaFileName(asignacion.Usuario, DateTime.Now);
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
                        Estado = "Pendiente_de_aprobacion",
                        MetodoFirma = "PDF_Subido",
                        NombreArchivo = fileName,
                        RutaArchivo = $"storage/actas/{categoriaFolder}/{fileName}",
                        FechaFirma = DateTime.Now,
                        FechaSubida = DateTime.Now,
                        Observaciones = string.IsNullOrEmpty(observaciones) ? "PDF firmado subido por el usuario" : observaciones
                    };
                    _db.Actas.Add(actaDb);
                }
                else
                {
                    // Actualizar acta existente
                    actaDb.Estado = "Pendiente_de_aprobacion";
                    actaDb.MetodoFirma = "PDF_Subido";
                    actaDb.NombreArchivo = fileName;
                    actaDb.RutaArchivo = $"storage/actas/{categoriaFolder}/{fileName}";
                    actaDb.FechaFirma = DateTime.Now;
                    actaDb.FechaSubida = DateTime.Now;
                    actaDb.Observaciones = string.IsNullOrEmpty(observaciones) ? "PDF firmado actualizado por el usuario" : observaciones;
                }

                await _db.SaveChangesAsync();

                // Notificar a admins y soporte
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    var payload = new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "acta",
                        Titulo = "Acta PDF subida por usuario",
                        Mensaje = $"El usuario {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido} ha subido un PDF firmado para el activo {asignacion.Activo?.Codigo}.",
                        RefTipo = "Acta",
                        RefId = actaDb.Id,
                        Ruta = $"/gestion-actas/{asignacionId}"
                    };
                    await notificationService.CreateForRoleAsync("admin", payload);
                    await notificationService.CreateForRoleAsync("soporte", payload);
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

                // Crear estructura de carpetas en almacenamiento privado
                var storageRootAdmin = _configuration["Storage:Root"] ?? Directory.GetCurrentDirectory();
                string categoriaFolder = GetCategoriaFolder(asignacion.Activo.Categoria);
                string uploadsDir = Path.Combine(storageRootAdmin, "actas", categoriaFolder);
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
                        RutaArchivo = $"storage/actas/{categoriaFolder}/{fileName}",
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
                    actaDb.RutaArchivo = $"storage/actas/{categoriaFolder}/{fileName}";
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
                    var authUser = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Username == asignacion.Usuario.Email);
                    if (authUser != null)
                    {
                        await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = authUser.Id,
                            Tipo = "acta",
                            Titulo = "Acta subida por administrador",
                            Mensaje = $"Se ha subido un acta para el activo {asignacion.Activo?.Codigo} por parte del administrador/soporte.",
                            RefTipo = "Acta",
                            RefId = actaDb.Id,
                            Ruta = $"/actas/{actaDb.Id}"
                        });
                    }
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
        [Authorize(Policy = "CanApproveActa")]
        [AuditAction("aprobar_acta", "Acta", true, true)]
        public async Task<IActionResult> AprobarActa(int actaId, [FromBody] AprobarActaRequest request)
        {
            try
            {
                if (request == null)
                {
                    _logger.LogWarning("AprobarActa - request nulo para actaId {ActaId}", actaId);
                    return BadRequest("Datos inválidos para procesar el acta");
                }

                _logger.LogInformation($"AprobarActa - actaId: {actaId}, aprobado: {request.Aprobar}");
                
                var acta = await _db.Actas
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Usuario)
                    .Include(a => a.Asignacion)
                    .ThenInclude(aa => aa.Activo)
                    .FirstOrDefaultAsync(a => a.Id == actaId);

                if (acta == null)
                    return NotFound("Acta no encontrada");

                // Aprobación sin restricción dura de estado para permitir overrides TI
                
                // Para rechazar, se puede hacer en cualquier estado
                // No se necesita validación adicional

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
                    acta.ComentariosAprobacion = string.IsNullOrWhiteSpace(request.Comentarios) ? null : request.Comentarios;

                    // Guardar primero el cambio de estado del acta
                    try
                    {
                        await _db.SaveChangesAsync();
                    }
                    catch (DbUpdateException dbEx)
                    {
                        var innerMsg = dbEx.InnerException?.Message ?? dbEx.Message;
                        _logger.LogError(dbEx, "AprobarActa - error guardando cambios (aprobación) para acta {ActaId}. Inner: {Inner}", acta.Id, innerMsg);
                        return BadRequest($"No se pudo guardar los cambios del acta. Detalle: {innerMsg}");
                    }

                    // Notificar al usuario
                    try
                    {
                        if (acta.Asignacion != null)
                        {
                            var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                            var authUser = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Username == acta.Asignacion.Usuario.Email);
                            if (authUser != null)
                            {
                                await notificationService.CreateAsync(new CreateNotificationDto
                                {
                                    UserId = authUser.Id,
                                    Tipo = "acta",
                                    Titulo = "Acta aprobada",
                                    Mensaje = $"Tu acta para el activo {acta.Asignacion.Activo?.Codigo} ha sido aprobada.",
                                    RefTipo = "Acta",
                                    RefId = acta.Id,
                                    Ruta = $"/actas/{acta.Id}"
                                });
                            }
                        }
                        else
                        {
                            _logger.LogWarning("AprobarActa - Asignacion nula al notificar aprobación para acta {ActaId}", acta.Id);
                        }
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
                    acta.ComentariosAprobacion = string.IsNullOrWhiteSpace(request.Comentarios) ? null : request.Comentarios;

                    // Guardar primero el cambio de estado del acta
                    try
                    {
                        await _db.SaveChangesAsync();
                    }
                    catch (DbUpdateException dbEx)
                    {
                        var innerMsg = dbEx.InnerException?.Message ?? dbEx.Message;
                        _logger.LogError(dbEx, "AprobarActa - error guardando cambios (rechazo) para acta {ActaId}. Inner: {Inner}", acta.Id, innerMsg);
                        return BadRequest($"No se pudo guardar los cambios del acta. Detalle: {innerMsg}");
                    }

                    // Notificar al usuario
                    try
                    {
                        if (acta.Asignacion != null)
                        {
                            var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                            var authUser = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Username == acta.Asignacion.Usuario.Email);
                            if (authUser != null)
                            {
                                await notificationService.CreateAsync(new CreateNotificationDto
                                {
                                    UserId = authUser.Id,
                                    Tipo = "acta",
                                    Titulo = "Acta rechazada",
                                    Mensaje = $"Tu acta para el activo {acta.Asignacion.Activo?.Codigo} ha sido rechazada. Motivo: {request.Comentarios}",
                                    RefTipo = "Acta",
                                    RefId = acta.Id,
                                    Ruta = $"/actas/{acta.Id}"
                                });
                            }
                        }
                        else
                        {
                            _logger.LogWarning("AprobarActa - Asignacion nula al notificar rechazo para acta {ActaId}", acta.Id);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error al enviar notificación de rechazo");
                    }
                }

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

        [HttpPost("previsualizar-temporal")]
        [Authorize(Policy = "CanManageActas")]
        public async Task<IActionResult> PrevisualizarActaTemporal([FromBody] GenerarActaRequest request)
        {
            try
            {
                Console.WriteLine("=== ENDPOINT PREVISUALIZAR TEMPORAL LLAMADO ===");
                Console.WriteLine($"Request recibido: AsignacionId={request?.AsignacionId}, IncluirFirmaTI={request?.IncluirFirmaTI}");
                
                if (request == null || request.AsignacionId <= 0)
                    return BadRequest("Datos inválidos para previsualizar acta");

                var asignacion = await _db.AsignacionesActivos
                    .Include(aa => aa.Usuario)
                    .Include(aa => aa.Activo)
                    .FirstOrDefaultAsync(aa => aa.Id == request.AsignacionId);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                // Firma TI opcional - usar la firma del usuario actual (admin/soporte) que está generando el acta
                string? adminSignaturePath = null;
                if (request.IncluirFirmaTI == true)
                {
                    // Obtener firma de admin/soporte (cualquier admin/soporte, como en previsualización personalizada)
                    var adminUser = await _db.AuthUsers
                        .FirstOrDefaultAsync(u => (u.Role == "admin" || u.Role == "soporte") && !string.IsNullOrEmpty(u.SignaturePath));

                    if (adminUser != null)
                    {
                        adminSignaturePath = adminUser.SignaturePath;
                        Console.WriteLine($"CONTROLLER - IncluirFirmaTI: {request.IncluirFirmaTI}");
                        Console.WriteLine($"CONTROLLER - AdminUser: {adminUser.Username}");
                        Console.WriteLine($"CONTROLLER - AdminSignaturePath: {adminSignaturePath}");
                        
                        _logger.LogInformation("PrevisualizarActaTemporal - IncluirFirmaTI: {IncluirFirmaTI}, AdminUser: {AdminUser}, SignaturePath: {SignaturePath}", 
                            request.IncluirFirmaTI, adminUser.Username, adminSignaturePath);
                    }
                    else
                    {
                        Console.WriteLine("CONTROLLER - No se encontró firma de admin/soporte");
                        _logger.LogWarning("PrevisualizarActaTemporal - No se encontró firma de admin/soporte");
                    }
                }
                else
                {
                    Console.WriteLine($"CONTROLLER - IncluirFirmaTI es false o null: {request.IncluirFirmaTI}");
                }

                var fechaEntrega = !string.IsNullOrWhiteSpace(request.FechaEntrega)
                    && DateTime.TryParse(request.FechaEntrega, out var fecha)
                        ? fecha
                        : asignacion.FechaAsignacion;

                // Generar PDF (con o sin firma TI) - SIN GUARDAR EN STORAGE
                byte[] pdfBytes = _pdfService.GenerateActaEntregaWithSignatures(
                    asignacion,
                    asignacion.Activo,
                    asignacion.Usuario,
                    adminSignaturePath,
                    null,
                    fechaEntrega
                );

                string fileName = GenerateHumanReadableActaFileName(asignacion.Usuario, fechaEntrega);
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al previsualizar acta temporal");
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

                var storageRoot4 = _configuration["Storage:Root"] ?? Directory.GetCurrentDirectory();
                string filePath = Path.Combine(storageRoot4, acta.RutaArchivo.Replace("storage/", string.Empty));
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

                // Directorio de almacenamiento privado
                var storageRoot = _configuration["Storage:Root"] ?? Directory.GetCurrentDirectory();
                string uploadsDir = Path.Combine(storageRoot, "signatures");
                Directory.CreateDirectory(uploadsDir);

                // Generar nombre de archivo único
                string fileName = $"signature_{currentUser.Id}_{DateTime.Now:yyyyMMddHHmmss}{Path.GetExtension(firma.FileName)}";
                string filePath = Path.Combine(uploadsDir, fileName);

                // Guardar archivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await firma.CopyToAsync(stream);
                }

                // Actualizar firma del usuario con ruta lógica segura
                currentUser.SignaturePath = $"/storage/signatures/{fileName}";
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

        [HttpGet("test-generar")]
        [AllowAnonymous]
        public IActionResult TestGenerar()
        {
            Console.WriteLine("=== TEST GENERAR ENDPOINT LLAMADO ===");
            return Ok(new { message = "Test endpoint funcionando", timestamp = DateTime.Now });
        }

        [HttpGet("test-auth")]
        [Authorize]
        public IActionResult TestAuth()
        {
            Console.WriteLine("=== TEST AUTH ENDPOINT LLAMADO ===");
            Console.WriteLine($"User.Identity.IsAuthenticated: {User.Identity?.IsAuthenticated}");
            Console.WriteLine($"User.Identity.Name: {User.Identity?.Name}");
            Console.WriteLine($"User Claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");
            
            return Ok(new { 
                message = "Auth test funcionando", 
                isAuthenticated = User.Identity?.IsAuthenticated,
                name = User.Identity?.Name,
                claims = User.Claims.Select(c => new { c.Type, c.Value }).ToArray(),
                timestamp = DateTime.Now 
            });
        }

        [HttpGet("test-policy")]
        [Authorize(Policy = "CanManageActas")]
        public IActionResult TestPolicy()
        {
            Console.WriteLine("=== TEST POLICY ENDPOINT LLAMADO ===");
            Console.WriteLine($"User.Identity.IsAuthenticated: {User.Identity?.IsAuthenticated}");
            Console.WriteLine($"User.Identity.Name: {User.Identity?.Name}");
            Console.WriteLine($"User Claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");
            
            return Ok(new { 
                message = "Policy test funcionando", 
                isAuthenticated = User.Identity?.IsAuthenticated,
                name = User.Identity?.Name,
                claims = User.Claims.Select(c => new { c.Type, c.Value }).ToArray(),
                timestamp = DateTime.Now 
            });
        }

        [HttpGet("debug-signatures-public")]
        [AllowAnonymous]
        public async Task<IActionResult> DebugSignaturesPublic()
        {
            try
            {
                var storageRoot = _configuration["Storage:Root"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Storage");
                var signaturesDir = Path.Combine(storageRoot, "signatures");
                
                var result = new
                {
                    storageRoot = storageRoot,
                    signaturesDir = signaturesDir,
                    signaturesDirExists = Directory.Exists(signaturesDir),
                    signatureFiles = Directory.Exists(signaturesDir) ? Directory.GetFiles(signaturesDir) : new string[0],
                    adminUsers = await _db.AuthUsers
                        .Where(u => (u.Role == "admin" || u.Role == "soporte") && !string.IsNullOrEmpty(u.SignaturePath))
                        .Select(u => new { u.Username, u.Role, u.SignaturePath })
                        .ToListAsync()
                };
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en debug de firmas");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("debug-signatures")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> DebugSignatures()
        {
            try
            {
                var storageRoot = _configuration["Storage:Root"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Storage");
                var signaturesDir = Path.Combine(storageRoot, "signatures");
                
                var result = new
                {
                    storageRoot = storageRoot,
                    signaturesDir = signaturesDir,
                    signaturesDirExists = Directory.Exists(signaturesDir),
                    signatureFiles = Directory.Exists(signaturesDir) ? Directory.GetFiles(signaturesDir) : new string[0],
                    adminUsers = await _db.AuthUsers
                        .Where(u => (u.Role == "admin" || u.Role == "soporte") && !string.IsNullOrEmpty(u.SignaturePath))
                        .Select(u => new { u.Username, u.Role, u.SignaturePath })
                        .ToListAsync()
                };
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en debug de firmas");
                return StatusCode(500, new { error = ex.Message });
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
                    var storageRoot = _configuration["Storage:Root"] ?? Directory.GetCurrentDirectory();
                    string filePath = Path.Combine(storageRoot, acta.RutaArchivo.Replace("storage/", string.Empty));
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
            if (string.IsNullOrWhiteSpace(categoria)) return "Equipos";

            // Normalizar: minúsculas y sin acentos
            string normalized = RemoveDiacritics(categoria.ToLowerInvariant());

            // Monitores
            if (normalized.Contains("monitor"))
                return "Monitores";

            // Periféricos (impresora, escáner, teclado, mouse)
            if (normalized.Contains("perifer") || normalized.Contains("impresor") || normalized.Contains("scanner") ||
                normalized.Contains("teclado") || normalized.Contains("mouse"))
                return "Periféricos";

            // Accesorios (adaptadores, cables, hubs, etc.)
            if (normalized.Contains("accesorio") || normalized.Contains("accesorios") ||
                normalized.Contains("adaptador") || normalized.Contains("cable") || normalized.Contains("hub"))
                return "Accesorios";

            // Móviles
            if (normalized.Contains("movil") || normalized.Contains("moviles") || normalized.Contains("celular") ||
                normalized.Contains("telefono") || normalized.Contains("tablet"))
                return "Móviles";

            // Red
            if (normalized.Contains("red") || normalized.Contains("router") || normalized.Contains("switch") ||
                normalized.Contains("access point") || normalized.Contains("ap ") || normalized.EndsWith(" ap") ||
                normalized.Contains("firewall"))
                return "Red";

            // Equipos (resto: laptop/desktop/pc/notebook/torre)
            if (normalized.Contains("equipo") || normalized.Contains("laptop") || normalized.Contains("desktop") ||
                normalized.Contains("pc") || normalized.Contains("computador") || normalized.Contains("notebook") ||
                normalized.Contains("torre"))
                return "Equipos";

            return "Equipos"; // Por defecto a Equipos
        }

        private static string RemoveDiacritics(string text)
        {
            if (string.IsNullOrEmpty(text)) return text;
            var normalized = text.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var ch in normalized)
            {
                var uc = CharUnicodeInfo.GetUnicodeCategory(ch);
                if (uc != UnicodeCategory.NonSpacingMark)
                    sb.Append(ch);
            }
            return sb.ToString().Normalize(NormalizationForm.FormC);
        }

        private string GenerateActaFileName(NominaUsuario usuario, string categoria, bool isAdmin = false)
        {
            string prefix = isAdmin ? "Admin" : "Usuario";
            string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            return $"Acta de entrega - {usuario.Nombre} {usuario.Apellido} - {categoria} - {prefix}_{timestamp}.pdf";
        }

        // Nombre legible: "Acta de entrega - Nombre Apellido dd MMMM yyyy.pdf"
        private string GenerateHumanReadableActaFileName(NominaUsuario usuario, DateTime fechaEntrega)
        {
            var culture = new System.Globalization.CultureInfo("es-ES");
            string fecha = fechaEntrega.ToString("dd 'de' MMMM 'de' yyyy", culture);
            return $"Acta de entrega - {usuario.Nombre} {usuario.Apellido} {fecha}.pdf";
        }

        private string GetNextVersionedFileName(string dir, string baseName)
        {
            int version = 1;
            string candidate = $"{baseName} v{version}.pdf";
            while (System.IO.File.Exists(Path.Combine(dir, candidate)))
            {
                version++;
                candidate = $"{baseName} v{version}.pdf";
            }
            return candidate;
        }

        private string ComputeSha256(byte[] bytes)
        {
            using var sha = System.Security.Cryptography.SHA256.Create();
            var hash = sha.ComputeHash(bytes);
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
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

    public class GenerarActaRequest
    {
        public int AsignacionId { get; set; }
        public bool? IncluirFirmaTI { get; set; }
        public string? FechaEntrega { get; set; }
        public string? Observaciones { get; set; }
        public string? Plantilla { get; set; }
    }

    public class MotivoRequest
    {
        public string? Motivo { get; set; }
    }

    #endregion
} 