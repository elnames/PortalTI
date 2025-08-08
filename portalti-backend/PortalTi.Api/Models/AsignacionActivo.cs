using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class AsignacionActivo
    {
        public int Id { get; set; }
        
        [Required]
        public int ActivoId { get; set; }
        public Activo Activo { get; set; }
        
        [Required]
        public int UsuarioId { get; set; }
        public NominaUsuario Usuario { get; set; }
        
        [Required]
        public DateTime FechaAsignacion { get; set; } = DateTime.Now;
        
        public DateTime? FechaDevolucion { get; set; }
        
        [StringLength(500)]
        public string? Observaciones { get; set; }
        
        [Required]
        public string Estado { get; set; } = "Activa"; // Activa, Devuelta, Perdida, etc.
        
        public string? AsignadoPor { get; set; }
    }
} 