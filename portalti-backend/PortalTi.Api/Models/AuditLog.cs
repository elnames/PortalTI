using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Action { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string ResourceType { get; set; }
        
        public int? ResourceId { get; set; }
        
        [MaxLength(45)]
        public string? IpAddress { get; set; }
        
        [MaxLength(500)]
        public string? UserAgent { get; set; }
        
        [Required]
        public DateTime Timestamp { get; set; } = DateTime.Now;
        
        [MaxLength(4000)]
        public string? DataJson { get; set; }
        
        // Propiedades de navegación
        public AuthUser User { get; set; }
    }
}

