using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin,soporte")]
    public class ProgramasEstandarController : ControllerBase
    {
        private readonly PortalTiContext _context;
        private readonly ILogger<ProgramasEstandarController> _logger;

        public ProgramasEstandarController(PortalTiContext context, ILogger<ProgramasEstandarController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/programasestandar
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProgramaEstandarDto>>> GetProgramasEstandar()
        {
            try
            {
                var programas = await _context.ProgramasEstandar
                    .Where(p => p.Activo)
                    .OrderBy(p => p.Categoria)
                    .ThenBy(p => p.Nombre)
                    .Select(p => new ProgramaEstandarDto
                    {
                        Id = p.Id,
                        Nombre = p.Nombre,
                        Categoria = p.Categoria,
                        Tipo = p.Tipo,
                        Descripcion = p.Descripcion,
                        VersionRecomendada = p.VersionRecomendada,
                        Activo = p.Activo,
                        FechaCreacion = p.FechaCreacion,
                        FechaActualizacion = p.FechaActualizacion
                    })
                    .ToListAsync();

                return Ok(programas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener programas estándar");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/programasestandar/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ProgramaEstandarDto>> GetProgramaEstandar(int id)
        {
            try
            {
                var programa = await _context.ProgramasEstandar
                    .Where(p => p.Id == id)
                    .Select(p => new ProgramaEstandarDto
                    {
                        Id = p.Id,
                        Nombre = p.Nombre,
                        Categoria = p.Categoria,
                        Tipo = p.Tipo,
                        Descripcion = p.Descripcion,
                        VersionRecomendada = p.VersionRecomendada,
                        Activo = p.Activo,
                        FechaCreacion = p.FechaCreacion,
                        FechaActualizacion = p.FechaActualizacion
                    })
                    .FirstOrDefaultAsync();

                if (programa == null)
                    return NotFound("Programa estándar no encontrado");

                return Ok(programa);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener programa estándar {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/programasestandar
        [HttpPost]
        public async Task<ActionResult<ProgramaEstandarDto>> CreateProgramaEstandar(CreateProgramaEstandarDto dto)
        {
            try
            {
                var programa = new ProgramaEstandar
                {
                    Nombre = dto.Nombre,
                    Categoria = dto.Categoria,
                    Tipo = dto.Tipo,
                    Descripcion = dto.Descripcion,
                    VersionRecomendada = dto.VersionRecomendada,
                    Activo = dto.Activo,
                    FechaCreacion = DateTime.UtcNow,
                    CreadoPor = User.Identity?.Name ?? "Sistema"
                };

                _context.ProgramasEstandar.Add(programa);
                await _context.SaveChangesAsync();

                var programaDto = new ProgramaEstandarDto
                {
                    Id = programa.Id,
                    Nombre = programa.Nombre,
                    Categoria = programa.Categoria,
                    Tipo = programa.Tipo,
                    Descripcion = programa.Descripcion,
                    VersionRecomendada = programa.VersionRecomendada,
                    Activo = programa.Activo,
                    FechaCreacion = programa.FechaCreacion,
                    FechaActualizacion = programa.FechaActualizacion
                };

                return CreatedAtAction(nameof(GetProgramaEstandar), new { id = programa.Id }, programaDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear programa estándar");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/programasestandar/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProgramaEstandar(int id, UpdateProgramaEstandarDto dto)
        {
            try
            {
                var programa = await _context.ProgramasEstandar.FindAsync(id);
                if (programa == null)
                    return NotFound("Programa estándar no encontrado");

                programa.Nombre = dto.Nombre;
                programa.Categoria = dto.Categoria;
                programa.Tipo = dto.Tipo;
                programa.Descripcion = dto.Descripcion;
                programa.VersionRecomendada = dto.VersionRecomendada;
                programa.Activo = dto.Activo;
                programa.FechaActualizacion = DateTime.UtcNow;
                programa.ActualizadoPor = User.Identity?.Name ?? "Sistema";

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar programa estándar {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // DELETE: api/programasestandar/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProgramaEstandar(int id)
        {
            try
            {
                var programa = await _context.ProgramasEstandar.FindAsync(id);
                if (programa == null)
                    return NotFound("Programa estándar no encontrado");

                programa.Activo = false;
                programa.FechaActualizacion = DateTime.UtcNow;
                programa.ActualizadoPor = User.Identity?.Name ?? "Sistema";

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar programa estándar {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/programasestandar/categorias
        [HttpGet("categorias")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategorias()
        {
            try
            {
                var categorias = await _context.ProgramasEstandar
                    .Where(p => p.Activo)
                    .Select(p => p.Categoria)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                return Ok(categorias);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener categorías de programas estándar");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/programasestandar/verificar-instalacion
        [HttpPost("verificar-instalacion")]
        public async Task<ActionResult<object>> VerificarInstalacion([FromBody] VerificarInstalacionRequest request)
        {
            try
            {
                var activo = await _context.Activos
                    .Include(a => a.Software)
                    .Include(a => a.ProgramasSeguridad)
                    .Include(a => a.Licencias)
                    .FirstOrDefaultAsync(a => a.Id == request.ActivoId);

                if (activo == null)
                    return NotFound("Activo no encontrado");

                var programasEstandar = await _context.ProgramasEstandar
                    .Where(p => p.Activo && p.Categoria == request.Categoria)
                    .ToListAsync();

                var verificacion = programasEstandar.Select(pe => new
                {
                    Programa = pe.Nombre,
                    Categoria = pe.Categoria,
                    Tipo = pe.Tipo,
                    VersionRecomendada = pe.VersionRecomendada,
                    Instalado = pe.Categoria switch
                    {
                        "Software" => activo.Software.Any(s => s.Nombre.ToLower().Contains(pe.Nombre.ToLower()) && s.Estado == "OK"),
                        "Seguridad" => activo.ProgramasSeguridad.Any(p => p.Nombre.ToLower().Contains(pe.Nombre.ToLower()) && p.Estado == "OK"),
                        "Licencia" => activo.Licencias.Any(l => l.Software.ToLower().Contains(pe.Nombre.ToLower())),
                        _ => false
                    },
                    VersionInstalada = pe.Categoria switch
                    {
                        "Software" => activo.Software.FirstOrDefault(s => s.Nombre.ToLower().Contains(pe.Nombre.ToLower()))?.Version,
                        "Seguridad" => activo.ProgramasSeguridad.FirstOrDefault(p => p.Nombre.ToLower().Contains(pe.Nombre.ToLower()))?.Nombre,
                        "Licencia" => activo.Licencias.FirstOrDefault(l => l.Software.ToLower().Contains(pe.Nombre.ToLower()))?.Software,
                        _ => null
                    }
                }).ToList();

                return Ok(new
                {
                    ActivoId = activo.Id,
                    NombreActivo = activo.NombreEquipo ?? activo.Nombre,
                    Categoria = request.Categoria,
                    Verificacion = verificacion,
                    TotalProgramas = programasEstandar.Count,
                    ProgramasInstalados = verificacion.Count(v => v.Instalado),
                    PorcentajeCompletitud = programasEstandar.Count > 0 ? 
                        (double)verificacion.Count(v => v.Instalado) / programasEstandar.Count * 100 : 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar instalación para activo {ActivoId}", request.ActivoId);
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }

    public class VerificarInstalacionRequest
    {
        public int ActivoId { get; set; }
        public string Categoria { get; set; } = "Software";
    }
}
