using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class ProgramaEstandar
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Categoria { get; set; } = "Software"; // Software, Seguridad, Licencia

        [StringLength(20)]
        public string Tipo { get; set; } = "Obligatorio"; // Obligatorio, Opcional, Crítico

        [StringLength(500)]
        public string? Descripcion { get; set; }

        [StringLength(100)]
        public string? VersionRecomendada { get; set; }

        public bool Activo { get; set; } = true;

        // Campos de auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime? FechaActualizacion { get; set; }
        public string? CreadoPor { get; set; }
        public string? ActualizadoPor { get; set; }
    }

    // DTOs
    public class CreateProgramaEstandarDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Categoria { get; set; } = "Software";
        public string Tipo { get; set; } = "Obligatorio";
        public string? Descripcion { get; set; }
        public string? VersionRecomendada { get; set; }
        public bool Activo { get; set; } = true;
    }

    public class UpdateProgramaEstandarDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Categoria { get; set; } = "Software";
        public string Tipo { get; set; } = "Obligatorio";
        public string? Descripcion { get; set; }
        public string? VersionRecomendada { get; set; }
        public bool Activo { get; set; } = true;
    }

    public class ProgramaEstandarDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Categoria { get; set; } = "Software";
        public string Tipo { get; set; } = "Obligatorio";
        public string? Descripcion { get; set; }
        public string? VersionRecomendada { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
}
