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
        private readonly ILogger<ReportesController> _logger;

        public ReportesController(PortalTiContext context, ILogger<ReportesController> logger)
        {
            _context = context;
            _logger = logger;
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

                // Obtener datos reales de usuarios con sus activos asignados
                var usuariosConAsignaciones = await _context.NominaUsuarios
                    .Include(u => u.Asignaciones)
                        .ThenInclude(a => a.Activo)
                            .ThenInclude(act => act.Software)
                    .Include(u => u.Asignaciones)
                        .ThenInclude(a => a.Activo)
                            .ThenInclude(act => act.ProgramasSeguridad)
                    .Include(u => u.Asignaciones)
                        .ThenInclude(a => a.Activo)
                            .ThenInclude(act => act.Licencias)
                    .Where(u => u.Asignaciones.Any(a => a.Estado == "Activa"))
                    .ToListAsync();

                // Separar equipos por tipo - WORKSTATIONS
                var workstations = usuariosConAsignaciones
                    .Where(u => u.Asignaciones?.Any(a => a.Estado == "Activa" && 
                                                         a.Activo?.TipoEquipo?.ToLower().Contains("laptop") == true || 
                                                         a.Activo?.TipoEquipo?.ToLower().Contains("desktop") == true ||
                                                         a.Activo?.TipoEquipo?.ToLower().Contains("workstation") == true ||
                                                         a.Activo?.TipoEquipo?.ToLower().Contains("computador") == true ||
                                                         a.Activo?.TipoEquipo?.ToLower().Contains("pc") == true) == true)
                    .SelectMany(u => u.Asignaciones
                        .Where(a => a.Estado == "Activa" && 
                                   (a.Activo?.TipoEquipo?.ToLower().Contains("laptop") == true || 
                                    a.Activo?.TipoEquipo?.ToLower().Contains("desktop") == true ||
                                    a.Activo?.TipoEquipo?.ToLower().Contains("workstation") == true ||
                                    a.Activo?.TipoEquipo?.ToLower().Contains("computador") == true ||
                                    a.Activo?.TipoEquipo?.ToLower().Contains("pc") == true))
                        .Select(a => new
                        {
                            Region = "Chile", // Datos reales de la base
                            OpCo = a.Activo?.Empresa ?? "VICSA",
                            Username = u.Nombre + " " + u.Apellido,
                            Correo = u.Email ?? "N/A",
                            Hostname = a.Activo?.NombreEquipo ?? a.Activo?.Nombre ?? "N/A",
                            Procesador = a.Activo?.Procesador ?? "N/A",
                            OSNombre = a.Activo?.SistemaOperativo ?? "Windows 10",
                            Utilizacion = "Sí", // Basado en estado activo
                            UsoRemoto = a.Activo?.Software?.Any(p => p.Nombre.ToLower().Contains("forticlient") && p.Estado == "OK") == true ? "Sí" : "No",
                            // Verificar programas de seguridad instalados
                            CiscoSecureEndpoint = a.Activo?.ProgramasSeguridad?.Any(p => p.Nombre.ToLower().Contains("cisco") && p.Estado == "OK") == true ? "Instalado" : "No instalado",
                            CiscoUmbrella = a.Activo?.ProgramasSeguridad?.Any(p => p.Nombre.ToLower().Contains("umbrella") && p.Estado == "OK") == true ? "Instalado" : "No instalado",
                            Rapid7 = a.Activo?.ProgramasSeguridad?.Any(p => p.Nombre.ToLower().Contains("rapid7") && p.Estado == "OK") == true ? "Instalado" : "No instalado",
                            Vicarius = a.Activo?.ProgramasSeguridad?.Any(p => p.Nombre.ToLower().Contains("vicarius") && p.Estado == "OK") == true ? "Instalado" : "No instalado",
                            FechaActualizacion = DateTime.Now.ToString("dd/MM/yyyy"),
                            Comentarios = a.Observaciones ?? "",
                            Validacion = "Confirmado" // Basado en asignación activa
                        }))
                    .ToList();

                // Separar equipos por tipo - CELULARES
                var celulares = usuariosConAsignaciones
                    .Where(u => u.Asignaciones?.Any(a => a.Estado == "Activa" && 
                                                         (a.Activo?.TipoEquipo?.ToLower().Contains("celular") == true || 
                                                          a.Activo?.TipoEquipo?.ToLower().Contains("telefono") == true ||
                                                          a.Activo?.TipoEquipo?.ToLower().Contains("mobile") == true ||
                                                          a.Activo?.TipoEquipo?.ToLower().Contains("smartphone") == true ||
                                                          a.Activo?.TipoEquipo?.ToLower().Contains("iphone") == true ||
                                                          a.Activo?.TipoEquipo?.ToLower().Contains("android") == true)) == true)
                    .SelectMany(u => u.Asignaciones
                        .Where(a => a.Estado == "Activa" && 
                                   (a.Activo?.TipoEquipo?.ToLower().Contains("celular") == true || 
                                    a.Activo?.TipoEquipo?.ToLower().Contains("telefono") == true ||
                                    a.Activo?.TipoEquipo?.ToLower().Contains("mobile") == true ||
                                    a.Activo?.TipoEquipo?.ToLower().Contains("smartphone") == true ||
                                    a.Activo?.TipoEquipo?.ToLower().Contains("iphone") == true ||
                                    a.Activo?.TipoEquipo?.ToLower().Contains("android") == true))
                        .Select(a => new
                        {
                            Responsable = u.Nombre + " " + u.Apellido,
                            Empresa = a.Activo?.Empresa ?? "VICSA",
                            NombreDispositivo = a.Activo?.NombreEquipo ?? a.Activo?.Nombre ?? "N/A",
                            Fabricante = a.Activo?.Marca ?? "N/A",
                            Modelo = a.Activo?.Modelo ?? "N/A",
                            VersionOS = a.Activo?.SistemaOperativo ?? "N/A",
                            MemoriaDisponible = a.Activo?.Capacidad ?? "N/A",
                            NumeroTelefono = a.Activo?.NumeroCelular ?? "N/A",
                            MAC = a.Activo?.Imei ?? "N/A"
                        }))
                    .ToList();

                // Crear libro de Excel
                using var workbook = new XLWorkbook();

                // ===== HOJA WORKSTATIONS =====
                var wsWorkstations = workbook.Worksheets.Add("Workstations");
                CrearHojaWorkstations(wsWorkstations, workstations, trimestreActual, añoActual);

                // ===== HOJA CELULARES =====
                var wsCelulares = workbook.Worksheets.Add("Celulares");
                CrearHojaCelulares(wsCelulares, celulares, trimestreActual, añoActual);

                // Generar archivo
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                var content = stream.ToArray();

                var fileName = $"Reporte_Trimestral_Q{trimestreActual}_{añoActual}.xlsx";
                return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar reporte trimestral Excel");
                return StatusCode(500, "Error interno del servidor al generar el reporte");
            }
        }

        private void CrearHojaWorkstations(IXLWorksheet worksheet, dynamic workstations, int trimestre, int año)
        {
            // Configurar estilos
            var headerFill = XLColor.FromArgb(68, 114, 196); // Azul oscuro
            var subHeaderFill = XLColor.FromArgb(173, 216, 230); // Azul claro
            var borderColor = XLColor.Black;

            // Título principal
            worksheet.Cell("A1").Value = "REPORTE TRIMESTRAL DE REGISTROS - WORKSTATIONS";
            worksheet.Cell("A1").Style.Font.Bold = true;
            worksheet.Cell("A1").Style.Font.FontSize = 16;
            worksheet.Cell("A1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range("A1:P1").Merge();

            // Sub-título
            worksheet.Cell("A2").Value = $"Trimestre {trimestre} - Año {año}";
            worksheet.Cell("A2").Style.Font.Bold = true;
            worksheet.Cell("A2").Style.Font.FontSize = 12;
            worksheet.Cell("A2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range("A2:P2").Merge();

            // Fila vacía
            worksheet.Row(3).Height = 5;

            // Cabeceras principales (fila 4)
            var mainHeaders = new[]
            {
                ("A4:B4", "Localidad"),
                ("C4:D4", "Identificación"),
                ("E4:F4", "Workstation"),
                ("G4:I4", "Status"),
                ("J4:M4", "Instalaciones"),
                ("N4:P4", "Observaciones")
            };

            foreach (var (range, text) in mainHeaders)
            {
                worksheet.Range(range).Value = text;
                worksheet.Range(range).Style.Font.Bold = true;
                worksheet.Range(range).Style.Font.FontColor = XLColor.White;
                worksheet.Range(range).Style.Fill.BackgroundColor = headerFill;
                worksheet.Range(range).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                worksheet.Range(range).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                worksheet.Range(range).Style.Border.OutsideBorderColor = borderColor;
            }

            // Sub-cabeceras (fila 5)
            var subHeaders = new[]
            {
                ("A5", "Región"), ("B5", "OpCo"),
                ("C5", "Username"), ("D5", "Correo"),
                ("E5", "Hostname"), ("F5", "Procesador"),
                ("G5", "O.S Name"), ("H5", "Utilización"), ("I5", "Uso Remoto"),
                ("J5", "Cisco Secure Endpoint"), ("K5", "Cisco Umbrella"), ("L5", "Rapid7"), ("M5", "Vicarius"),
                ("N5", "Fecha de Actualización"), ("O5", "Comentarios"), ("P5", "Validación")
            };

            foreach (var (cell, text) in subHeaders)
            {
                worksheet.Cell(cell).Value = text;
                worksheet.Cell(cell).Style.Font.Bold = true;
                worksheet.Cell(cell).Style.Fill.BackgroundColor = subHeaderFill;
                worksheet.Cell(cell).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                worksheet.Cell(cell).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                worksheet.Cell(cell).Style.Border.OutsideBorderColor = borderColor;
            }

            // Datos
            int row = 6;
            foreach (var dato in workstations)
            {
                worksheet.Cell($"A{row}").Value = dato.Region;
                worksheet.Cell($"B{row}").Value = dato.OpCo;
                worksheet.Cell($"C{row}").Value = dato.Username;
                worksheet.Cell($"D{row}").Value = dato.Correo;
                worksheet.Cell($"E{row}").Value = dato.Hostname;
                worksheet.Cell($"F{row}").Value = dato.Procesador;
                worksheet.Cell($"G{row}").Value = dato.OSNombre;
                worksheet.Cell($"H{row}").Value = dato.Utilizacion;
                worksheet.Cell($"I{row}").Value = dato.UsoRemoto;
                worksheet.Cell($"J{row}").Value = dato.CiscoSecureEndpoint;
                worksheet.Cell($"K{row}").Value = dato.CiscoUmbrella;
                worksheet.Cell($"L{row}").Value = dato.Rapid7;
                worksheet.Cell($"M{row}").Value = dato.Vicarius;
                worksheet.Cell($"N{row}").Value = dato.FechaActualizacion;
                worksheet.Cell($"O{row}").Value = dato.Comentarios;
                worksheet.Cell($"P{row}").Value = dato.Validacion;

                // Aplicar bordes a toda la fila
                for (int col = 1; col <= 16; col++)
                {
                    worksheet.Cell(row, col).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    worksheet.Cell(row, col).Style.Border.OutsideBorderColor = borderColor;
                }

                row++;
            }

            // Ajustar ancho de columnas
            worksheet.Column("A").Width = 12; // Región
            worksheet.Column("B").Width = 10; // OpCo
            worksheet.Column("C").Width = 15; // Username
            worksheet.Column("D").Width = 20; // Correo
            worksheet.Column("E").Width = 18; // Hostname
            worksheet.Column("F").Width = 20; // Procesador
            worksheet.Column("G").Width = 15; // O.S Name
            worksheet.Column("H").Width = 12; // Utilización
            worksheet.Column("I").Width = 10; // Uso Remoto
            worksheet.Column("J").Width = 18; // Cisco Secure Endpoint
            worksheet.Column("K").Width = 15; // Cisco Umbrella
            worksheet.Column("L").Width = 10; // Rapid7
            worksheet.Column("M").Width = 12; // Vicarius
            worksheet.Column("N").Width = 18; // Fecha de Actualización
            worksheet.Column("O").Width = 20; // Comentarios
            worksheet.Column("P").Width = 12; // Validación

            // Aplicar filtros automáticos
            worksheet.Range("A4:P" + (row - 1)).SetAutoFilter();
        }

        private void CrearHojaCelulares(IXLWorksheet worksheet, dynamic celulares, int trimestre, int año)
        {
            // Configurar estilos
            var headerFill = XLColor.FromArgb(68, 114, 196); // Azul oscuro
            var subHeaderFill = XLColor.FromArgb(173, 216, 230); // Azul claro
            var borderColor = XLColor.Black;

            // Título principal
            worksheet.Cell("A1").Value = "REPORTE TRIMESTRAL DE REGISTROS - CELULARES";
            worksheet.Cell("A1").Style.Font.Bold = true;
            worksheet.Cell("A1").Style.Font.FontSize = 16;
            worksheet.Cell("A1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range("A1:I1").Merge();

            // Sub-título
            worksheet.Cell("A2").Value = $"Trimestre {trimestre} - Año {año}";
            worksheet.Cell("A2").Style.Font.Bold = true;
            worksheet.Cell("A2").Style.Font.FontSize = 12;
            worksheet.Cell("A2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range("A2:I2").Merge();

            // Fila vacía
            worksheet.Row(3).Height = 5;

            // Cabeceras (fila 4)
            var headers = new[]
            {
                ("A4", "Responsable"),
                ("B4", "Empresa"),
                ("C4", "Nombre del Dispositivo"),
                ("D4", "Fabricante"),
                ("E4", "Modelo"),
                ("F4", "Version OS"),
                ("G4", "Memória Disponible"),
                ("H4", "Número de Teléfono"),
                ("I4", "MAC")
            };

            foreach (var (cell, text) in headers)
            {
                worksheet.Cell(cell).Value = text;
                worksheet.Cell(cell).Style.Font.Bold = true;
                worksheet.Cell(cell).Style.Font.FontColor = XLColor.White;
                worksheet.Cell(cell).Style.Fill.BackgroundColor = headerFill;
                worksheet.Cell(cell).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                worksheet.Cell(cell).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                worksheet.Cell(cell).Style.Border.OutsideBorderColor = borderColor;
            }

            // Datos
            int row = 5;
            foreach (var dato in celulares)
            {
                worksheet.Cell($"A{row}").Value = dato.Responsable;
                worksheet.Cell($"B{row}").Value = dato.Empresa;
                worksheet.Cell($"C{row}").Value = dato.NombreDispositivo;
                worksheet.Cell($"D{row}").Value = dato.Fabricante;
                worksheet.Cell($"E{row}").Value = dato.Modelo;
                worksheet.Cell($"F{row}").Value = dato.VersionOS;
                worksheet.Cell($"G{row}").Value = dato.MemoriaDisponible;
                worksheet.Cell($"H{row}").Value = dato.NumeroTelefono;
                worksheet.Cell($"I{row}").Value = dato.MAC;

                // Aplicar bordes a toda la fila
                for (int col = 1; col <= 9; col++)
                {
                    worksheet.Cell(row, col).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    worksheet.Cell(row, col).Style.Border.OutsideBorderColor = borderColor;
                }

                row++;
            }

            // Ajustar ancho de columnas
            worksheet.Column("A").Width = 20; // Responsable
            worksheet.Column("B").Width = 15; // Empresa
            worksheet.Column("C").Width = 25; // Nombre del Dispositivo
            worksheet.Column("D").Width = 15; // Fabricante
            worksheet.Column("E").Width = 20; // Modelo
            worksheet.Column("F").Width = 15; // Version OS
            worksheet.Column("G").Width = 18; // Memória Disponible
            worksheet.Column("H").Width = 20; // Número de Teléfono
            worksheet.Column("I").Width = 20; // MAC

            // Aplicar filtros automáticos
            worksheet.Range("A4:I" + (row - 1)).SetAutoFilter();
        }
    }
} 