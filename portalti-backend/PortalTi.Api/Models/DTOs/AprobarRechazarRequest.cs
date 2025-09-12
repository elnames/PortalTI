namespace PortalTi.Api.Models.DTOs
{
    public class AprobarRechazarRequest
    {
        public string Rol { get; set; } = string.Empty;
        public string? Comentario { get; set; }
    }
}
