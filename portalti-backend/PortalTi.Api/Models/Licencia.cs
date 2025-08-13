using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalTi.Api.Models
{
    public class Licencia
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Software { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Tipo { get; set; } = "Perpetua"; // Perpetua, Anual, Mensual, Trial

        [StringLength(100)]
        public string? NumeroLicencia { get; set; }

        [StringLength(100)]
        public string? UsuarioAsignado { get; set; }

        [Column(TypeName = "date")]
        public DateTime? FechaInicio { get; set; }

        [Column(TypeName = "date")]
        public DateTime? FechaVencimiento { get; set; }

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
    public class CreateLicenciaDto
    {
        public string Software { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Perpetua";
        public string? NumeroLicencia { get; set; }
        public string? UsuarioAsignado { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaVencimiento { get; set; }
        public string? Notas { get; set; }
        public int ActivoId { get; set; }
    }

    public class UpdateLicenciaDto
    {
        public string Software { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Perpetua";
        public string? NumeroLicencia { get; set; }
        public string? UsuarioAsignado { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaVencimiento { get; set; }
        public string? Notas { get; set; }
    }

    public class LicenciaDto
    {
        public int Id { get; set; }
        public string Software { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Perpetua";
        public string? NumeroLicencia { get; set; }
        public string? UsuarioAsignado { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaVencimiento { get; set; }
        public string? Notas { get; set; }
        public int ActivoId { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
}
