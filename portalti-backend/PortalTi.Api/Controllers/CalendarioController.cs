using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using System.Linq;
using PortalTi.Api.Services;
using PortalTi.Api.Filters;

namespace PortalTi.Api.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	[Authorize(Policy = "CanViewReports")]
	public class CalendarioController : ControllerBase
	{
		private readonly PortalTiContext _context;
		private readonly INotificationsService _notifications;

		public CalendarioController(PortalTiContext context, INotificationsService notifications)
		{
			_context = context;
			_notifications = notifications;
		}

		// GET: api/Calendario/events?start=2025-08-01&end=2025-08-31
		[HttpGet("events")]
		public async Task<ActionResult<IEnumerable<object>>> GetEvents([FromQuery] DateTime? start, [FromQuery] DateTime? end)
		{
			var query = _context.CalendarEvents
				.Include(e => e.Assignees)
				.ThenInclude(a => a.User)
				.AsQueryable();
			if (start.HasValue) query = query.Where(e => e.End == null ? e.Start >= start : e.End >= start);
			if (end.HasValue) query = query.Where(e => e.Start <= end);
			var items = await query.OrderBy(e => e.Start).Take(500).ToListAsync();
			var shaped = items.Select(ev => new {
				id = ev.Id,
				title = ev.Title,
				start = ev.Start,
				end = ev.End,
				allDay = ev.AllDay,
				color = ev.Color,
				description = ev.Description,
				assignees = ev.Assignees.Select(a => new { id = a.UserId, name = a.User != null ? a.User.Username : string.Empty })
			});
			return Ok(shaped);
		}

		private async Task<int?> ResolveAuthUserIdByNominaId(int nominaUsuarioId)
		{
			var nomina = await _context.NominaUsuarios.FirstOrDefaultAsync(n => n.Id == nominaUsuarioId);
			if (nomina == null || string.IsNullOrWhiteSpace(nomina.Email)) return null;
			var auth = await _context.AuthUsers.FirstOrDefaultAsync(a => a.Username == nomina.Email);
			return auth?.Id;
		}

		// POST: api/Calendario
		public class CalendarEventRequest
		{
			public int? Id { get; set; }
			public string Title { get; set; } = string.Empty;
			public string? Description { get; set; }
			public DateTime Start { get; set; }
			public DateTime? End { get; set; }
			public bool AllDay { get; set; }
			public string? Color { get; set; }
			// Compatibilidad anterior (NominaUsuario.Id)
			public List<int> AssigneeIds { get; set; } = new();
			// Preferido: IDs de AuthUser con rol admin/soporte
			public List<int> AssigneeAuthIds { get; set; } = new();
		}

		[HttpPost]
		[AuditAction("crear_evento_calendario", "CalendarEvent", true, true)]
		public async Task<ActionResult<object>> Create([FromBody] CalendarEventRequest dto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);
			var userIdClaim = User.Claims.FirstOrDefault(c => c.Type.EndsWith("/nameidentifier") || c.Type.EndsWith("nameid"))?.Value;
			var ev = new CalendarEvent
			{
				Title = dto.Title,
				Description = dto.Description,
				Start = dto.Start,
				End = dto.End,
				AllDay = dto.AllDay,
				Color = dto.Color,
			};
			if (int.TryParse(userIdClaim, out var userId)) ev.CreatedById = userId;
			var authIds = new HashSet<int>();
			foreach (var aid in (dto.AssigneeAuthIds ?? new()).Where(id => id > 0)) authIds.Add(aid);
			foreach (var nominaId in (dto.AssigneeIds ?? new()).Where(id => id > 0))
			{
				var authId = await ResolveAuthUserIdByNominaId(nominaId);
				if (authId.HasValue) authIds.Add(authId.Value);
			}
			foreach (var finalId in authIds)
			{
				ev.Assignees.Add(new CalendarEventAssignee { UserId = finalId });
			}

			_context.CalendarEvents.Add(ev);
			await _context.SaveChangesAsync();

			// Notificar a los asignados
			foreach (var a in ev.Assignees)
			{
				await _notifications.CreateAsync(new CreateNotificationDto
				{
					UserId = a.UserId,
					Tipo = "calendario",
					Titulo = "Nuevo evento asignado",
					Mensaje = $"Te asignaron: {ev.Title}",
					RefTipo = "Calendario",
					RefId = ev.Id,
					Ruta = $"/calendario"
				});
			}
			return CreatedAtAction(nameof(GetById), new { id = ev.Id }, new { id = ev.Id });
		}

		// GET: api/Calendario/{id}
		[HttpGet("{id}")]
		public async Task<ActionResult<object>> GetById([FromRoute] int id)
		{
			var ev = await _context.CalendarEvents
				.Include(e => e.Assignees)
				.ThenInclude(a => a.User)
				.Include(e => e.CreatedBy)
				.FirstOrDefaultAsync(e => e.Id == id);
			if (ev == null) return NotFound();
			return Ok(new
			{
				id = ev.Id,
				title = ev.Title,
				description = ev.Description,
				start = ev.Start,
				end = ev.End,
				allDay = ev.AllDay,
				color = ev.Color,
				createdAt = ev.CreatedAt,
				createdBy = ev.CreatedBy != null ? new { id = ev.CreatedBy.Id, username = ev.CreatedBy.Username, role = ev.CreatedBy.Role } : null,
				assignees = ev.Assignees.Select(a => new { id = a.UserId, name = a.User != null ? a.User.Username : string.Empty })
			});
		}

		// PUT: api/Calendario/{id}
		[HttpPut("{id}")]
		[AuditAction("actualizar_evento_calendario", "CalendarEvent", true, true)]
		public async Task<ActionResult> Update([FromRoute] int id, [FromBody] CalendarEventRequest dto)
		{
			var existing = await _context.CalendarEvents
				.Include(e => e.Assignees)
				.FirstOrDefaultAsync(e => e.Id == id);
			if (existing == null) return NotFound();

			existing.Title = dto.Title;
			existing.Description = dto.Description;
			existing.Start = dto.Start;
			existing.End = dto.End;
			existing.AllDay = dto.AllDay;
			existing.Color = dto.Color;
			existing.Assignees.Clear();
			var authIdsUpd = new HashSet<int>();
			foreach (var aid in (dto.AssigneeAuthIds ?? new()).Where(id => id > 0)) authIdsUpd.Add(aid);
			foreach (var nominaId in (dto.AssigneeIds ?? new()).Where(id => id > 0))
			{
				var authId = await ResolveAuthUserIdByNominaId(nominaId);
				if (authId.HasValue) authIdsUpd.Add(authId.Value);
			}
			foreach (var finalId in authIdsUpd)
			{
				existing.Assignees.Add(new CalendarEventAssignee { EventId = existing.Id, UserId = finalId });
			}
			await _context.SaveChangesAsync();
			// Notificar a los asignados (actualizados)
			foreach (var a in existing.Assignees)
			{
				await _notifications.CreateAsync(new CreateNotificationDto
				{
					UserId = a.UserId,
					Tipo = "calendario",
					Titulo = "Evento actualizado",
					Mensaje = $"Se actualizó: {existing.Title}",
					RefTipo = "Calendario",
					RefId = existing.Id,
					Ruta = "/calendario"
				});
			}
			return NoContent();
		}

		// DELETE: api/Calendario/{id}
		[HttpDelete("{id}")]
		[AuditAction("eliminar_evento_calendario", "CalendarEvent", true, true)]
		public async Task<ActionResult> Delete([FromRoute] int id)
		{
			var existing = await _context.CalendarEvents.FindAsync(id);
			if (existing == null) return NotFound();
			_context.CalendarEvents.Remove(existing);
			await _context.SaveChangesAsync();
			return NoContent();
		}
	}
}


