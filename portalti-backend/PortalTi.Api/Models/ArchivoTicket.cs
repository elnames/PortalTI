using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class ArchivoTicket
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(255)]
        public string NombreOriginal { get; set; }
        
        [Required]
        [StringLength(255)]
        public string NombreArchivo { get; set; }
        
        [Required]
        public string RutaArchivo { get; set; }
        
        public long TamañoBytes { get; set; }
        
        [StringLength(100)]
        public string TipoMime { get; set; }
        
        public DateTime FechaSubida { get; set; } = DateTime.Now;
        
        // Relaciones
        public int TicketId { get; set; }
        public Ticket Ticket { get; set; }
        
        public int? SubidoPorId { get; set; }
        public AuthUser? SubidoPor { get; set; }
    }
} 