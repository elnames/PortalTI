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
        [Authorize(Policy = "RequireRRHHOrAdmin")]
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
        /// Enviar documento a firma
        /// </summary>
        [HttpPost("{id}/send")]
        [Authorize(Policy = "RequireRRHHOrAdmin")]
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
                return Forbid(ex.Message);
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
                return Forbid(ex.Message);
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
                    return NotFound(new { message = "PDF no disponible" });

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
                
                // Obtener activos asignados al usuario
                var asignaciones = await _context.AsignacionesActivos
                    .Include(aa => aa.Activo)
                    .Where(aa => aa.UsuarioId == usuarioId && aa.Estado == "Activa")
                    .ToListAsync();

                _logger.LogInformation("Encontradas {Count} asignaciones para usuario {UsuarioId}", asignaciones.Count, usuarioId);

                var activos = asignaciones.Select(aa => new
                {
                    Id = aa.ActivoId,
                    Descripcion = $"{aa.Activo.Categoria} - {aa.Activo.Marca} {aa.Activo.Modelo}",
                    EstadoActivo = "Pendiente",
                    Observacion = "Pendiente de devolución",
                    FechaCorte = DateTime.Now
                }).ToList();

                _logger.LogInformation("Retornando {Count} activos para usuario {UsuarioId}", activos.Count, usuarioId);
                return Ok(activos);
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