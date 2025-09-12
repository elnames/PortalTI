using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models
{
    /// <summary>
    /// Request para aprobar o rechazar un Paz y Salvo desde el frontend
    /// </summary>
    public class AprobarRechazarRequest
    {
        /// <summary>
        /// Rol del usuario que está aprobando/rechazando
        /// </summary>
        [Required]
        public string Rol { get; set; } = string.Empty;

        /// <summary>
        /// Comentario o motivo de la acción
        /// </summary>
        public string? Comentario { get; set; }

        /// <summary>
        /// Observaciones adicionales (opcional)
        /// </summary>
        public string? Observaciones { get; set; }
    }
}
