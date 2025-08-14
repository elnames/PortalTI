using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using System.Security.Claims;
using System.Text.Json;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PazYSalvoController : ControllerBase
    {
        private readonly PortalTiContext _context;
        private readonly IWebHostEnvironment _environment;

        public PazYSalvoController(PortalTiContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/pazysalvo
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetPazYSalvos()
        {
            var pazYSalvos = await _context.PazYSalvos
                .Include(p => p.Usuario)
                .OrderByDescending(p => p.FechaSubida)
                .ToListAsync();

            var result = new List<object>();

            foreach (var pazYSalvo in pazYSalvos)
            {
                // Calcular activos pendientes reales
                var activosPendientes = await _context.AsignacionesActivos
                    .Where(aa => aa.UsuarioId == pazYSalvo.UsuarioId && aa.Estado == "Activa")
                    .CountAsync();

                result.Add(new
                {
                    pazYSalvo.Id,
                    pazYSalvo.UsuarioId,
                    UsuarioNombre = pazYSalvo.UsuarioNombre,
                    pazYSalvo.FechaSubida,
                    pazYSalvo.ArchivoPath,
                    pazYSalvo.Estado,
                    pazYSalvo.Notas,
                    ActivosPendientes = activosPendientes
                });
            }

            return result;
        }

        // GET: api/pazysalvo/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PazYSalvo>> GetPazYSalvo(int id)
        {
            var pazYSalvo = await _context.PazYSalvos
                .Include(p => p.Usuario)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pazYSalvo == null)
            {
                return NotFound();
            }

            return pazYSalvo;
        }

        // POST: api/pazysalvo
        [HttpPost]
        public async Task<ActionResult<PazYSalvo>> CreatePazYSalvo([FromForm] PazYSalvoCreateDto dto)
        {
            try
            {
                if (dto.Archivo == null || dto.Archivo.Length == 0)
                {
                    return BadRequest("Archivo requerido");
                }

                // Validar que sea un PDF
                if (dto.Archivo.ContentType != "application/pdf")
                {
                    return BadRequest("Solo se permiten archivos PDF");
                }

                // Validar tamaño del archivo (máximo 10MB)
                if (dto.Archivo.Length > 10 * 1024 * 1024)
                {
                    return BadRequest("El archivo no puede ser mayor a 10MB");
                }

                // Validar usuario
                if (dto.UsuarioId <= 0)
                {
                    return BadRequest("Usuario requerido");
                }

                // Verificar que el usuario existe
                var usuario = await _context.NominaUsuarios.FindAsync(dto.UsuarioId);
                if (usuario == null)
                {
                    return BadRequest("Usuario no encontrado");
                }

                // Crear directorio si no existe
                string uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "pazysalvo");
                Directory.CreateDirectory(uploadsDir);

                // Generar nombre único para el archivo
                string fileName = $"PazYSalvo_{usuario.Nombre}_{usuario.Apellido}_{DateTime.Now:yyyyMMddHHmmss}.pdf";
                fileName = fileName.Replace(" ", "_");
                string filePath = Path.Combine(uploadsDir, fileName);

                // Guardar archivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.Archivo.CopyToAsync(stream);
                }

                // Procesar activos devueltos si se proporcionan
                var activosDevueltosInfo = new List<object>();
                if (!string.IsNullOrEmpty(dto.ActivosDevueltos))
                {
                    try
                    {
                        activosDevueltosInfo = JsonSerializer.Deserialize<List<object>>(dto.ActivosDevueltos);
                    }
                    catch (JsonException)
                    {
                        // Si no se puede deserializar, continuar sin activos devueltos
                    }
                }

                // Crear registro en base de datos
                var pazYSalvo = new PazYSalvo
                {
                    UsuarioId = dto.UsuarioId,
                    UsuarioNombre = dto.UsuarioNombre ?? $"{usuario.Nombre} {usuario.Apellido}",
                    FechaSubida = DateTime.Now,
                    ArchivoPath = $"/pazysalvo/{fileName}",
                    Estado = "Pendiente",
                    ActivosPendientes = dto.ActivosPendientes,
                    Notas = dto.Notas ?? ""
                };

                _context.PazYSalvos.Add(pazYSalvo);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPazYSalvo), new { id = pazYSalvo.Id }, pazYSalvo);
            }
            catch (Exception ex)
            {
                // Log del error para debugging
                Console.WriteLine($"Error al crear Paz y Salvo: {ex.Message}");
                return StatusCode(500, "Error interno del servidor al procesar el archivo");
            }
        }

        // PUT: api/pazysalvo/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePazYSalvo(int id, PazYSalvoUpdateDto dto)
        {
            var pazYSalvo = await _context.PazYSalvos.FindAsync(id);
            if (pazYSalvo == null)
            {
                return NotFound();
            }

            pazYSalvo.Estado = dto.Estado;
            pazYSalvo.Notas = dto.Notas;
            pazYSalvo.FechaActualizacion = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/pazysalvo/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePazYSalvo(int id)
        {
            var pazYSalvo = await _context.PazYSalvos.FindAsync(id);
            if (pazYSalvo == null)
            {
                return NotFound();
            }

            // Eliminar archivo físico
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", pazYSalvo.ArchivoPath.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            _context.PazYSalvos.Remove(pazYSalvo);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/pazysalvo/{id}/eliminar
        [HttpDelete("{id}/eliminar")]
        public async Task<IActionResult> EliminarPazYSalvo(int id)
        {
            try
            {
                var pazYSalvo = await _context.PazYSalvos.FindAsync(id);
                if (pazYSalvo == null)
                {
                    return NotFound("Documento no encontrado");
                }

                // Eliminar archivo físico
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", pazYSalvo.ArchivoPath.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                _context.PazYSalvos.Remove(pazYSalvo);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Documento eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/pazysalvo/download/{id}
        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadPazYSalvo(int id)
        {
            var pazYSalvo = await _context.PazYSalvos.FindAsync(id);
            if (pazYSalvo == null)
            {
                return NotFound();
            }

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", pazYSalvo.ArchivoPath.TrimStart('/'));
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Archivo no encontrado");
            }

            var fileName = Path.GetFileName(pazYSalvo.ArchivoPath);
            var contentType = "application/pdf";

            return PhysicalFile(filePath, contentType, fileName);
        }

        // GET: api/pazysalvo/preview/{id}
        [HttpGet("preview/{id}")]
        public async Task<IActionResult> PreviewPazYSalvo(int id)
        {
            var pazYSalvo = await _context.PazYSalvos.FindAsync(id);
            if (pazYSalvo == null)
            {
                return NotFound();
            }

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", pazYSalvo.ArchivoPath.TrimStart('/'));
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Archivo no encontrado");
            }

            var contentType = "application/pdf";
            
            // Para previsualización, no incluir el nombre del archivo para evitar descarga
            return PhysicalFile(filePath, contentType);
        }

        // GET: api/pazysalvo/activos-pendientes/{usuarioId}
        [HttpGet("activos-pendientes/{usuarioId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetActivosPendientes(int usuarioId)
        {
            var activosPendientes = await _context.AsignacionesActivos
                .Include(aa => aa.Activo)
                .Where(aa => aa.UsuarioId == usuarioId && aa.Estado == "Activa")
                .Select(aa => new
                {
                    aa.Activo.Id,
                    aa.Activo.Codigo,
                    aa.Activo.Nombre,
                    aa.Activo.Categoria,
                    aa.Activo.NombreEquipo,
                    aa.FechaAsignacion,
                    aa.Estado
                })
                .ToListAsync();

            return activosPendientes;
        }

        // GET: api/pazysalvo/activos-pendientes-todos
        [HttpGet("activos-pendientes-todos")]
        public async Task<ActionResult<IEnumerable<object>>> GetActivosPendientesTodos()
        {
            // Obtener todos los usuarios que tienen documentos de paz y salvo pendientes
            var usuariosConPazYSalvo = await _context.PazYSalvos
                .Where(p => p.Estado == "Pendiente")
                .Select(p => p.UsuarioId)
                .Distinct()
                .ToListAsync();

            var activosPendientes = new List<object>();

            foreach (var usuarioId in usuariosConPazYSalvo)
            {
                var activosUsuario = await _context.AsignacionesActivos
                    .Include(aa => aa.Activo)
                    .Include(aa => aa.Usuario)
                    .Where(aa => aa.UsuarioId == usuarioId && aa.Estado == "Activa")
                    .Select(aa => new
                    {
                        aa.Activo.Id,
                        aa.Activo.Codigo,
                        aa.Activo.Nombre,
                        aa.Activo.Categoria,
                        aa.Activo.NombreEquipo,
                        aa.FechaAsignacion,
                        aa.Estado,
                        UsuarioId = aa.UsuarioId,
                        UsuarioNombre = $"{aa.Usuario.Nombre} {aa.Usuario.Apellido}",
                        PazYSalvoId = _context.PazYSalvos
                            .Where(p => p.UsuarioId == aa.UsuarioId && p.Estado == "Pendiente")
                            .Select(p => p.Id)
                            .FirstOrDefault()
                    })
                    .ToListAsync();

                activosPendientes.AddRange(activosUsuario);
            }

            return activosPendientes;
        }

        // POST: api/pazysalvo/marcar-activo-devuelto
        [HttpPost("marcar-activo-devuelto")]
        public async Task<IActionResult> MarcarActivoDevuelto([FromBody] MarcarActivoDevueltoDto dto)
        {
            try
            {
                // Buscar la asignación del activo
                var asignacion = await _context.AsignacionesActivos
                    .Include(aa => aa.Activo)
                    .Include(aa => aa.Usuario)
                    .FirstOrDefaultAsync(aa => aa.ActivoId == dto.ActivoId && aa.UsuarioId == dto.UsuarioId && aa.Estado == "Activa");

                if (asignacion == null)
                {
                    return NotFound("Asignación no encontrada");
                }

                // Marcar la asignación como devuelta
                asignacion.Estado = "Devuelto";
                asignacion.FechaDevolucion = DateTime.Now;
                asignacion.Observaciones = dto.Observaciones ?? "Devuelto por Paz y Salvo";

                await _context.SaveChangesAsync();

                // Verificar si todos los activos del usuario han sido devueltos
                var activosPendientes = await _context.AsignacionesActivos
                    .Where(aa => aa.UsuarioId == dto.UsuarioId && aa.Estado == "Activa")
                    .CountAsync();

                if (activosPendientes == 0)
                {
                    // Si no hay más activos pendientes, marcar el paz y salvo como completado
                    var pazYSalvo = await _context.PazYSalvos
                        .Where(p => p.UsuarioId == dto.UsuarioId && p.Estado == "Pendiente")
                        .FirstOrDefaultAsync();

                    if (pazYSalvo != null)
                    {
                        pazYSalvo.Estado = "Completado";
                        pazYSalvo.FechaActualizacion = DateTime.Now;
                        await _context.SaveChangesAsync();
                    }
                }

                return Ok(new { message = "Activo marcado como devuelto exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }

    public class PazYSalvoCreateDto
    {
        public int UsuarioId { get; set; }
        public string? UsuarioNombre { get; set; }
        public IFormFile Archivo { get; set; } = null!;
        public int ActivosPendientes { get; set; }
        public string? Notas { get; set; }
        public string? ActivosDevueltos { get; set; } // JSON string con información de activos devueltos
    }

    public class PazYSalvoUpdateDto
    {
        public string Estado { get; set; } = string.Empty;
        public string Notas { get; set; } = string.Empty;
    }

    public class MarcarActivoDevueltoDto
    {
        public int UsuarioId { get; set; }
        public int ActivoId { get; set; }
        public string? Observaciones { get; set; }
    }
}
