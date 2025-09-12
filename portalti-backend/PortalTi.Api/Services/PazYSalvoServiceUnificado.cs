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

                // Configurar firmas por defecto
                var firmas = CrearFirmasPorDefecto(request.JefeDirectoId);
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

            // Validar que el usuario puede firmar
            if (!await PuedeFirmarAsync(rol, request.ActorUserId))
                throw new UnauthorizedAccessException("No tienes permisos para firmar este documento");

            // Obtener información del firmante
            var firmante = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Id == request.ActorUserId);
            if (firmante == null)
                throw new ArgumentException("Usuario firmante no encontrado");

            // Actualizar firma
            firma.Estado = "Firmado";
            firma.FirmanteUserId = request.ActorUserId;
            firma.FirmanteNombre = firmante.Username; // Capturar nombre del firmante
            firma.FechaFirma = DateTime.Now;
            firma.Comentario = request.Comentario;
            firma.FirmaHash = await CalcularHashFirmaAsync(pazYSalvo, firma, request.ActorUserId);

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
            
            if (firmasCompletadas == firmasRequeridas.Count)
            {
                pazYSalvo.Estado = "Aprobado";
                pazYSalvo.FechaAprobacion = DateTime.Now;
                pazYSalvo.FechaActualizacion = DateTime.Now;

                historial.Add(new HistorialData
                {
                    ActorUserId = request.ActorUserId,
                    Accion = "Approved",
                    EstadoDesde = "EnFirma",
                    EstadoHasta = "Aprobado",
                    Nota = "Todas las firmas requeridas completadas",
                    FechaAccion = DateTime.Now
                });

                // Notificar aprobación
                await NotificarAprobacionAsync(pazYSalvoId);
            }

            pazYSalvo.SetHistorial(historial);
            await _context.SaveChangesAsync();

            return await ObtenerDetalleAsync(pazYSalvoId);
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
        private List<FirmaData> CrearFirmasPorDefecto(int? jefeDirectoId = null)
        {
            var firmas = new List<FirmaData>
            {
                new FirmaData { Rol = "JefeInmediato", Orden = 1, Obligatorio = true, FirmanteUserId = jefeDirectoId },
                new FirmaData { Rol = "Contabilidad", Orden = 2, Obligatorio = true },
                new FirmaData { Rol = "Informatica", Orden = 3, Obligatorio = true },
                new FirmaData { Rol = "GerenciaFinanzas", Orden = 4, Obligatorio = true }
            };

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

            // VALIDACIÓN DE SEGURIDAD: Verificar que el usuario tiene firma digital configurada
            if (string.IsNullOrEmpty(user.SignaturePath))
            {
                throw new InvalidOperationException("No tienes una firma digital configurada. Contacta al administrador para configurar tu firma.");
            }

            // Verificar que el archivo de firma existe
            var storageRoot = Path.Combine(Directory.GetCurrentDirectory(), "Storage");
            var signatureFilePath = user.SignaturePath.StartsWith("/storage/")
                ? Path.Combine(storageRoot, user.SignaturePath.Replace("/storage/", string.Empty))
                : Path.Combine(storageRoot, user.SignaturePath.TrimStart('/'));

            if (!File.Exists(signatureFilePath))
            {
                throw new InvalidOperationException("Tu archivo de firma digital no se encuentra. Contacta al administrador para reconfigurar tu firma.");
            }

            // Admin/soporte con firma válida pueden firmar cualquier cosa
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
                SignaturePath = user.SignaturePath, // Incluir ruta de firma para mayor seguridad
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
    }
}
