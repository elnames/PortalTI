using System.Collections.Generic;

namespace PortalTi.Api.Models
{
    public static class ActaStateMachine
    {
        public static readonly Dictionary<string, HashSet<string>> ValidTransitions = new()
        {
            ["Pendiente"] = new HashSet<string> { "Firmada", "Rechazada", "Anulada" },
            ["Firmada"] = new HashSet<string> { "Aprobada", "Rechazada", "Anulada" },
            ["Aprobada"] = new HashSet<string> { "Anulada" },
            ["Rechazada"] = new HashSet<string> { "Pendiente", "Anulada" },
            ["Anulada"] = new HashSet<string> { } // Estado final
        };

        public static readonly HashSet<string> ValidStates = new()
        {
            "Pendiente", "Firmada", "Aprobada", "Rechazada", "Anulada"
        };

        public static bool IsValidTransition(string currentState, string newState)
        {
            if (!ValidStates.Contains(currentState) || !ValidStates.Contains(newState))
                return false;

            return ValidTransitions[currentState].Contains(newState);
        }

        public static bool IsFinalState(string state)
        {
            return state == "Anulada";
        }

        public static bool CanTransition(string currentState, string newState)
        {
            return IsValidTransition(currentState, newState);
        }

        public static string[] GetValidTransitions(string currentState)
        {
            return ValidStates.Contains(currentState) 
                ? ValidTransitions[currentState].ToArray() 
                : Array.Empty<string>();
        }
    }
}

