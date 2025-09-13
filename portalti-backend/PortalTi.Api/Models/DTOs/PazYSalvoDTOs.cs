using System.ComponentModel.DataAnnotations;

namespace PortalTi.Api.Models.DTOs
{
    // DTOs simplificados para requests
    public class CrearPazYSalvoRequest
    {
        [Required]
        public int UsuarioId { get; set; }
        
        [Required]
        public DateTime FechaSalida { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string MotivoSalida { get; set; } = string.Empty;
        
        [MaxLength(2000)]
        public string? Observaciones { get; set; }
        
        // Jefe directo seleccionado por RRHH
        public int? JefeDirectoId { get; set; }
        
        // Empresa del usuario (detectada automáticamente)
        public string? Empresa { get; set; }
        
        // Datos opcionales de firmas
        public List<FirmaData>? Firmas { get; set; }
        public List<ActivoData>? Activos { get; set; }
    }

    public class FirmarRequest
    {
        [Required]
        public int ActorUserId { get; set; }
        
        [MaxLength(500)]
        public string? Comentario { get; set; }
    }

    public class RechazarRequest
    {
        [Required]
        public int ActorUserId { get; set; }
        
        [Required]
        [MaxLength(500)]
        public string Motivo { get; set; } = string.Empty;
    }

    public class CrearExcepcionRequest
    {
        [Required]
        public int AprobadaPorId { get; set; }
        
        [Required]
        [MaxLength(1000)]
        public string Motivo { get; set; } = string.Empty;
    }

    // DTOs simplificados para responses
    public class PazYSalvoResponse
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string UsuarioNombre { get; set; } = string.Empty;
        public string UsuarioRut { get; set; } = string.Empty;
        public DateTime FechaSalida { get; set; }
        public string MotivoSalida { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string? Observaciones { get; set; }
        public string? HashFinal { get; set; }
        public string? PdfFinalPath { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public DateTime? FechaEnvioFirma { get; set; }
        public DateTime? FechaAprobacion { get; set; }
        public DateTime? FechaCierre { get; set; }
        
        // Datos deserializados de JSON
        public List<FirmaData> Firmas { get; set; } = new List<FirmaData>();
        public List<HistorialData> Historial { get; set; } = new List<HistorialData>();
        public List<AdjuntoData> Adjuntos { get; set; } = new List<AdjuntoData>();
        public List<ExcepcionData> Excepciones { get; set; } = new List<ExcepcionData>();
        public List<ActivoData> ActivosSnapshot { get; set; } = new List<ActivoData>();
    }

    public class PazYSalvoListResponse
    {
        public int Id { get; set; }
        public string UsuarioNombre { get; set; } = string.Empty;
        public string UsuarioRut { get; set; } = string.Empty;
        public DateTime FechaSalida { get; set; }
        public string MotivoSalida { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public int FirmasPendientes { get; set; }
        public int FirmasTotales { get; set; }
        public int FirmasRequeridas { get; set; }
    }

    public class PazYSalvoListPaginatedResponse
    {
        public List<PazYSalvoListResponse> Items { get; set; } = new List<PazYSalvoListResponse>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class VerificarHashResponse
    {
        public bool Valido { get; set; }
        public string? HashCalculado { get; set; }
        public string? HashAlmacenado { get; set; }
        public string? Mensaje { get; set; }
        public DateTime? FechaVerificacion { get; set; }
    }
}
