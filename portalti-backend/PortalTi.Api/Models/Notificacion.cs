using System;

namespace PortalTi.Api.Models
{
    public class Notificacion
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string Tipo { get; set; }
        public string Mensaje { get; set; }
        public string Datos { get; set; } // JSON string
        public bool Leida { get; set; }
        public DateTime Fecha { get; set; }
    }
}
