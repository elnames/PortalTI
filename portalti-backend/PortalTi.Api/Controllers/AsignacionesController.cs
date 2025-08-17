using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using PortalTi.Api.Services;
using System.IO;
using System.Text.Json;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AsignacionesController : ControllerBase
    {
        private readonly PortalTiContext _db;
        private readonly ILogger<AsignacionesController> _logger;
        private readonly PdfService _pdfService;

        public AsignacionesController(PortalTiContext db, ILogger<AsignacionesController> logger, PdfService pdfService)
        {
            _db = db;
            _logger = logger;
            _pdfService = pdfService;
        }

        private async Task<int?> ResolveAuthUserIdByNominaId(int nominaUsuarioId)
        {
            // Busca el email en Nómina y luego mapea a AuthUsers por Username
            var nomina = await _db.NominaUsuarios.FindAsync(nominaUsuarioId);
            if (nomina == null || string.IsNullOrWhiteSpace(nomina.Email)) return null;
            var normalized = nomina.Email.Trim().ToLower();
            var auth = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Username.ToLower() == normalized && u.IsActive);
            return auth?.Id;
        }

        // GET: api/asignaciones/sugerencias-asignado-por
        [HttpGet("sugerencias-asignado-por")]
        public async Task<ActionResult<IEnumerable<string>>> GetSugerenciasAsignadoPor()
        {
            try
            {
                // Obtener nombres únicos de asignaciones existentes
                var sugerencias = await _db.AsignacionesActivos
                    .Where(aa => !string.IsNullOrEmpty(aa.AsignadoPor))
                    .Select(aa => aa.AsignadoPor)
                    .Distinct()
                    .OrderBy(nombre => nombre)
                    .ToListAsync();

                // Agregar sugerencias por defecto si no hay muchas
                var sugerenciasPorDefecto = new List<string>
                {
                    "Javier Jorquera",
                    "María González",
                    "Carlos Rodríguez",
                    "Ana López",
                    "Luis Martínez",
                    "Patricia Silva",
                    "Roberto Vargas",
                    "Carmen Morales",
                    "Fernando Herrera",
                    "Isabel Torres"
                };

                // Combinar y eliminar duplicados
                var todasLasSugerencias = sugerencias
                    .Union(sugerenciasPorDefecto)
                    .OrderBy(nombre => nombre)
                    .ToList();

                return Ok(todasLasSugerencias);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener sugerencias de asignado por");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/asignaciones
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            try
            {
                var asignaciones = await _db.AsignacionesActivos
                    .Include(a => a.Activo)
                    .Include(a => a.Usuario)
                    .OrderByDescending(a => a.FechaAsignacion)
                    .ToListAsync();

                var result = asignaciones.Select(a => new
                {
                    a.Id,
                    a.FechaAsignacion,
                    a.FechaDevolucion,
                    a.Estado,
                    a.Observaciones,
                    a.AsignadoPor,
                    Activo = new
                    {
                        a.Activo.Id,
                        a.Activo.Codigo,
                        a.Activo.Categoria,
                        a.Activo.Estado,
                        a.Activo.Ubicacion,
                        a.Activo.NombreEquipo,
                        a.Activo.TipoEquipo
                    },
                    Usuario = new
                    {
                        a.Usuario.Id,
                        a.Usuario.Nombre,
                        a.Usuario.Apellido,
                        a.Usuario.Email,
                        a.Usuario.Departamento
                    }
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener asignaciones");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/asignaciones/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetById(int id)
        {
            try
            {
                var asignacion = await _db.AsignacionesActivos
                    .Include(a => a.Activo)
                    .Include(a => a.Usuario)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (asignacion == null)
                {
                    return NotFound("Asignación no encontrada");
                }

                var result = new
                {
                    asignacion.Id,
                    asignacion.FechaAsignacion,
                    asignacion.FechaDevolucion,
                    asignacion.Estado,
                    asignacion.Observaciones,
                    asignacion.AsignadoPor,
                    Activo = new
                    {
                        asignacion.Activo.Id,
                        asignacion.Activo.Codigo,
                        asignacion.Activo.Categoria,
                        asignacion.Activo.Estado,
                        asignacion.Activo.Ubicacion,
                        asignacion.Activo.NombreEquipo,
                        asignacion.Activo.TipoEquipo,
                        asignacion.Activo.Nombre,
                        asignacion.Activo.SistemaOperativo,
                        asignacion.Activo.NumeroCelular,
                        asignacion.Activo.Empresa
                    },
                    Usuario = new
                    {
                        asignacion.Usuario.Id,
                        asignacion.Usuario.Nombre,
                        asignacion.Usuario.Apellido,
                        asignacion.Usuario.Email,
                        asignacion.Usuario.Departamento,
                        asignacion.Usuario.Empresa,
                        asignacion.Usuario.Ubicacion
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener asignación por ID: {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/asignaciones/activo/{activoId}
        [HttpGet("activo/{activoId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetByActivo(int activoId)
        {
            try
            {
                var asignaciones = await _db.AsignacionesActivos
                    .Include(a => a.Activo)
                    .Include(a => a.Usuario)
                    .Where(a => a.ActivoId == activoId)
                    .OrderByDescending(a => a.FechaAsignacion)
                    .ToListAsync();

                var result = asignaciones.Select(a => new
                {
                    a.Id,
                    a.FechaAsignacion,
                    a.FechaDevolucion,
                    a.Estado,
                    a.Observaciones,
                    a.AsignadoPor,
                    Activo = new
                    {
                        a.Activo.Id,
                        a.Activo.Codigo,
                        a.Activo.Categoria,
                        a.Activo.Estado,
                        a.Activo.Ubicacion,
                        a.Activo.NombreEquipo,
                        a.Activo.TipoEquipo
                    },
                    Usuario = new
                    {
                        a.Usuario.Id,
                        a.Usuario.Nombre,
                        a.Usuario.Apellido,
                        a.Usuario.Email,
                        a.Usuario.Departamento
                    }
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener asignaciones del activo {ActivoId}", activoId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/asignaciones/usuario/{usuarioId}
        [HttpGet("usuario/{usuarioId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetByUsuario(int usuarioId)
        {
            try
            {
                var asignaciones = await _db.AsignacionesActivos
                    .Include(a => a.Activo)
                    .Include(a => a.Usuario)
                    .Where(a => a.UsuarioId == usuarioId)
                    .OrderByDescending(a => a.FechaAsignacion)
                    .ToListAsync();

                var result = asignaciones.Select(a => new
                {
                    a.Id,
                    a.FechaAsignacion,
                    a.FechaDevolucion,
                    a.Estado,
                    a.Observaciones,
                    a.AsignadoPor,
                    Activo = new
                    {
                        a.Activo.Id,
                        a.Activo.Codigo,
                        a.Activo.Categoria,
                        a.Activo.Estado,
                        a.Activo.Ubicacion,
                        a.Activo.NombreEquipo,
                        a.Activo.TipoEquipo
                    },
                    Usuario = new
                    {
                        a.Usuario.Id,
                        a.Usuario.Nombre,
                        a.Usuario.Apellido,
                        a.Usuario.Email,
                        a.Usuario.Departamento
                    }
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener asignaciones del usuario {UsuarioId}", usuarioId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/asignaciones/activas
        [HttpGet("activas")]
        public async Task<ActionResult<IEnumerable<object>>> GetActivas()
        {
            try
            {
                var asignaciones = await _db.AsignacionesActivos
                    .Include(a => a.Activo)
                    .Include(a => a.Usuario)
                    .Where(a => a.Estado == "Activa")
                    .OrderByDescending(a => a.FechaAsignacion)
                    .ToListAsync();

                var result = asignaciones.Select(a => new
                {
                    a.Id,
                    a.FechaAsignacion,
                    a.FechaDevolucion,
                    a.Estado,
                    a.Observaciones,
                    a.AsignadoPor,
                    Activo = new
                    {
                        a.Activo.Id,
                        a.Activo.Codigo,
                        a.Activo.Categoria,
                        a.Activo.Estado,
                        a.Activo.Ubicacion,
                        a.Activo.NombreEquipo,
                        a.Activo.TipoEquipo
                    },
                    Usuario = new
                    {
                        a.Usuario.Id,
                        a.Usuario.Nombre,
                        a.Usuario.Apellido,
                        a.Usuario.Email,
                        a.Usuario.Departamento
                    }
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener asignaciones activas");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/asignaciones
        [HttpPost]
        public async Task<ActionResult<object>> Create(CreateAsignacionRequest request)
        {
            try
            {
                _logger.LogInformation("=== INICIO CREAR ASIGNACIÓN DEBUG ===");
                _logger.LogInformation($"Request: ActivoId={request.ActivoId}, UsuarioId={request.UsuarioId}, Observaciones={request.Observaciones}, AsignadoPor={request.AsignadoPor}");
                
                // Verificar si el activo ya tiene una asignación activa
                var existingActiveAssignment = await _db.AsignacionesActivos
                    .FirstOrDefaultAsync(a => a.ActivoId == request.ActivoId && a.Estado == "Activa");

                if (existingActiveAssignment != null)
                {
                    _logger.LogWarning($"Activo {request.ActivoId} ya tiene asignación activa: {existingActiveAssignment.Id}");
                    return BadRequest("El activo ya tiene una asignación activa");
                }

                var asignacion = new AsignacionActivo
                {
                    ActivoId = request.ActivoId,
                    UsuarioId = request.UsuarioId,
                    FechaAsignacion = DateTime.Now,
                    Estado = "Activa",
                    Observaciones = request.Observaciones,
                    AsignadoPor = request.AsignadoPor ?? "Sistema"
                };

                _logger.LogInformation($"Creando asignación: Estado='{asignacion.Estado}', FechaAsignacion={asignacion.FechaAsignacion}");

                _db.AsignacionesActivos.Add(asignacion);
                await _db.SaveChangesAsync();
                
                _logger.LogInformation($"Asignación creada exitosamente con ID: {asignacion.Id}");

                // Crear acta pendiente automáticamente
                var acta = new Acta
                {
                    AsignacionId = asignacion.Id,
                    Estado = "Pendiente",
                    MetodoFirma = "Pendiente",
                    FechaCreacion = DateTime.Now,
                    Observaciones = "Acta pendiente de firma - creada automáticamente al asignar el activo"
                };

                _db.Actas.Add(acta);
                await _db.SaveChangesAsync();

                _logger.LogInformation($"Acta pendiente creada automáticamente con ID: {acta.Id}");

                // Obtener información del activo y usuario para el log y notificaciones
                var activo = await _db.Activos.FindAsync(request.ActivoId);
                var usuario = await _db.NominaUsuarios.FindAsync(request.UsuarioId);

                // Notificar asignación
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    // Notificar al usuario asignado (mapear Nómina -> AuthUser)
                    var authUserId = await ResolveAuthUserIdByNominaId(request.UsuarioId);
                    if (authUserId.HasValue)
                    {
                        await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = authUserId.Value,
                            Tipo = "assignment",
                            Titulo = "Activo asignado",
                            Mensaje = $"Se te ha asignado el activo: {activo?.Codigo} - {activo?.NombreEquipo}",
                            RefTipo = "Activo",
                            RefId = request.ActivoId,
                            Ruta = "/mis-activos"
                        });
                    }
                    else
                    {
                        _logger.LogWarning("No se encontró AuthUser para NominaUsuarioId {NominaId} ({Email})", usuario?.Id, usuario?.Email);
                    }
                    
                    // Notificar a admins y soporte
                    await notificationService.CreateForRoleAsync("admin", new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "assignment",
                        Titulo = "Nueva asignación de activo",
                        Mensaje = $"Se asignó el activo {activo?.Codigo} a {usuario?.Nombre} {usuario?.Apellido}",
                        RefTipo = "Activo",
                        RefId = request.ActivoId,
                        Ruta = $"/activos/{request.ActivoId}"
                    });
                    
                    await notificationService.CreateForRoleAsync("soporte", new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "assignment",
                        Titulo = "Nueva asignación de activo",
                        Mensaje = $"Se asignó el activo {activo?.Codigo} a {usuario?.Nombre} {usuario?.Apellido}",
                        RefTipo = "Activo",
                        RefId = request.ActivoId,
                        Ruta = $"/activos/{request.ActivoId}"
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando asignación: {ex.Message}");
                }

                // Log de actividad
                await LogActivity("create_assignment", $"Asignación creada: {activo?.Codigo} → {usuario?.Nombre} {usuario?.Apellido}", new { 
                    asignacionId = asignacion.Id,
                    activoId = request.ActivoId,
                    activoCodigo = activo?.Codigo,
                    activoCategoria = activo?.Categoria,
                    usuarioId = request.UsuarioId,
                    usuarioNombre = $"{usuario?.Nombre} {usuario?.Apellido}",
                    observaciones = request.Observaciones,
                    asignadoPor = asignacion.AsignadoPor,
                    actaId = acta.Id
                });

                // Devolver objeto anónimo para evitar ciclos de serialización
                var result = new
                {
                    asignacion.Id,
                    asignacion.ActivoId,
                    asignacion.UsuarioId,
                    asignacion.FechaAsignacion,
                    asignacion.Estado,
                    asignacion.Observaciones,
                    asignacion.AsignadoPor,
                    Acta = new
                    {
                        acta.Id,
                        acta.Estado,
                        acta.MetodoFirma,
                        acta.FechaCreacion
                    },
                    Activo = new
                    {
                        activo?.Id,
                        activo?.Codigo,
                        activo?.Categoria,
                        activo?.Estado,
                        activo?.Ubicacion,
                        activo?.NombreEquipo,
                        activo?.TipoEquipo
                    },
                    Usuario = new
                    {
                        usuario?.Id,
                        usuario?.Nombre,
                        usuario?.Apellido,
                        usuario?.Email,
                        usuario?.Departamento
                    }
                };

                return CreatedAtAction(nameof(GetAll), new { id = asignacion.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear asignación");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/asignaciones/{id}/devolver
        [HttpPut("{id}/devolver")]
        public async Task<IActionResult> Devolver(int id, DevolverRequest request)
        {
            try
            {
                var asignacion = await _db.AsignacionesActivos
                    .Include(a => a.Activo)
                    .Include(a => a.Usuario)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                if (asignacion.Estado != "Activa")
                    return BadRequest("La asignación no está activa");

                asignacion.Estado = "Devuelta";
                asignacion.FechaDevolucion = DateTime.Now;
                asignacion.Observaciones = request.Observaciones;

                await _db.SaveChangesAsync();

                // Notificar devolución
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    // Notificar al usuario (mapear Nómina -> AuthUser)
                    var authUserId = await ResolveAuthUserIdByNominaId(asignacion.UsuarioId);
                    if (authUserId.HasValue)
                    {
                        await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = authUserId.Value,
                            Tipo = "return",
                            Titulo = "Activo devuelto",
                            Mensaje = $"Has devuelto el activo: {asignacion.Activo.Codigo} - {asignacion.Activo.NombreEquipo}",
                            RefTipo = "Activo",
                            RefId = asignacion.ActivoId,
                            Ruta = "/mis-activos"
                        });
                    }
                    else
                    {
                        _logger.LogWarning("No se encontró AuthUser para devolución (NominaUsuarioId {NominaId})", asignacion.UsuarioId);
                    }
                    
                    // Notificar a admins y soporte
                    await notificationService.CreateForRoleAsync("admin", new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "return",
                        Titulo = "Activo devuelto",
                        Mensaje = $"El activo {asignacion.Activo.Codigo} fue devuelto por {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}",
                        RefTipo = "Activo",
                        RefId = asignacion.ActivoId,
                        Ruta = $"/activos/{asignacion.ActivoId}"
                    });
                    
                    await notificationService.CreateForRoleAsync("soporte", new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "return",
                        Titulo = "Activo devuelto",
                        Mensaje = $"El activo {asignacion.Activo.Codigo} fue devuelto por {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}",
                        RefTipo = "Activo",
                        RefId = asignacion.ActivoId,
                        Ruta = $"/activos/{asignacion.ActivoId}"
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando devolución: {ex.Message}");
                }

                // Log de actividad
                await LogActivity("return_assignment", $"Asignación devuelta: {asignacion.Activo.Codigo} ← {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}", new { 
                    asignacionId = id,
                    activoId = asignacion.ActivoId,
                    activoCodigo = asignacion.Activo.Codigo,
                    usuarioId = asignacion.UsuarioId,
                    usuarioNombre = $"{asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}",
                    observaciones = request.Observaciones
                });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al devolver asignación {AsignacionId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // DELETE: api/asignaciones/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var asignacion = await _db.AsignacionesActivos
                    .Include(a => a.Activo)
                    .Include(a => a.Usuario)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                var asignacionData = new
                {
                    activoCodigo = asignacion.Activo.Codigo,
                    usuarioNombre = $"{asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}",
                    estado = asignacion.Estado,
                    fechaAsignacion = asignacion.FechaAsignacion
                };

                _db.AsignacionesActivos.Remove(asignacion);
                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity("delete_assignment", $"Asignación eliminada: {asignacion.Activo.Codigo} ↔ {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}", new { 
                    asignacionId = id,
                    asignacionData
                });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar asignación {AsignacionId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/asignaciones/crear-actas-pendientes
        [HttpPost("crear-actas-pendientes")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<object>> CrearActasPendientesParaAsignacionesExistentes()
        {
            try
            {
                _logger.LogInformation("=== INICIO CREAR ACTAS PENDIENTES PARA ASIGNACIONES EXISTENTES ===");
                
                // Obtener todas las asignaciones activas que no tienen acta
                var asignacionesSinActa = await _db.AsignacionesActivos
                    .Where(a => a.Estado == "Activa")
                    .Where(a => !_db.Actas.Any(acta => acta.AsignacionId == a.Id))
                    .ToListAsync();

                _logger.LogInformation($"Encontradas {asignacionesSinActa.Count} asignaciones sin acta");

                var actasCreadas = new List<Acta>();

                foreach (var asignacion in asignacionesSinActa)
                {
                    var acta = new Acta
                    {
                        AsignacionId = asignacion.Id,
                        Estado = "Pendiente",
                        MetodoFirma = "Pendiente",
                        FechaCreacion = DateTime.Now,
                        Observaciones = "Acta pendiente de firma - creada automáticamente para asignación existente"
                    };

                    _db.Actas.Add(acta);
                    actasCreadas.Add(acta);
                }

                await _db.SaveChangesAsync();

                _logger.LogInformation($"Creadas {actasCreadas.Count} actas pendientes");

                // Log de actividad
                await LogActivity("create_pending_actas", $"Creadas {actasCreadas.Count} actas pendientes para asignaciones existentes", new { 
                    asignacionesProcesadas = asignacionesSinActa.Count,
                    actasCreadas = actasCreadas.Count,
                    asignacionesIds = asignacionesSinActa.Select(a => a.Id).ToList(),
                    actasIds = actasCreadas.Select(a => a.Id).ToList()
                });

                return Ok(new
                {
                    message = $"Se crearon {actasCreadas.Count} actas pendientes para asignaciones existentes",
                    asignacionesProcesadas = asignacionesSinActa.Count,
                    actasCreadas = actasCreadas.Count,
                    asignacionesIds = asignacionesSinActa.Select(a => a.Id).ToList(),
                    actasIds = actasCreadas.Select(a => a.Id).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear actas pendientes para asignaciones existentes");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/asignaciones/generar-datos-prueba
        [HttpPost("generar-datos-prueba")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<object>> GenerarDatosPrueba()
        {
            try
            {
                _logger.LogInformation("=== INICIO GENERAR DATOS DE PRUEBA ===");
                
                // Obtener todos los activos disponibles (no asignados)
                var activosDisponibles = await _db.Activos
                    .Where(a => a.Estado == "Disponible")
                    .ToListAsync();

                // Obtener todos los usuarios
                var usuarios = await _db.NominaUsuarios.ToListAsync();

                _logger.LogInformation($"Encontrados {activosDisponibles.Count} activos disponibles y {usuarios.Count} usuarios");

                if (activosDisponibles.Count == 0)
                {
                    return BadRequest("No hay activos disponibles para asignar");
                }

                if (usuarios.Count == 0)
                {
                    return BadRequest("No hay usuarios disponibles para asignar");
                }

                var asignacionesCreadas = new List<AsignacionActivo>();
                var actasCreadas = new List<Acta>();
                var random = new Random();

                // Crear asignaciones para todos los activos disponibles
                foreach (var activo in activosDisponibles)
                {
                    // Seleccionar un usuario aleatorio
                    var usuarioAleatorio = usuarios[random.Next(usuarios.Count)];

                    // Crear asignación
                    var asignacion = new AsignacionActivo
                    {
                        ActivoId = activo.Id,
                        UsuarioId = usuarioAleatorio.Id,
                        FechaAsignacion = DateTime.Now.AddDays(-random.Next(1, 30)), // Fecha aleatoria en los últimos 30 días
                        Estado = "Activa",
                        Observaciones = $"Asignación de prueba generada automáticamente",
                        AsignadoPor = "Sistema"
                    };

                    _db.AsignacionesActivos.Add(asignacion);
                    asignacionesCreadas.Add(asignacion);

                    // Cambiar estado del activo a "Asignado"
                    activo.Estado = "Asignado";
                }

                await _db.SaveChangesAsync();

                _logger.LogInformation($"Creadas {asignacionesCreadas.Count} asignaciones");

                // Crear actas pendientes para todas las asignaciones creadas
                foreach (var asignacion in asignacionesCreadas)
                {
                    var acta = new Acta
                    {
                        AsignacionId = asignacion.Id,
                        Estado = "Pendiente",
                        MetodoFirma = "Pendiente",
                        FechaCreacion = DateTime.Now,
                        Observaciones = "Acta pendiente de firma - creada automáticamente para datos de prueba"
                    };

                    _db.Actas.Add(acta);
                    actasCreadas.Add(acta);
                }

                await _db.SaveChangesAsync();

                _logger.LogInformation($"Creadas {actasCreadas.Count} actas pendientes");

                // Log de actividad
                await LogActivity("generate_test_data", $"Generados datos de prueba: {asignacionesCreadas.Count} asignaciones y {actasCreadas.Count} actas", new { 
                    activosProcesados = activosDisponibles.Count,
                    usuariosProcesados = usuarios.Count,
                    asignacionesCreadas = asignacionesCreadas.Count,
                    actasCreadas = actasCreadas.Count,
                    asignacionesIds = asignacionesCreadas.Select(a => a.Id).ToList(),
                    actasIds = actasCreadas.Select(a => a.Id).ToList()
                });

                return Ok(new
                {
                    message = $"Se generaron datos de prueba: {asignacionesCreadas.Count} asignaciones y {actasCreadas.Count} actas pendientes",
                    activosProcesados = activosDisponibles.Count,
                    usuariosProcesados = usuarios.Count,
                    asignacionesCreadas = asignacionesCreadas.Count,
                    actasCreadas = actasCreadas.Count,
                    asignacionesIds = asignacionesCreadas.Select(a => a.Id).ToList(),
                    actasIds = actasCreadas.Select(a => a.Id).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar datos de prueba");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        private async Task LogActivity(string action, string description, object? details = null)
        {
            try
            {
                _logger.LogInformation($"=== LOGGING ACTIVITY: {action} ===");
                _logger.LogInformation($"Description: {description}");
                _logger.LogInformation($"Details: {JsonSerializer.Serialize(details)}");
                
                // Obtener el ID del usuario actual desde el token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation($"User ID from token: {userIdClaim}");
                
                if (int.TryParse(userIdClaim, out int currentUserId))
                {
                    var log = new UserActivityLog
                    {
                        UserId = currentUserId,
                        Action = action,
                        Description = description,
                        Details = details != null ? JsonSerializer.Serialize(details) : null,
                        Timestamp = DateTime.Now,
                        IpAddress = GetClientIpAddress(),
                        UserAgent = Request.Headers["User-Agent"].ToString()
                    };

                    _logger.LogInformation($"Creating log entry: UserId={log.UserId}, Action={log.Action}, Timestamp={log.Timestamp}");
                    
                    _db.UserActivityLogs.Add(log);
                    await _db.SaveChangesAsync();
                    
                    _logger.LogInformation($"Activity log saved successfully with ID: {log.Id}");
                }
                else
                {
                    _logger.LogWarning("Could not parse user ID from token");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al registrar actividad");
            }
        }

        [HttpGet("{id}/acta")]
        public async Task<IActionResult> GenerateActa(int id, [FromQuery] bool includeSignature = false, [FromQuery] DateTime? fechaEntrega = null)
        {
            try
            {
                var asignacion = await _db.AsignacionesActivos
                    .Include(a => a.Activo)
                    .Include(a => a.Usuario)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                // Obtener firma del usuario actual si se solicita
                string? userSignaturePath = null;
                if (includeSignature)
                {
                    var currentUserId = GetCurrentUserId();
                    if (currentUserId.HasValue)
                    {
                        var currentUser = await _db.AuthUsers.FindAsync(currentUserId.Value);
                        userSignaturePath = currentUser?.SignaturePath;
                    }
                }

                // Usar fecha proporcionada o la fecha actual
                DateTime fechaParaActa = fechaEntrega ?? DateTime.Now;

                // Generar PDF
                byte[] pdfBytes = _pdfService.GenerateActaEntrega(asignacion, asignacion.Activo, asignacion.Usuario, userSignaturePath, fechaParaActa);

                // Log de actividad
                await LogActivity("generate_acta", $"Acta generada para asignación: {asignacion.Activo.Codigo} → {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}", new { 
                    asignacionId = id,
                    activoId = asignacion.ActivoId,
                    activoCodigo = asignacion.Activo.Codigo,
                    usuarioId = asignacion.UsuarioId,
                    usuarioNombre = $"{asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}"
                });

                // Devolver PDF para previsualización en navegador
                string fileName = $"Acta de entrega - {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}.pdf";

                return File(pdfBytes, "application/pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar acta para asignación {AsignacionId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("{id}/acta-firmada")]
        public async Task<IActionResult> UploadActaFirmada(int id, IFormFile archivo)
        {
            try
            {
                var asignacion = await _db.AsignacionesActivos
                    .Include(a => a.Activo)
                    .Include(a => a.Usuario)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (asignacion == null)
                    return NotFound("Asignación no encontrada");

                if (archivo == null || archivo.Length == 0)
                    return BadRequest("No se proporcionó ningún archivo");

                if (archivo.ContentType != "application/pdf")
                    return BadRequest("Solo se permiten archivos PDF");

                // Crear directorio si no existe
                string uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "actas-firmadas");
                Directory.CreateDirectory(uploadsDir);

                // Generar nombre único para el archivo
                string fileName = $"Acta_Firmada_{asignacion.Activo.Codigo}_{asignacion.Usuario.Nombre}_{asignacion.Usuario.Apellido}_{DateTime.Now:yyyyMMddHHmmss}.pdf";
                fileName = fileName.Replace(" ", "_");
                string filePath = Path.Combine(uploadsDir, fileName);

                // Guardar archivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await archivo.CopyToAsync(stream);
                }

                // Log de actividad
                await LogActivity("upload_signed_acta", $"Acta firmada subida para asignación: {asignacion.Activo.Codigo} → {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}", new { 
                    asignacionId = id,
                    activoId = asignacion.ActivoId,
                    activoCodigo = asignacion.Activo.Codigo,
                    usuarioId = asignacion.UsuarioId,
                    usuarioNombre = $"{asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}",
                    fileName = fileName
                });

                return Ok(new { message = "Acta firmada subida exitosamente", fileName = fileName });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir acta firmada para asignación {AsignacionId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : null;
        }

        private string GetClientIpAddress()
        {
            return Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                   Request.Headers["X-Real-IP"].FirstOrDefault() ??
                   Request.HttpContext.Connection.RemoteIpAddress?.ToString() ??
                   "Unknown";
        }

        public class CreateAsignacionRequest
        {
            public int ActivoId { get; set; }
            public int UsuarioId { get; set; }
            public string? Observaciones { get; set; }
            public string? AsignadoPor { get; set; }
        }

        public class DevolverRequest
        {
            public string? Observaciones { get; set; }
        }
    }
} 