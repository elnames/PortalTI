using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using PortalTi.Api.Data;
using PortalTi.Api.Models;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProgramasEstandarController : ControllerBase
    {
        private readonly PortalTiContext _context;

        public ProgramasEstandarController(PortalTiContext context)
        {
            _context = context;
        }

        // GET: api/programasestandar
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProgramaEstandar>>> GetProgramasEstandar()
        {
            try
            {
                Console.WriteLine("Solicitando programas estándar...");
                var programas = await _context.ProgramasEstandar
                    .Where(p => p.Activo)
                    .OrderBy(p => p.Categoria)
                    .ThenBy(p => p.Nombre)
                    .ToListAsync();
                
                Console.WriteLine($"Programas encontrados: {programas.Count}");
                return programas;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al obtener programas estándar: {ex.Message}");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/programasestandar/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProgramaEstandar>> GetProgramaEstandar(int id)
        {
            var programa = await _context.ProgramasEstandar.FindAsync(id);

            if (programa == null)
            {
                return NotFound();
            }

            return programa;
        }

        // GET: api/programasestandar/categorias
        [HttpGet("categorias")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategorias()
        {
            var categorias = await _context.ProgramasEstandar
                .Where(p => p.Activo)
                .Select(p => p.Categoria)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return categorias;
        }

        // POST: api/programasestandar
        [HttpPost]
        [Authorize(Roles = "admin,soporte")]
        public async Task<ActionResult<ProgramaEstandar>> PostProgramaEstandar(ProgramaEstandar programa)
        {
            programa.FechaCreacion = DateTime.UtcNow;
            programa.CreadoPor = User.Identity?.Name ?? "Sistema";

            _context.ProgramasEstandar.Add(programa);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProgramaEstandar", new { id = programa.Id }, programa);
        }

        // PUT: api/programasestandar/5
        [HttpPut("{id}")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> PutProgramaEstandar(int id, ProgramaEstandar programa)
        {
            if (id != programa.Id)
            {
                return BadRequest();
            }

            programa.FechaActualizacion = DateTime.UtcNow;
            programa.ActualizadoPor = User.Identity?.Name ?? "Sistema";

            _context.Entry(programa).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProgramaEstandarExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/programasestandar/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<IActionResult> DeleteProgramaEstandar(int id)
        {
            var programa = await _context.ProgramasEstandar.FindAsync(id);
            if (programa == null)
            {
                return NotFound();
            }

            programa.Activo = false;
            programa.FechaActualizacion = DateTime.UtcNow;
            programa.ActualizadoPor = User.Identity?.Name ?? "Sistema";

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProgramaEstandarExists(int id)
        {
            return _context.ProgramasEstandar.Any(e => e.Id == id);
        }
    }
}