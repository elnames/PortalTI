using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class PazYSalvo
    {
        public int Id { get; set; }
        
        [Required]
        public int UsuarioId { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string UsuarioNombre { get; set; } = string.Empty;
        
        [Required]
        public DateTime FechaSubida { get; set; }
        
        [Required]
        [MaxLength(500)]
        public string ArchivoPath { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Completado, Rechazado
        
        public int ActivosPendientes { get; set; }
        
        [MaxLength(1000)]
        public string Notas { get; set; } = string.Empty;
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        
        public DateTime? FechaActualizacion { get; set; }
        
        // Relación con el usuario
        public virtual NominaUsuario? Usuario { get; set; }
    }
}
