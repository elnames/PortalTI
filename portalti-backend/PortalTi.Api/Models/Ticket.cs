using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class Ticket
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Titulo { get; set; }
        
        [Required]
        public string Descripcion { get; set; }
        
        [Required]
        [StringLength(100)]
        public string NombreSolicitante { get; set; }
        
        [Required]
        [EmailAddress]
        public string EmailSolicitante { get; set; }
        
        [StringLength(20)]
        public string? TelefonoSolicitante { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Empresa { get; set; }
        
        [StringLength(100)]
        public string? Departamento { get; set; }
        
        [Required]
        public string Categoria { get; set; } // Hardware, Software, Red, Otros
        
        [Required]
        public string Prioridad { get; set; } // Baja, Media, Alta, Crítica
        
        [Required]
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Asignado, En Proceso, Resuelto, Cerrado
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime? FechaAsignacion { get; set; }
        public DateTime? FechaResolucion { get; set; }
        public DateTime? FechaCierre { get; set; }
        
        // Relaciones
        public int? AsignadoAId { get; set; }
        public AuthUser? AsignadoA { get; set; }
        
        public int? CreadoPorId { get; set; }
        public AuthUser? CreadoPor { get; set; }
        
        // Activo relacionado (opcional)
        public int? ActivoId { get; set; }
        public Activo? Activo { get; set; }
        
        // Comentarios del ticket
        public ICollection<ComentarioTicket> Comentarios { get; set; } = new List<ComentarioTicket>();
        
        // Archivos adjuntos
        public ICollection<ArchivoTicket> Archivos { get; set; } = new List<ArchivoTicket>();
    }
} 