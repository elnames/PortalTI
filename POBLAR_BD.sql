-- =====================================================
-- SCRIPT PARA POBLAR BASE DE DATOS PORTAL TI
-- PRESERVA USUARIOS ADMIN EXISTENTES
-- =====================================================

SET QUOTED_IDENTIFIER ON
GO

USE [PortalTi]
GO

-- =====================================================
-- 1. PRESERVAR USUARIOS ADMIN EXISTENTES
-- =====================================================

-- Crear tabla temporal para preservar usuarios admin
IF OBJECT_ID('tempdb..#AdminUsersBackup') IS NOT NULL DROP TABLE #AdminUsersBackup

SELECT * INTO #AdminUsersBackup 
FROM AuthUsers 
WHERE Role = 'admin'

DECLARE @AdminCount INT
SELECT @AdminCount = COUNT(*) FROM #AdminUsersBackup
PRINT 'Usuarios admin preservados: ' + CAST(@AdminCount AS VARCHAR(10))

-- =====================================================
-- 2. LIMPIAR TABLAS (ORDEN CORRECTO POR FOREIGN KEYS)
-- =====================================================

PRINT 'Limpiando tablas...'

-- Tablas dependientes primero
DELETE FROM ChatMensajes
DELETE FROM ChatConversaciones
DELETE FROM ArchivosTickets
DELETE FROM ComentariosTickets
DELETE FROM Actas
DELETE FROM AsignacionesActivos
DELETE FROM UserActivityLogs
DELETE FROM Notificaciones

-- Tablas principales
DELETE FROM Tickets
DELETE FROM Activos
DELETE FROM NominaUsuarios

-- Limpiar AuthUsers pero preservar admins únicos
DELETE FROM AuthUsers WHERE Role != 'admin'

-- Restaurar usuarios admin únicos (evitar duplicados)
INSERT INTO AuthUsers (Username, PasswordHash, PasswordSalt, Role, IsActive, PreferenciasJson, SignaturePath, CreatedAt, LastLoginAt)
SELECT DISTINCT Username, PasswordHash, PasswordSalt, Role, IsActive, PreferenciasJson, SignaturePath, CreatedAt, LastLoginAt
FROM #AdminUsersBackup
WHERE Username NOT IN (SELECT Username FROM AuthUsers WHERE Role = 'admin')

DECLARE @AdminRestored INT
SELECT @AdminRestored = COUNT(*) FROM AuthUsers WHERE Role = 'admin'
PRINT 'Usuarios admin restaurados: ' + CAST(@AdminRestored AS VARCHAR(10))

-- =====================================================
-- 3. RESETEAR CONTADORES DE IDENTIDAD
-- =====================================================

PRINT 'Reseteando contadores de identidad...'

DBCC CHECKIDENT ('NominaUsuarios', RESEED, 0)
DBCC CHECKIDENT ('Activos', RESEED, 0)
DBCC CHECKIDENT ('AsignacionesActivos', RESEED, 0)
DBCC CHECKIDENT ('Tickets', RESEED, 0)
DBCC CHECKIDENT ('ComentariosTickets', RESEED, 0)
DBCC CHECKIDENT ('ArchivosTickets', RESEED, 0)
DBCC CHECKIDENT ('Actas', RESEED, 0)
DBCC CHECKIDENT ('ChatConversaciones', RESEED, 0)
DBCC CHECKIDENT ('ChatMensajes', RESEED, 0)
DBCC CHECKIDENT ('UserActivityLogs', RESEED, 0)
DBCC CHECKIDENT ('Notificaciones', RESEED, 0)

-- =====================================================
-- 4. DATOS DE REFERENCIA
-- =====================================================

-- Arrays de datos según formularios
DECLARE @Empresas TABLE (Empresa NVARCHAR(50))
INSERT INTO @Empresas VALUES ('Empresa A'), ('Empresa B'), ('Empresa C'), ('Empresa D')

DECLARE @Departamentos TABLE (Departamento NVARCHAR(50))
INSERT INTO @Departamentos VALUES ('TI'), ('Recursos Humanos'), ('Finanzas'), ('Ventas'), ('Operaciones'), ('Marketing')

DECLARE @UbicacionesPrincipales TABLE (Ubicacion NVARCHAR(100))
INSERT INTO @UbicacionesPrincipales VALUES 
('Oficina Central - Santiago Centro'),
('Sucursal Norte - Conchalí'),
('Sucursal Sur - San Joaquín'),
('Sucursal Este - Las Condes'),
('Sucursal Oeste - Pudahuel'),
('Centro de Distribución - Colina'),
('Almacén Principal - Huechuraba')

DECLARE @UbicacionesRegion TABLE (Ubicacion NVARCHAR(100))
INSERT INTO @UbicacionesRegion VALUES 
('Argentina'), ('Uruguay'), ('Antofagasta'), ('Concepción'), 
('Iquique'), ('La Serena'), ('Pucón'), ('Temuco')

DECLARE @CategoriasActivos TABLE (Categoria NVARCHAR(50))
INSERT INTO @CategoriasActivos VALUES ('Equipos'), ('Móviles'), ('Monitores'), ('Periféricos'), ('Accesorios'), ('Red')

DECLARE @Marcas TABLE (Marca NVARCHAR(50))
INSERT INTO @Marcas VALUES ('HP'), ('Dell'), ('Lenovo'), ('Asus'), ('Acer'), ('Apple')

DECLARE @TiposEquipo TABLE (Tipo NVARCHAR(50))
INSERT INTO @TiposEquipo VALUES ('Desktop'), ('Laptop'), ('Servidor'), ('Workstation')

DECLARE @Rams TABLE (Ram INT)
INSERT INTO @Rams VALUES (4), (8), (16), (24), (32), (64), (128)

DECLARE @CapacidadesDisco TABLE (Capacidad INT)
INSERT INTO @CapacidadesDisco VALUES (128), (256), (480), (512), (1024), (2048)

DECLARE @CategoriasTickets TABLE (Categoria NVARCHAR(50))
INSERT INTO @CategoriasTickets VALUES ('Hardware'), ('Software'), ('Red'), ('Otros')

DECLARE @PrioridadesTickets TABLE (Prioridad NVARCHAR(50))
INSERT INTO @PrioridadesTickets VALUES ('Baja'), ('Media'), ('Alta'), ('Crítica')

-- Nombres y apellidos genéricos
DECLARE @Nombres TABLE (Nombre NVARCHAR(50))
INSERT INTO @Nombres VALUES 
('Juan'), ('María'), ('Carlos'), ('Ana'), ('Luis'), ('Carmen'), ('Pedro'), ('Isabel'),
('Miguel'), ('Rosa'), ('Jorge'), ('Patricia'), ('Fernando'), ('Lucía'), ('Roberto'), ('Elena'),
('Daniel'), ('Sofía'), ('Alejandro'), ('Valentina'), ('Andrés'), ('Camila'), ('Diego'), ('Natalia'),
('Ricardo'), ('Gabriela'), ('Francisco'), ('Daniela'), ('Manuel'), ('Carolina'), ('Eduardo'), ('Mariana'),
('Alberto'), ('Verónica'), ('Héctor'), ('Claudia'), ('Raúl'), ('Monica'), ('Oscar'), ('Paula')

DECLARE @Apellidos TABLE (Apellido NVARCHAR(50))
INSERT INTO @Apellidos VALUES 
('García'), ('Rodríguez'), ('López'), ('Martínez'), ('González'), ('Pérez'), ('Sánchez'), ('Ramírez'),
('Torres'), ('Flores'), ('Rivera'), ('Morales'), ('Cruz'), ('Ortiz'), ('Reyes'), ('Moreno'),
('Jiménez'), ('Díaz'), ('Romero'), ('Herrera'), ('Vargas'), ('Castro'), ('Mendoza'), ('Silva'),
('Ruiz'), ('Acosta'), ('Medina'), ('Rojas'), ('Guerrero'), ('Vega'), ('Castillo'), ('Ramos'),
('Chávez'), ('Cortés'), ('Herrera'), ('Núñez'), ('Molina'), ('Aguilar'), ('Vargas'), ('Reyes')

-- =====================================================
-- 5. CREAR USUARIOS DE NÓMINA (250 usuarios)
-- =====================================================

PRINT 'Creando 250 usuarios de nómina...'

DECLARE @i INT = 1
DECLARE @MaxUsuarios INT = 250
DECLARE @NombreUsuario NVARCHAR(50)
DECLARE @ApellidoUsuario NVARCHAR(50)
DECLARE @Rut NVARCHAR(20)
DECLARE @Email NVARCHAR(100)
DECLARE @Departamento NVARCHAR(50)
DECLARE @Empresa NVARCHAR(50)
DECLARE @Ubicacion NVARCHAR(100)

WHILE @i <= @MaxUsuarios
BEGIN
    SELECT TOP 1 @NombreUsuario = Nombre FROM @Nombres ORDER BY NEWID()
    SELECT TOP 1 @ApellidoUsuario = Apellido FROM @Apellidos ORDER BY NEWID()
    SET @Rut = CAST(10000000 + @i AS NVARCHAR(10)) + '-9'
    SET @Email = LOWER(@NombreUsuario) + '.' + LOWER(@ApellidoUsuario) + '@empresa.com'
    SELECT TOP 1 @Departamento = Departamento FROM @Departamentos ORDER BY NEWID()
    SELECT TOP 1 @Empresa = Empresa FROM @Empresas ORDER BY NEWID()
    
    -- 70% ubicaciones principales, 30% región
    IF @i % 10 < 7
        SELECT TOP 1 @Ubicacion = Ubicacion FROM @UbicacionesPrincipales ORDER BY NEWID()
    ELSE
        SELECT TOP 1 @Ubicacion = Ubicacion FROM @UbicacionesRegion ORDER BY NEWID()

    INSERT INTO NominaUsuarios (Nombre, Apellido, Rut, Email, Departamento, Empresa, Ubicacion)
    VALUES (@NombreUsuario, @ApellidoUsuario, @Rut, @Email, @Departamento, @Empresa, @Ubicacion)

    SET @i = @i + 1
END

DECLARE @UsuariosCreados INT
SELECT @UsuariosCreados = COUNT(*) FROM NominaUsuarios
PRINT 'Usuarios de nómina creados: ' + CAST(@UsuariosCreados AS VARCHAR(10))

-- =====================================================
-- 6. CREAR ACTIVOS (500 activos)
-- =====================================================

PRINT 'Creando 500 activos...'

SET @i = 1
DECLARE @MaxActivos INT = 500
DECLARE @Categoria NVARCHAR(50)
DECLARE @Codigo NVARCHAR(50)
DECLARE @EstadoActivo NVARCHAR(20)
DECLARE @UbicacionActivo NVARCHAR(100)
DECLARE @EmpresaActivo NVARCHAR(50)
DECLARE @NombreEquipo NVARCHAR(100)
DECLARE @TipoEquipo NVARCHAR(50)
DECLARE @Procesador NVARCHAR(100)
DECLARE @SistemaOperativo NVARCHAR(100)
DECLARE @Serie NVARCHAR(100)
DECLARE @Ram NVARCHAR(20)
DECLARE @Marca NVARCHAR(50)
DECLARE @Modelo NVARCHAR(100)
DECLARE @DiscosJson NVARCHAR(MAX)
DECLARE @Pulgadas NVARCHAR(20)
DECLARE @Imei NVARCHAR(50)
DECLARE @Capacidad NVARCHAR(20)
DECLARE @NumeroCelular NVARCHAR(20)
DECLARE @NombreActivo NVARCHAR(100)
DECLARE @Cantidad INT
DECLARE @CapacidadDisco INT

WHILE @i <= @MaxActivos
BEGIN
    SELECT TOP 1 @Categoria = Categoria FROM @CategoriasActivos ORDER BY NEWID()
    SET @EstadoActivo = CASE WHEN @i % 3 = 0 THEN 'Usado' ELSE 'Nuevo' END
    SELECT TOP 1 @UbicacionActivo = Ubicacion FROM @UbicacionesPrincipales ORDER BY NEWID()
    SELECT TOP 1 @EmpresaActivo = Empresa FROM @Empresas ORDER BY NEWID()
    
    -- Generar código según categoría
    IF @Categoria = 'Equipos'
        SET @Codigo = 'EQUIPO-' + CAST(1000 + @i AS NVARCHAR(10))
    ELSE IF @Categoria = 'Móviles'
        SET @Codigo = 'MOV-' + CAST(1000 + @i AS NVARCHAR(10))
    ELSE IF @Categoria = 'Monitores'
        SET @Codigo = 'MON-' + CAST(1000 + @i AS NVARCHAR(10))
    ELSE IF @Categoria = 'Periféricos'
        SET @Codigo = 'PER-' + CAST(1000 + @i AS NVARCHAR(10))
    ELSE IF @Categoria = 'Accesorios'
        SET @Codigo = 'ACC-' + CAST(1000 + @i AS NVARCHAR(10))
    ELSE
        SET @Codigo = 'RED-' + CAST(1000 + @i AS NVARCHAR(10))

    -- Campos específicos según categoría
    SET @NombreEquipo = NULL
    SET @TipoEquipo = NULL
    SET @Procesador = NULL
    SET @SistemaOperativo = NULL
    SET @Serie = 'SER-' + CAST(100000 + @i AS NVARCHAR(10))
    SET @Ram = NULL
    SELECT TOP 1 @Marca = Marca FROM @Marcas ORDER BY NEWID()
    SET @Modelo = 'Modelo ' + CAST(2020 + (@i % 5) AS NVARCHAR(4))
    SET @DiscosJson = NULL
    SET @Pulgadas = NULL
    SET @Imei = NULL
    SET @Capacidad = NULL
    SET @NumeroCelular = NULL
    SET @NombreActivo = NULL
    SET @Cantidad = NULL

    IF @Categoria = 'Equipos'
    BEGIN
        SET @NombreEquipo = 'Equipo-' + CAST(@i AS NVARCHAR(10))
        SELECT TOP 1 @TipoEquipo = Tipo FROM @TiposEquipo ORDER BY NEWID()
        SET @Procesador = 'Intel Core i' + CAST(5 + (@i % 8) AS NVARCHAR(2)) + '-' + CAST(1000 + (@i % 1000) AS NVARCHAR(4))
        SET @SistemaOperativo = CASE WHEN @i % 3 = 0 THEN 'Windows 11 Pro' WHEN @i % 3 = 1 THEN 'Ubuntu 22.04' ELSE 'macOS Ventura' END
        SELECT TOP 1 @Ram = CAST(Ram AS NVARCHAR(10)) FROM @Rams ORDER BY NEWID()
        
        -- JSON para discos
        SELECT TOP 1 @CapacidadDisco = Capacidad FROM @CapacidadesDisco ORDER BY NEWID()
        SET @DiscosJson = '[{"tipo":"SSD","capacidad":"' + CAST(@CapacidadDisco AS NVARCHAR(10)) + '"}]'
    END
    ELSE IF @Categoria = 'Monitores'
    BEGIN
        SET @Pulgadas = CAST(20 + (@i % 15) AS NVARCHAR(10))
    END
    ELSE IF @Categoria = 'Móviles'
    BEGIN
        SET @Imei = '35' + CAST(100000000000000 + @i AS NVARCHAR(15))
        SELECT TOP 1 @Capacidad = CAST(Capacidad AS NVARCHAR(10)) FROM @CapacidadesDisco WHERE Capacidad <= 512 ORDER BY NEWID()
        SET @NumeroCelular = '+569' + CAST(10000000 + @i AS NVARCHAR(8))
    END
    ELSE
    BEGIN
        SET @NombreActivo = @Categoria + ' ' + CAST(@i AS NVARCHAR(10))
        SET @Cantidad = 1 + (@i % 5)
    END

    INSERT INTO Activos (
        Categoria, Codigo, Estado, Ubicacion, Empresa, NombreEquipo, TipoEquipo, 
        Procesador, SistemaOperativo, Serie, Ram, Marca, Modelo, DiscosJson,
        Pulgadas, Imei, Capacidad, NumeroCelular, Nombre, Cantidad
    )
    VALUES (
        @Categoria, @Codigo, @EstadoActivo, @UbicacionActivo, @EmpresaActivo, @NombreEquipo, @TipoEquipo,
        @Procesador, @SistemaOperativo, @Serie, @Ram, @Marca, @Modelo, @DiscosJson,
        @Pulgadas, @Imei, @Capacidad, @NumeroCelular, @NombreActivo, @Cantidad
    )

    SET @i = @i + 1
END

DECLARE @ActivosCreados INT
SELECT @ActivosCreados = COUNT(*) FROM Activos
PRINT 'Activos creados: ' + CAST(@ActivosCreados AS VARCHAR(10))

-- =====================================================
-- 7. CREAR ASIGNACIONES (200 asignaciones)
-- =====================================================

PRINT 'Creando 200 asignaciones...'

SET @i = 1
DECLARE @MaxAsignaciones INT = 200
DECLARE @ActivoId INT
DECLARE @UsuarioId INT
DECLARE @FechaAsignacion DATETIME
DECLARE @EstadoAsignacion NVARCHAR(20)
DECLARE @Observaciones NVARCHAR(500)
DECLARE @AsignadoPor NVARCHAR(100)

WHILE @i <= @MaxAsignaciones
BEGIN
    -- Seleccionar activo y usuario aleatorios
    SELECT TOP 1 @ActivoId = Id FROM Activos ORDER BY NEWID()
    SELECT TOP 1 @UsuarioId = Id FROM NominaUsuarios ORDER BY NEWID()
    SET @FechaAsignacion = DATEADD(DAY, -RAND() * 180, GETDATE()) -- Últimos 6 meses
    SET @EstadoAsignacion = CASE WHEN @i % 10 < 8 THEN 'Activa' WHEN @i % 10 < 9 THEN 'Devuelta' ELSE 'Perdida' END
    SET @Observaciones = CASE WHEN @i % 5 = 0 THEN 'Asignación estándar' ELSE NULL END
    SET @AsignadoPor = 'Sistema'

    -- Evitar asignaciones duplicadas activas
    IF NOT EXISTS (SELECT 1 FROM AsignacionesActivos WHERE ActivoId = @ActivoId AND Estado = 'Activa')
    BEGIN
        INSERT INTO AsignacionesActivos (ActivoId, UsuarioId, FechaAsignacion, Estado, Observaciones, AsignadoPor)
        VALUES (@ActivoId, @UsuarioId, @FechaAsignacion, @EstadoAsignacion, @Observaciones, @AsignadoPor)
    END

    SET @i = @i + 1
END

DECLARE @AsignacionesCreadas INT
SELECT @AsignacionesCreadas = COUNT(*) FROM AsignacionesActivos
PRINT 'Asignaciones creadas: ' + CAST(@AsignacionesCreadas AS VARCHAR(10))

-- =====================================================
-- 8. CREAR TICKETS (50 tickets)
-- =====================================================

PRINT 'Creando 50 tickets...'

SET @i = 1
DECLARE @MaxTickets INT = 50
DECLARE @Titulo NVARCHAR(200)
DECLARE @Descripcion NVARCHAR(MAX)
DECLARE @NombreSolicitante NVARCHAR(100)
DECLARE @EmailSolicitante NVARCHAR(100)
DECLARE @TelefonoSolicitante NVARCHAR(20)
DECLARE @EmpresaTicket NVARCHAR(50)
DECLARE @DepartamentoTicket NVARCHAR(50)
DECLARE @CategoriaTicket NVARCHAR(50)
DECLARE @Prioridad NVARCHAR(20)
DECLARE @EstadoTicket NVARCHAR(20)
DECLARE @FechaCreacion DATETIME
DECLARE @ActivoIdTicket INT
DECLARE @CreadoPorId INT

WHILE @i <= @MaxTickets
BEGIN
    SET @Titulo = 'Ticket de soporte #' + CAST(@i AS NVARCHAR(10))
    SET @Descripcion = 'Descripción del problema reportado por el usuario. Este es un ticket de ejemplo para pruebas.'
    SELECT TOP 1 @NombreSolicitante = Nombre + ' ' + Apellido FROM NominaUsuarios ORDER BY NEWID()
    SELECT TOP 1 @EmailSolicitante = Email FROM NominaUsuarios ORDER BY NEWID()
    SET @TelefonoSolicitante = '+569' + CAST(10000000 + @i AS NVARCHAR(8))
    SELECT TOP 1 @EmpresaTicket = Empresa FROM @Empresas ORDER BY NEWID()
    SELECT TOP 1 @DepartamentoTicket = Departamento FROM @Departamentos ORDER BY NEWID()
    SELECT TOP 1 @CategoriaTicket = Categoria FROM @CategoriasTickets ORDER BY NEWID()
    SELECT TOP 1 @Prioridad = Prioridad FROM @PrioridadesTickets ORDER BY NEWID()
    SET @EstadoTicket = CASE WHEN @i % 5 = 0 THEN 'Pendiente' WHEN @i % 5 = 1 THEN 'Asignado' WHEN @i % 5 = 2 THEN 'En Proceso' WHEN @i % 5 = 3 THEN 'Resuelto' ELSE 'Cerrado' END
    SET @FechaCreacion = DATEADD(DAY, -RAND() * 30, GETDATE()) -- Últimos 30 días
    SELECT TOP 1 @ActivoIdTicket = Id FROM Activos ORDER BY NEWID()
    SELECT TOP 1 @CreadoPorId = Id FROM AuthUsers WHERE Role = 'admin' ORDER BY NEWID()

    INSERT INTO Tickets (
        Titulo, Descripcion, NombreSolicitante, EmailSolicitante, TelefonoSolicitante,
        Empresa, Departamento, Categoria, Prioridad, Estado, FechaCreacion, ActivoId, CreadoPorId
    )
    VALUES (
        @Titulo, @Descripcion, @NombreSolicitante, @EmailSolicitante, @TelefonoSolicitante,
        @EmpresaTicket, @DepartamentoTicket, @CategoriaTicket, @Prioridad, @EstadoTicket, @FechaCreacion, @ActivoIdTicket, @CreadoPorId
    )

    SET @i = @i + 1
END

DECLARE @TicketsCreados INT
SELECT @TicketsCreados = COUNT(*) FROM Tickets
PRINT 'Tickets creados: ' + CAST(@TicketsCreados AS VARCHAR(10))

-- =====================================================
-- 9. CREAR ACTAS (25 actas)
-- =====================================================

PRINT 'Creando 25 actas...'

SET @i = 1
DECLARE @MaxActas INT = 25
DECLARE @AsignacionId INT
DECLARE @EstadoActa NVARCHAR(20)
DECLARE @MetodoFirma NVARCHAR(20)
DECLARE @FechaCreacionActa DATETIME
DECLARE @AprobadoPorId INT

WHILE @i <= @MaxActas
BEGIN
    SELECT TOP 1 @AsignacionId = Id FROM AsignacionesActivos WHERE Estado = 'Activa' ORDER BY NEWID()
    SET @EstadoActa = CASE WHEN @i % 4 = 0 THEN 'Pendiente' WHEN @i % 4 = 1 THEN 'Firmada' WHEN @i % 4 = 2 THEN 'Aprobada' ELSE 'Rechazada' END
    SET @MetodoFirma = CASE WHEN @i % 3 = 0 THEN 'Digital' WHEN @i % 3 = 1 THEN 'PDF_Subido' ELSE 'Admin_Subida' END
    SET @FechaCreacionActa = DATEADD(DAY, -RAND() * 60, GETDATE()) -- Últimos 60 días
    SELECT TOP 1 @AprobadoPorId = Id FROM AuthUsers WHERE Role = 'admin' ORDER BY NEWID()

    IF @AsignacionId IS NOT NULL
    BEGIN
        INSERT INTO Actas (AsignacionId, Estado, MetodoFirma, FechaCreacion, AprobadoPorId)
        VALUES (@AsignacionId, @EstadoActa, @MetodoFirma, @FechaCreacionActa, @AprobadoPorId)
    END

    SET @i = @i + 1
END

DECLARE @ActasCreadas INT
SELECT @ActasCreadas = COUNT(*) FROM Actas
PRINT 'Actas creadas: ' + CAST(@ActasCreadas AS VARCHAR(10))

-- =====================================================
-- 10. CREAR COMENTARIOS DE TICKETS
-- =====================================================

PRINT 'Creando comentarios de tickets...'

SET @i = 1
DECLARE @MaxComentarios INT = 100
DECLARE @TicketId INT
DECLARE @Contenido NVARCHAR(MAX)
DECLARE @FechaCreacionComentario DATETIME
DECLARE @EsInterno BIT
DECLARE @CreadoPorIdComentario INT

WHILE @i <= @MaxComentarios
BEGIN
    SELECT TOP 1 @TicketId = Id FROM Tickets ORDER BY NEWID()
    SET @Contenido = 'Comentario de seguimiento #' + CAST(@i AS NVARCHAR(10)) + '. Este es un comentario de ejemplo para el ticket.'
    SET @FechaCreacionComentario = DATEADD(DAY, -RAND() * 30, GETDATE())
    SET @EsInterno = CASE WHEN @i % 4 = 0 THEN 1 ELSE 0 END
    SELECT TOP 1 @CreadoPorIdComentario = Id FROM AuthUsers ORDER BY NEWID()

    INSERT INTO ComentariosTickets (TicketId, Contenido, FechaCreacion, EsInterno, CreadoPorId)
    VALUES (@TicketId, @Contenido, @FechaCreacionComentario, @EsInterno, @CreadoPorIdComentario)

    SET @i = @i + 1
END

DECLARE @ComentariosCreados INT
SELECT @ComentariosCreados = COUNT(*) FROM ComentariosTickets
PRINT 'Comentarios creados: ' + CAST(@ComentariosCreados AS VARCHAR(10))

-- =====================================================
-- 11. CREAR CONVERSACIONES DE CHAT
-- =====================================================

PRINT 'Creando conversaciones de chat...'

SET @i = 1
DECLARE @MaxConversaciones INT = 30
DECLARE @TituloChat NVARCHAR(200)
DECLARE @DescripcionChat NVARCHAR(500)
DECLARE @EstadoChat NVARCHAR(20)
DECLARE @FechaCreacionChat DATETIME
DECLARE @UsuarioIdChat INT
DECLARE @SoporteIdChat INT
DECLARE @TicketIdChat INT

WHILE @i <= @MaxConversaciones
BEGIN
    SET @TituloChat = 'Conversación de soporte #' + CAST(@i AS NVARCHAR(10))
    SET @DescripcionChat = 'Conversación de soporte técnico'
    SET @EstadoChat = CASE WHEN @i % 3 = 0 THEN 'Activa' WHEN @i % 3 = 1 THEN 'Cerrada' ELSE 'Pendiente' END
    SET @FechaCreacionChat = DATEADD(DAY, -RAND() * 30, GETDATE())
    SET @UsuarioIdChat = (SELECT TOP 1 Id FROM AuthUsers WHERE Role = 'usuario' ORDER BY NEWID())
    SET @SoporteIdChat = (SELECT TOP 1 Id FROM AuthUsers WHERE Role = 'soporte' ORDER BY NEWID())
    SET @TicketIdChat = (SELECT TOP 1 Id FROM Tickets ORDER BY NEWID())

    INSERT INTO ChatConversaciones (Titulo, Descripcion, Estado, FechaCreacion, UsuarioId, SoporteId, TicketId)
    VALUES (@TituloChat, @DescripcionChat, @EstadoChat, @FechaCreacionChat, @UsuarioIdChat, @SoporteIdChat, @TicketIdChat)

    SET @i = @i + 1
END

DECLARE @ConversacionesCreadas INT = (SELECT COUNT(*) FROM ChatConversaciones)
PRINT 'Conversaciones creadas: ' + CAST(@ConversacionesCreadas AS VARCHAR(10))

-- =====================================================
-- 12. CREAR MENSAJES DE CHAT
-- =====================================================

PRINT 'Creando mensajes de chat...'

SET @i = 1
DECLARE @MaxMensajes INT = 150
DECLARE @ConversacionId INT
DECLARE @ContenidoMensaje NVARCHAR(MAX)
DECLARE @FechaCreacionMensaje DATETIME
DECLARE @EsInternoMensaje BIT
DECLARE @EsLeido BIT
DECLARE @CreadoPorIdMensaje INT

WHILE @i <= @MaxMensajes
BEGIN
    SELECT TOP 1 @ConversacionId = Id FROM ChatConversaciones ORDER BY NEWID()
    SET @ContenidoMensaje = 'Mensaje #' + CAST(@i AS NVARCHAR(10)) + ' en la conversación.'
    SET @FechaCreacionMensaje = DATEADD(DAY, -RAND() * 30, GETDATE())
    SET @EsInternoMensaje = CASE WHEN @i % 5 = 0 THEN 1 ELSE 0 END
    SET @EsLeido = CASE WHEN @i % 3 = 0 THEN 0 ELSE 1 END
    SELECT TOP 1 @CreadoPorIdMensaje = Id FROM AuthUsers ORDER BY NEWID()

    INSERT INTO ChatMensajes (ConversacionId, Contenido, FechaCreacion, EsInterno, EsLeido, CreadoPorId)
    VALUES (@ConversacionId, @ContenidoMensaje, @FechaCreacionMensaje, @EsInternoMensaje, @EsLeido, @CreadoPorIdMensaje)

    SET @i = @i + 1
END

DECLARE @MensajesCreados INT = (SELECT COUNT(*) FROM ChatMensajes)
PRINT 'Mensajes creados: ' + CAST(@MensajesCreados AS VARCHAR(10))

-- =====================================================
-- 13. CREAR LOGS DE ACTIVIDAD
-- =====================================================

PRINT 'Creando logs de actividad...'

SET @i = 1
DECLARE @MaxLogs INT = 200
DECLARE @UserId INT
DECLARE @Action NVARCHAR(50)
DECLARE @Description NVARCHAR(500)
DECLARE @Timestamp DATETIME
DECLARE @IpAddress NVARCHAR(45)

WHILE @i <= @MaxLogs
BEGIN
    SELECT TOP 1 @UserId = Id FROM AuthUsers ORDER BY NEWID()
    SET @Action = CASE WHEN @i % 4 = 0 THEN 'login' WHEN @i % 4 = 1 THEN 'logout' WHEN @i % 4 = 2 THEN 'edit_user' ELSE 'view_dashboard' END
    SET @Description = 'Actividad del usuario #' + CAST(@i AS NVARCHAR(10))
    SET @Timestamp = DATEADD(DAY, -RAND() * 30, GETDATE())
    SET @IpAddress = '192.168.1.' + CAST(100 + (@i % 155) AS NVARCHAR(3))

    INSERT INTO UserActivityLogs (UserId, Action, Description, Timestamp, IpAddress)
    VALUES (@UserId, @Action, @Description, @Timestamp, @IpAddress)

    SET @i = @i + 1
END

DECLARE @LogsCreados INT = (SELECT COUNT(*) FROM UserActivityLogs)
PRINT 'Logs creados: ' + CAST(@LogsCreados AS VARCHAR(10))

-- =====================================================
-- 14. CREAR NOTIFICACIONES
-- =====================================================

PRINT 'Creando notificaciones...'

SET @i = 1
DECLARE @MaxNotificaciones INT = 100
DECLARE @UsuarioIdNotif INT
DECLARE @TipoNotif NVARCHAR(20)
DECLARE @MensajeNotif NVARCHAR(500)
DECLARE @DatosNotif NVARCHAR(MAX)
DECLARE @Leida BIT
DECLARE @FechaNotif DATETIME

WHILE @i <= @MaxNotificaciones
BEGIN
    SELECT TOP 1 @UsuarioIdNotif = Id FROM AuthUsers ORDER BY NEWID()
    SET @TipoNotif = CASE WHEN @i % 4 = 0 THEN 'info' WHEN @i % 4 = 1 THEN 'warning' WHEN @i % 4 = 2 THEN 'error' ELSE 'success' END
    SET @MensajeNotif = 'Notificación #' + CAST(@i AS NVARCHAR(10)) + ' del sistema.'
    SET @DatosNotif = '{"tipo":"' + @TipoNotif + '","id":' + CAST(@i AS NVARCHAR(10)) + '}'
    SET @Leida = CASE WHEN @i % 3 = 0 THEN 0 ELSE 1 END
    SET @FechaNotif = DATEADD(DAY, -RAND() * 30, GETDATE())

    INSERT INTO Notificaciones (UsuarioId, Tipo, Mensaje, Datos, Leida, Fecha)
    VALUES (@UsuarioIdNotif, @TipoNotif, @MensajeNotif, @DatosNotif, @Leida, @FechaNotif)

    SET @i = @i + 1
END

DECLARE @NotificacionesCreadas INT = (SELECT COUNT(*) FROM Notificaciones)
PRINT 'Notificaciones creadas: ' + CAST(@NotificacionesCreadas AS VARCHAR(10))

-- =====================================================
-- 15. LIMPIAR DUPLICADOS DE ADMIN (SI LOS HAY)
-- =====================================================

-- Actualizar referencias en tablas dependientes antes de eliminar duplicados
UPDATE Actas SET AprobadoPorId = (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' AND Username = 'admin') 
WHERE AprobadoPorId IN (SELECT Id FROM AuthUsers WHERE Role = 'admin' AND Id NOT IN (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' GROUP BY Username))

UPDATE Tickets SET CreadoPorId = (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' AND Username = 'admin') 
WHERE CreadoPorId IN (SELECT Id FROM AuthUsers WHERE Role = 'admin' AND Id NOT IN (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' GROUP BY Username))

UPDATE ComentariosTickets SET CreadoPorId = (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' AND Username = 'admin') 
WHERE CreadoPorId IN (SELECT Id FROM AuthUsers WHERE Role = 'admin' AND Id NOT IN (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' GROUP BY Username))

UPDATE UserActivityLogs SET UserId = (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' AND Username = 'admin') 
WHERE UserId IN (SELECT Id FROM AuthUsers WHERE Role = 'admin' AND Id NOT IN (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' GROUP BY Username))

UPDATE Notificaciones SET UsuarioId = (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' AND Username = 'admin') 
WHERE UsuarioId IN (SELECT Id FROM AuthUsers WHERE Role = 'admin' AND Id NOT IN (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' GROUP BY Username))

-- Eliminar usuarios admin duplicados
DELETE FROM AuthUsers WHERE Role = 'admin' AND Id NOT IN (SELECT MIN(Id) FROM AuthUsers WHERE Role = 'admin' GROUP BY Username)

-- =====================================================
-- 16. LIMPIAR TABLA TEMPORAL
-- =====================================================

DROP TABLE #AdminUsersBackup

-- =====================================================
-- 17. RESUMEN FINAL
-- =====================================================

DECLARE @TotalUsuarios INT
DECLARE @TotalActivos INT
DECLARE @TotalAsignaciones INT
DECLARE @TotalTickets INT
DECLARE @TotalActas INT
DECLARE @TotalComentarios INT
DECLARE @TotalLogs INT
DECLARE @TotalNotificaciones INT
DECLARE @TotalAdmins INT

SELECT @TotalUsuarios = COUNT(*) FROM NominaUsuarios
SELECT @TotalActivos = COUNT(*) FROM Activos
SELECT @TotalAsignaciones = COUNT(*) FROM AsignacionesActivos
SELECT @TotalTickets = COUNT(*) FROM Tickets
SELECT @TotalActas = COUNT(*) FROM Actas
SELECT @TotalComentarios = COUNT(*) FROM ComentariosTickets
SELECT @TotalLogs = COUNT(*) FROM UserActivityLogs
SELECT @TotalNotificaciones = COUNT(*) FROM Notificaciones
SELECT @TotalAdmins = COUNT(*) FROM AuthUsers WHERE Role = 'admin'

PRINT '====================================================='
PRINT 'POBLACIÓN DE BASE DE DATOS COMPLETADA'
PRINT '====================================================='
PRINT 'Usuarios de nómina: ' + CAST(@TotalUsuarios AS VARCHAR(10))
PRINT 'Activos: ' + CAST(@TotalActivos AS VARCHAR(10))
PRINT 'Asignaciones: ' + CAST(@TotalAsignaciones AS VARCHAR(10))
PRINT 'Tickets: ' + CAST(@TotalTickets AS VARCHAR(10))
PRINT 'Actas: ' + CAST(@TotalActas AS VARCHAR(10))
PRINT 'Comentarios: ' + CAST(@TotalComentarios AS VARCHAR(10))
PRINT 'Logs: ' + CAST(@TotalLogs AS VARCHAR(10))
PRINT 'Notificaciones: ' + CAST(@TotalNotificaciones AS VARCHAR(10))
PRINT 'Usuarios admin preservados: ' + CAST(@TotalAdmins AS VARCHAR(10))
PRINT '====================================================='

GO
