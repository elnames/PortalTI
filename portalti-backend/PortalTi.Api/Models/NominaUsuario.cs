// Models/NominaUsuario.cs
namespace PortalTi.Api.Models
{
    public class NominaUsuario
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string Apellido { get; set; }
        public string Rut { get; set; }
        public string? Departamento { get; set; }
        public string? Empresa { get; set; } // Nueva propiedad para la empresa
        public string? Ubicacion { get; set; } // Nueva propiedad para la ubicación
        public string? Email { get; set; }
        
        // Propiedad de navegación para las asignaciones
        public ICollection<AsignacionActivo> Asignaciones { get; set; } = new List<AsignacionActivo>();
    }
}
