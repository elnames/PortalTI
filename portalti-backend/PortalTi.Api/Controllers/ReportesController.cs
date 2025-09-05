using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using System.Linq;
using ClosedXML.Excel;

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

        // Rendimiento del equipo TI: KPIs por agente, tendencias y aging
        [HttpGet("ti-performance")]
        public async Task<IActionResult> GetTiPerformance(
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            try
            {
                var inicio = from?.Date ?? DateTime.UtcNow.AddDays(-30).Date;
                var fin = (to?.Date.AddDays(1) ?? DateTime.UtcNow.AddDays(1).Date); // exclusivo

                // Tickets del periodo
                var ticketsPeriodo = await _context.Tickets
                    .Include(t => t.AsignadoA)
                    .Include(t => t.CreadoPor)
                    .Where(t => t.FechaCreacion >= inicio && t.FechaCreacion < fin)
                    .ToListAsync();

                // Comentarios del periodo (para primera respuesta)
                var ticketIds = ticketsPeriodo.Select(t => t.Id).ToList();
                var comentarios = await _context.ComentariosTickets
                    .Include(c => c.CreadoPor)
                    .Where(c => ticketIds.Contains(c.TicketId))
                    .OrderBy(c => c.FechaCreacion)
                    .ToListAsync();

                // Política SLA (horas a resolución y primera respuesta por prioridad)
                var slaResolucionHoras = new Dictionary<string, double>
                {
                    {"Crítica", 8},
                    {"Alta", 16},
                    {"Media", 36},
                    {"Baja", 72}
                };
                var slaPrimeraRespuestaHoras = new Dictionary<string, double>
                {
                    {"Crítica", 1},
                    {"Alta", 2},
                    {"Media", 8},
                    {"Baja", 24}
                };

                // Helper local
                bool EsAgenteTi(AuthUser? u) => u != null && (u.Role == "admin" || u.Role == "soporte");

                // Agrupar por agente asignado
                var agentes = await _context.AuthUsers
                    .Where(u => u.Role == "admin" || u.Role == "soporte")
                    .Select(u => new { u.Id, u.Username, u.Role })
                    .ToListAsync();

                var perAgent = new List<object>();

                foreach (var agente in agentes)
                {
                    var abiertosAsignados = await _context.Tickets
                        .CountAsync(t => t.AsignadoAId == agente.Id && (t.Estado != "Cerrado" && t.Estado != "Resuelto"));

                    var resueltosPeriodo = ticketsPeriodo
                        .Where(t => t.AsignadoAId == agente.Id && (t.FechaResolucion.HasValue || t.FechaCierre.HasValue))
                        .ToList();

                    // Primera respuesta para tickets del agente (cuando cualquier admin/soporte responde primero)
                    var firstResponses = new List<TimeSpan>();
                    var resoluciones = new List<TimeSpan>();
                    int slaRespOk = 0, slaResOk = 0, slaRespTotal = 0, slaResTotal = 0;

                    foreach (var t in ticketsPeriodo.Where(t => t.AsignadoAId == agente.Id))
                    {
                        var firstReply = comentarios
                            .Where(c => c.TicketId == t.Id && EsAgenteTi(c.CreadoPor))
                            .OrderBy(c => c.FechaCreacion)
                            .FirstOrDefault();

                        if (firstReply != null)
                        {
                            var delta = firstReply.FechaCreacion - t.FechaCreacion;
                            if (delta.TotalSeconds >= 0)
                            {
                                firstResponses.Add(delta);
                                slaRespTotal++;
                                var limite = slaPrimeraRespuestaHoras.TryGetValue(t.Prioridad ?? "Media", out var h) ? h : 8;
                                if (delta.TotalHours <= limite) slaRespOk++;
                            }
                        }

                        DateTime? finRes = t.FechaCierre ?? t.FechaResolucion;
                        if (finRes.HasValue)
                        {
                            var rdelta = finRes.Value - t.FechaCreacion;
                            if (rdelta.TotalSeconds >= 0)
                            {
                                resoluciones.Add(rdelta);
                                slaResTotal++;
                                var limiteRes = slaResolucionHoras.TryGetValue(t.Prioridad ?? "Media", out var hr) ? hr : 36;
                                if (rdelta.TotalHours <= limiteRes) slaResOk++;
                            }
                        }
                    }

                    perAgent.Add(new
                    {
                        Id = agente.Id,
                        Nombre = agente.Username,
                        Rol = agente.Role,
                        AbiertosAsignados = abiertosAsignados,
                        ResueltosPeriodo = resueltosPeriodo.Count,
                        TiempoPrimeraRespuestaMin = firstResponses.Any() ? Math.Round(firstResponses.Average(x => x.TotalMinutes), 1) : 0,
                        TiempoResolucionHoras = resoluciones.Any() ? Math.Round(resoluciones.Average(x => x.TotalHours), 2) : 0,
                        SlaPrimeraRespuestaPct = slaRespTotal > 0 ? Math.Round((double)slaRespOk * 100 / slaRespTotal, 1) : 0,
                        SlaResolucionPct = slaResTotal > 0 ? Math.Round((double)slaResOk * 100 / slaResTotal, 1) : 0
                    });
                }

                // Tendencia de volumen (creados vs cerrados por día)
                var rangoDias = Enumerable.Range(0, (int)(fin - inicio).TotalDays)
                    .Select(offset => inicio.AddDays(offset).Date)
                    .ToList();

                var trend = rangoDias.Select(dia => new
                {
                    Fecha = dia.ToString("yyyy-MM-dd"),
                    Creados = ticketsPeriodo.Count(t => t.FechaCreacion.Date == dia),
                    Cerrados = ticketsPeriodo.Count(t => (t.FechaCierre ?? t.FechaResolucion)?.Date == dia)
                }).ToList();

                // Aging buckets para tickets abiertos
                var ahora = DateTime.UtcNow;
                var abiertos = await _context.Tickets.Where(t => t.Estado != "Cerrado" && t.Estado != "Resuelto").ToListAsync();
                int b0_2 = 0, b3_7 = 0, b8_14 = 0, b15_30 = 0, b30p = 0;
                foreach (var t in abiertos)
                {
                    var dias = (ahora - t.FechaCreacion).TotalDays;
                    if (dias <= 2) b0_2++;
                    else if (dias <= 7) b3_7++;
                    else if (dias <= 14) b8_14++;
                    else if (dias <= 30) b15_30++;
                    else b30p++;
                }

                var result = new
                {
                    Periodo = new { From = inicio, To = fin.AddDays(-1) },
                    PerAgent = perAgent.OrderByDescending(x => ((dynamic)x).ResueltosPeriodo).ToList(),
                    Trend = trend,
                    Aging = new { d0_2 = b0_2, d3_7 = b3_7, d8_14 = b8_14, d15_30 = b15_30, d30p = b30p }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al obtener rendimiento TI: {ex.Message}");
            }
        }

        // Reporte Trimestral de Registros
        [HttpGet("registros-trimestrales/excel")]
        public async Task<IActionResult> GenerarReporteTrimestralExcel([FromQuery] int? trimestre, [FromQuery] int? año)
        {
            try
            {
                var trimestreActual = trimestre ?? ((DateTime.Now.Month - 1) / 3) + 1;
                var añoActual = año ?? DateTime.Now.Year;

                // Obtener datos de usuarios con sus activos asignados
                var usuariosConAsignaciones = await _context.NominaUsuarios
                    .Include(u => u.Asignaciones)
                        .ThenInclude(a => a.Activo)
                    .Where(u => u.Asignaciones.Any())
                    .ToListAsync();

                var datosReporte = usuariosConAsignaciones.Select(u => new
                {
                    // Localidad
                    Region = "Chile",
                    OpCo = "VICSA",
                    Unidad = u.Departamento ?? "Sin departamento",
                    
                    // Identificación
                    Username = u.Nombre + " " + u.Apellido,
                    UsuarioAD = u.Email != null ? u.Email.Split('@')[0] : "N/A",
                    Correo = u.Email ?? "N/A",
                    
                    // Workstation (del primer activo asignado)
                    Hostname = u.Asignaciones.FirstOrDefault()?.Activo?.Nombre ?? "N/A",
                    Procesador = u.Asignaciones.FirstOrDefault()?.Activo?.Procesador ?? "N/A",
                    
                    // Status
                    OSName = u.Asignaciones.FirstOrDefault()?.Activo?.SistemaOperativo ?? "Windows 10",
                    Utilizacion = "Sí",
                    UsoRemoto = "Sí",
                    
                    // Instalaciones (simuladas por ahora)
                    CiscoSecureEndpoint = "Instalado",
                    CiscoUmbrella = "Instalado",
                    Rapid7 = "Instalado",
                    
                    // Observaciones
                    FechaActualizacion = DateTime.Now.ToString("dd-MM-yyyy"),
                    Comentar = "",
                    Validacion = "Confirmado"
                }).ToList();

                // Crear el archivo Excel
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Registros Trimestrales");

                // Configurar el estilo de la cabecera principal
                var headerStyle = workbook.Style;
                headerStyle.Fill.BackgroundColor = XLColor.FromHtml("#1F497D");
                headerStyle.Font.FontColor = XLColor.White;
                headerStyle.Font.Bold = true;
                headerStyle.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                headerStyle.Alignment.Vertical = XLAlignmentVerticalValues.Center;

                // Configurar el estilo de la sub-cabecera
                var subHeaderStyle = workbook.Style;
                subHeaderStyle.Fill.BackgroundColor = XLColor.FromHtml("#DCE6F1");
                subHeaderStyle.Font.FontColor = XLColor.Black;
                subHeaderStyle.Font.Bold = true;
                subHeaderStyle.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                subHeaderStyle.Alignment.Vertical = XLAlignmentVerticalValues.Center;

                // Configurar el estilo de los datos
                var dataStyle = workbook.Style;
                dataStyle.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                dataStyle.Alignment.Vertical = XLAlignmentVerticalValues.Center;

                // Crear la cabecera principal (fila 1)
                worksheet.Range("A1:P1").Merge();
                worksheet.Cell("A1").Value = "REPORTE TRIMESTRAL DE REGISTROS";
                worksheet.Cell("A1").Style = headerStyle;
                worksheet.Row(1).Height = 30;

                // Crear la sub-cabecera con información del trimestre (fila 2)
                worksheet.Range("A2:P2").Merge();
                worksheet.Cell("A2").Value = $"Trimestre {trimestreActual} - {añoActual}";
                worksheet.Cell("A2").Style = subHeaderStyle;
                worksheet.Row(2).Height = 25;

                // Crear las cabeceras de columnas (fila 3)
                var headers = new[]
                {
                    "Región", "OpCo", "Unidad", "Username", "Usuario AD", "Correo",
                    "Hostname", "Procesador", "O.S Name", "Utilizac", "Uso Remo",
                    "Cisco Secure Endp", "Cisco Umbre", "Rapid7", "Fecha de Actualizaci", "Comentar", "Validación"
                };

                for (int i = 0; i < headers.Length; i++)
                {
                    var cell = worksheet.Cell(3, i + 1);
                    cell.Value = headers[i];
                    cell.Style = subHeaderStyle;
                    cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                }
                worksheet.Row(3).Height = 25;

                // Llenar los datos
                for (int i = 0; i < datosReporte.Count; i++)
                {
                    var dato = datosReporte[i];
                    var row = i + 4;

                    var values = new[]
                    {
                        dato.Region, dato.OpCo, dato.Unidad, dato.Username, dato.UsuarioAD, dato.Correo,
                        dato.Hostname, dato.Procesador, dato.OSName, dato.Utilizacion, dato.UsoRemoto,
                        dato.CiscoSecureEndpoint, dato.CiscoUmbrella, dato.Rapid7, dato.FechaActualizacion, dato.Comentar, dato.Validacion
                    };

                    for (int j = 0; j < values.Length; j++)
                    {
                        var cell = worksheet.Cell(row, j + 1);
                        cell.Value = values[j];
                        cell.Style = dataStyle;
                        cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    }
                    worksheet.Row(row).Height = 20;
                }

                // Ajustar el ancho de las columnas
                worksheet.Columns().AdjustToContents();

                // Agregar filtros a la fila de cabecera
                worksheet.Range(3, 1, 3, headers.Length).SetAutoFilter();

                // Generar el archivo en memoria
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var fileName = $"Registros_Trimestrales_Q{trimestreActual}_{añoActual}_{DateTime.Now:yyyyMMdd}.xlsx";
                return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al generar reporte trimestral: {ex.Message}");
            }
        }
    }
} 