using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalTi.Api.Models
{
    public class ProgramaSeguridad
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Tipo { get; set; } = "Antivirus"; // Antivirus, Firewall, VPN, Antimalware, Otro

        [Required]
        [StringLength(20)]
        public string Estado { get; set; } = "OK"; // OK, NO, Pendiente



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
    public class CreateProgramaSeguridadDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Antivirus";
        public string Estado { get; set; } = "OK";
        public string? Notas { get; set; }
        public int ActivoId { get; set; }
    }

    public class UpdateProgramaSeguridadDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Antivirus";
        public string Estado { get; set; } = "OK";
        public string? Notas { get; set; }
    }

    public class ProgramaSeguridadDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Antivirus";
        public string Estado { get; set; } = "OK";
        public string? Notas { get; set; }
        public int ActivoId { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
}
