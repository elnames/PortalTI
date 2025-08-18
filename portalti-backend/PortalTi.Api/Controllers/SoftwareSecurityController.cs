using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using PortalTi.Api.Filters;
using System.Security.Claims;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "CanManageSoftwareSecurity")]
    public class SoftwareSecurityController : ControllerBase
    {
        private readonly PortalTiContext _context;

        public SoftwareSecurityController(PortalTiContext context)
        {
            _context = context;
        }

        // GET: api/SoftwareSecurity/activo/{activoId}
        [HttpGet("activo/{activoId}")]
        public async Task<ActionResult<object>> GetSoftwareSecurityByActivo(int activoId)
        {
            try
            {
                var software = await _context.Software
                    .Where(s => s.ActivoId == activoId)
                    .OrderByDescending(s => s.FechaCreacion)
                    .ToListAsync();

                var programasSeguridad = await _context.ProgramasSeguridad
                    .Where(ps => ps.ActivoId == activoId)
                    .OrderByDescending(ps => ps.FechaCreacion)
                    .ToListAsync();

                var licencias = await _context.Licencias
                    .Where(l => l.ActivoId == activoId)
                    .OrderByDescending(l => l.FechaCreacion)
                    .ToListAsync();

                return Ok(new
                {
                    software,
                    programasSeguridad,
                    licencias
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // POST: api/SoftwareSecurity/software
        [HttpPost("software")]
        [AuditAction("crear_software", "Software", true, true)]
        public async Task<ActionResult<SoftwareDto>> CreateSoftware([FromBody] CreateSoftwareDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                var software = new Software
                {
                    Nombre = dto.Nombre,
                    Version = dto.Version,
                    Estado = dto.Estado,
                    FechaInstalacion = dto.FechaInstalacion,
                    Notas = dto.Notas,
                    ActivoId = dto.ActivoId,
                    CreadoPor = userId
                };

                _context.Software.Add(software);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetSoftware), new { id = software.Id }, software);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear software", error = ex.Message });
            }
        }

        // GET: api/SoftwareSecurity/software/{id}
        [HttpGet("software/{id}")]
        public async Task<ActionResult<SoftwareDto>> GetSoftware(int id)
        {
            var software = await _context.Software.FindAsync(id);
            if (software == null)
            {
                return NotFound();
            }

            return Ok(software);
        }

        // PUT: api/SoftwareSecurity/software/{id}
        [HttpPut("software/{id}")]
        public async Task<IActionResult> UpdateSoftware(int id, [FromBody] UpdateSoftwareDto dto)
        {
            try
            {
                var software = await _context.Software.FindAsync(id);
                if (software == null)
                {
                    return NotFound();
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                software.Nombre = dto.Nombre;
                software.Version = dto.Version;
                software.Estado = dto.Estado;
                software.FechaInstalacion = dto.FechaInstalacion;
                software.Notas = dto.Notas;
                software.FechaActualizacion = DateTime.UtcNow;
                software.ActualizadoPor = userId;

                await _context.SaveChangesAsync();

                return Ok(software);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar software", error = ex.Message });
            }
        }

        // DELETE: api/SoftwareSecurity/software/{id}
        [HttpDelete("software/{id}")]
        public async Task<IActionResult> DeleteSoftware(int id)
        {
            try
            {
                var software = await _context.Software.FindAsync(id);
                if (software == null)
                {
                    return NotFound();
                }

                _context.Software.Remove(software);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Software eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar software", error = ex.Message });
            }
        }

        // POST: api/SoftwareSecurity/seguridad
        [HttpPost("seguridad")]
        [AuditAction("crear_programa_seguridad", "ProgramaSeguridad", true, true)]
        public async Task<ActionResult<ProgramaSeguridadDto>> CreateProgramaSeguridad([FromBody] CreateProgramaSeguridadDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                var programaSeguridad = new ProgramaSeguridad
                {
                    Nombre = dto.Nombre,
                    Tipo = dto.Tipo,
                    Estado = dto.Estado,
                    Notas = dto.Notas,
                    ActivoId = dto.ActivoId,
                    CreadoPor = userId
                };

                _context.ProgramasSeguridad.Add(programaSeguridad);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetProgramaSeguridad), new { id = programaSeguridad.Id }, programaSeguridad);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear programa de seguridad", error = ex.Message });
            }
        }

        // GET: api/SoftwareSecurity/seguridad/{id}
        [HttpGet("seguridad/{id}")]
        public async Task<ActionResult<ProgramaSeguridadDto>> GetProgramaSeguridad(int id)
        {
            var programaSeguridad = await _context.ProgramasSeguridad.FindAsync(id);
            if (programaSeguridad == null)
            {
                return NotFound();
            }

            return Ok(programaSeguridad);
        }

        // PUT: api/SoftwareSecurity/seguridad/{id}
        [HttpPut("seguridad/{id}")]
        public async Task<IActionResult> UpdateProgramaSeguridad(int id, [FromBody] UpdateProgramaSeguridadDto dto)
        {
            try
            {
                var programaSeguridad = await _context.ProgramasSeguridad.FindAsync(id);
                if (programaSeguridad == null)
                {
                    return NotFound();
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                programaSeguridad.Nombre = dto.Nombre;
                programaSeguridad.Tipo = dto.Tipo;
                programaSeguridad.Estado = dto.Estado;
                programaSeguridad.Notas = dto.Notas;
                programaSeguridad.FechaActualizacion = DateTime.UtcNow;
                programaSeguridad.ActualizadoPor = userId;

                await _context.SaveChangesAsync();

                return Ok(programaSeguridad);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar programa de seguridad", error = ex.Message });
            }
        }

        // DELETE: api/SoftwareSecurity/seguridad/{id}
        [HttpDelete("seguridad/{id}")]
        public async Task<IActionResult> DeleteProgramaSeguridad(int id)
        {
            try
            {
                var programaSeguridad = await _context.ProgramasSeguridad.FindAsync(id);
                if (programaSeguridad == null)
                {
                    return NotFound();
                }

                _context.ProgramasSeguridad.Remove(programaSeguridad);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Programa de seguridad eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar programa de seguridad", error = ex.Message });
            }
        }

        // POST: api/SoftwareSecurity/licencia
        [HttpPost("licencia")]
        [AuditAction("crear_licencia", "Licencia", true, true)]
        public async Task<ActionResult<LicenciaDto>> CreateLicencia([FromBody] CreateLicenciaDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                var licencia = new Licencia
                {
                    Software = dto.Software,
                    Tipo = dto.Tipo,
                    NumeroLicencia = dto.NumeroLicencia,
                    UsuarioAsignado = dto.UsuarioAsignado,
                    FechaInicio = dto.FechaInicio,
                    FechaVencimiento = dto.FechaVencimiento,
                    Notas = dto.Notas,
                    ActivoId = dto.ActivoId,
                    CreadoPor = userId
                };

                _context.Licencias.Add(licencia);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetLicencia), new { id = licencia.Id }, licencia);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear licencia", error = ex.Message });
            }
        }

        // GET: api/SoftwareSecurity/licencia/{id}
        [HttpGet("licencia/{id}")]
        public async Task<ActionResult<LicenciaDto>> GetLicencia(int id)
        {
            var licencia = await _context.Licencias.FindAsync(id);
            if (licencia == null)
            {
                return NotFound();
            }

            return Ok(licencia);
        }

        // PUT: api/SoftwareSecurity/licencia/{id}
        [HttpPut("licencia/{id}")]
        public async Task<IActionResult> UpdateLicencia(int id, [FromBody] UpdateLicenciaDto dto)
        {
            try
            {
                var licencia = await _context.Licencias.FindAsync(id);
                if (licencia == null)
                {
                    return NotFound();
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                licencia.Software = dto.Software;
                licencia.Tipo = dto.Tipo;
                licencia.NumeroLicencia = dto.NumeroLicencia;
                licencia.UsuarioAsignado = dto.UsuarioAsignado;
                licencia.FechaInicio = dto.FechaInicio;
                licencia.FechaVencimiento = dto.FechaVencimiento;
                licencia.Notas = dto.Notas;
                licencia.FechaActualizacion = DateTime.UtcNow;
                licencia.ActualizadoPor = userId;

                await _context.SaveChangesAsync();

                return Ok(licencia);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar licencia", error = ex.Message });
            }
        }

        // DELETE: api/SoftwareSecurity/licencia/{id}
        [HttpDelete("licencia/{id}")]
        public async Task<IActionResult> DeleteLicencia(int id)
        {
            try
            {
                var licencia = await _context.Licencias.FindAsync(id);
                if (licencia == null)
                {
                    return NotFound();
                }

                _context.Licencias.Remove(licencia);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Licencia eliminada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar licencia", error = ex.Message });
            }
        }
    }
}
