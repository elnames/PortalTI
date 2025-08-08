using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace PortalTi.Api.Data
{
    public static class DbInitializer
    {
        public static async Task Initialize(PortalTiContext context)
        {
            // Asegurar que la base de datos esté creada
            await context.Database.EnsureCreatedAsync();

            // Activar todos los usuarios existentes que no tengan IsActive configurado
            var inactiveUsers = await context.AuthUsers
                .Where(u => !u.IsActive)
                .ToListAsync();

            foreach (var user in inactiveUsers)
            {
                user.IsActive = true;
            }

            // También activar usuarios que puedan tener IsActive como false
            var usersWithoutIsActive = await context.AuthUsers
                .Where(u => u.IsActive == false)
                .ToListAsync();

            foreach (var user in usersWithoutIsActive)
            {
                user.IsActive = true;
            }

            if (inactiveUsers.Any() || usersWithoutIsActive.Any())
            {
                await context.SaveChangesAsync();
            }

            // Crear usuario admin por defecto si no existe
            if (!await context.AuthUsers.AnyAsync())
            {
                using var hmac = new HMACSHA512();
                var adminUser = new AuthUser
                {
                    Username = "admin",
                    Role = "admin",
                    PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes("admin123")),
                    PasswordSalt = hmac.Key,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                context.AuthUsers.Add(adminUser);
                await context.SaveChangesAsync();
            }
        }
    }
} 