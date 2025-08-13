// Models/Activo.cs
namespace PortalTi.Api.Models
{
    public class Activo
    {
        public int Id { get; set; }
        public string Categoria { get; set; }
        public string Codigo { get; set; }
        public string Estado { get; set; }
        public string Ubicacion { get; set; }
        public string? NombreEquipo { get; set; }
        public string? TipoEquipo { get; set; }
        public string? Procesador { get; set; }
        public string? SistemaOperativo { get; set; }
        public string? Serie { get; set; }
        public string? Ram { get; set; }
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? DiscosJson { get; set; }
        public string? Pulgadas { get; set; }
        public string? Imei { get; set; }
        public string? Capacidad { get; set; }
        public string? NumeroCelular { get; set; }
        public string? Nombre { get; set; }
        public int? Cantidad { get; set; }
        public string? Empresa { get; set; }
        public DateTime? FechaBaja { get; set; }
        public string? MotivoBaja { get; set; }
        public string? RustDeskId { get; set; }
        
        // Propiedad de navegación para las asignaciones
        public ICollection<AsignacionActivo> Asignaciones { get; set; } = new List<AsignacionActivo>();
        
        // Propiedades de navegación para software y seguridad
        public ICollection<Software> Software { get; set; } = new List<Software>();
        public ICollection<ProgramaSeguridad> ProgramasSeguridad { get; set; } = new List<ProgramaSeguridad>();
        public ICollection<Licencia> Licencias { get; set; } = new List<Licencia>();
    }
}
