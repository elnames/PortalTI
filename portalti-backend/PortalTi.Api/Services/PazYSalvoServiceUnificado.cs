using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using PortalTi.Api.Models.DTOs;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace PortalTi.Api.Services
{
    public class PazYSalvoServiceUnificado
    {
        private readonly PortalTiContext _context;
        private readonly INotificationsService _notificationsService;
        private readonly PazYSalvoPdfService _pdfService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PazYSalvoServiceUnificado> _logger;

        public PazYSalvoServiceUnificado(
            PortalTiContext context,
            INotificationsService notificationsService,
            PazYSalvoPdfService pdfService,
            IConfiguration configuration,
            ILogger<PazYSalvoServiceUnificado> logger)
        {
            _context = context;
            _notificationsService = notificationsService;
            _pdfService = pdfService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<PazYSalvoResponse> CrearAsync(CrearPazYSalvoRequest request, int solicitadoPorId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Obtener usuario de la nómina
                var usuario = await _context.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Id == request.UsuarioId);

                if (usuario == null)
                    throw new ArgumentException("Usuario no encontrado");

                // Obtener el AuthUser que solicita el Paz y Salvo
                var authUser = await _context.AuthUsers
                    .FirstOrDefaultAsync(au => au.Id == solicitadoPorId);

                if (authUser == null)
                    throw new ArgumentException("Usuario de autenticación no encontrado");

                // Manejar jefe directo - crear AuthUser si no existe
                int? jefeDirectoAuthUserId = null;
                if (request.JefeDirectoId.HasValue)
                {
                    // Buscar si ya existe un AuthUser para este jefe directo
                    var jefeDirectoNomina = await _context.NominaUsuarios
                        .FirstOrDefaultAsync(nu => nu.Id == request.JefeDirectoId.Value);
                    
                    if (jefeDirectoNomina != null)
                    {
                        var jefeDirectoAuthUser = await _context.AuthUsers
                            .FirstOrDefaultAsync(au => au.Username == jefeDirectoNomina.Email);
                        
                        if (jefeDirectoAuthUser == null)
                        {
                            // Generar hash para contraseña temporal "admin"
                            var password = "admin";
                            var salt = GenerateSalt();
                            var hash = HashPassword(password, salt);
                            
                            // Crear AuthUser para el jefe directo
                            jefeDirectoAuthUser = new AuthUser
                            {
                                Username = jefeDirectoNomina.Email,
                                PasswordHash = hash,
                                PasswordSalt = salt,
                                Role = "usuario",
                                IsActive = true,
                                CreatedAt = DateTime.Now
                            };
                            
                            _context.AuthUsers.Add(jefeDirectoAuthUser);
                            await _context.SaveChangesAsync();
                            
                            _logger.LogInformation("Creado AuthUser para {Email}", jefeDirectoNomina.Email);
                        }
                        
                        // Verificar si ya tiene el subrol JefeInmediato asignado
                        var existingAssignment = await _context.PazYSalvoRoleAssignments
                            .FirstOrDefaultAsync(ra => ra.UserId == jefeDirectoAuthUser.Id && ra.Rol == "JefeInmediato" && ra.IsActive);
                        
                        if (existingAssignment == null)
                        {
                            // Asignar subrol de JefeInmediato
                            var jefeAssignment = new PazYSalvoRoleAssignment
                            {
                                UserId = jefeDirectoAuthUser.Id,
                                Rol = "JefeInmediato",
                                Departamento = jefeDirectoNomina.Departamento,
                                Empresa = jefeDirectoNomina.Empresa,
                                IsActive = true,
                                CreatedAt = DateTime.Now
                            };
                            
                            _context.PazYSalvoRoleAssignments.Add(jefeAssignment);
                            await _context.SaveChangesAsync();
                            
                            _logger.LogInformation("Asignado subrol JefeInmediato para {Email}", jefeDirectoNomina.Email);
                        }
                        else
                        {
                            _logger.LogInformation("Usuario {Email} ya tiene subrol JefeInmediato asignado", jefeDirectoNomina.Email);
                        }
                        
                        jefeDirectoAuthUserId = jefeDirectoAuthUser.Id;
                    }
                }

                // Crear Paz y Salvo
                var pazYSalvo = new PazYSalvo
                {
                    UsuarioId = request.UsuarioId,
                    SolicitadoPorId = authUser.Id, // Usar el ID del AuthUser
                    UsuarioNombre = $"{usuario.Nombre} {usuario.Apellido}",
                    UsuarioRut = usuario.Rut,
                    FechaSalida = request.FechaSalida,
                    MotivoSalida = request.MotivoSalida,
                    Observaciones = request.Observaciones ?? string.Empty,
                    Estado = "Borrador"
                };

                // Configurar firmas por defecto - usar la empresa del usuario
                _logger.LogInformation("Creando firmas para usuario {UsuarioId} - {Nombre} {Apellido} de empresa: {Empresa}", 
                    usuario.Id, usuario.Nombre, usuario.Apellido, usuario.Empresa);
                var firmas = await CrearFirmasPorDefectoAsync(jefeDirectoAuthUserId, usuario.Empresa);
                pazYSalvo.SetFirmas(firmas);

                // Configurar snapshot de activos si se proporcionan
                if (request.Activos != null && request.Activos.Any())
                {
                    pazYSalvo.SetActivosSnapshot(request.Activos);
                }
                else
                {
                    // Crear snapshot automático de activos del usuario
                    var activosSnapshot = await CrearSnapshotActivosAsync(request.UsuarioId);
                    pazYSalvo.SetActivosSnapshot(activosSnapshot);
                }

                // Registrar creación en historial
                var historial = new List<HistorialData>
                {
                    new HistorialData
                    {
                        ActorUserId = authUser.Id, // Usar el ID del AuthUser
                        Accion = "Created",
                        EstadoDesde = null,
                        EstadoHasta = "Borrador",
                        Nota = "Documento creado",
                        FechaAccion = DateTime.Now
                    }
                };
                pazYSalvo.SetHistorial(historial);

                _context.PazYSalvos.Add(pazYSalvo);
                await _context.SaveChangesAsync();

                // Auto-enviar a firma
                try
                {
                    await EnviarAFirmaAsync(pazYSalvo.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al enviar Paz y Salvo {PazYSalvoId} a firma automáticamente", pazYSalvo.Id);
                    // No fallar la creación por error en envío a firma
                }

                await transaction.CommitAsync();

                return await ObtenerDetalleAsync(pazYSalvo.Id);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<PazYSalvoResponse> SolicitarFirmaAsync(int id, string rol)
        {
            var pazYSalvo = await _context.PazYSalvos
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pazYSalvo == null)
                throw new ArgumentException("Paz y Salvo no encontrado");

            // Obtener las firmas actuales
            var firmas = pazYSalvo.GetFirmas();
            var firma = firmas.FirstOrDefault(f => f.Rol == rol);

            if (firma == null)
                throw new ArgumentException($"Rol {rol} no encontrado en las firmas");

            if (firma.Estado != "Pendiente")
                throw new InvalidOperationException($"La firma para el rol {rol} no está pendiente");

            // Aquí podrías enviar notificaciones específicas al firmante
            // Por ahora solo retornamos el estado actual
            return await ObtenerDetalleAsync(id);
        }

        public async Task<PazYSalvoResponse> EnviarAFirmaAsync(int pazYSalvoId)
        {
            var pazYSalvo = await _context.PazYSalvos
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo == null)
                throw new ArgumentException("Paz y Salvo no encontrado");

            if (!pazYSalvo.PuedeSerEnviadoAFirma)
                throw new InvalidOperationException("El documento no puede ser enviado a firma en su estado actual");

            // Cambiar estado
            var estadoAnterior = pazYSalvo.Estado;
            pazYSalvo.Estado = "EnFirma";
            pazYSalvo.FechaEnvioFirma = DateTime.Now;
            pazYSalvo.FechaActualizacion = DateTime.Now;

            // Registrar en historial
            var historial = pazYSalvo.GetHistorial();
            historial.Add(new HistorialData
            {
                ActorUserId = pazYSalvo.SolicitadoPorId,
                Accion = "SentToSign",
                EstadoDesde = estadoAnterior,
                EstadoHasta = "EnFirma",
                Nota = "Enviado a firma",
                FechaAccion = DateTime.Now
            });
            pazYSalvo.SetHistorial(historial);

            await _context.SaveChangesAsync();

            // Notificar a todos los firmantes requeridos
            try
            {
                await NotificarFirmantesAsync(pazYSalvoId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al enviar notificaciones de firma para Paz y Salvo {PazYSalvoId}", pazYSalvoId);
                // No fallar la creación por error en notificaciones
            }

            return await ObtenerDetalleAsync(pazYSalvoId);
        }

        public async Task<PazYSalvoResponse> FirmarAsync(int pazYSalvoId, string rol, FirmarRequest request)
        {
            try
            {
                _logger.LogInformation("Iniciando proceso de firma para Paz y Salvo {PazYSalvoId}, rol {Rol}, usuario {ActorUserId}", 
                    pazYSalvoId, rol, request.ActorUserId);

                var pazYSalvo = await _context.PazYSalvos
                    .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

                if (pazYSalvo == null)
                {
                    _logger.LogWarning("Paz y Salvo {PazYSalvoId} no encontrado", pazYSalvoId);
                    throw new ArgumentException("Paz y Salvo no encontrado");
                }

                // Validar estado según el rol
                if (rol == "RRHH")
                {
                    // RRHH solo puede firmar cuando el documento está "Aprobado"
                    if (pazYSalvo.Estado != "Aprobado")
                    {
                        _logger.LogWarning("RRHH no puede firmar Paz y Salvo {PazYSalvoId} en estado {Estado}. Debe estar 'Aprobado'", 
                            pazYSalvoId, pazYSalvo.Estado);
                        throw new InvalidOperationException("RRHH solo puede firmar cuando el documento está aprobado");
                    }
                }
                else
                {
                    // Otros roles solo pueden firmar cuando está "EnFirma"
                    if (!pazYSalvo.EsEnFirma)
                    {
                        _logger.LogWarning("Paz y Salvo {PazYSalvoId} no está en estado de firma. Estado actual: {Estado}", 
                            pazYSalvoId, pazYSalvo.Estado);
                        throw new InvalidOperationException("El documento no está en estado de firma");
                    }
                }

                var firmas = pazYSalvo.GetFirmas();
                var firma = firmas.FirstOrDefault(f => f.Rol == rol);
                
                // Lógica especial para RRHH: si no existe la firma, crearla automáticamente
                if (firma == null && rol == "RRHH")
                {
                    _logger.LogInformation("Creando firma de RRHH automáticamente para Paz y Salvo {PazYSalvoId}", pazYSalvoId);
                    
                    var firmaRRHH = new FirmaData 
                    { 
                        Rol = "RRHH", 
                        Orden = 5, 
                        Obligatorio = true, 
                        Estado = "Pendiente" 
                    };
                    
                    // Buscar usuario RRHH asignado
                    var rrhhUser = await _context.PazYSalvoRoleAssignments
                        .FirstOrDefaultAsync(ra => ra.Rol == "RRHH" && ra.IsActive);
                    
                    if (rrhhUser != null)
                    {
                        firmaRRHH.FirmanteUserId = rrhhUser.UserId;
                        var rrhhAuthUser = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Id == rrhhUser.UserId);
                        if (rrhhAuthUser != null)
                        {
                            firmaRRHH.FirmanteNombre = rrhhAuthUser.Username;
                        }
                    }
                    
                    firmas.Add(firmaRRHH);
                    pazYSalvo.SetFirmas(firmas);
                    firma = firmaRRHH;
                    
                    _logger.LogInformation("Firma de RRHH creada exitosamente para Paz y Salvo {PazYSalvoId}", pazYSalvoId);
                }
                else if (firma == null)
                {
                    _logger.LogWarning("Firma para rol {Rol} no encontrada en Paz y Salvo {PazYSalvoId}", rol, pazYSalvoId);
                    throw new ArgumentException($"Firma para rol {rol} no encontrada");
                }

                if (firma.Estado != "Pendiente")
                {
                    _logger.LogWarning("Firma para rol {Rol} ya fue procesada. Estado actual: {Estado}", rol, firma.Estado);
                    throw new InvalidOperationException("Esta firma ya fue procesada");
                }

                // Validar que el usuario puede firmar
                var puedeFirmar = await PuedeFirmarAsync(rol, request.ActorUserId);
                if (!puedeFirmar)
                {
                    _logger.LogWarning("Usuario {ActorUserId} no tiene permisos para firmar como {Rol}", request.ActorUserId, rol);
                    throw new UnauthorizedAccessException("No tienes permisos para firmar este documento");
                }

                // Obtener información del firmante
                var firmante = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Id == request.ActorUserId);
                if (firmante == null)
                {
                    _logger.LogWarning("Usuario firmante {ActorUserId} no encontrado", request.ActorUserId);
                    throw new ArgumentException("Usuario firmante no encontrado");
                }

                _logger.LogInformation("Procesando firma para usuario {Username} como {Rol}", firmante.Username, rol);

                // Actualizar firma
                firma.Estado = "Firmado";
                firma.FirmanteUserId = request.ActorUserId;
                firma.FirmanteNombre = firmante.Username; // Capturar nombre del firmante
                firma.FechaFirma = DateTime.Now;
                firma.Comentario = request.Comentario;
                
                try
                {
                    firma.FirmaHash = await CalcularHashFirmaAsync(pazYSalvo, firma, request.ActorUserId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al calcular hash de firma para usuario {ActorUserId}", request.ActorUserId);
                    throw new InvalidOperationException("Error al generar la firma digital");
                }

                pazYSalvo.SetFirmas(firmas);

                // Registrar en historial
                var historial = pazYSalvo.GetHistorial();
                historial.Add(new HistorialData
                {
                    ActorUserId = request.ActorUserId,
                    Accion = "Signed",
                    EstadoDesde = "Pendiente",
                    EstadoHasta = "Firmado",
                    Nota = $"Firmado por {rol}",
                    FechaAccion = DateTime.Now
                });

                // Verificar si todas las firmas requeridas están completas
                var firmasRequeridas = firmas.Where(f => f.Obligatorio).ToList();
                var firmasCompletadas = firmasRequeridas.Count(f => f.Estado == "Firmado");
                
                // Lógica especial para RRHH: si firma RRHH, cerrar el documento
                if (rol == "RRHH")
                {
                    _logger.LogInformation("RRHH firmó Paz y Salvo {PazYSalvoId} - cerrando documento", pazYSalvoId);
                    pazYSalvo.Estado = "Cerrado";
                    pazYSalvo.FechaCierre = DateTime.Now;
                    pazYSalvo.FechaActualizacion = DateTime.Now;

                    historial.Add(new HistorialData
                    {
                        ActorUserId = request.ActorUserId,
                        Accion = "Closed",
                        EstadoDesde = "Aprobado",
                        EstadoHasta = "Cerrado",
                        Nota = "Documento cerrado por RRHH - Finiquito aprobado",
                        FechaAccion = DateTime.Now
                    });

                    // Notificar cierre
                    try
                    {
                        await NotificarCierreAsync(pazYSalvoId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error al enviar notificación de cierre para Paz y Salvo {PazYSalvoId}", pazYSalvoId);
                    }
                }
                else if (firmasCompletadas == firmasRequeridas.Count)
                {
                    _logger.LogInformation("Todas las firmas requeridas completadas para Paz y Salvo {PazYSalvoId}", pazYSalvoId);
                    pazYSalvo.Estado = "Aprobado";
                    pazYSalvo.FechaAprobacion = DateTime.Now;
                    pazYSalvo.FechaActualizacion = DateTime.Now;

                    // Agregar firma de RRHH ahora que está aprobado
                    var firmaRRHH = new FirmaData 
                    { 
                        Rol = "RRHH", 
                        Orden = 5, 
                        Obligatorio = true, 
                        Estado = "Pendiente" 
                    };
                    
                    // Buscar usuario RRHH asignado
                    var rrhhUser = await _context.PazYSalvoRoleAssignments
                        .FirstOrDefaultAsync(ra => ra.Rol == "RRHH" && ra.IsActive);
                    
                    if (rrhhUser != null)
                    {
                        firmaRRHH.FirmanteUserId = rrhhUser.UserId;
                        var rrhhAuthUser = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Id == rrhhUser.UserId);
                        if (rrhhAuthUser != null)
                        {
                            firmaRRHH.FirmanteNombre = rrhhAuthUser.Username;
                        }
                    }
                    
                    firmas.Add(firmaRRHH);
                    pazYSalvo.SetFirmas(firmas);

                    historial.Add(new HistorialData
                    {
                        ActorUserId = request.ActorUserId,
                        Accion = "Approved",
                        EstadoDesde = "EnFirma",
                        EstadoHasta = "Aprobado",
                        Nota = "Todas las firmas requeridas completadas - RRHH puede firmar para cerrar",
                        FechaAccion = DateTime.Now
                    });

                    // Notificar aprobación
                    try
                    {
                        await NotificarAprobacionAsync(pazYSalvoId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error al enviar notificación de aprobación para Paz y Salvo {PazYSalvoId}", pazYSalvoId);
                        // No fallar la firma por error en notificación
                    }
                }

                pazYSalvo.SetHistorial(historial);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Firma completada exitosamente para Paz y Salvo {PazYSalvoId}, rol {Rol}", pazYSalvoId, rol);
                return await ObtenerDetalleAsync(pazYSalvoId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al firmar Paz y Salvo {PazYSalvoId}, rol {Rol}, usuario {ActorUserId}", 
                    pazYSalvoId, rol, request.ActorUserId);
                throw;
            }
        }

        public async Task<PazYSalvoResponse> RechazarAsync(int pazYSalvoId, string rol, RechazarRequest request)
        {
            var pazYSalvo = await _context.PazYSalvos
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo == null)
                throw new ArgumentException("Paz y Salvo no encontrado");

            if (!pazYSalvo.EsEnFirma)
                throw new InvalidOperationException("El documento no está en estado de firma");

            var firmas = pazYSalvo.GetFirmas();
            var firma = firmas.FirstOrDefault(f => f.Rol == rol);
            
            if (firma == null)
                throw new ArgumentException($"Firma para rol {rol} no encontrada");

            if (firma.Estado != "Pendiente")
                throw new InvalidOperationException("Esta firma ya fue procesada");

            // Validar que el usuario puede rechazar
            if (!await PuedeFirmarAsync(rol, request.ActorUserId))
                throw new UnauthorizedAccessException("No tienes permisos para rechazar este documento");

            // Marcar firma como rechazada
            firma.Estado = "Rechazado";
            firma.FirmanteUserId = request.ActorUserId;
            firma.FechaFirma = DateTime.Now;
            firma.Comentario = request.Motivo;

            pazYSalvo.SetFirmas(firmas);

            // Cambiar estado del documento a Rechazado
            var estadoAnterior = pazYSalvo.Estado;
            pazYSalvo.Estado = "Rechazado";
            pazYSalvo.FechaActualizacion = DateTime.Now;

            // Registrar en historial
            var historial = pazYSalvo.GetHistorial();
            historial.Add(new HistorialData
            {
                ActorUserId = request.ActorUserId,
                Accion = "Rejected",
                EstadoDesde = estadoAnterior,
                EstadoHasta = "Rechazado",
                Nota = $"Rechazado por {rol}: {request.Motivo}",
                FechaAccion = DateTime.Now
            });
            pazYSalvo.SetHistorial(historial);

            await _context.SaveChangesAsync();

            // Notificar rechazo
            await NotificarRechazoAsync(pazYSalvoId);

            return await ObtenerDetalleAsync(pazYSalvoId);
        }

        public async Task<PazYSalvoResponse> CerrarAsync(int pazYSalvoId)
        {
            var pazYSalvo = await _context.PazYSalvos
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo == null)
                throw new ArgumentException("Paz y Salvo no encontrado");

            if (!pazYSalvo.PuedeSerCerrado)
                throw new InvalidOperationException("El documento no puede ser cerrado en su estado actual");

            // Generar PDF final
            var pdfPath = await GenerarPdfFinalAsync(pazYSalvo);
            var hashFinal = await CalcularHashFinalAsync(pazYSalvo);

            // Actualizar estado
            pazYSalvo.Estado = "Cerrado";
            pazYSalvo.PdfFinalPath = pdfPath;
            pazYSalvo.HashFinal = hashFinal;
            pazYSalvo.FechaCierre = DateTime.Now;
            pazYSalvo.FechaActualizacion = DateTime.Now;

            // Registrar en historial
            var historial = pazYSalvo.GetHistorial();
            historial.Add(new HistorialData
            {
                ActorUserId = pazYSalvo.SolicitadoPorId,
                Accion = "Closed",
                EstadoDesde = "Aprobado",
                EstadoHasta = "Cerrado",
                Nota = "Documento cerrado y PDF generado",
                FechaAccion = DateTime.Now
            });
            pazYSalvo.SetHistorial(historial);

            await _context.SaveChangesAsync();

            // Notificar cierre
            await NotificarCierreAsync(pazYSalvoId);

            return await ObtenerDetalleAsync(pazYSalvoId);
        }

        public async Task<PazYSalvoResponse> ObtenerDetalleAsync(int pazYSalvoId)
        {
            var pazYSalvo = await _context.PazYSalvos
                .Include(p => p.Usuario)
                .Include(p => p.SolicitadoPor)
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo == null)
                throw new ArgumentException("Paz y Salvo no encontrado");

            return MapearAResponse(pazYSalvo);
        }

        public async Task<PazYSalvoListPaginatedResponse> ListarAsync(string? estado = null, int page = 1, int pageSize = 10, string? search = null)
        {
            var query = _context.PazYSalvos.AsQueryable();

            if (!string.IsNullOrEmpty(estado))
            {
                query = query.Where(p => p.Estado == estado);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => 
                    p.UsuarioNombre.Contains(search) ||
                    (p.UsuarioRut != null && p.UsuarioRut.Contains(search)) ||
                    (p.MotivoSalida != null && p.MotivoSalida.Contains(search))
                );
            }

            var totalCount = await query.CountAsync();

            var resultados = await query
                .OrderByDescending(p => p.FechaCreacion)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = resultados.Select(p => new PazYSalvoListResponse
            {
                Id = p.Id,
                UsuarioNombre = p.UsuarioNombre,
                UsuarioRut = p.UsuarioRut ?? "",
                FechaSalida = p.FechaSalida,
                MotivoSalida = p.MotivoSalida ?? "",
                Estado = p.Estado,
                FechaCreacion = p.FechaCreacion,
                FechaActualizacion = p.FechaActualizacion ?? p.FechaCreacion,
                FirmasPendientes = p.GetFirmas().Count(f => f.Estado == "Pendiente"),
                FirmasTotales = p.GetFirmas().Count,
                FirmasRequeridas = p.GetFirmas().Count(f => f.Obligatorio)
            }).ToList();

            return new PazYSalvoListPaginatedResponse
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        // Métodos privados auxiliares
        private async Task<List<FirmaData>> CrearFirmasPorDefectoAsync(int? jefeDirectoId = null, string empresa = null)
        {
            _logger.LogInformation("CrearFirmasPorDefectoAsync - Empresa: {Empresa}, JefeDirectoId: {JefeDirectoId}", empresa, jefeDirectoId);
            
            var firmas = new List<FirmaData>
            {
                new FirmaData { Rol = "JefeInmediato", Orden = 1, Obligatorio = true, FirmanteUserId = jefeDirectoId },
                new FirmaData { Rol = "Contabilidad", Orden = 2, Obligatorio = true },
                new FirmaData { Rol = "Informatica", Orden = 3, Obligatorio = true },
                new FirmaData { Rol = "GerenciaFinanzas", Orden = 4, Obligatorio = true }
            };

            // Obtener nombres de los usuarios asignados a cada rol
            foreach (var firma in firmas)
            {
                if (firma.FirmanteUserId.HasValue)
                {
                    // Verificar que el usuario no sea admin
                    var authUser = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Id == firma.FirmanteUserId.Value);
                    if (authUser != null && authUser.Role == "admin")
                    {
                        // Si es admin, buscar otro usuario para este rol de la misma empresa o dejar sin asignar
                        var rolesABuscar = new List<string> { firma.Rol };
                        if (firma.Rol == "GerenciaFinanzas")
                        {
                            rolesABuscar.Add("Gerencia Finanzas");
                        }
                        else if (firma.Rol == "Gerencia Finanzas")
                        {
                            rolesABuscar.Add("GerenciaFinanzas");
                        }
                        
                        var otraQuery = _context.PazYSalvoRoleAssignments
                            .Where(ra => rolesABuscar.Contains(ra.Rol) && ra.IsActive && ra.UserId != firma.FirmanteUserId.Value);
                        
                        if (!string.IsNullOrEmpty(empresa))
                        {
                            otraQuery = otraQuery.Where(ra => ra.Empresa == empresa);
                        }
                        
                        var otraAsignacion = await otraQuery.FirstOrDefaultAsync();
                        
                        if (otraAsignacion != null)
                        {
                            firma.FirmanteUserId = otraAsignacion.UserId;
                            authUser = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Id == otraAsignacion.UserId);
                        }
                        else
                        {
                            // No hay otro usuario para este rol, dejar sin asignar
                            firma.FirmanteUserId = null;
                            authUser = null;
                        }
                    }
                    
                    if (firma.FirmanteUserId.HasValue && authUser != null)
                    {
                        // Buscar el nombre real del usuario en la nómina
                        var usuario = await _context.AuthUsers
                            .Join(_context.NominaUsuarios, 
                                  au => au.Username, 
                                  nu => nu.Email, 
                                  (au, nu) => new { AuthUser = au, NominaUser = nu })
                            .FirstOrDefaultAsync(u => u.AuthUser.Id == firma.FirmanteUserId.Value);
                        
                        if (usuario != null)
                        {
                            firma.FirmanteNombre = $"{usuario.NominaUser.Nombre} {usuario.NominaUser.Apellido}".Trim();
                        }
                        else
                        {
                            // Fallback al username si no se encuentra en nómina
                            firma.FirmanteNombre = authUser.Username;
                        }
                    }
                }
                else
                {
                    // Buscar usuario asignado al rol de la empresa específica
                    // Manejar variaciones en nombres de roles (con y sin espacios)
                    var rolesABuscar = new List<string> { firma.Rol };
                    if (firma.Rol == "GerenciaFinanzas")
                    {
                        rolesABuscar.Add("Gerencia Finanzas");
                    }
                    else if (firma.Rol == "Gerencia Finanzas")
                    {
                        rolesABuscar.Add("GerenciaFinanzas");
                    }
                    
                    var query = _context.PazYSalvoRoleAssignments
                        .Where(ra => rolesABuscar.Contains(ra.Rol) && ra.IsActive);
                    
                    // Filtrar por empresa si se especifica
                    if (!string.IsNullOrEmpty(empresa))
                    {
                        query = query.Where(ra => ra.Empresa == empresa);
                        _logger.LogInformation("Buscando asignaciones para roles {Roles} en empresa {Empresa}", string.Join(", ", rolesABuscar), empresa);
                    }
                    else
                    {
                        _logger.LogInformation("Buscando asignaciones para roles {Roles} sin filtro de empresa", string.Join(", ", rolesABuscar));
                    }
                    
                    var asignacion = await query.FirstOrDefaultAsync();
                    _logger.LogInformation("Asignación encontrada para rol {Rol}: {Asignacion}", firma.Rol, asignacion != null ? $"UserId: {asignacion.UserId}, Empresa: {asignacion.Empresa}, Rol: {asignacion.Rol}" : "Ninguna");
                    
                    if (asignacion != null)
                    {
                        // Verificar que el usuario no sea admin
                        var authUser = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Id == asignacion.UserId);
                        if (authUser != null && authUser.Role == "admin")
                        {
                            // Saltar al admin, buscar otro usuario para este rol de la misma empresa
                            var rolesAlternativos = new List<string> { firma.Rol };
                            if (firma.Rol == "GerenciaFinanzas")
                            {
                                rolesAlternativos.Add("Gerencia Finanzas");
                            }
                            else if (firma.Rol == "Gerencia Finanzas")
                            {
                                rolesAlternativos.Add("GerenciaFinanzas");
                            }
                            
                            var otraQuery = _context.PazYSalvoRoleAssignments
                                .Where(ra => rolesAlternativos.Contains(ra.Rol) && ra.IsActive && ra.UserId != asignacion.UserId);
                            
                            if (!string.IsNullOrEmpty(empresa))
                            {
                                otraQuery = otraQuery.Where(ra => ra.Empresa == empresa);
                            }
                            
                            var otraAsignacion = await otraQuery.FirstOrDefaultAsync();
                            
                            if (otraAsignacion != null)
                            {
                                asignacion = otraAsignacion;
                                authUser = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Id == otraAsignacion.UserId);
                            }
                            else
                            {
                                // No hay otro usuario para este rol, dejar sin asignar
                                asignacion = null;
                            }
                        }
                        
                        if (asignacion != null)
                        {
                            // Buscar el nombre real del usuario en la nómina
                            var usuario = await _context.AuthUsers
                                .Join(_context.NominaUsuarios, 
                                      au => au.Username, 
                                      nu => nu.Email, 
                                      (au, nu) => new { AuthUser = au, NominaUser = nu })
                                .FirstOrDefaultAsync(u => u.AuthUser.Id == asignacion.UserId);
                            
                            if (usuario != null)
                            {
                                firma.FirmanteUserId = usuario.AuthUser.Id;
                                firma.FirmanteNombre = $"{usuario.NominaUser.Nombre} {usuario.NominaUser.Apellido}".Trim();
                            }
                            else
                            {
                                // Fallback al username si no se encuentra en nómina
                                if (authUser != null)
                                {
                                    firma.FirmanteUserId = authUser.Id;
                                    firma.FirmanteNombre = authUser.Username;
                                }
                            }
                        }
                    }
                }
            }

            return firmas;
        }

        private async Task<List<ActivoData>> CrearSnapshotActivosAsync(int usuarioId)
        {
            var asignaciones = await _context.AsignacionesActivos
                .Include(aa => aa.Activo)
                .Where(aa => aa.UsuarioId == usuarioId && aa.Estado == "Activa")
                .ToListAsync();

            var snapshots = asignaciones.Select(aa => new ActivoData
            {
                ActivoId = aa.ActivoId,
                Descripcion = $"{aa.Activo.Categoria} - {aa.Activo.Marca} {aa.Activo.Modelo}",
                EstadoActivo = "Pendiente",
                Observacion = "Pendiente de devolución"
            }).ToList();

            return snapshots;
        }

        private async Task<bool> PuedeFirmarAsync(string rol, int userId)
        {
            var user = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return false;

            // Admin/soporte pueden firmar cualquier cosa (sin validar firma digital)
            if (user.Role == "admin" || user.Role == "soporte") return true;

            // Verificar subroles de Paz y Salvo
            var hasSubrole = await _context.PazYSalvoRoleAssignments
                .AnyAsync(ra => ra.UserId == userId && 
                              ra.IsActive && 
                              ra.Rol == rol);

            if (hasSubrole) return true;

            // Verificar delegaciones activas (si la tabla existe)
            try
            {
                var hasDelegation = await _context.PazYSalvoDelegations
                    .AnyAsync(d => d.UsuarioDelegadoId == userId &&
                                  d.IsActive &&
                                  d.SubRole == rol &&
                                  d.FechaFin > DateTime.Now);

                if (hasDelegation) return true;
            }
            catch
            {
                // Si la tabla de delegaciones no existe, continuamos
            }

            return false;
        }

        private async Task<string> CalcularHashFirmaAsync(PazYSalvo pazYSalvo, FirmaData firma, int actorUserId)
        {
            // Obtener información del usuario firmante para mayor seguridad
            var user = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Id == actorUserId);
            if (user == null)
                throw new ArgumentException("Usuario firmante no encontrado");

            var payload = new
            {
                PazYSalvoId = pazYSalvo.Id,
                Rol = firma.Rol,
                ActorUserId = actorUserId,
                ActorUsername = user.Username,
                SignaturePath = user.SignaturePath ?? "default", // Usar "default" si no hay firma configurada
                UsuarioId = pazYSalvo.UsuarioId,
                UsuarioRut = pazYSalvo.UsuarioRut,
                Timestamp = DateTime.UtcNow,
                Version = 2 // Incrementar versión por cambios de seguridad
            };

            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = false });
            var bytes = Encoding.UTF8.GetBytes(json);
            
            using var sha256 = SHA256.Create();
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        private async Task<string> CalcularHashFinalAsync(PazYSalvo pazYSalvo)
        {
            var payload = new
            {
                Id = pazYSalvo.Id,
                UsuarioId = pazYSalvo.UsuarioId,
                FechaSalida = pazYSalvo.FechaSalida,
                MotivoSalida = pazYSalvo.MotivoSalida,
                Estado = pazYSalvo.Estado,
                Firmas = pazYSalvo.GetFirmas().Select(f => new
                {
                    f.Rol,
                    f.Estado,
                    f.FirmaHash,
                    f.FechaFirma
                }).OrderBy(f => f.Rol),
                Version = 1
            };

            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = false });
            var bytes = Encoding.UTF8.GetBytes(json);
            
            using var sha256 = SHA256.Create();
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        private async Task<string> GenerarPdfFinalAsync(PazYSalvo pazYSalvo)
        {
            // Obtener detalle completo para generar PDF
            var detalle = await ObtenerDetalleAsync(pazYSalvo.Id);
            
            // Generar PDF
            var pdfBytes = _pdfService.GenerarPazYSalvoPdf(detalle);
            
            // Crear directorio si no existe
            var storageRoot = _configuration["Storage:Root"] ?? "Storage";
            if (!Path.IsPathRooted(storageRoot))
            {
                storageRoot = Path.Combine(Directory.GetCurrentDirectory(), storageRoot);
            }
            
            var year = DateTime.Now.Year.ToString();
            var month = DateTime.Now.Month.ToString("00");
            var directory = Path.Combine(storageRoot, "pazysalvo", year, month);
            Directory.CreateDirectory(directory);
            
            // Guardar PDF
            var fileName = $"pazysalvo_{pazYSalvo.Id}_{pazYSalvo.UsuarioRut}_{DateTime.Now:yyyyMMdd}.pdf";
            var filePath = Path.Combine(directory, fileName);
            await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);
            
            // Retornar ruta relativa
            return $"storage/pazysalvo/{year}/{month}/{fileName}";
        }

        private async Task NotificarFirmantesAsync(int pazYSalvoId)
        {
            var pazYSalvo = await _context.PazYSalvos.FirstOrDefaultAsync(p => p.Id == pazYSalvoId);
            if (pazYSalvo == null) return;

            var firmas = pazYSalvo.GetFirmas().Where(f => f.Estado == "Pendiente" && f.FirmanteUserId.HasValue);
            
            foreach (var firma in firmas)
            {
                await _notificationsService.CreateAsync(new CreateNotificationDto
                {
                    UserId = firma.FirmanteUserId.Value,
                    Titulo = "Firma Pendiente",
                    Mensaje = "Tienes una firma pendiente de Paz y Salvo",
                    Tipo = "PazYSalvo",
                    RefTipo = "PazYSalvo",
                    RefId = pazYSalvoId
                });
            }
        }

        /// <summary>
        /// Generar PDF firmado solo por un rol específico
        /// </summary>
        public async Task<byte[]> GenerarPdfFirmadoPorRolAsync(int pazYSalvoId, string rol)
        {
            var pazYSalvo = await _context.PazYSalvos
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo == null)
                throw new ArgumentException("Paz y Salvo no encontrado");

            // Obtener detalle completo
            var detalle = await ObtenerDetalleAsync(pazYSalvoId);
            
            // Verificar que existe la firma para el rol
            var firma = detalle.Firmas?.FirstOrDefault(f => f.Rol == rol);
            if (firma == null)
                throw new ArgumentException($"Firma para rol {rol} no encontrada");

            if (firma.Estado != "Firmado")
                throw new InvalidOperationException($"El documento no ha sido firmado por {rol}");

            // Generar PDF con solo esta firma específica
            var pdfBytes = _pdfService.GenerarPazYSalvoPdfFirmadoPorRol(detalle, rol);
            
            return pdfBytes;
        }

        public async Task<byte[]> GenerarPdfPrevisualizacionAsync(int pazYSalvoId)
        {
            var pazYSalvo = await _context.PazYSalvos
                .Include(p => p.Usuario)
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo == null)
                throw new ArgumentException("Paz y Salvo no encontrado");

            // Obtener detalle completo
            var detalle = await ObtenerDetalleAsync(pazYSalvoId);
            
            // Obtener la empresa del empleado
            string? empresaEmpleado = null;
            if (pazYSalvo.Usuario != null)
            {
                empresaEmpleado = pazYSalvo.Usuario.Empresa;
            }
            
            // Generar PDF sin firmas (solo el documento base)
            var pdfBytes = _pdfService.GenerarPazYSalvoPdfPrevisualizacion(detalle, empresaEmpleado);
            
            return pdfBytes;
        }

        private async Task NotificarAprobacionAsync(int pazYSalvoId)
        {
            var pazYSalvo = await _context.PazYSalvos
                .Include(p => p.SolicitadoPor)
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo?.SolicitadoPor != null)
            {
                await _notificationsService.CreateAsync(new CreateNotificationDto
                {
                    UserId = pazYSalvo.SolicitadoPor.Id,
                    Titulo = "Paz y Salvo Aprobado",
                    Mensaje = "El Paz y Salvo ha sido aprobado y está listo para cerrar",
                    Tipo = "PazYSalvo",
                    RefTipo = "PazYSalvo",
                    RefId = pazYSalvoId
                });
            }
        }

        private async Task NotificarRechazoAsync(int pazYSalvoId)
        {
            var pazYSalvo = await _context.PazYSalvos
                .Include(p => p.SolicitadoPor)
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo?.SolicitadoPor != null)
            {
                await _notificationsService.CreateAsync(new CreateNotificationDto
                {
                    UserId = pazYSalvo.SolicitadoPor.Id,
                    Titulo = "Paz y Salvo Rechazado",
                    Mensaje = "El Paz y Salvo ha sido rechazado",
                    Tipo = "PazYSalvo",
                    RefTipo = "PazYSalvo",
                    RefId = pazYSalvoId
                });
            }
        }

        private async Task NotificarCierreAsync(int pazYSalvoId)
        {
            var pazYSalvo = await _context.PazYSalvos
                .Include(p => p.SolicitadoPor)
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo?.SolicitadoPor != null)
            {
                await _notificationsService.CreateAsync(new CreateNotificationDto
                {
                    UserId = pazYSalvo.SolicitadoPor.Id,
                    Titulo = "Paz y Salvo Cerrado",
                    Mensaje = "El Paz y Salvo ha sido cerrado y el PDF está disponible",
                    Tipo = "PazYSalvo",
                    RefTipo = "PazYSalvo",
                    RefId = pazYSalvoId
                });
            }
        }

        public async Task<PazYSalvoResponse> CrearExcepcionAsync(int pazYSalvoId, CrearExcepcionRequest request)
        {
            var pazYSalvo = await _context.PazYSalvos
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo == null)
                throw new ArgumentException("Paz y Salvo no encontrado");

            var excepciones = pazYSalvo.GetExcepciones();
            excepciones.Add(new ExcepcionData
            {
                AprobadaPorId = request.AprobadaPorId,
                Motivo = request.Motivo,
                FechaCreacion = DateTime.Now
            });
            pazYSalvo.SetExcepciones(excepciones);

            await _context.SaveChangesAsync();
            return await ObtenerDetalleAsync(pazYSalvoId);
        }

        public async Task<VerificarHashResponse> VerificarHashAsync(int pazYSalvoId)
        {
            var pazYSalvo = await _context.PazYSalvos
                .FirstOrDefaultAsync(p => p.Id == pazYSalvoId);

            if (pazYSalvo == null)
                throw new ArgumentException("Paz y Salvo no encontrado");

            if (string.IsNullOrEmpty(pazYSalvo.HashFinal))
            {
                return new VerificarHashResponse
                {
                    Valido = false,
                    Mensaje = "El documento no tiene hash final",
                    FechaVerificacion = DateTime.Now
                };
            }

            var hashCalculado = await CalcularHashFinalAsync(pazYSalvo);
            var esValido = hashCalculado == pazYSalvo.HashFinal;

            return new VerificarHashResponse
            {
                Valido = esValido,
                HashCalculado = hashCalculado,
                HashAlmacenado = pazYSalvo.HashFinal,
                Mensaje = esValido ? "El hash es válido" : "El hash no coincide",
                FechaVerificacion = DateTime.Now
            };
        }

        private PazYSalvoResponse MapearAResponse(PazYSalvo pazYSalvo)
        {
            return new PazYSalvoResponse
            {
                Id = pazYSalvo.Id,
                UsuarioId = pazYSalvo.UsuarioId,
                UsuarioNombre = pazYSalvo.UsuarioNombre,
                UsuarioRut = pazYSalvo.UsuarioRut,
                FechaSalida = pazYSalvo.FechaSalida,
                MotivoSalida = pazYSalvo.MotivoSalida,
                Estado = pazYSalvo.Estado,
                Observaciones = pazYSalvo.Observaciones,
                HashFinal = pazYSalvo.HashFinal,
                PdfFinalPath = pazYSalvo.PdfFinalPath,
                FechaCreacion = pazYSalvo.FechaCreacion,
                FechaActualizacion = pazYSalvo.FechaActualizacion,
                FechaEnvioFirma = pazYSalvo.FechaEnvioFirma,
                FechaAprobacion = pazYSalvo.FechaAprobacion,
                FechaCierre = pazYSalvo.FechaCierre,
                Firmas = pazYSalvo.GetFirmas(),
                Historial = pazYSalvo.GetHistorial(),
                Adjuntos = pazYSalvo.GetAdjuntos(),
                Excepciones = pazYSalvo.GetExcepciones(),
                ActivosSnapshot = pazYSalvo.GetActivosSnapshot()
            };
        }

        private byte[] GenerateSalt()
        {
            using var rng = RandomNumberGenerator.Create();
            var salt = new byte[32];
            rng.GetBytes(salt);
            return salt;
        }

        private byte[] HashPassword(string password, byte[] salt)
        {
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
            return pbkdf2.GetBytes(32);
        }
    }
}
