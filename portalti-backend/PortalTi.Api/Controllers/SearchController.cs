using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using System.Security.Claims;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly PortalTiContext _context;

        public SearchController(PortalTiContext context)
        {
            _context = context;
        }

        // GET: api/search?q=query
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new List<object>());
            }

            var query = q.ToLower();
            var results = new List<object>();

            try
            {
                // Buscar activos
                var activos = await _context.Activos
                    .Where(a => a.Codigo.ToLower().Contains(query) || 
                               a.NombreEquipo.ToLower().Contains(query) ||
                               a.Categoria.ToLower().Contains(query))
                    .Take(5)
                    .Select(a => new
                    {
                        id = a.Id,
                        codigo = a.Codigo,
                        tipo = "activo",
                        titulo = a.Codigo,
                        subtitulo = $"{a.NombreEquipo} - {a.Categoria}",
                        estado = a.Estado
                    })
                    .ToListAsync();

                results.AddRange(activos);

                // Buscar usuarios (solo admin y soporte)
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole == "admin" || userRole == "soporte")
                {
                    var usuarios = await _context.NominaUsuarios
                        .Where(u => u.Nombre.ToLower().Contains(query) ||
                                   u.Apellido.ToLower().Contains(query) ||
                                   u.Email.ToLower().Contains(query))
                        .Take(5)
                        .Select(u => new
                        {
                            id = u.Id,
                            tipo = "usuario",
                            titulo = $"{u.Nombre} {u.Apellido}",
                            subtitulo = u.Email,
                            departamento = u.Departamento
                        })
                        .ToListAsync();

                    results.AddRange(usuarios);
                }

                // Buscar tickets
                var tickets = await _context.Tickets
                    .Where(t => t.Titulo.ToLower().Contains(query) ||
                               t.Descripcion.ToLower().Contains(query) ||
                               t.Categoria.ToLower().Contains(query))
                    .Take(5)
                    .Select(t => new
                    {
                        id = t.Id,
                        tipo = "ticket",
                        titulo = t.Titulo,
                        subtitulo = $"{t.Categoria} - {t.Estado}",
                        estado = t.Estado
                    })
                    .ToListAsync();

                results.AddRange(tickets);

                // Ordenar resultados por relevancia (activos primero, luego usuarios, luego tickets)
                var orderedResults = results
                    .OrderBy(r => r.GetType().GetProperty("tipo").GetValue(r).ToString() == "activo" ? 0 : 1)
                    .ThenBy(r => r.GetType().GetProperty("tipo").GetValue(r).ToString() == "usuario" ? 0 : 1)
                    .ThenBy(r => r.GetType().GetProperty("tipo").GetValue(r).ToString() == "ticket" ? 0 : 1)
                    .Take(10)
                    .ToList();

                return Ok(orderedResults);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error en la búsqueda", details = ex.Message });
            }
        }
    }
}
