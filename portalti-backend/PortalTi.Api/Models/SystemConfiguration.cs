using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class SystemConfiguration
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Key { get; set; }
        
        [StringLength(500)]
        public string Value { get; set; }
        
        [StringLength(100)]
        public string Category { get; set; }
        
        [StringLength(500)]
        public string Description { get; set; }
        
        public DateTime LastModified { get; set; }
        
        public int? ModifiedByUserId { get; set; }
        
        // Navegación
        public virtual AuthUser? ModifiedByUser { get; set; }
    }
}

