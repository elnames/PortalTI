using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalTi.Api.Models
{
    public class ChatArchivo
    {
        [Key]
        public int Id { get; set; }
        
        public int UsuarioId { get; set; }
        public int ConversacionId { get; set; }
        public DateTime FechaArchivo { get; set; } = DateTime.Now;
        
        // Relaciones
        [ForeignKey("UsuarioId")]
        public virtual AuthUser Usuario { get; set; }
        
        [ForeignKey("ConversacionId")]
        public virtual ChatConversacion Conversacion { get; set; }
    }
}

