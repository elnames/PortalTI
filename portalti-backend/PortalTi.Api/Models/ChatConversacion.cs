using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class ChatConversacion
    {
        public int Id { get; set; }
        
        [Required]
        public string Titulo { get; set; }
        
        public string? Descripcion { get; set; }
        
        [Required]
        public string Estado { get; set; } = "Activa"; // Activa, Cerrada, Pendiente
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime? FechaCierre { get; set; }
        
        // Relaciones
        public int UsuarioId { get; set; }
        public AuthUser Usuario { get; set; }
        
        public int? SoporteId { get; set; }
        public AuthUser? Soporte { get; set; }
        
        // Mensajes del chat
        public ICollection<ChatMensaje> Mensajes { get; set; } = new List<ChatMensaje>();
        
        // Ticket relacionado (opcional)
        public int? TicketId { get; set; }
        public Ticket? Ticket { get; set; }
    }
}
