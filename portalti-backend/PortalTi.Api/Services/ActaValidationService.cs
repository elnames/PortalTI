using PortalTi.Api.Data;
using PortalTi.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace PortalTi.Api.Services
{
    public interface IActaValidationService
    {
        Task<ValidationResult> ValidateActaTransitionAsync(int actaId, string newState, int userId);
        Task<ValidationResult> ValidateActaCreationAsync(Acta acta);
        Task<ValidationResult> ValidateActaUpdateAsync(Acta acta);
        Task<bool> IsActaInValidStateForModificationAsync(int actaId);
    }

    public class ActaValidationService : IActaValidationService
    {
        private readonly PortalTiContext _context;
        private readonly ILogger<ActaValidationService> _logger;

        public ActaValidationService(PortalTiContext context, ILogger<ActaValidationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ValidationResult> ValidateActaTransitionAsync(int actaId, string newState, int userId)
        {
            var acta = await _context.Actas
                .Include(a => a.Asignacion)
                .FirstOrDefaultAsync(a => a.Id == actaId);

            if (acta == null)
                return ValidationResult.Failure("Acta no encontrada");

            // Validar transición de estado
            if (!ActaStateMachine.IsValidTransition(acta.Estado, newState))
            {
                var validTransitions = ActaStateMachine.GetValidTransitions(acta.Estado);
                return ValidationResult.Failure(
                    $"Transición de estado '{acta.Estado}' a '{newState}' no válida. " +
                    $"Estados permitidos: {string.Join(", ", validTransitions)}");
            }

            // Validar que el usuario tenga permisos para el cambio
            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return ValidationResult.Failure("Usuario no encontrado");

            // Solo admins pueden aprobar/rechazar actas
            if ((newState == "Aprobada" || newState == "Rechazada") && user.Role != "admin")
            {
                return ValidationResult.Failure("Solo los administradores pueden aprobar o rechazar actas");
            }

            // Validar reglas específicas por estado
            switch (newState)
            {
                case "Aprobada":
                    if (string.IsNullOrEmpty(acta.RutaArchivo))
                        return ValidationResult.Failure("No se puede aprobar una acta sin PDF");
                    break;

                case "Firmada":
                    if (acta.Asignacion?.UsuarioId != userId && user.Role != "admin")
                        return ValidationResult.Failure("Solo el usuario asignado o un admin puede firmar la acta");
                    break;
            }

            return ValidationResult.Success();
        }

        public async Task<ValidationResult> ValidateActaCreationAsync(Acta acta)
        {
            // Validar que la asignación existe y está activa
            if (acta.AsignacionId <= 0)
                return ValidationResult.Failure("Asignación requerida");

            var asignacion = await _context.AsignacionesActivos
                .FirstOrDefaultAsync(a => a.Id == acta.AsignacionId);

            if (asignacion == null)
                return ValidationResult.Failure("Asignación no encontrada");

            if (asignacion.Estado != "Activa")
                return ValidationResult.Failure("Solo se pueden crear actas para asignaciones activas");

            // Validar que no exista ya una acta para esta asignación
            var existingActa = await _context.Actas
                .FirstOrDefaultAsync(a => a.AsignacionId == acta.AsignacionId && a.Estado != "Anulada");

            if (existingActa != null)
                return ValidationResult.Failure("Ya existe una acta válida para esta asignación");

            return ValidationResult.Success();
        }

        public async Task<ValidationResult> ValidateActaUpdateAsync(Acta acta)
        {
            var existingActa = await _context.Actas.FindAsync(acta.Id);
            if (existingActa == null)
                return ValidationResult.Failure("Acta no encontrada");

            // No permitir cambios en actas anuladas
            if (existingActa.Estado == "Anulada")
                return ValidationResult.Failure("No se pueden modificar actas anuladas");

            // Validar que el estado no cambie sin usar el método de transición
            if (existingActa.Estado != acta.Estado)
                return ValidationResult.Failure("Los cambios de estado deben realizarse a través de los métodos apropiados");

            return ValidationResult.Success();
        }

        public async Task<bool> IsActaInValidStateForModificationAsync(int actaId)
        {
            var acta = await _context.Actas.FindAsync(actaId);
            if (acta == null) return false;

            return !ActaStateMachine.IsFinalState(acta.Estado);
        }
    }

    public class ValidationResult
    {
        public bool IsValid { get; private set; }
        public string? ErrorMessage { get; private set; }

        private ValidationResult(bool isValid, string? errorMessage = null)
        {
            IsValid = isValid;
            ErrorMessage = errorMessage;
        }

        public static ValidationResult Success() => new(true);
        public static ValidationResult Failure(string errorMessage) => new(false, errorMessage);
    }
}
