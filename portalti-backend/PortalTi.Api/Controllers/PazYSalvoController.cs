using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models.DTOs;
using PortalTi.Api.Services;
using System.Security.Claims;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PazYSalvoController : ControllerBase
    {
        private readonly PazYSalvoServiceUnificado _pazYSalvoService;
        private readonly PortalTiContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PazYSalvoController> _logger;

        public PazYSalvoController(
            PazYSalvoServiceUnificado pazYSalvoService,
            PortalTiContext context,
            IConfiguration configuration,
            ILogger<PazYSalvoController> logger)
        {
            _pazYSalvoService = pazYSalvoService;
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Crear un nuevo Paz y Salvo
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "RequireRRHHOrAdminWithSubroles")]
        public async Task<IActionResult> Crear([FromBody] CrearPazYSalvoRequest request)
        {
            try
            {
                // Obtener el ID del usuario autenticado
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int solicitadoPorId))
                {
                    return Unauthorized(new { message = "Usuario no autenticado" });
                }

                var result = await _pazYSalvoService.CrearAsync(request, solicitadoPorId);
                return CreatedAtAction(nameof(ObtenerDetalle), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear Paz y Salvo");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Solicitar firma específica
        /// </summary>
        [HttpPost("{id}/solicitar-firma/{rol}")]
        [Authorize(Policy = "RequireRRHHOrAdminWithSubroles")]
        public async Task<IActionResult> SolicitarFirma(int id, string rol)
        {
            try
            {
                var result = await _pazYSalvoService.SolicitarFirmaAsync(id, rol);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al solicitar firma para Paz y Salvo {Id}, rol {Rol}", id, rol);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Enviar documento a firma
        /// </summary>
        [HttpPost("{id}/send")]
        [Authorize(Policy = "RequireRRHHOrAdminWithSubroles")]
        public async Task<IActionResult> EnviarAFirma(int id)
        {
            try
            {
                var result = await _pazYSalvoService.EnviarAFirmaAsync(id);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar Paz y Salvo a firma");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Firmar documento
        /// </summary>
        [HttpPost("{id}/firmas/{rol}/sign")]
        [Authorize]
        public async Task<IActionResult> Firmar(int id, string rol, [FromBody] FirmarRequest request)
        {
            try
            {
                // Obtener el ID del usuario autenticado
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int authenticatedUserId))
                {
                    _logger.LogWarning("Usuario no autenticado - no se encontró claim NameIdentifier");
                    return Unauthorized(new { message = "Usuario no autenticado" });
                }

                _logger.LogInformation("Usuario autenticado: {AuthenticatedUserId}, ActorUserId en request: {ActorUserId}", 
                    authenticatedUserId, request.ActorUserId);

                // Validar que el usuario autenticado sea el mismo que intenta firmar
                if (request.ActorUserId != authenticatedUserId)
                {
                    _logger.LogWarning("Intento de firma con usuario diferente - Autenticado: {AuthenticatedUserId}, Solicitado: {ActorUserId}", 
                        authenticatedUserId, request.ActorUserId);
                    return Unauthorized(new { message = "No puedes firmar en nombre de otro usuario" });
                }

                var result = await _pazYSalvoService.FirmarAsync(id, rol, request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al firmar Paz y Salvo");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Agregar observación al documento
        /// </summary>
        [HttpPost("{id}/firmas/{rol}/observe")]
        [Authorize]
        public async Task<IActionResult> Observar(int id, string rol, [FromBody] RechazarRequest request)
        {
            try
            {
                var result = await _pazYSalvoService.RechazarAsync(id, rol, request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al agregar observación");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Rechazar documento
        /// </summary>
        [HttpPost("{id}/firmas/{rol}/reject")]
        [Authorize]
        public async Task<IActionResult> Rechazar(int id, string rol, [FromBody] RechazarRequest request)
        {
            try
            {
                // Obtener el ID del usuario autenticado
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int authenticatedUserId))
                {
                    return Unauthorized(new { message = "Usuario no autenticado" });
                }

                // Validar que el usuario autenticado sea el mismo que intenta rechazar
                if (request.ActorUserId != authenticatedUserId)
                {
                    return Unauthorized(new { message = "No puedes rechazar en nombre de otro usuario" });
                }

                var result = await _pazYSalvoService.RechazarAsync(id, rol, request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al rechazar Paz y Salvo");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Crear excepción para cierre con activos pendientes
        /// </summary>
        [HttpPost("{id}/excepciones")]
        [Authorize(Policy = "RequireTIOrAdmin")]
        public async Task<IActionResult> CrearExcepcion(int id, [FromBody] CrearExcepcionRequest request)
        {
            try
            {
                var result = await _pazYSalvoService.CrearExcepcionAsync(id, request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear excepción");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Subir adjunto
        /// </summary>
        [HttpPost("{id}/adjuntos")]
        [Authorize]
        public async Task<IActionResult> SubirAdjunto(int id, IFormFile archivo)
        {
            try
            {
                if (archivo == null || archivo.Length == 0)
                    return BadRequest(new { message = "No se ha proporcionado ningún archivo" });

                // TODO: Implementar subida de archivos
                // Por ahora, retornar error
                return BadRequest(new { message = "Funcionalidad de adjuntos no implementada aún" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir adjunto");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtener detalle del documento
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> ObtenerDetalle(int id)
        {
            try
            {
                var result = await _pazYSalvoService.ObtenerDetalleAsync(id);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener detalle del Paz y Salvo");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Listar documentos con filtros y paginación
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Listar(
            [FromQuery] string? estado = null, 
            [FromQuery] string? rol = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null)
        {
            try
            {
                var result = await _pazYSalvoService.ListarAsync(estado, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al listar Paz y Salvo");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Eliminar un Paz y Salvo
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireRRHHOrAdminWithSubroles")]
        public async Task<IActionResult> Eliminar(int id)
        {
            try
            {
                var pazYSalvo = await _context.PazYSalvos
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (pazYSalvo == null)
                {
                    return NotFound(new { message = "Paz y Salvo no encontrado" });
                }

                // Verificar que el usuario tenga permisos para eliminar
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int currentUserId))
                {
                    return Unauthorized(new { message = "Usuario no autenticado" });
                }

                // Verificar permisos: admin, rrhh, o subrol RRHH
                var user = await _context.AuthUsers
                    .FirstOrDefaultAsync(u => u.Id == currentUserId);

                if (user == null)
                {
                    return Unauthorized(new { message = "Usuario no encontrado" });
                }

                // Verificar rol principal
                bool hasMainRole = user.Role == "admin" || user.Role == "rrhh";
                
                // Verificar subrol RRHH si no tiene rol principal
                bool hasRRHHSubrole = false;
                if (!hasMainRole)
                {
                    hasRRHHSubrole = await _context.PazYSalvoRoleAssignments
                        .AnyAsync(p => p.UserId == currentUserId && p.Rol == "RRHH" && p.IsActive);
                }

                if (!hasMainRole && !hasRRHHSubrole)
                {
                    return Forbid("No tienes permisos para eliminar Paz y Salvo");
                }

                // Eliminar el Paz y Salvo
                _context.PazYSalvos.Remove(pazYSalvo);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Paz y Salvo {Id} eliminado por usuario {UserId}", id, currentUserId);

                return Ok(new { message = "Paz y Salvo eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar Paz y Salvo {Id}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Endpoint de prueba sin autenticación para debuggear
        /// </summary>
        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test()
        {
            try
            {
                return Ok(new { 
                    success = true, 
                    message = "Test básico exitoso - sin base de datos",
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en test de Paz y Salvo: {Message}", ex.Message);
                return StatusCode(500, new { 
                    success = false, 
                    error = ex.Message, 
                    stackTrace = ex.StackTrace 
                });
            }
        }

        /// <summary>
        /// Descargar PDF final
        /// </summary>
        [HttpGet("{id}/pdf")]
        [Authorize]
        public async Task<IActionResult> DescargarPdf(int id)
        {
            try
            {
                var detalle = await _pazYSalvoService.ObtenerDetalleAsync(id);
                
                if (string.IsNullOrEmpty(detalle.PdfFinalPath))
                    return NotFound(new { message = "PDF no disponible. El documento debe estar cerrado para generar el PDF final." });

                // Obtener ruta completa del archivo
                var storageRoot = _configuration["Storage:Root"] ?? "Storage";
                if (!Path.IsPathRooted(storageRoot))
                {
                    storageRoot = Path.Combine(Directory.GetCurrentDirectory(), storageRoot);
                }

                var filePath = detalle.PdfFinalPath.StartsWith("/storage/")
                    ? Path.Combine(storageRoot, detalle.PdfFinalPath.Replace("/storage/", string.Empty))
                    : Path.Combine(storageRoot, detalle.PdfFinalPath.TrimStart('/'));

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { message = "Archivo PDF no encontrado" });

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var fileName = $"PazYSalvo_{detalle.UsuarioRut}_{detalle.FechaSalida:yyyyMMdd}.pdf";

                return File(fileBytes, "application/pdf", fileName);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al descargar PDF");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Descargar PDF firmado por rol específico
        /// </summary>
        [HttpGet("{id}/pdf/{rol}")]
        [Authorize]
        public async Task<IActionResult> DescargarPdfFirmadoPorRol(int id, string rol)
        {
            try
            {
                var pdfBytes = await _pazYSalvoService.GenerarPdfFirmadoPorRolAsync(id, rol);
                var fileName = $"PazYSalvo_{id}_Firmado_{rol}_{DateTime.Now:yyyyMMdd}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar PDF firmado por rol {Rol}", rol);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Previsualizar documento sin firmas (para todos los subroles)
        /// </summary>
        [HttpGet("{id}/preview")]
        [Authorize(Policy = "RequireRRHHOrAdminWithSubroles")]
        public async Task<IActionResult> PrevisualizarDocumento(int id)
        {
            try
            {
                var pdfBytes = await _pazYSalvoService.GenerarPdfPrevisualizacionAsync(id);
                var fileName = $"PazYSalvo_Preview_{id}_{DateTime.Now:yyyyMMdd}.pdf";
                
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar PDF de previsualización para Paz y Salvo {Id}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Cerrar documento (generar PDF final)
        /// </summary>
        [HttpPost("{id}/cerrar")]
        [Authorize(Policy = "RequireTIOrAdmin")]
        public async Task<IActionResult> Cerrar(int id)
        {
            try
            {
                var result = await _pazYSalvoService.CerrarAsync(id);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cerrar Paz y Salvo");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtener activos pendientes de un usuario
        /// </summary>
        [HttpGet("activos-pendientes/{usuarioId}")]
        [Authorize]
        public async Task<IActionResult> GetActivosPendientes(int usuarioId)
        {
            try
            {
                _logger.LogInformation("Buscando activos para usuario {UsuarioId}", usuarioId);
                
                // Verificar que el usuario existe en la nómina
                var usuario = await _context.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Id == usuarioId);

                if (usuario == null)
                {
                    _logger.LogWarning("Usuario no encontrado en nómina: {UsuarioId}", usuarioId);
                    return NotFound(new { message = "Usuario no encontrado en la nómina" });
                }

                _logger.LogInformation("Usuario encontrado: {Nombre} {Apellido}", usuario.Nombre, usuario.Apellido);
                
                // Obtener activos asignados al usuario usando la misma lógica que ActivosController
                var activosAsignados = await _context.AsignacionesActivos
                    .Include(aa => aa.Activo)
                    .Where(aa => aa.UsuarioId == usuarioId && aa.Estado == "Activa")
                    .Select(aa => new
                    {
                        Id = aa.ActivoId,
                        codigo = aa.Activo.Codigo,
                        categoria = aa.Activo.Categoria,
                        nombreEquipo = aa.Activo.NombreEquipo,
                        marca = aa.Activo.Marca,
                        modelo = aa.Activo.Modelo,
                        serie = aa.Activo.Serie,
                        tipoEquipo = aa.Activo.TipoEquipo,
                        procesador = aa.Activo.Procesador,
                        sistemaOperativo = aa.Activo.SistemaOperativo,
                        ram = aa.Activo.Ram,
                        ubicacion = aa.Activo.Ubicacion,
                        estado = aa.Activo.Estado,
                        fechaAsignacion = aa.FechaAsignacion,
                        Descripcion = $"{aa.Activo.Categoria} - {aa.Activo.Marca} {aa.Activo.Modelo}",
                        EstadoActivo = "Pendiente",
                        Observacion = "Pendiente de devolución",
                        FechaCorte = DateTime.Now
                    })
                    .ToListAsync();

                _logger.LogInformation("Encontrados {Count} activos para usuario {UsuarioId}", activosAsignados.Count, usuarioId);

                return Ok(activosAsignados);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener activos pendientes para usuario {UsuarioId}", usuarioId);
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        /// <summary>
        /// Verificar integridad del documento mediante hash
        /// </summary>
        [HttpGet("verify")]
        [AllowAnonymous]
        public async Task<IActionResult> VerificarHash([FromQuery] int id, [FromQuery] string h)
        {
            try
            {
                if (string.IsNullOrEmpty(h))
                    return BadRequest(new { message = "Hash requerido" });

                var result = await _pazYSalvoService.VerificarHashAsync(id);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar hash");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }
    }
}