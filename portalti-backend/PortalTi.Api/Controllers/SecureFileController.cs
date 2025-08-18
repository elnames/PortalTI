using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PortalTi.Api.Services;
using PortalTi.Api.Filters;
using System.Security.Claims;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SecureFileController : ControllerBase
    {
        private readonly IFileSecurityService _fileService;
        private readonly ILogger<SecureFileController> _logger;
        private readonly string _storageRoot;

        public SecureFileController(IFileSecurityService fileService, ILogger<SecureFileController> logger, IConfiguration configuration)
        {
            _fileService = fileService;
            _logger = logger;
            _storageRoot = configuration["Storage:Root"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Storage");
        }

        [HttpGet("download/{subdirectory}/{fileName}")]
        [AuditAction("descargar_archivo", "Archivo", false, false)]
        public async Task<IActionResult> DownloadFile(string subdirectory, string fileName)
        {
            try
            {
                // Validar parámetros
                if (string.IsNullOrEmpty(subdirectory) || string.IsNullOrEmpty(fileName))
                    return BadRequest("Parámetros inválidos");

                // Construir ruta del archivo
                var filePath = Path.Combine(_storageRoot, subdirectory, fileName);
                
                if (!System.IO.File.Exists(filePath))
                    return NotFound("Archivo no encontrado");

                // Obtener información del archivo
                var fileInfo = new FileInfo(filePath);
                var contentType = GetContentType(fileName);

                // Log de descarga
                var userId = GetCurrentUserId();
                _logger.LogInformation("Usuario {UserId} descargando archivo: {FilePath}", userId, filePath);

                // Retornar archivo con streaming
                return PhysicalFile(filePath, contentType, fileName, enableRangeProcessing: true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al descargar archivo: {Subdirectory}/{FileName}", subdirectory, fileName);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("preview/{subdirectory}/{fileName}")]
        [AuditAction("previsualizar_archivo", "Archivo", false, false)]
        public async Task<IActionResult> PreviewFile(string subdirectory, string fileName)
        {
            try
            {
                // Validar parámetros
                if (string.IsNullOrEmpty(subdirectory) || string.IsNullOrEmpty(fileName))
                    return BadRequest("Parámetros inválidos");

                // Construir ruta del archivo
                var filePath = Path.Combine(_storageRoot, subdirectory, fileName);
                
                if (!System.IO.File.Exists(filePath))
                    return NotFound("Archivo no encontrado");

                // Obtener información del archivo
                var fileInfo = new FileInfo(filePath);
                var contentType = GetContentType(fileName);

                // Para previsualización, no incluir nombre de archivo para evitar descarga
                return PhysicalFile(filePath, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al previsualizar archivo: {Subdirectory}/{FileName}", subdirectory, fileName);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("verify/{subdirectory}/{fileName}")]
        [AuditAction("verificar_archivo", "Archivo", false, false)]
        public async Task<IActionResult> VerifyFileIntegrity(string subdirectory, string fileName)
        {
            try
            {
                // Validar parámetros
                if (string.IsNullOrEmpty(subdirectory) || string.IsNullOrEmpty(fileName))
                    return BadRequest("Parámetros inválidos");

                // Construir ruta del archivo
                var filePath = Path.Combine(_storageRoot, subdirectory, fileName);
                var hashFilePath = filePath + ".hash";
                
                if (!System.IO.File.Exists(filePath))
                    return NotFound("Archivo no encontrado");

                if (!System.IO.File.Exists(hashFilePath))
                    return NotFound("Archivo de hash no encontrado");

                // Leer hash almacenado
                var storedHash = await System.IO.File.ReadAllTextAsync(hashFilePath);

                // Calcular hash actual
                using var fileStream = System.IO.File.OpenRead(filePath);
                var currentHash = _fileService.CalculateFileHash(fileStream);

                // Comparar hashes
                var isIntegrityValid = storedHash.Equals(currentHash, StringComparison.OrdinalIgnoreCase);

                return Ok(new
                {
                    FileName = fileName,
                    StoredHash = storedHash,
                    CurrentHash = currentHash,
                    IntegrityValid = isIntegrityValid,
                    FileSize = fileStream.Length,
                    LastModified = System.IO.File.GetLastWriteTime(filePath)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar integridad del archivo: {Subdirectory}/{FileName}", subdirectory, fileName);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpDelete("{subdirectory}/{fileName}")]
        [Authorize(Policy = "CanManageAssets")]
        [AuditAction("eliminar_archivo", "Archivo", true, true)]
        public async Task<IActionResult> DeleteFile(string subdirectory, string fileName)
        {
            try
            {
                // Validar parámetros
                if (string.IsNullOrEmpty(subdirectory) || string.IsNullOrEmpty(fileName))
                    return BadRequest("Parámetros inválidos");

                // Construir ruta del archivo
                var filePath = $"{subdirectory}/{fileName}";
                
                // Eliminar archivo
                var deleted = await _fileService.DeleteFileAsync(filePath);
                
                if (!deleted)
                    return NotFound("Archivo no encontrado");

                _logger.LogInformation("Archivo eliminado: {FilePath}", filePath);
                return Ok(new { message = "Archivo eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar archivo: {Subdirectory}/{FileName}", subdirectory, fileName);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".txt" => "text/plain",
                _ => "application/octet-stream"
            };
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }
    }
}

