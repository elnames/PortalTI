using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Models;
using System.Text.Json;

namespace PortalTi.Api.Data
{
    public static class DbInitializer
    {
        public static void Initialize(PortalTiContext context)
        {
            // Asegurar que la base de datos esté creada
            context.Database.EnsureCreated();

            // Verificar si ya hay datos
            if (context.NominaUsuarios.Any())
            {
                return; // La base de datos ya tiene datos
            }

            // Poblar con datos iniciales si está vacía
            SeedInitialData(context);
        }

        public static void ClearAndSeedGenericData(PortalTiContext context)
        {
            try
            {
                // Preservar usuarios admin existentes
                var adminUsers = context.AuthUsers.Where(u => u.Role == "admin").ToList();
                Console.WriteLine($"Usuarios admin encontrados: {adminUsers.Count}");
                
                // Limpiar todos los datos existentes
                Console.WriteLine("Eliminando AsignacionesActivos...");
                context.Database.ExecuteSqlRaw("DELETE FROM AsignacionesActivos");
                
                Console.WriteLine("Eliminando ComentariosTickets...");
                context.Database.ExecuteSqlRaw("DELETE FROM ComentariosTickets");
                
                Console.WriteLine("Eliminando ArchivosTickets...");
                context.Database.ExecuteSqlRaw("DELETE FROM ArchivosTickets");
                
                Console.WriteLine("Eliminando Tickets...");
                context.Database.ExecuteSqlRaw("DELETE FROM Tickets");
                
                Console.WriteLine("Eliminando ChatMensajes...");
                context.Database.ExecuteSqlRaw("DELETE FROM ChatMensajes");
                
                Console.WriteLine("Eliminando ChatConversaciones...");
                context.Database.ExecuteSqlRaw("DELETE FROM ChatConversaciones");
                
                Console.WriteLine("Eliminando Notificaciones...");
                context.Database.ExecuteSqlRaw("DELETE FROM Notificaciones");
                
                Console.WriteLine("Eliminando UserActivityLogs...");
                context.Database.ExecuteSqlRaw("DELETE FROM UserActivityLogs");
                
                Console.WriteLine("Eliminando Actas...");
                context.Database.ExecuteSqlRaw("DELETE FROM Actas");
                
                Console.WriteLine("Eliminando Activos...");
                context.Database.ExecuteSqlRaw("DELETE FROM Activos");
                
                Console.WriteLine("Eliminando NominaUsuarios...");
                context.Database.ExecuteSqlRaw("DELETE FROM NominaUsuarios");
                
                Console.WriteLine("Eliminando AuthUsers...");
                context.Database.ExecuteSqlRaw("DELETE FROM AuthUsers");
                
                // Restaurar usuarios admin
                if (adminUsers.Any())
                {
                    Console.WriteLine("Restaurando usuarios admin...");
                    context.AuthUsers.AddRange(adminUsers);
                    context.SaveChanges();
                }

                // Resetear contadores de identidad
                Console.WriteLine("Reseteando contadores de identidad...");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('NominaUsuarios', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('Activos', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('AsignacionesActivos', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('Tickets', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('ComentariosTickets', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('ArchivosTickets', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('ChatConversaciones', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('ChatMensajes', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('Notificaciones', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('UserActivityLogs', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('Actas', RESEED, 0)");
                context.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('AuthUsers', RESEED, 0)");

                // Poblar con datos genéricos
                Console.WriteLine("Iniciando población de datos genéricos...");
                SeedGenericData(context);
                Console.WriteLine("Población de datos genéricos completada.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en ClearAndSeedGenericData: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                throw;
            }
        }

        private static void SeedInitialData(PortalTiContext context)
        {
            // Datos iniciales básicos (mantener para compatibilidad)
            var usuarios = new List<NominaUsuario>
            {
                new NominaUsuario
                {
                    Nombre = "Admin",
                    Apellido = "Sistema",
                    Rut = "12345678-9",
                    Email = "admin@empresa.com",
                    Departamento = "TI y Sistemas",
                    Empresa = "Empresa A",
                    Ubicacion = "Oficina Central - Santiago Centro"
                }
            };

            context.NominaUsuarios.AddRange(usuarios);
            context.SaveChanges();
        }

        private static void SeedGenericData(PortalTiContext context)
        {
            var random = new Random();

            // Datos genéricos
            var empresas = new[] { "Empresa A", "Empresa B", "Empresa C", "Empresa D" };
            var ubicaciones = new[]
            {
                "Oficina Central - Santiago Centro",
                "Sucursal Norte - Conchalí",
                "Sucursal Sur - San Joaquín",
                "Sucursal Este - Las Condes",
                "Sucursal Oeste - Pudahuel",
                "Centro de Distribución - Colina",
                "Almacén Principal - Huechuraba",
                "Argentina", "Uruguay", "Antofagasta", "Concepción",
                "Iquique", "La Serena", "Pucón", "Temuco"
            };
            var departamentos = new[]
            {
                "TI y Sistemas", "Recursos Humanos", "Finanzas", "Operaciones",
                "Ventas", "Marketing", "Logística", "Administración",
                "Servicio al Cliente", "Desarrollo", "Soporte Técnico",
                "Gerencia", "Contabilidad", "Compras", "Calidad"
            };
            var nombres = new[]
            {
                "Juan", "María", "Carlos", "Ana", "Luis", "Carmen", "Pedro", "Isabel",
                "Miguel", "Rosa", "Fernando", "Patricia", "Roberto", "Elena", "Diego",
                "Sofia", "Andrés", "Claudia", "Ricardo", "Mónica", "Alejandro",
                "Verónica", "Francisco", "Natalia", "Daniel", "Carolina", "Jorge",
                "Valentina", "Manuel", "Gabriela", "Héctor", "Camila", "Eduardo",
                "Daniela", "Felipe", "Javiera", "Cristian", "Constanza", "Sebastián", "Antonia"
            };
            var apellidos = new[]
            {
                "González", "Rodríguez", "Gómez", "Fernández", "López", "Díaz",
                "Martínez", "Pérez", "García", "Sánchez", "Romero", "Sosa", "Torres",
                "Álvarez", "Ruiz", "Jiménez", "Moreno", "Muñoz", "Alonso", "Gutiérrez",
                "Navarro", "Domínguez", "Gil", "Vázquez", "Serrano", "Ramos",
                "Blanco", "Suárez", "Castro", "Ortega", "Rubio", "Marín", "Sanz",
                "Iglesias", "Medina", "Cortés", "Garrido", "Castillo", "Santos", "Lozano"
            };

            // Crear 250 usuarios genéricos
            var usuarios = new List<NominaUsuario>();
            for (int i = 1; i <= 250; i++)
            {
                var nombre = nombres[random.Next(nombres.Length)];
                var apellido = apellidos[random.Next(apellidos.Length)];
                var email = $"{nombre.ToLower()}.{apellido.ToLower()}{i}@empresa.com";
                var rut = $"{10000000 + i}-K";

                usuarios.Add(new NominaUsuario
                {
                    Nombre = nombre,
                    Apellido = apellido,
                    Rut = rut,
                    Email = email,
                    Departamento = departamentos[random.Next(departamentos.Length)],
                    Empresa = empresas[random.Next(empresas.Length)],
                    Ubicacion = ubicaciones[random.Next(ubicaciones.Length)]
                });
            }

            context.NominaUsuarios.AddRange(usuarios);
            context.SaveChanges();

            // Datos para activos
            var categorias = new[]
            {
                "Laptop", "Desktop", "Monitor", "Impresora", "Tablet", "Smartphone",
                "Servidor", "Switch", "Router", "UPS", "Teclado", "Mouse", "Webcam",
                "Auriculares", "Micrófono", "Escáner", "Proyector", "Cámara", "Radio", "GPS"
            };
            var estados = new[] { "Activo", "Inactivo", "En Mantenimiento", "Fuera de Servicio", "Pendiente de Asignación" };
            var marcas = new[] { "Marca A", "Marca B", "Marca C", "Marca D", "Marca E", "Marca F", "Marca G", "Marca H" };
            var modelos = new[] { "Modelo 2024", "Modelo Pro", "Modelo Lite", "Modelo Plus", "Modelo Elite", "Modelo Standard", "Modelo Premium" };

            // Crear 500 activos genéricos
            var activos = new List<Activo>();
            for (int i = 1; i <= 500; i++)
            {
                var categoria = categorias[random.Next(categorias.Length)];
                var marca = marcas[random.Next(marcas.Length)];
                var modelo = modelos[random.Next(modelos.Length)];
                var codigo = $"ACT-{i:D4}";
                var nombreEquipo = $"{marca} {modelo} - {codigo}";
                var serie = $"SER-{i:D6}";

                activos.Add(new Activo
                {
                    Categoria = categoria,
                    Codigo = codigo,
                    Estado = estados[random.Next(estados.Length)],
                    Ubicacion = ubicaciones[random.Next(ubicaciones.Length)],
                    NombreEquipo = nombreEquipo,
                    Marca = marca,
                    Modelo = modelo,
                    Serie = serie,
                    Empresa = empresas[random.Next(empresas.Length)],
                    Cantidad = 1
                });
            }

            context.Activos.AddRange(activos);
            context.SaveChanges();

            // Crear asignaciones de activos a usuarios
            var asignaciones = new List<AsignacionActivo>();
            var usuariosList = context.NominaUsuarios.ToList();
            var activosList = context.Activos.Where(a => a.Estado == "Activo").ToList();

            for (int i = 0; i < 200; i++)
            {
                var usuario = usuariosList[random.Next(usuariosList.Count)];
                var activo = activosList[random.Next(activosList.Count)];
                var fechaAsignacion = DateTime.Now.AddDays(-random.Next(180));
                var asignadoPor = usuariosList[random.Next(usuariosList.Count)];

                // Evitar asignaciones duplicadas
                if (!asignaciones.Any(a => a.UsuarioId == usuario.Id && a.ActivoId == activo.Id))
                {
                    asignaciones.Add(new AsignacionActivo
                    {
                        ActivoId = activo.Id,
                        UsuarioId = usuario.Id,
                        FechaAsignacion = fechaAsignacion,
                        Estado = "Activa",
                        AsignadoPor = $"{asignadoPor.Nombre} {asignadoPor.Apellido}"
                    });
                }
            }

            context.AsignacionesActivos.AddRange(asignaciones);
            context.SaveChanges();

            // Crear algunos tickets de ejemplo
            var tickets = new List<Ticket>();
            var asignacionesActivas = context.AsignacionesActivos
                .Include(a => a.Activo)
                .Include(a => a.Usuario)
                .Where(a => a.Estado == "Activa")
                .ToList();

            foreach (var asignacion in asignacionesActivas.Take(50)) // Solo algunos tickets
            {
                var prioridades = new[] { "Alta", "Media", "Baja" };
                tickets.Add(new Ticket
                {
                    Titulo = $"Problema con {asignacion.Activo.Categoria}",
                    Descripcion = $"El equipo {asignacion.Activo.NombreEquipo} presenta problemas técnicos que requieren atención.",
                    Estado = "Abierto",
                    Prioridad = prioridades[random.Next(prioridades.Length)],
                    Categoria = "Soporte Técnico",
                    Empresa = asignacion.Activo.Empresa,
                    FechaCreacion = DateTime.Now.AddDays(-random.Next(30)),
                    NombreSolicitante = $"{asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}",
                    EmailSolicitante = asignacion.Usuario.Email ?? "usuario@empresa.com"
                });
            }

            context.Tickets.AddRange(tickets);
            context.SaveChanges();

            // Crear algunas actas de ejemplo
            var actas = new List<Acta>();
            foreach (var asignacion in asignacionesActivas.Take(25)) // Solo algunas actas
            {
                actas.Add(new Acta
                {
                    AsignacionId = asignacion.Id,
                    Estado = "Firmada",
                    MetodoFirma = "Digital",
                    NombreArchivo = $"Acta_Entrega_{asignacion.Activo.Codigo}.pdf",
                    Observaciones = $"Acta de entrega del equipo {asignacion.Activo.NombreEquipo} al usuario {asignacion.Usuario.Nombre} {asignacion.Usuario.Apellido}",
                    FechaCreacion = DateTime.Now.AddDays(-random.Next(60)),
                    FechaSubida = DateTime.Now
                });
            }

            context.Actas.AddRange(actas);
            context.SaveChanges();
        }
    }
} 