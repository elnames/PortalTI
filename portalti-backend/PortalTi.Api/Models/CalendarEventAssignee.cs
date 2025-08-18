namespace PortalTi.Api.Models
{
	public class CalendarEventAssignee
	{
		public int EventId { get; set; }
		public CalendarEvent? Event { get; set; }

		public int UserId { get; set; }
		public AuthUser? User { get; set; }
	}
}


