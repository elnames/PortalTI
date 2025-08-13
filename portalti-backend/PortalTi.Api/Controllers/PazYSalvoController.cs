using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using System.Security.Claims;

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
        public async Task<ActionResult<IEnumerable<PazYSalvo>>> GetPazYSalvos()
        {
            return await _context.PazYSalvos
                .Include(p => p.Usuario)
                .OrderByDescending(p => p.FechaSubida)
                .ToListAsync();
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
            if (dto.Archivo == null || dto.Archivo.Length == 0)
            {
                return BadRequest("Archivo requerido");
            }

            // Validar que sea un PDF
            if (!dto.Archivo.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Solo se permiten archivos PDF");
            }

            // Crear directorio si no existe
            var uploadPath = Path.Combine(_environment.WebRootPath, "pazysalvo");
            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            // Generar nombre único para el archivo
            var fileName = $"{DateTime.Now:yyyyMMdd_HHmmss}_{Guid.NewGuid()}_{dto.Archivo.FileName}";
            var filePath = Path.Combine(uploadPath, fileName);

            // Guardar archivo
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.Archivo.CopyToAsync(stream);
            }

            // Crear registro en base de datos
            var pazYSalvo = new PazYSalvo
            {
                UsuarioId = dto.UsuarioId,
                UsuarioNombre = dto.UsuarioNombre,
                FechaSubida = DateTime.Now,
                ArchivoPath = $"/pazysalvo/{fileName}",
                Estado = "Pendiente",
                ActivosPendientes = dto.ActivosPendientes,
                Notas = dto.Notas
            };

            _context.PazYSalvos.Add(pazYSalvo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPazYSalvo), new { id = pazYSalvo.Id }, pazYSalvo);
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
            var filePath = Path.Combine(_environment.WebRootPath, pazYSalvo.ArchivoPath.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            _context.PazYSalvos.Remove(pazYSalvo);
            await _context.SaveChangesAsync();

            return NoContent();
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

            var filePath = Path.Combine(_environment.WebRootPath, pazYSalvo.ArchivoPath.TrimStart('/'));
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Archivo no encontrado");
            }

            var fileName = Path.GetFileName(pazYSalvo.ArchivoPath);
            var contentType = "application/pdf";

            return PhysicalFile(filePath, contentType, fileName);
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
                    aa.FechaAsignacion,
                    aa.Estado
                })
                .ToListAsync();

            return activosPendientes;
        }
    }

            public class PazYSalvoCreateDto
        {
            public int UsuarioId { get; set; }
            public string UsuarioNombre { get; set; } = string.Empty;
            public IFormFile Archivo { get; set; } = null!;
            public int ActivosPendientes { get; set; }
            public string Notas { get; set; } = string.Empty;
        }

            public class PazYSalvoUpdateDto
        {
            public string Estado { get; set; } = string.Empty;
            public string Notas { get; set; } = string.Empty;
        }
}
