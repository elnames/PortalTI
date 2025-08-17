using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;

namespace PortalTi.Api.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	[Authorize(Roles = "admin,soporte")]
	public class CalendarioController : ControllerBase
	{
		private readonly PortalTiContext _context;

		public CalendarioController(PortalTiContext context)
		{
			_context = context;
		}

		// GET: api/Calendario/events?start=2025-08-01&end=2025-08-31
		[HttpGet("events")]
		public async Task<ActionResult<IEnumerable<CalendarEvent>>> GetEvents([FromQuery] DateTime? start, [FromQuery] DateTime? end)
		{
			var query = _context.CalendarEvents.AsQueryable();
			if (start.HasValue) query = query.Where(e => e.End == null ? e.Start >= start : e.End >= start);
			if (end.HasValue) query = query.Where(e => e.Start <= end);
			var items = await query.OrderBy(e => e.Start).Take(500).ToListAsync();
			return Ok(items);
		}

		// POST: api/Calendario
		[HttpPost]
		public async Task<ActionResult<CalendarEvent>> Create([FromBody] CalendarEvent dto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);
			var userIdClaim = User.Claims.FirstOrDefault(c => c.Type.EndsWith("/nameidentifier") || c.Type.EndsWith("nameid"))?.Value;
			if (int.TryParse(userIdClaim, out var userId)) dto.CreatedById = userId;

			_context.CalendarEvents.Add(dto);
			await _context.SaveChangesAsync();
			return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
		}

		// GET: api/Calendario/{id}
		[HttpGet("{id}")]
		public async Task<ActionResult<CalendarEvent>> GetById([FromRoute] int id)
		{
			var ev = await _context.CalendarEvents.FindAsync(id);
			if (ev == null) return NotFound();
			return Ok(ev);
		}

		// PUT: api/Calendario/{id}
		[HttpPut("{id}")]
		public async Task<ActionResult> Update([FromRoute] int id, [FromBody] CalendarEvent dto)
		{
			if (id != dto.Id) return BadRequest("Id no coincide");
			var existing = await _context.CalendarEvents.FindAsync(id);
			if (existing == null) return NotFound();

			existing.Title = dto.Title;
			existing.Description = dto.Description;
			existing.Start = dto.Start;
			existing.End = dto.End;
			existing.AllDay = dto.AllDay;
			existing.Color = dto.Color;
			await _context.SaveChangesAsync();
			return NoContent();
		}

		// DELETE: api/Calendario/{id}
		[HttpDelete("{id}")]
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


