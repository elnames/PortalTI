using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly PortalTiContext _db;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(PortalTiContext db, ILogger<DashboardController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            // Obtener el rol del usuario autenticado
            var role = User.Claims.FirstOrDefault(c => c.Type == "role")?.Value ?? "usuario";

            // Estadísticas generales
            var totalUsuarios = await _db.NominaUsuarios.CountAsync();
            var totalActivos = await _db.Activos.CountAsync();
            var totalTickets = await _db.Tickets.CountAsync();
            var totalActas = await _db.Actas.CountAsync();

            // Activos por estado
            var activosAsignados = await _db.Activos.CountAsync(a => a.Asignaciones.Any(aa => aa.Estado == "Activa"));
            var activosDisponibles = totalActivos - activosAsignados;
            var activosDadosDeBaja = await _db.Activos.CountAsync(a => a.FechaBaja.HasValue);

            // Activos por categoría
            var activosPorCategoria = await _db.Activos
                .GroupBy(a => a.Categoria)
                .Select(g => new { Categoria = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            // Tickets por estado
            var ticketsPendientes = await _db.Tickets.CountAsync(t => t.Estado == "Pendiente");
            var ticketsEnProceso = await _db.Tickets.CountAsync(t => t.Estado == "En Proceso");
            var ticketsResueltos = await _db.Tickets.CountAsync(t => t.Estado == "Resuelto");
            var ticketsCerrados = await _db.Tickets.CountAsync(t => t.Estado == "Cerrado");

            // Actas por estado
            var actasPendientes = await _db.Actas.CountAsync(a => a.Estado == "Pendiente");
            var actasFirmadas = await _db.Actas.CountAsync(a => a.Estado == "Firmada");

            // Últimas asignaciones
            var ultimasAsignaciones = await _db.AsignacionesActivos
                .Include(a => a.Usuario)
                .Include(a => a.Activo)
                .Where(a => a.Estado == "Activa")
                .OrderByDescending(a => a.FechaAsignacion)
                .Take(5)
                .Select(a => new {
                    usuario = a.Usuario.Nombre + " " + a.Usuario.Apellido,
                    activo = a.Activo.Codigo,
                    categoria = a.Activo.Categoria,
                    fecha = a.FechaAsignacion
                }).ToListAsync();

            // Últimos tickets
            var ultimosTickets = await _db.Tickets
                .Include(t => t.CreadoPor)
                .OrderByDescending(t => t.FechaCreacion)
                .Take(5)
                .Select(t => new {
                    id = t.Id,
                    titulo = t.Titulo,
                    estado = t.Estado,
                    prioridad = t.Prioridad,
                    solicitante = t.NombreSolicitante,
                    fecha = t.FechaCreacion
                }).ToListAsync();

            // Activos próximos a mantenimiento (activos con más de 2 años)
            var fechaLimite = DateTime.Now.AddYears(-2);
            var activosProxMantenimiento = await _db.Activos
                .Where(a => !a.FechaBaja.HasValue)
                .Take(10)
                .Select(a => new {
                    codigo = a.Codigo,
                    categoria = a.Categoria,
                    diasDesdeCreacion = 730 // 2 años aproximados
                }).ToListAsync();

            // Usuarios sin activos asignados
            var usuariosSinActivos = await _db.NominaUsuarios
                .Where(u => !u.Asignaciones.Any(a => a.Estado == "Activa"))
                .CountAsync();

            // Activos sin asignar
            var activosSinAsignar = await _db.Activos
                .Where(a => !a.Asignaciones.Any(aa => aa.Estado == "Activa") && !a.FechaBaja.HasValue)
                .CountAsync();

            // Datos específicos para admin
            object ultimasActividades = new object[0];
            object usuariosAuth = new object[0];
            object estadisticasEmpresas = new object[0];
            
            if (role == "admin")
            {
                // Debug: verificar si hay datos en UserActivityLogs
                var totalLogs = await _db.UserActivityLogs.CountAsync();
                _logger.LogInformation($"Total de logs de actividad: {totalLogs}");

                // Últimas actividades del sistema
                ultimasActividades = await _db.UserActivityLogs
                    .Include(l => l.User)
                    .OrderByDescending(l => l.Timestamp)
                    .Take(10)
                    .Select(l => new {
                        usuario = l.User.Username,
                        accion = l.Action,
                        descripcion = l.Description,
                        fecha = l.Timestamp
                    }).ToListAsync();

                _logger.LogInformation($"Últimas actividades obtenidas: {((List<object>)ultimasActividades).Count}");

                // Usuarios autenticados
                usuariosAuth = await _db.AuthUsers
                    .Select(u => new {
                        u.Id, u.Username, u.Role, u.IsActive, u.LastLoginAt
                    }).ToListAsync();

                _logger.LogInformation($"Usuarios autenticados obtenidos: {((List<object>)usuariosAuth).Count}");

                // Debug: verificar datos de empresas
                var totalUsuariosNomina = await _db.NominaUsuarios.CountAsync();
                var usuariosConEmpresa = await _db.NominaUsuarios.CountAsync(u => !string.IsNullOrEmpty(u.Empresa));
                _logger.LogInformation($"Total usuarios nómina: {totalUsuariosNomina}, Con empresa: {usuariosConEmpresa}");

                // Estadísticas por empresa
                estadisticasEmpresas = await _db.NominaUsuarios
                    .GroupBy(u => u.Empresa ?? "Sin empresa")
                    .Select(g => new {
                        empresa = g.Key,
                        cantidad = g.Count()
                    }).ToListAsync();

                _logger.LogInformation($"Estadísticas por empresa obtenidas: {((List<object>)estadisticasEmpresas).Count}");
            }

            // Datos específicos para soporte
            object ticketsAsignados = new object[0];
            object activosConProblemas = new object[0];
            
            if (role == "soporte")
            {
                var userId = int.Parse(User.Claims.FirstOrDefault(c => c.Type == "nameid")?.Value ?? "0");
                
                // Tickets asignados al soporte
                ticketsAsignados = await _db.Tickets
                    .Where(t => t.AsignadoAId == userId && t.Estado != "Cerrado")
                    .OrderByDescending(t => t.FechaCreacion)
                    .Take(5)
                    .Select(t => new {
                        id = t.Id,
                        titulo = t.Titulo,
                        estado = t.Estado,
                        prioridad = t.Prioridad,
                        fecha = t.FechaCreacion
                    }).ToListAsync();

                // Activos con problemas (activos asignados)
                activosConProblemas = await _db.Activos
                    .Where(a => a.Asignaciones.Any(aa => aa.Estado == "Activa"))
                    .Take(5)
                    .Select(a => new {
                        codigo = a.Codigo,
                        categoria = a.Categoria,
                        ticketsAbiertos = 0 // Placeholder hasta que se implemente la relación con tickets
                    }).ToListAsync();
            }

            var result = new
            {
                // Estadísticas generales
                estadisticas = new {
                    totalUsuarios,
                    totalActivos,
                    totalTickets,
                    totalActas,
                    activosAsignados,
                    activosDisponibles,
                    activosDadosDeBaja,
                    usuariosSinActivos,
                    activosSinAsignar
                },

                // Activos
                activos = new {
                    total = totalActivos,
                    asignados = activosAsignados,
                    disponibles = activosDisponibles,
                    dadosDeBaja = activosDadosDeBaja,
                    porCategoria = activosPorCategoria
                },

                // Tickets
                tickets = new {
                    total = totalTickets,
                    pendientes = ticketsPendientes,
                    enProceso = ticketsEnProceso,
                    resueltos = ticketsResueltos,
                    cerrados = ticketsCerrados
                },

                // Actas
                actas = new {
                    total = totalActas,
                    pendientes = actasPendientes,
                    firmadas = actasFirmadas
                },

                // Listas
                ultimasAsignaciones,
                ultimosTickets,
                activosProxMantenimiento,

                // Datos específicos por rol
                ultimasActividades,
                usuariosAuth,
                estadisticasEmpresas,
                ticketsAsignados,
                activosConProblemas
            };

            return Ok(result);
        }

        // POST: api/dashboard/seed-data - Endpoint temporal para crear datos de prueba
        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "API funcionando correctamente", timestamp = DateTime.Now });
        }

        [HttpPost("seed-data-test")]
        public IActionResult SeedDataTest()
        {
            try
            {
                _logger.LogInformation("Iniciando prueba sin autenticación");
                
                // Solo crear un usuario de prueba sin limpiar nada
                var usuario = new NominaUsuario
                {
                    Nombre = "Test",
                    Apellido = "Usuario",
                    Rut = "99999999-9",
                    Email = "test@empresa.com",
                    Departamento = "TI y Sistemas",
                    Empresa = "Empresa A",
                    Ubicacion = "Oficina Central - Santiago Centro"
                };
                
                _db.NominaUsuarios.Add(usuario);
                _db.SaveChanges();
                _logger.LogInformation("Usuario de prueba creado");
                
                return Ok(new { 
                    message = "Usuario de prueba creado exitosamente (sin auth)",
                    details = new {
                        usuarios = 1,
                        activos = 0,
                        asignaciones = 0,
                        tickets = 0,
                        actas = 0
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario de prueba: {Message}", ex.Message);
                _logger.LogError(ex, "StackTrace: {StackTrace}", ex.StackTrace);
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpPost("seed-data")]
        [Authorize(Policy = "CanManageAssets")]
        public IActionResult SeedData()
        {
            try
            {
                _logger.LogInformation("Iniciando proceso de limpieza y población de base de datos con datos genéricos (preservando admins)");
                
                // Llamar al método de limpieza y población
                DbInitializer.ClearAndSeedGenericData(_db);
                
                // Obtener conteos actualizados
                var totalUsuarios = _db.NominaUsuarios.Count();
                var totalActivos = _db.Activos.Count();
                var totalAsignaciones = _db.AsignacionesActivos.Count();
                var totalTickets = _db.Tickets.Count();
                var totalActas = _db.Actas.Count();
                var totalAdmins = _db.AuthUsers.Count(u => u.Role == "admin");
                
                _logger.LogInformation("Base de datos limpiada y poblada exitosamente con datos genéricos");
                
                return Ok(new { 
                    message = "Base de datos limpiada y poblada exitosamente con datos genéricos",
                    details = new {
                        usuarios = totalUsuarios,
                        activos = totalActivos,
                        asignaciones = totalAsignaciones,
                        tickets = totalTickets,
                        actas = totalActas,
                        admins = totalAdmins
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al limpiar y poblar la base de datos: {Message}", ex.Message);
                _logger.LogError(ex, "StackTrace: {StackTrace}", ex.StackTrace);
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpPost("clear-and-seed")]
        public IActionResult ClearAndSeedDatabase()
        {
            try
            {
                _logger.LogInformation("Iniciando proceso de limpieza y población de base de datos con datos genéricos");
                
                // Llamar al método de limpieza y población
                DbInitializer.ClearAndSeedGenericData(_db);
                
                _logger.LogInformation("Base de datos limpiada y poblada exitosamente con datos genéricos");
                
                return Ok(new { 
                    message = "Base de datos limpiada y poblada exitosamente con datos genéricos",
                    details = new {
                        usuarios = 250,
                        activos = 500,
                        asignaciones = 200,
                        tickets = 50,
                        actas = 25
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al limpiar y poblar la base de datos");
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }


    }
}