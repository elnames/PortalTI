using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class ChatMensaje
    {
        public int Id { get; set; }
        
        [Required]
        public string Contenido { get; set; }
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        
        public bool EsInterno { get; set; } = false; // Si es true, solo lo ven soporte y admin
        
        public bool EsLeido { get; set; } = false;
        
        public DateTime? FechaLectura { get; set; }
        
        // Relaciones
        public int ConversacionId { get; set; }
        public ChatConversacion Conversacion { get; set; }
        
        public int? CreadoPorId { get; set; }
        public AuthUser? CreadoPor { get; set; }
    }
}
