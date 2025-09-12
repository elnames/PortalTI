-- Script para migrar datos de Paz y Salvo al modelo unificado
USE PortalTi;

PRINT 'Iniciando migración de Paz y Salvo al modelo unificado...';

-- 1. Agregar nuevas columnas JSON a la tabla PazYSalvos
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PazYSalvos') AND name = 'FirmasJson')
BEGIN
    PRINT 'Agregando columna FirmasJson...';
    ALTER TABLE PazYSalvos ADD FirmasJson NVARCHAR(4000) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PazYSalvos') AND name = 'HistorialJson')
BEGIN
    PRINT 'Agregando columna HistorialJson...';
    ALTER TABLE PazYSalvos ADD HistorialJson NVARCHAR(4000) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PazYSalvos') AND name = 'AdjuntosJson')
BEGIN
    PRINT 'Agregando columna AdjuntosJson...';
    ALTER TABLE PazYSalvos ADD AdjuntosJson NVARCHAR(2000) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PazYSalvos') AND name = 'ExcepcionesJson')
BEGIN
    PRINT 'Agregando columna ExcepcionesJson...';
    ALTER TABLE PazYSalvos ADD ExcepcionesJson NVARCHAR(1000) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PazYSalvos') AND name = 'ActivosSnapshotJson')
BEGIN
    PRINT 'Agregando columna ActivosSnapshotJson...';
    ALTER TABLE PazYSalvos ADD ActivosSnapshotJson NVARCHAR(2000) NULL;
END

-- 2. Migrar datos de firmas a JSON
PRINT 'Migrando datos de firmas...';
UPDATE p 
SET FirmasJson = (
    SELECT 
        (
            SELECT 
                f.Rol,
                f.FirmanteUserId,
                f.Estado,
                f.FechaFirma,
                f.Comentario,
                f.FirmaHash,
                f.Orden,
                f.Obligatorio
            FROM PazYSalvoFirmas f
            WHERE f.PazYSalvoId = p.Id
            ORDER BY f.Orden
            FOR JSON PATH
        )
    )
FROM PazYSalvos p
WHERE EXISTS (SELECT 1 FROM PazYSalvoFirmas f WHERE f.PazYSalvoId = p.Id);

-- 3. Migrar datos de historial a JSON
PRINT 'Migrando datos de historial...';
UPDATE p 
SET HistorialJson = (
    SELECT 
        (
            SELECT 
                h.ActorUserId,
                h.ActorNombre,
                h.Accion,
                h.EstadoDesde,
                h.EstadoHasta,
                h.Nota,
                h.FechaAccion
            FROM PazYSalvoHistorial h
            WHERE h.PazYSalvoId = p.Id
            ORDER BY h.FechaAccion
            FOR JSON PATH
        )
    )
FROM PazYSalvos p
WHERE EXISTS (SELECT 1 FROM PazYSalvoHistorial h WHERE h.PazYSalvoId = p.Id);

-- 4. Migrar datos de adjuntos a JSON
PRINT 'Migrando datos de adjuntos...';
UPDATE p 
SET AdjuntosJson = (
    SELECT 
        (
            SELECT 
                a.SubidoPorId,
                a.SubidoPorNombre,
                a.Nombre,
                a.Ruta,
                a.Tipo,
                a.Tamaño,
                a.FechaSubida
            FROM PazYSalvoAdjuntos a
            WHERE a.PazYSalvoId = p.Id
            ORDER BY a.FechaSubida
            FOR JSON PATH
        )
    )
FROM PazYSalvos p
WHERE EXISTS (SELECT 1 FROM PazYSalvoAdjuntos a WHERE a.PazYSalvoId = p.Id);

-- 5. Migrar datos de excepciones a JSON
PRINT 'Migrando datos de excepciones...';
UPDATE p 
SET ExcepcionesJson = (
    SELECT 
        (
            SELECT 
                e.AprobadaPorId,
                e.AprobadaPorNombre,
                e.Motivo,
                e.FechaCreacion
            FROM PazYSalvoExcepciones e
            WHERE e.PazYSalvoId = p.Id
            ORDER BY e.FechaCreacion
            FOR JSON PATH
        )
    )
FROM PazYSalvos p
WHERE EXISTS (SELECT 1 FROM PazYSalvoExcepciones e WHERE e.PazYSalvoId = p.Id);

-- 6. Migrar datos de activos snapshot a JSON
PRINT 'Migrando datos de activos snapshot...';
UPDATE p 
SET ActivosSnapshotJson = (
    SELECT 
        (
            SELECT 
                s.ActivoId,
                s.Descripcion,
                s.EstadoActivo,
                s.Observacion,
                s.FechaCorte
            FROM PazYSalvoActivoSnapshots s
            WHERE s.PazYSalvoId = p.Id
            ORDER BY s.FechaCorte
            FOR JSON PATH
        )
    )
FROM PazYSalvos p
WHERE EXISTS (SELECT 1 FROM PazYSalvoActivoSnapshots s WHERE s.PazYSalvoId = p.Id);

-- 7. Verificar migración
PRINT 'Verificando migración...';
SELECT 
    COUNT(*) as TotalPazYSalvos,
    SUM(CASE WHEN FirmasJson IS NOT NULL THEN 1 ELSE 0 END) as ConFirmas,
    SUM(CASE WHEN HistorialJson IS NOT NULL THEN 1 ELSE 0 END) as ConHistorial,
    SUM(CASE WHEN AdjuntosJson IS NOT NULL THEN 1 ELSE 0 END) as ConAdjuntos,
    SUM(CASE WHEN ExcepcionesJson IS NOT NULL THEN 1 ELSE 0 END) as ConExcepciones,
    SUM(CASE WHEN ActivosSnapshotJson IS NOT NULL THEN 1 ELSE 0 END) as ConActivos
FROM PazYSalvos;

PRINT 'Migración completada exitosamente.';
PRINT 'Las tablas antiguas pueden ser eliminadas después de verificar que todo funciona correctamente.';
PRINT 'Tablas que se pueden eliminar:';
PRINT '- PazYSalvoFirmas';
PRINT '- PazYSalvoHistorial';
PRINT '- PazYSalvoAdjuntos';
PRINT '- PazYSalvoExcepciones';
PRINT '- PazYSalvoActivoSnapshots';
PRINT '- PazYSalvoConfigs';
PRINT '- PazYSalvoConfigFirmas';
