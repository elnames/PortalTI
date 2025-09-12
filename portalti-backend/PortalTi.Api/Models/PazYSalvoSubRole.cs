using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class PazYSalvoSubRole
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Descripcion { get; set; } = string.Empty;

        public int Orden { get; set; }

        public bool Obligatorio { get; set; }

        public bool PermiteDelegacion { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}
