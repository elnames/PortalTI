using System.Security.Cryptography;
using System.Text;

namespace PortalTi.Api.Services
{
    public interface IFileSecurityService
    {
        Task<FileValidationResult> ValidateFileAsync(IFormFile file, FileValidationOptions options);
        Task<string> SaveFileSecurelyAsync(IFormFile file, string subdirectory, string? customFileName = null);
        Task<bool> DeleteFileAsync(string filePath);
        string CalculateFileHash(Stream fileStream);
        bool IsValidPdfFile(Stream fileStream);
        string GetSecureFilePath(string fileName, string subdirectory);
    }

    public class FileSecurityService : IFileSecurityService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileSecurityService> _logger;
        private readonly string _storageRoot;

        public FileSecurityService(IWebHostEnvironment environment, ILogger<FileSecurityService> logger, IConfiguration configuration)
        {
            _environment = environment;
            _logger = logger;
            _storageRoot = configuration["Storage:Root"] ?? Path.Combine(_environment.ContentRootPath, "Storage");
        }

        public async Task<FileValidationResult> ValidateFileAsync(IFormFile file, FileValidationOptions options)
        {
            if (file == null || file.Length == 0)
                return FileValidationResult.Failure("Archivo requerido");

            // Validar tamaño
            if (file.Length > options.MaxFileSizeBytes)
                return FileValidationResult.Failure($"El archivo excede el tamaño máximo permitido ({options.MaxFileSizeBytes / (1024 * 1024)}MB)");

            // Validar extensión
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!options.AllowedExtensions.Contains(extension))
                return FileValidationResult.Failure($"Extensión no permitida. Extensiones válidas: {string.Join(", ", options.AllowedExtensions)}");

            // Validar MIME type
            if (!string.IsNullOrEmpty(options.RequiredMimeType) && file.ContentType != options.RequiredMimeType)
                return FileValidationResult.Failure($"Tipo MIME no válido. Se requiere: {options.RequiredMimeType}");

            // Validar contenido real del archivo (magic numbers)
            using var stream = file.OpenReadStream();
            if (options.RequiredMimeType == "application/pdf" && !IsValidPdfFile(stream))
                return FileValidationResult.Failure("El archivo no es un PDF válido");

            // Validar nombre del archivo
            if (!IsValidFileName(file.FileName))
                return FileValidationResult.Failure("Nombre de archivo no válido");

            return FileValidationResult.Success();
        }

        public async Task<string> SaveFileSecurelyAsync(IFormFile file, string subdirectory, string? customFileName = null)
        {
            try
            {
                // Crear directorio seguro
                var directory = Path.Combine(_storageRoot, subdirectory);
                Directory.CreateDirectory(directory);

                // Generar nombre de archivo seguro
                var fileName = customFileName ?? GenerateSecureFileName(file.FileName);
                var filePath = Path.Combine(directory, fileName);

                // Verificar que no exista un archivo con el mismo nombre
                var counter = 1;
                while (File.Exists(filePath))
                {
                    var nameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
                    var ext = Path.GetExtension(fileName);
                    fileName = $"{nameWithoutExt}_{counter}{ext}";
                    filePath = Path.Combine(directory, fileName);
                    counter++;
                }

                // Guardar archivo
                using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                // Calcular hash del archivo
                stream.Position = 0;
                var hash = CalculateFileHash(stream);

                // Guardar hash en un archivo separado para verificación
                var hashFilePath = filePath + ".hash";
                await File.WriteAllTextAsync(hashFilePath, hash);

                _logger.LogInformation("Archivo guardado exitosamente: {FilePath} con hash: {Hash}", filePath, hash);

                return GetSecureFilePath(fileName, subdirectory);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar archivo: {FileName}", file.FileName);
                throw new InvalidOperationException("Error al guardar el archivo", ex);
            }
        }

        public async Task<bool> DeleteFileAsync(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(_storageRoot, filePath.TrimStart('/'));
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    
                    // Eliminar archivo de hash si existe
                    var hashFilePath = fullPath + ".hash";
                    if (File.Exists(hashFilePath))
                        File.Delete(hashFilePath);

                    _logger.LogInformation("Archivo eliminado: {FilePath}", fullPath);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar archivo: {FilePath}", filePath);
                return false;
            }
        }

        public string CalculateFileHash(Stream fileStream)
        {
            using var sha256 = SHA256.Create();
            var hash = sha256.ComputeHash(fileStream);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        public bool IsValidPdfFile(Stream fileStream)
        {
            try
            {
                var buffer = new byte[4];
                fileStream.Position = 0;
                fileStream.Read(buffer, 0, 4);
                fileStream.Position = 0;

                // Verificar magic number de PDF: %PDF
                return buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46;
            }
            catch
            {
                return false;
            }
        }

        public string GetSecureFilePath(string fileName, string subdirectory)
        {
            return $"/storage/{subdirectory}/{fileName}";
        }

        private string GenerateSecureFileName(string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName);
            var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
            var random = Guid.NewGuid().ToString("N")[..8];
            return $"{timestamp}_{random}{extension}";
        }

        private bool IsValidFileName(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName)) return false;
            
            var invalidChars = Path.GetInvalidFileNameChars();
            return !fileName.Any(c => invalidChars.Contains(c)) && 
                   !fileName.Contains("..") && 
                   fileName.Length <= 255;
        }
    }

    public class FileValidationOptions
    {
        public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024; // 10MB por defecto
        public string[] AllowedExtensions { get; set; } = { ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png" };
        public string? RequiredMimeType { get; set; } // null = cualquier MIME válido
        public bool ValidateContent { get; set; } = true;
    }

    public class FileValidationResult
    {
        public bool IsValid { get; private set; }
        public string? ErrorMessage { get; private set; }

        private FileValidationResult(bool isValid, string? errorMessage = null)
        {
            IsValid = isValid;
            ErrorMessage = errorMessage;
        }

        public static FileValidationResult Success() => new(true);
        public static FileValidationResult Failure(string errorMessage) => new(false, errorMessage);
    }
}

