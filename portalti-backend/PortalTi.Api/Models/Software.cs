using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalTi.Api.Models
{
    public class Software
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(50)]
        public string? Version { get; set; }

        [Required]
        [StringLength(20)]
        public string Estado { get; set; } = "OK"; // OK, Pendiente, NO

        [Column(TypeName = "date")]
        public DateTime? FechaInstalacion { get; set; }

        [StringLength(500)]
        public string? Notas { get; set; }

        // Relación con Activo
        public int ActivoId { get; set; }
        [ForeignKey("ActivoId")]
        public virtual Activo? Activo { get; set; }

        // Campos de auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime? FechaActualizacion { get; set; }
        public string? CreadoPor { get; set; }
        public string? ActualizadoPor { get; set; }
    }

    // DTOs
    public class CreateSoftwareDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Version { get; set; }
        public string Estado { get; set; } = "OK";
        public DateTime? FechaInstalacion { get; set; }
        public string? Notas { get; set; }
        public int ActivoId { get; set; }
    }

    public class UpdateSoftwareDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Version { get; set; }
        public string Estado { get; set; } = "OK";
        public DateTime? FechaInstalacion { get; set; }
        public string? Notas { get; set; }
    }

    public class SoftwareDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Version { get; set; }
        public string Estado { get; set; } = "OK";
        public DateTime? FechaInstalacion { get; set; }
        public string? Notas { get; set; }
        public int ActivoId { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
}
