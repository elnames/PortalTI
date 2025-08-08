using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class ComentarioTicket
    {
        public int Id { get; set; }
        
        [Required]
        public string Contenido { get; set; }
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        
        public bool EsInterno { get; set; } = false; // Si es true, solo lo ven soporte y admin
        
        public string? Evidencia { get; set; } // URL de la imagen de evidencia
        
        public string? EstadoCreacion { get; set; } // Estado del ticket cuando se creó el comentario
        
        public bool EsMensajeChat { get; set; } = false; // Si es true, es un mensaje de chat (no aparece en timeline)
        
        // Relaciones
        public int TicketId { get; set; }
        public Ticket Ticket { get; set; }
        
        public int? CreadoPorId { get; set; }
        public AuthUser? CreadoPor { get; set; }
    }
} 