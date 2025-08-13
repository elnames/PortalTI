using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalTi.Api.Models
{
    [Table("Notificaciones")]
    public class Notificacion
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(40)]
        public string Tipo { get; set; }

        [Required]
        [StringLength(150)]
        public string Titulo { get; set; }

        [Required]
        [StringLength(500)]
        public string Mensaje { get; set; }

        [StringLength(40)]
        public string? RefTipo { get; set; }

        public int? RefId { get; set; }

        [StringLength(200)]
        public string? Ruta { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Propiedades de navegación
        [ForeignKey("UserId")]
        public virtual AuthUser? Usuario { get; set; }
    }

    // DTOs para las operaciones
    public class CreateNotificationDto
    {
        public int UserId { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public string? RefTipo { get; set; }
        public int? RefId { get; set; }
        public string? Ruta { get; set; }
    }

    public class NotificationDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public string? RefTipo { get; set; }
        public int? RefId { get; set; }
        public string? Ruta { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class MarkReadDto
    {
        public int[] Ids { get; set; } = Array.Empty<int>();
    }
}
