using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalTi.Api.Models
{
	public class CalendarEvent
	{
		public int Id { get; set; }

		[Required]
		[MaxLength(150)]
		public string Title { get; set; } = string.Empty;

		[MaxLength(1000)]
		public string? Description { get; set; }

		public DateTime Start { get; set; }
		public DateTime? End { get; set; }
		public bool AllDay { get; set; }

		[MaxLength(20)]
		public string? Color { get; set; }

		// Auditoría mínima
		public int CreatedById { get; set; }
		public AuthUser? CreatedBy { get; set; }
		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	}
}


