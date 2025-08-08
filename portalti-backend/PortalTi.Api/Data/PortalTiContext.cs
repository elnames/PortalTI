using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Models;

namespace PortalTi.Api.Data
{
    public class PortalTiContext : DbContext
    {
        public PortalTiContext(DbContextOptions<PortalTiContext> options)
            : base(options)
        {
        }

        public DbSet<AuthUser> AuthUsers { get; set; }
        public DbSet<NominaUsuario> NominaUsuarios { get; set; }
        public DbSet<Activo> Activos { get; set; }
        public DbSet<AsignacionActivo> AsignacionesActivos { get; set; }
        public DbSet<UserActivityLog> UserActivityLogs { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<ComentarioTicket> ComentariosTickets { get; set; }
        public DbSet<ArchivoTicket> ArchivosTickets { get; set; }
        public DbSet<Notificacion> Notificaciones { get; set; }
        public DbSet<Acta> Actas { get; set; }
        public DbSet<ChatConversacion> ChatConversaciones { get; set; }
        public DbSet<ChatMensaje> ChatMensajes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurar relaciones para AsignacionActivo
            modelBuilder.Entity<AsignacionActivo>()
                .HasOne(aa => aa.Activo)
                .WithMany(a => a.Asignaciones)
                .HasForeignKey(aa => aa.ActivoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AsignacionActivo>()
                .HasOne(aa => aa.Usuario)
                .WithMany(u => u.Asignaciones)
                .HasForeignKey(aa => aa.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configurar índice único para evitar asignaciones duplicadas activas
            modelBuilder.Entity<AsignacionActivo>()
                .HasIndex(aa => new { aa.ActivoId, aa.Estado })
                .HasFilter("\"Estado\" = 'Activa'")
                .IsUnique();

            // Configurar relaciones para Acta
            modelBuilder.Entity<Acta>()
                .HasOne(a => a.Asignacion)
                .WithMany()
                .HasForeignKey(a => a.AsignacionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Acta>()
                .HasOne(a => a.AprobadoPor)
                .WithMany()
                .HasForeignKey(a => a.AprobadoPorId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configurar índices para Acta
            modelBuilder.Entity<Acta>()
                .HasIndex(a => a.Estado);

            modelBuilder.Entity<Acta>()
                .HasIndex(a => a.MetodoFirma);

            modelBuilder.Entity<Acta>()
                .HasIndex(a => a.FechaCreacion);

            modelBuilder.Entity<Acta>()
                .HasIndex(a => a.AsignacionId);

            // Configurar relaciones para UserActivityLog
            modelBuilder.Entity<UserActivityLog>()
                .HasOne(log => log.User)
                .WithMany(user => user.ActivityLogs)
                .HasForeignKey(log => log.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configurar índices para UserActivityLog
            modelBuilder.Entity<UserActivityLog>()
                .HasIndex(log => new { log.UserId, log.Timestamp });

            modelBuilder.Entity<UserActivityLog>()
                .HasIndex(log => log.Action);

            modelBuilder.Entity<UserActivityLog>()
                .HasIndex(log => log.Timestamp);

            // Configurar relaciones para Tickets
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.AsignadoA)
                .WithMany()
                .HasForeignKey(t => t.AsignadoAId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.CreadoPor)
                .WithMany()
                .HasForeignKey(t => t.CreadoPorId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configurar relaciones para ComentarioTicket
            modelBuilder.Entity<ComentarioTicket>()
                .HasOne(c => c.Ticket)
                .WithMany(t => t.Comentarios)
                .HasForeignKey(c => c.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ComentarioTicket>()
                .HasOne(c => c.CreadoPor)
                .WithMany()
                .HasForeignKey(c => c.CreadoPorId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configurar relaciones para ArchivoTicket
            modelBuilder.Entity<ArchivoTicket>()
                .HasOne(a => a.Ticket)
                .WithMany(t => t.Archivos)
                .HasForeignKey(a => a.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ArchivoTicket>()
                .HasOne(a => a.SubidoPor)
                .WithMany()
                .HasForeignKey(a => a.SubidoPorId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configurar índices para Tickets
            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.Estado);

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.Prioridad);

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.Categoria);

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.FechaCreacion);

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.AsignadoAId);

            // Configurar índices para ComentarioTicket
            modelBuilder.Entity<ComentarioTicket>()
                .HasIndex(c => new { c.TicketId, c.FechaCreacion });

            // Configurar índices para ArchivoTicket
            modelBuilder.Entity<ArchivoTicket>()
                .HasIndex(a => new { a.TicketId, a.FechaSubida });

            // Configurar relaciones para ChatConversacion
            modelBuilder.Entity<ChatConversacion>()
                .HasOne(c => c.Usuario)
                .WithMany()
                .HasForeignKey(c => c.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChatConversacion>()
                .HasOne(c => c.Soporte)
                .WithMany()
                .HasForeignKey(c => c.SoporteId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ChatConversacion>()
                .HasOne(c => c.Ticket)
                .WithMany()
                .HasForeignKey(c => c.TicketId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configurar relaciones para ChatMensaje
            modelBuilder.Entity<ChatMensaje>()
                .HasOne(m => m.Conversacion)
                .WithMany(c => c.Mensajes)
                .HasForeignKey(m => m.ConversacionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChatMensaje>()
                .HasOne(m => m.CreadoPor)
                .WithMany()
                .HasForeignKey(m => m.CreadoPorId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configurar índices para ChatConversacion
            modelBuilder.Entity<ChatConversacion>()
                .HasIndex(c => c.Estado);

            modelBuilder.Entity<ChatConversacion>()
                .HasIndex(c => c.FechaCreacion);

            modelBuilder.Entity<ChatConversacion>()
                .HasIndex(c => c.UsuarioId);

            modelBuilder.Entity<ChatConversacion>()
                .HasIndex(c => c.SoporteId);

            // Configurar índices para ChatMensaje
            modelBuilder.Entity<ChatMensaje>()
                .HasIndex(m => new { m.ConversacionId, m.FechaCreacion });

            modelBuilder.Entity<ChatMensaje>()
                .HasIndex(m => m.EsLeido);
        }
    }
}
