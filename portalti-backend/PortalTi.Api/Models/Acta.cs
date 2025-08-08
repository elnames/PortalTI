using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    public class Acta
    {
        public int Id { get; set; }
        
        [Required]
        public int AsignacionId { get; set; }
        public AsignacionActivo Asignacion { get; set; }
        
        [Required]
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Firmada, Aprobada, Rechazada
        
        [Required]
        public string MetodoFirma { get; set; } // Digital, PDF_Subido, Admin_Subida
        
        public string? NombreArchivo { get; set; }
        public string? RutaArchivo { get; set; }
        public string? Observaciones { get; set; }
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime? FechaSubida { get; set; } // Fecha cuando se subió el documento al portal
        public DateTime? FechaFirma { get; set; }
        public DateTime? FechaAprobacion { get; set; }
        
        public int? AprobadoPorId { get; set; }
        public AuthUser? AprobadoPor { get; set; }
        
        public string? ComentariosAprobacion { get; set; }
    }
} 