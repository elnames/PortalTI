using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class PazYSalvoDelegation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioPrincipalId { get; set; }

        [Required]
        public int UsuarioDelegadoId { get; set; }

        [Required]
        [MaxLength(50)]
        public string SubRole { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Motivo { get; set; } = string.Empty;

        public DateTime FechaInicio { get; set; }

        public DateTime FechaFin { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }

        // Navegación
        public virtual NominaUsuario UsuarioPrincipal { get; set; } = null!;
        public virtual NominaUsuario UsuarioDelegado { get; set; } = null!;
    }
}
