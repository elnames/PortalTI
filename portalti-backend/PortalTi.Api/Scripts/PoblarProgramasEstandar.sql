-- Script para poblar la tabla ProgramasEstandar con programas estándar
-- Ejecutar después de crear la tabla

-- Programas de Seguridad Estándar
INSERT INTO ProgramasEstandar (Nombre, Categoria, Tipo, Descripcion, VersionRecomendada, Activo, FechaCreacion, CreadoPor)
VALUES 
('Cisco Secure Endpoint', 'Seguridad', 'Crítico', 'Antivirus empresarial de Cisco', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Cisco Umbrella', 'Seguridad', 'Crítico', 'Filtrado DNS y seguridad web', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Rapid7 Insight Agent', 'Seguridad', 'Obligatorio', 'Agente de monitoreo de vulnerabilidades', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Vicarius', 'Seguridad', 'Obligatorio', 'Plataforma de gestión de vulnerabilidades', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Windows Defender', 'Seguridad', 'Obligatorio', 'Antivirus integrado de Windows', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Firewall Windows', 'Seguridad', 'Obligatorio', 'Firewall integrado de Windows', 'Latest', 1, GETUTCDATE(), 'Sistema');

-- Software Estándar
INSERT INTO ProgramasEstandar (Nombre, Categoria, Tipo, Descripcion, VersionRecomendada, Activo, FechaCreacion, CreadoPor)
VALUES 
('Microsoft Office 365 Apps', 'Software', 'Obligatorio', 'Suite ofimática de Microsoft Office 365', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Google Chrome', 'Software', 'Obligatorio', 'Navegador web de Google', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Adobe Acrobat Reader', 'Software', 'Obligatorio', 'Lector de archivos PDF', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('SAP', 'Software', 'Obligatorio', 'Sistema de planificación de recursos empresariales', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('AnyDesk', 'Software', 'Obligatorio', 'Software de acceso remoto', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('RustDesk', 'Software', 'Obligatorio', 'Software de acceso remoto', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Creative Cloud Apps', 'Software', 'Obligatorio', 'Suite de aplicaciones creativas de Adobe', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Power BI', 'Software', 'Obligatorio', 'Herramienta de análisis de datos de Microsoft', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('FileZilla', 'Software', 'Obligatorio', 'Cliente FTP', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Forticlient VPN', 'Software', 'Obligatorio', 'Cliente VPN de Fortinet', 'Latest', 1, GETUTCDATE(), 'Sistema');

-- Licencias Estándar
INSERT INTO ProgramasEstandar (Nombre, Categoria, Tipo, Descripcion, VersionRecomendada, Activo, FechaCreacion, CreadoPor)
VALUES 
('Windows 10/11 Pro', 'Licencia', 'Crítico', 'Licencia de sistema operativo Windows', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Microsoft Office 365', 'Licencia', 'Obligatorio', 'Licencia de Office 365', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Adobe Creative Cloud', 'Licencia', 'Opcional', 'Suite de diseño de Adobe', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('AutoCAD', 'Licencia', 'Opcional', 'Software de diseño asistido por computadora', 'Latest', 1, GETUTCDATE(), 'Sistema');

PRINT 'Programas estándar insertados correctamente';