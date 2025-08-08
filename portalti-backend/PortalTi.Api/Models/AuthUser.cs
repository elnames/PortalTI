// Models/AuthUser.cs
namespace PortalTi.Api.Models
{
    public class AuthUser
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public byte[] PasswordHash { get; set; }
        public byte[] PasswordSalt { get; set; }
        public string Role { get; set; }
        public bool IsActive { get; set; } = true;
        public string? PreferenciasJson { get; set; }
        public string? SignaturePath { get; set; } // Ruta a la imagen de la firma digital
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? LastLoginAt { get; set; }
        
        // Propiedad de navegación para el log de actividades
        public ICollection<UserActivityLog> ActivityLogs { get; set; } = new List<UserActivityLog>();
    }
}
