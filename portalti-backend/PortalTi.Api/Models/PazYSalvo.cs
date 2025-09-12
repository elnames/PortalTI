using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace PortalTi.Api.Models
{
    public class PazYSalvo
    {
        public int Id { get; set; }
        
        [Required]
        public int UsuarioId { get; set; }
        
        [Required]
        public int SolicitadoPorId { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string UsuarioNombre { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string UsuarioRut { get; set; } = string.Empty;
        
        [Required]
        public DateTime FechaSalida { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string MotivoSalida { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Estado { get; set; } = "Borrador"; // Borrador, EnFirma, Aprobado, Rechazado, Cerrado
        
        [MaxLength(2000)]
        public string? Observaciones { get; set; }
        
        public string? HashFinal { get; set; }
        public string? PdfFinalPath { get; set; }
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime? FechaActualizacion { get; set; }
        public DateTime? FechaEnvioFirma { get; set; }
        public DateTime? FechaAprobacion { get; set; }
        public DateTime? FechaCierre { get; set; }
        
        // Control de concurrencia
        [Timestamp]
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();
        
        // **UNIFICACIÓN: Datos de firmas en JSON**
        [MaxLength(4000)]
        public string? FirmasJson { get; set; } // JSON con todas las firmas
        
        [MaxLength(4000)]
        public string? HistorialJson { get; set; } // JSON con historial de cambios
        
        [MaxLength(2000)]
        public string? AdjuntosJson { get; set; } // JSON con archivos adjuntos
        
        [MaxLength(1000)]
        public string? ExcepcionesJson { get; set; } // JSON con excepciones
        
        [MaxLength(2000)]
        public string? ActivosSnapshotJson { get; set; } // JSON con snapshot de activos
        
        // Relaciones básicas (solo las esenciales)
        public virtual NominaUsuario? Usuario { get; set; }
        public virtual AuthUser? SolicitadoPor { get; set; }
        
        // Propiedades calculadas
        public bool EsBorrador => Estado == "Borrador";
        public bool EsEnFirma => Estado == "EnFirma";
        public bool EsAprobado => Estado == "Aprobado";
        public bool EsRechazado => Estado == "Rechazado";
        public bool EsCerrado => Estado == "Cerrado";
        
        public bool PuedeSerEnviadoAFirma => EsBorrador;
        public bool PuedeSerCerrado => EsAprobado;
        public bool EsEstadoFinal => EsCerrado || EsRechazado;
        
        // Métodos para manejar datos JSON
        public List<FirmaData> GetFirmas()
        {
            if (string.IsNullOrEmpty(FirmasJson))
                return new List<FirmaData>();
            
            try
            {
                return JsonSerializer.Deserialize<List<FirmaData>>(FirmasJson) ?? new List<FirmaData>();
            }
            catch
            {
                return new List<FirmaData>();
            }
        }
        
        public void SetFirmas(List<FirmaData> firmas)
        {
            FirmasJson = JsonSerializer.Serialize(firmas);
        }
        
        public List<HistorialData> GetHistorial()
        {
            if (string.IsNullOrEmpty(HistorialJson))
                return new List<HistorialData>();
            
            try
            {
                return JsonSerializer.Deserialize<List<HistorialData>>(HistorialJson) ?? new List<HistorialData>();
            }
            catch
            {
                return new List<HistorialData>();
            }
        }
        
        public void SetHistorial(List<HistorialData> historial)
        {
            HistorialJson = JsonSerializer.Serialize(historial);
        }
        
        public List<AdjuntoData> GetAdjuntos()
        {
            if (string.IsNullOrEmpty(AdjuntosJson))
                return new List<AdjuntoData>();
            
            try
            {
                return JsonSerializer.Deserialize<List<AdjuntoData>>(AdjuntosJson) ?? new List<AdjuntoData>();
            }
            catch
            {
                return new List<AdjuntoData>();
            }
        }
        
        public void SetAdjuntos(List<AdjuntoData> adjuntos)
        {
            AdjuntosJson = JsonSerializer.Serialize(adjuntos);
        }
        
        public List<ExcepcionData> GetExcepciones()
        {
            if (string.IsNullOrEmpty(ExcepcionesJson))
                return new List<ExcepcionData>();
            
            try
            {
                return JsonSerializer.Deserialize<List<ExcepcionData>>(ExcepcionesJson) ?? new List<ExcepcionData>();
            }
            catch
            {
                return new List<ExcepcionData>();
            }
        }
        
        public void SetExcepciones(List<ExcepcionData> excepciones)
        {
            ExcepcionesJson = JsonSerializer.Serialize(excepciones);
        }
        
        public List<ActivoData> GetActivosSnapshot()
        {
            if (string.IsNullOrEmpty(ActivosSnapshotJson))
                return new List<ActivoData>();
            
            try
            {
                return JsonSerializer.Deserialize<List<ActivoData>>(ActivosSnapshotJson) ?? new List<ActivoData>();
            }
            catch
            {
                return new List<ActivoData>();
            }
        }
        
        public void SetActivosSnapshot(List<ActivoData> activos)
        {
            ActivosSnapshotJson = JsonSerializer.Serialize(activos);
        }
    }
    
    // Clases de datos simples para JSON
    public class FirmaData
    {
        public string Rol { get; set; } = string.Empty; // JefeInmediato, Contabilidad, Informatica, GerenciaFinanzas
        public int? FirmanteUserId { get; set; }
        public string? FirmanteNombre { get; set; }
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Firmado, Rechazado
        public DateTime? FechaFirma { get; set; }
        public string? Comentario { get; set; }
        public string? FirmaHash { get; set; }
        public int Orden { get; set; }
        public bool Obligatorio { get; set; } = true;
    }
    
    public class HistorialData
    {
        public int ActorUserId { get; set; }
        public string? ActorNombre { get; set; }
        public string Accion { get; set; } = string.Empty; // Created, SentToSign, Signed, Rejected, Approved, Closed
        public string? EstadoDesde { get; set; }
        public string? EstadoHasta { get; set; }
        public string? Nota { get; set; }
        public DateTime FechaAccion { get; set; } = DateTime.Now;
    }
    
    public class AdjuntoData
    {
        public int SubidoPorId { get; set; }
        public string? SubidoPorNombre { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Ruta { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public long Tamaño { get; set; }
        public DateTime FechaSubida { get; set; } = DateTime.Now;
    }
    
    public class ExcepcionData
    {
        public int AprobadaPorId { get; set; }
        public string? AprobadaPorNombre { get; set; }
        public string Motivo { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
    
    public class ActivoData
    {
        public int? ActivoId { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public string EstadoActivo { get; set; } = "Pendiente"; // Pendiente, Devuelto, Perdido
        public string? Observacion { get; set; }
        public DateTime FechaCorte { get; set; } = DateTime.Now;
    }
}
