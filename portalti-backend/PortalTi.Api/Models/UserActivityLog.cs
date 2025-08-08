using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class UserActivityLog
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        public AuthUser User { get; set; }
        
        [Required]
        public string Action { get; set; } // "login", "logout", "edit_user", "change_role", etc.
        
        [Required]
        public string Description { get; set; } // Descripción detallada de la acción
        
        public string? Details { get; set; } // JSON con detalles adicionales
        
        [Required]
        public DateTime Timestamp { get; set; } = DateTime.Now;
        
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
    }
} 