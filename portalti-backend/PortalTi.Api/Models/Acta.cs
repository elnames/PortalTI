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
        public string Estado { get; set; } = "Pendiente"; 
        // Estados: Pendiente, Firmada, Aprobada, Rechazada
        
        [Required]
        public string MetodoFirma { get; set; } = "Pendiente";
        // Métodos: Pendiente, Digital, PDF_Subido, Admin_Subida
        
        public string? NombreArchivo { get; set; }
        public string? RutaArchivo { get; set; }
        public string? Observaciones { get; set; }
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime? FechaSubida { get; set; }
        public DateTime? FechaFirma { get; set; }
        public DateTime? FechaAprobacion { get; set; }
        
        public int? AprobadoPorId { get; set; }
        public AuthUser? AprobadoPor { get; set; }
        
        public string? ComentariosAprobacion { get; set; }
        
        // Propiedades calculadas para facilitar el trabajo
        public bool EsPendiente => Estado?.ToLower() == "pendiente";
        public bool EsFirmada => Estado?.ToLower() == "firmada";
        public bool EsAprobada => Estado?.ToLower() == "aprobada";
        public bool EsRechazada => Estado?.ToLower() == "rechazada";
        
        public bool EsFirmaDigital => MetodoFirma?.ToLower() == "digital";
        public bool EsPdfSubido => MetodoFirma?.ToLower() == "pdf_subido";
        public bool EsAdminSubida => MetodoFirma?.ToLower() == "admin_subida";
        public bool EsPendienteFirma => MetodoFirma?.ToLower() == "pendiente";
        
        // Propiedades para determinar qué acciones están disponibles
        public bool PuedeSerFirmada => EsPendiente || EsRechazada;
        public bool PuedeSerAprobada => EsFirmada;
        public bool PuedeSerRechazada => EsFirmada;
        public bool PuedeSerPrevisualizada => true; // Siempre se puede previsualizar
        public bool PuedeSerDescargada => !string.IsNullOrEmpty(RutaArchivo);
    }
} 