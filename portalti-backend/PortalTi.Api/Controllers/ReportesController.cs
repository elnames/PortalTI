using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "CanViewReports")]
    public class ReportesController : ControllerBase
    {
        private readonly PortalTiContext _context;

        public ReportesController(PortalTiContext context)
        {
            _context = context;
        }

        [HttpGet("{tipo}")]
        public async Task<IActionResult> GenerarReportePDF(string tipo, [FromQuery] string? startDate, [FromQuery] string? endDate, 
            [FromQuery] string? categoria, [FromQuery] string? departamento, [FromQuery] string? empresa, [FromQuery] string? estado)
        {
            try
            {
                // Por ahora retornamos un PDF básico
                var pdfContent = $"Reporte de {tipo} generado el {DateTime.Now:dd/MM/yyyy}";
                var pdfBytes = System.Text.Encoding.UTF8.GetBytes(pdfContent);

                return File(pdfBytes, "application/pdf", $"Reporte_{tipo}_{DateTime.Now:yyyy-MM-dd}.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al generar reporte: {ex.Message}");
            }
        }

        [HttpGet("{tipo}/excel")]
        public async Task<IActionResult> GenerarReporteExcel(string tipo, [FromQuery] string? startDate, [FromQuery] string? endDate,
            [FromQuery] string? categoria, [FromQuery] string? departamento, [FromQuery] string? empresa, [FromQuery] string? estado)
        {
            try
            {
                // Por ahora retornamos un Excel básico
                var excelContent = $"Reporte Excel de {tipo} generado el {DateTime.Now:dd/MM/yyyy}";
                var excelBytes = System.Text.Encoding.UTF8.GetBytes(excelContent);

                return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                    $"Reporte_{tipo}_{DateTime.Now:yyyy-MM-dd}.xlsx");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al generar reporte Excel: {ex.Message}");
            }
        }

        [HttpGet("estadisticas")]
        public async Task<IActionResult> ObtenerEstadisticas()
        {
            try
            {
                var totalUsuarios = await _context.NominaUsuarios.CountAsync();
                var totalActivos = await _context.Activos.CountAsync();
                var activosAsignados = await _context.Activos.CountAsync(a => a.Asignaciones.Any(asig => asig.Estado == "Activa"));
                var totalTickets = await _context.Tickets.CountAsync();
                var ticketsAbiertos = await _context.Tickets.CountAsync(t => t.Estado == "Abierto");

                var porDepartamento = await _context.NominaUsuarios
                    .GroupBy(u => u.Departamento ?? "Sin departamento")
                    .Select(g => new { Departamento = g.Key, Cantidad = g.Count() })
                    .ToListAsync();

                var porCategoria = await _context.Activos
                    .GroupBy(a => a.Categoria ?? "Sin categoría")
                    .Select(g => new { Categoria = g.Key, Cantidad = g.Count() })
                    .ToListAsync();

                var estadisticas = new
                {
                    TotalUsuarios = totalUsuarios,
                    TotalActivos = totalActivos,
                    ActivosAsignados = activosAsignados,
                    ActivosDisponibles = totalActivos - activosAsignados,
                    TotalTickets = totalTickets,
                    TicketsAbiertos = ticketsAbiertos,
                    TicketsCerrados = totalTickets - ticketsAbiertos,
                    PorDepartamento = porDepartamento,
                    PorCategoria = porCategoria
                };

                return Ok(estadisticas);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al obtener estadísticas: {ex.Message}");
            }
        }
    }
} 