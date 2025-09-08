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
            var configRoot = configuration["Storage:Root"] ?? "Storage";
            
            // Si es una ruta relativa, resolverla desde el directorio del proyecto
            if (!Path.IsPathRooted(configRoot))
            {
                _storageRoot = Path.Combine(Directory.GetCurrentDirectory(), configRoot);
            }
            else
            {
                _storageRoot = configRoot;
            }
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
                
                _logger.LogInformation("Intentando acceder a archivo: {FilePath}", filePath);
                
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Archivo no encontrado: {FilePath}", filePath);
                    return NotFound("Archivo no encontrado");
                }

                // Verificar permisos de lectura
                try
                {
                    using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
                    {
                        // El archivo se puede abrir, continuar
                    }
                }
                catch (UnauthorizedAccessException ex)
                {
                    _logger.LogError(ex, "Sin permisos para acceder al archivo: {FilePath}", filePath);
                    return StatusCode(403, "Sin permisos para acceder al archivo");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al verificar permisos del archivo: {FilePath}", filePath);
                    return StatusCode(500, "Error al acceder al archivo");
                }

                // Obtener información del archivo
                var fileInfo = new FileInfo(filePath);
                var contentType = GetContentType(fileName);

                _logger.LogInformation("Sirviendo archivo: {FilePath} (Tamaño: {Size} bytes)", filePath, fileInfo.Length);

                // Para previsualización, no incluir nombre de archivo para evitar descarga
                return PhysicalFile(filePath, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al previsualizar archivo: {Subdirectory}/{FileName}", subdirectory, fileName);
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpGet("check-permissions")]
        [Authorize(Policy = "CanManageTickets")]
        public async Task<IActionResult> CheckEvidencePermissions()
        {
            try
            {
                var evidencePath = Path.Combine(_storageRoot, "evidence");
                var result = new
                {
                    path = evidencePath,
                    exists = Directory.Exists(evidencePath),
                    canRead = false,
                    canWrite = false,
                    files = new string[0],
                    error = (string)null
                };

                if (!Directory.Exists(evidencePath))
                {
                    return Ok(result);
                }

                try
                {
                    // Verificar permisos de lectura
                    var files = Directory.GetFiles(evidencePath);
                    result = result with { files = files };

                    // Verificar permisos de escritura
                    var testFile = Path.Combine(evidencePath, "permission_test.tmp");
                    await System.IO.File.WriteAllTextAsync(testFile, "test");
                    result = result with { canWrite = true };

                    // Verificar permisos de lectura
                    await System.IO.File.ReadAllTextAsync(testFile);
                    result = result with { canRead = true };

                    // Limpiar archivo de prueba
                    System.IO.File.Delete(testFile);
                }
                catch (Exception ex)
                {
                    result = result with { error = ex.Message };
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar permisos de evidencias");
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPost("fix-permissions")]
        [Authorize(Policy = "CanManageTickets")]
        public async Task<IActionResult> FixEvidencePermissions()
        {
            try
            {
                var evidencePath = Path.Combine(_storageRoot, "evidence");
                
                // Crear la carpeta si no existe
                if (!Directory.Exists(evidencePath))
                {
                    Directory.CreateDirectory(evidencePath);
                    _logger.LogInformation("Carpeta de evidencias creada: {Path}", evidencePath);
                }

                // Verificar y corregir permisos
                var process = new System.Diagnostics.Process
                {
                    StartInfo = new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = "icacls",
                        Arguments = $"\"{evidencePath}\" /grant \"IIS_IUSRS:(OI)(CI)F\" /T",
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        CreateNoWindow = true
                    }
                };

                process.Start();
                await process.WaitForExitAsync();

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                _logger.LogInformation("Resultado de icacls: {Output}", output);
                if (!string.IsNullOrEmpty(error))
                {
                    _logger.LogWarning("Errores de icacls: {Error}", error);
                }

                // Verificar que los permisos funcionan
                var testFile = Path.Combine(evidencePath, "test_permissions.txt");
                try
                {
                    await System.IO.File.WriteAllTextAsync(testFile, "test");
                    await System.IO.File.ReadAllTextAsync(testFile);
                    System.IO.File.Delete(testFile);
                    
                    _logger.LogInformation("Permisos de evidencias verificados correctamente");
                    return Ok(new { message = "Permisos de evidencias corregidos exitosamente", path = evidencePath });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al verificar permisos de evidencias");
                    return StatusCode(500, new { message = "Error al verificar permisos", error = ex.Message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al corregir permisos de evidencias");
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
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

