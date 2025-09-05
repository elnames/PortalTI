-- Script para poblar la tabla ProgramasEstandar con programas estándar
-- Ejecutar después de crear la tabla

-- Programas de Seguridad Estándar
INSERT INTO ProgramasEstandar (Nombre, Categoria, Tipo, Descripcion, VersionRecomendada, Activo, FechaCreacion, CreadoPor)
VALUES 
('Cisco Secure Endpoint', 'Seguridad', 'Crítico', 'Antivirus empresarial de Cisco', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Cisco Umbrella', 'Seguridad', 'Crítico', 'Filtrado DNS y seguridad web', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Rapid7 Insight Agent', 'Seguridad', 'Obligatorio', 'Agente de monitoreo de vulnerabilidades', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Windows Defender', 'Seguridad', 'Obligatorio', 'Antivirus integrado de Windows', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Firewall Windows', 'Seguridad', 'Obligatorio', 'Firewall integrado de Windows', 'Latest', 1, GETUTCDATE(), 'Sistema');

-- Software Estándar
INSERT INTO ProgramasEstandar (Nombre, Categoria, Tipo, Descripcion, VersionRecomendada, Activo, FechaCreacion, CreadoPor)
VALUES 
('Microsoft Office', 'Software', 'Obligatorio', 'Suite ofimática de Microsoft', 'Office 365', 1, GETUTCDATE(), 'Sistema'),
('Google Chrome', 'Software', 'Obligatorio', 'Navegador web de Google', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Microsoft Edge', 'Software', 'Obligatorio', 'Navegador web de Microsoft', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Adobe Acrobat Reader', 'Software', 'Obligatorio', 'Lector de archivos PDF', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('7-Zip', 'Software', 'Opcional', 'Compresor de archivos', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('VLC Media Player', 'Software', 'Opcional', 'Reproductor multimedia', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Zoom', 'Software', 'Obligatorio', 'Plataforma de videoconferencias', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Microsoft Teams', 'Software', 'Obligatorio', 'Plataforma de colaboración', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Slack', 'Software', 'Opcional', 'Plataforma de comunicación empresarial', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Notepad++', 'Software', 'Opcional', 'Editor de texto avanzado', 'Latest', 1, GETUTCDATE(), 'Sistema');

-- Licencias Estándar
INSERT INTO ProgramasEstandar (Nombre, Categoria, Tipo, Descripcion, VersionRecomendada, Activo, FechaCreacion, CreadoPor)
VALUES 
('Windows 10/11 Pro', 'Licencia', 'Crítico', 'Licencia de sistema operativo Windows', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Microsoft Office 365', 'Licencia', 'Obligatorio', 'Licencia de Office 365', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Adobe Creative Cloud', 'Licencia', 'Opcional', 'Suite de diseño de Adobe', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('AutoCAD', 'Licencia', 'Opcional', 'Software de diseño asistido por computadora', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('VMware Workstation', 'Licencia', 'Opcional', 'Virtualización de escritorio', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('Cisco AnyConnect', 'Licencia', 'Obligatorio', 'Cliente VPN de Cisco', 'Latest', 1, GETUTCDATE(), 'Sistema'),
('RustDesk', 'Licencia', 'Opcional', 'Software de acceso remoto', 'Latest', 1, GETUTCDATE(), 'Sistema');

PRINT 'Programas estándar insertados correctamente';
