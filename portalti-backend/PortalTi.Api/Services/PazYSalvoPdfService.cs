using iTextSharp.text;
using iTextSharp.text.pdf;
using PortalTi.Api.Models;
using PortalTi.Api.Models.DTOs;
using System.IO;
using System.Text;

namespace PortalTi.Api.Services
{
    public class PazYSalvoPdfService
    {
        private readonly IConfiguration _configuration;

        public PazYSalvoPdfService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public byte[] GenerarPazYSalvoPdf(PazYSalvoResponse pazYSalvo)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                Document document = new Document(PageSize.A4, 40, 40, 40, 40);
                PdfWriter writer = PdfWriter.GetInstance(document, ms);
                document.Open();

                // Configurar fuentes
                var fontTitulo = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18, new BaseColor(0, 0, 0));
                var fontNormal = FontFactory.GetFont(FontFactory.HELVETICA, 10, new BaseColor(0, 0, 0));
                var fontNegrita = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, new BaseColor(0, 0, 0));
                var fontPequeno = FontFactory.GetFont(FontFactory.HELVETICA, 8, new BaseColor(0, 0, 0));

                // Encabezado genérico (sin logos ni marcas)
                GenerarHeader(document, fontNormal);

                // Título principal
                var titulo = new Paragraph("PAZ Y SALVO", fontTitulo);
                titulo.Alignment = Element.ALIGN_CENTER;
                titulo.SpacingAfter = 10;
                document.Add(titulo);

                // Versión
                var version = new Paragraph("VERSION:1  Última actualización 01-07-2024", fontPequeno);
                version.Alignment = Element.ALIGN_CENTER;
                version.SpacingAfter = 20;
                document.Add(version);

                // Datos del empleado
                GenerarDatosEmpleado(document, pazYSalvo, fontNormal, fontNegrita);

                // Sección de información y checklist (como en la imagen)
                GenerarSeccionInformacionYChecklist(document, pazYSalvo, fontNormal, fontNegrita, fontPequeno);

                // Sección de firmas
                GenerarSeccionFirmas(document, pazYSalvo, fontNormal, fontNegrita, fontPequeno);

                // Sección de empresas (sin información por cierre comercial)
                GenerarSeccionEmpresas(document, fontNormal, fontNegrita);

                // Autorización y Valor Humano
                GenerarAutorizacionYValorHumano(document, fontNormal, fontNegrita);

                // Observaciones
                GenerarObservaciones(document, pazYSalvo, fontNormal, fontNegrita);

                // Cláusulas
                GenerarClausulas(document, fontNormal, fontNegrita, fontPequeno);

                // Footer con hash y QR
                GenerarFooter(document, pazYSalvo, fontPequeno);

                document.Close();
                return ms.ToArray();
            }
        }

        private void GenerarHeader(Document document, Font fontNormal)
        {
            // Encabezado simple sin logos ni nombres reales
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.WidthPercentage = 100;
            headerTable.SetWidths(new float[] { 1f, 3f });

            // Columna izquierda vacía (antes había logos)
            PdfPCell logoCell = new PdfPCell();
            logoCell.Border = Rectangle.NO_BORDER;
            logoCell.HorizontalAlignment = Element.ALIGN_LEFT;
            logoCell.VerticalAlignment = Element.ALIGN_MIDDLE;
            logoCell.FixedHeight = 60f;
            // Sin contenido (requisito: sin logos ni marcas)
            logoCell.Phrase = new Phrase(" ");
            
            headerTable.AddCell(logoCell);

            // Información genérica (sin nombres reales)
            PdfPCell infoCell = new PdfPCell();
            infoCell.Border = Rectangle.NO_BORDER;
            infoCell.HorizontalAlignment = Element.ALIGN_RIGHT;
            infoCell.VerticalAlignment = Element.ALIGN_MIDDLE;
            infoCell.FixedHeight = 60f;
            
            var infoPhrase = new Phrase();
            infoPhrase.Add(new Chunk("EMPRESA GENÉRICA S.A.\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, new BaseColor(0, 0, 0))));
            infoPhrase.Add(new Chunk("Departamento de Recursos Humanos\n", fontNormal));
            infoPhrase.Add(new Chunk("Dirección: Av. Ejemplo 123, Ciudad – País\n", fontNormal));
            infoPhrase.Add(new Chunk($"Fecha: {DateTime.Now:dd/MM/yyyy}", fontNormal));
            infoCell.Phrase = infoPhrase;
            headerTable.AddCell(infoCell);

            document.Add(headerTable);
            document.Add(new Paragraph(" "));
        }

        private void GenerarDatosEmpleado(Document document, PazYSalvoResponse pazYSalvo, Font fontNormal, Font fontNegrita)
        {
            // Línea 1: Certificamos que el(la) señor(a)
            var certificamos = new Paragraph();
            certificamos.Add(new Chunk("Certificamos que el(la) señor(a) ", fontNormal));
            certificamos.Add(new Chunk("_____________________________", fontNormal));
            certificamos.Add(new Chunk($" {pazYSalvo.UsuarioNombre}", fontNegrita));
            document.Add(certificamos);

            // Línea 2: Identificado con el rut
            var rut = new Paragraph();
            rut.Add(new Chunk("Identificado con el rut ", fontNormal));
            rut.Add(new Chunk("_____________________________", fontNormal));
            rut.Add(new Chunk($" {pazYSalvo.UsuarioRut}", fontNegrita));
            document.Add(rut);

            // Línea 3: Fecha de Salida
            var fechaSalida = new Paragraph();
            fechaSalida.Add(new Chunk("Fecha de Salida ", fontNormal));
            fechaSalida.Add(new Chunk("_____________________________", fontNormal));
            fechaSalida.Add(new Chunk($" {pazYSalvo.FechaSalida:dd-MM-yyyy}", fontNegrita));
            document.Add(fechaSalida);

            // Línea 4: Motivo Salida
            var motivoSalida = new Paragraph();
            motivoSalida.Add(new Chunk("Motivo Salida ", fontNormal));
            motivoSalida.Add(new Chunk("_____________________________", fontNormal));
            motivoSalida.Add(new Chunk($" {pazYSalvo.MotivoSalida}", fontNegrita));
            document.Add(motivoSalida);

            document.Add(new Paragraph(" "));
        }

        private void GenerarSeccionInformacionYChecklist(Document document, PazYSalvoResponse pazYSalvo, Font fontNormal, Font fontNegrita, Font fontPequeno)
        {
            // El diseño de referencia no incluye esta sección en el cuerpo principal.
            // Se deja vacío a propósito para replicar el formato solicitado.
        }

        private void GenerarSeccionFirmas(Document document, PazYSalvoResponse pazYSalvo, Font fontNormal, Font fontNegrita, Font fontPequeno)
        {
            // Tabla de firmas
            PdfPTable firmasTable = new PdfPTable(4);
            firmasTable.WidthPercentage = 100;
            firmasTable.SetWidths(new float[] { 1f, 1f, 1f, 1f });

            // Headers de las columnas
            string[] headers = { "Jefe Inmediato (1)", "Contabilidad (2)", "Informática (3)", "Gerencia Finanzas (4)" };
            foreach (var header in headers)
            {
                PdfPCell headerCell = new PdfPCell(new Phrase(header, fontNegrita));
                headerCell.HorizontalAlignment = Element.ALIGN_CENTER;
                headerCell.VerticalAlignment = Element.ALIGN_MIDDLE;
                headerCell.FixedHeight = 30f;
                headerCell.Border = Rectangle.BOX;
                firmasTable.AddCell(headerCell);
            }

            // Celdas de firma
            for (int i = 0; i < 4; i++)
            {
                PdfPCell firmaCell = new PdfPCell();
                firmaCell.FixedHeight = 80f;
                firmaCell.Border = Rectangle.BOX;
                firmaCell.HorizontalAlignment = Element.ALIGN_CENTER;
                firmaCell.VerticalAlignment = Element.ALIGN_MIDDLE;

                // Buscar la firma correspondiente
                var firma = pazYSalvo.Firmas.FirstOrDefault(f => f.Orden == i + 1);
                if (firma != null)
                {
                    // Estado de la firma
                    var estado = firma.Estado switch
                    {
                        "Firmado" => "FIRMADO",
                        "Rechazado" => "RECHAZADO",
                        _ => "PENDIENTE"
                    };

                    var estadoColor = firma.Estado switch
                    {
                        "Firmado" => new BaseColor(0, 128, 0),
                        "Rechazado" => new BaseColor(255, 0, 0),
                        _ => new BaseColor(128, 128, 128)
                    };

                    var estadoPhrase = new Phrase(estado, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 8, estadoColor));
                    firmaCell.Phrase = estadoPhrase;

                    // Fecha si está firmado
                    if (firma.Estado == "Firmado" && firma.FechaFirma.HasValue)
                    {
                        var fechaPhrase = new Phrase($"\n{firma.FechaFirma.Value:dd/MM/yyyy HH:mm}", fontPequeno);
                        firmaCell.Phrase = new Phrase();
                        firmaCell.Phrase.Add(estadoPhrase);
                        firmaCell.Phrase.Add(fechaPhrase);
                    }
                }
                else
                {
                    firmaCell.Phrase = new Phrase("PENDIENTE", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 8, new BaseColor(128, 128, 128)));
                }

                firmasTable.AddCell(firmaCell);
            }

            document.Add(firmasTable);
            document.Add(new Paragraph(" "));
        }

        private void GenerarSeccionEmpresas(Document document, Font fontNormal, Font fontNegrita)
        {
            // Texto "Se encuentra a PAZ y SALVO con la empresa"
            var textoEmpresa = new Paragraph("Se encuentra a PAZ y SALVO con la empresa", fontNormal);
            textoEmpresa.SpacingAfter = 10;
            document.Add(textoEmpresa);

            // Lista de empresas genéricas (sin marcas)
            string[] empresas = {
                "Empresa Matriz",
                "Sucursal Norte",
                "Sucursal Sur",
                "División Internacional",
                "Distribuidora Local",
                "Comercializadora Regional",
                "Holding de Servicios",
                "Unidad de Salud"
            };

            foreach (var empresa in empresas)
            {
                var empresaLine = new Paragraph();
                empresaLine.Add(new Chunk("☐ ", fontNormal)); // Checkbox vacío
                empresaLine.Add(new Chunk(empresa, fontNormal));
                document.Add(empresaLine);
            }

            document.Add(new Paragraph(" "));
        }


        private void GenerarObservaciones(Document document, PazYSalvoResponse pazYSalvo, Font fontNormal, Font fontNegrita)
        {
            var obsHeader = new Paragraph("OBSERVACIONES", fontNegrita);
            obsHeader.SpacingAfter = 5;
            document.Add(obsHeader);

            // Líneas para observaciones
            for (int i = 0; i < 3; i++)
            {
                var linea = new Paragraph("_________________________________________________", fontNormal);
                linea.SpacingAfter = 5;
                document.Add(linea);
            }

            // Agregar observaciones del sistema si existen
            if (!string.IsNullOrEmpty(pazYSalvo.Observaciones))
            {
                var obsTexto = new Paragraph(pazYSalvo.Observaciones, fontNormal);
                obsTexto.SpacingAfter = 10;
                document.Add(obsTexto);
            }

            document.Add(new Paragraph(" "));
        }

        private void GenerarClausulas(Document document, Font fontNormal, Font fontNegrita, Font fontPequeno)
        {
            var clausulasHeader = new Paragraph("CLAUSULAS:", fontNegrita);
            clausulasHeader.SpacingAfter = 5;
            document.Add(clausulasHeader);

            string[] clausulas = {
                "(1) INFORMES, TRABAJOS PENDIENTES, DOCUMENTOS CONFIDENCIALES",
                "(2) ANTICIPOS, CAJAS CHICAS, PRESTAMOS, ETC",
                "(3) HERRAMIENTAS DE COMPUTACION, CELULARES, CONTRASEÑAS, BAJAS DE SISTEMA, ENTRE OTROS",
                "(4) INFORMES PENDIENTES, DAR DE BAJA EN INDICADORES Y BANCOS",
                "(5) DADO DE BAJA EN ERP NOMINA, ENCUESTA DE SALIDA"
            };

            foreach (var clausula in clausulas)
            {
                var clausulaPara = new Paragraph(clausula, fontPequeno);
                clausulaPara.SpacingAfter = 2;
                document.Add(clausulaPara);
            }

            document.Add(new Paragraph(" "));
        }

        private void GenerarFooter(Document document, PazYSalvoResponse pazYSalvo, Font fontPequeno)
        {
            // Footer con hash y QR
            var footer = new Paragraph();
            footer.Alignment = Element.ALIGN_CENTER;
            footer.SpacingBefore = 20;

            if (!string.IsNullOrEmpty(pazYSalvo.HashFinal))
            {
                footer.Add(new Chunk($"Paz y Salvo #{pazYSalvo.Id} – Hash: {pazYSalvo.HashFinal}", fontPequeno));
            }

            // TODO: Agregar QR code aquí
            // Por ahora, solo texto
            if (!string.IsNullOrEmpty(pazYSalvo.HashFinal))
            {
                var qrText = new Paragraph();
                qrText.Alignment = Element.ALIGN_CENTER;
                qrText.Add(new Chunk("QR: Verificar integridad en el sistema", fontPequeno));
                document.Add(qrText);
            }

            document.Add(footer);
        }

        /// <summary>
        /// Generar PDF firmado solo por un rol específico (para visualización parcial)
        /// </summary>
        public byte[] GenerarPazYSalvoPdfFirmadoPorRol(PazYSalvoResponse pazYSalvo, string rolFirmante)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                Document document = new Document(PageSize.A4, 40, 40, 40, 40);
                PdfWriter writer = PdfWriter.GetInstance(document, ms);
                document.Open();

                // Configurar fuentes
                var fontTitulo = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18, new BaseColor(0, 0, 0));
                var fontNormal = FontFactory.GetFont(FontFactory.HELVETICA, 10, new BaseColor(0, 0, 0));
                var fontNegrita = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, new BaseColor(0, 0, 0));
                var fontPequeno = FontFactory.GetFont(FontFactory.HELVETICA, 8, new BaseColor(0, 0, 0));

                // Encabezado genérico (sin logos ni marcas)
                GenerarHeader(document, fontNormal);

                // Título principal
                var titulo = new Paragraph("PAZ Y SALVO", fontTitulo);
                titulo.Alignment = Element.ALIGN_CENTER;
                titulo.SpacingAfter = 10;
                document.Add(titulo);

                // Versión
                var version = new Paragraph("VERSION:1  Última actualización 01-07-2024", fontPequeno);
                version.Alignment = Element.ALIGN_CENTER;
                version.SpacingAfter = 20;
                document.Add(version);

                // Datos del empleado
                GenerarDatosEmpleado(document, pazYSalvo, fontNormal, fontNegrita);

                // Sección de firmas del documento completo, destacando el rol solicitado
                GenerarSeccionFirmasParcial(document, pazYSalvo, rolFirmante, fontNormal, fontNegrita, fontPequeno);

                // Sección de empresas genéricas
                GenerarSeccionEmpresas(document, fontNormal, fontNegrita);

                // Autorización y Valor Humano
                GenerarAutorizacionYValorHumano(document, fontNormal, fontNegrita);

                // Observaciones y cláusulas
                GenerarObservaciones(document, pazYSalvo, fontNormal, fontNegrita);
                GenerarClausulas(document, fontNormal, fontNegrita, fontPequeno);

                // Footer con hash específico
                GenerarFooterFirmaParcial(document, pazYSalvo, rolFirmante, fontPequeno);

                document.Close();
                return ms.ToArray();
            }
        }

        // Renderiza la tabla completa de firmas, resaltando/colocando solo datos del rol solicitado
        private void GenerarSeccionFirmasParcial(Document document, PazYSalvoResponse pazYSalvo, string rolFirmante, Font fontNormal, Font fontNegrita, Font fontPequeno)
        {
            PdfPTable firmasTable = new PdfPTable(4);
            firmasTable.WidthPercentage = 100;
            firmasTable.SetWidths(new float[] { 1f, 1f, 1f, 1f });

            string[] headers = { "Jefe Inmediato (1)", "Contabilidad (2)", "Informática (3)", "Gerencia Finanzas (4)" };
            for (int h = 0; h < headers.Length; h++)
            {
                PdfPCell headerCell = new PdfPCell(new Phrase(headers[h], fontNegrita));
                headerCell.HorizontalAlignment = Element.ALIGN_CENTER;
                headerCell.VerticalAlignment = Element.ALIGN_MIDDLE;
                headerCell.FixedHeight = 30f;
                firmasTable.AddCell(headerCell);
            }

            for (int i = 0; i < 4; i++)
            {
                PdfPCell firmaCell = new PdfPCell();
                firmaCell.FixedHeight = 80f;
                firmaCell.Border = Rectangle.BOX;
                firmaCell.HorizontalAlignment = Element.ALIGN_CENTER;
                firmaCell.VerticalAlignment = Element.ALIGN_MIDDLE;

                var firma = pazYSalvo.Firmas.FirstOrDefault(f => f.Orden == i + 1);
                if (firma != null)
                {
                    var esRolSolicitado = string.Equals(firma.Rol, rolFirmante, StringComparison.OrdinalIgnoreCase);

                    // Estado
                    var estado = firma.Estado == "Firmado" ? "FIRMADO" : (firma.Estado == "Rechazado" ? "RECHAZADO" : "PENDIENTE");
                    var estadoColor = firma.Estado == "Firmado" ? new BaseColor(0, 128, 0) : (firma.Estado == "Rechazado" ? new BaseColor(255, 0, 0) : new BaseColor(128, 128, 128));

                    var phrase = new Phrase();
                    phrase.Add(new Chunk(estado, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 8, estadoColor)));

                    // Solo mostrar detalles (fecha/nombre/hash) si es el rol solicitado
                    if (esRolSolicitado && firma.Estado == "Firmado")
                    {
                        if (firma.FechaFirma.HasValue)
                            phrase.Add(new Chunk($"\n{firma.FechaFirma.Value:dd/MM/yyyy HH:mm}", fontPequeno));
                        if (!string.IsNullOrEmpty(firma.FirmanteNombre))
                            phrase.Add(new Chunk($"\n{firma.FirmanteNombre}", fontPequeno));
                        if (!string.IsNullOrEmpty(firma.FirmaHash))
                            phrase.Add(new Chunk($"\nHash: {firma.FirmaHash.Substring(0, Math.Min(16, firma.FirmaHash.Length))}...", fontPequeno));
                    }

                    firmaCell.Phrase = phrase;
                }
                else
                {
                    firmaCell.Phrase = new Phrase("PENDIENTE", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 8, new BaseColor(128, 128, 128)));
                }

                firmasTable.AddCell(firmaCell);
            }

            document.Add(firmasTable);
            document.Add(new Paragraph(" "));
        }

        private void GenerarSeccionFirmaEspecifica(Document document, PazYSalvoResponse pazYSalvo, string rolFirmante, Font fontNormal, Font fontNegrita, Font fontPequeno)
        {
            var firmasHeader = new Paragraph("FIRMA AUTORIZADA", fontNegrita);
            firmasHeader.SpacingAfter = 10;
            document.Add(firmasHeader);

            // Tabla para la firma específica
            PdfPTable firmasTable = new PdfPTable(1);
            firmasTable.WidthPercentage = 100;

            var firma = pazYSalvo.Firmas?.FirstOrDefault(f => f.Rol == rolFirmante);
            if (firma != null)
            {
                PdfPCell firmaCell = new PdfPCell();
                firmaCell.Border = Rectangle.BOX;
                firmaCell.HorizontalAlignment = Element.ALIGN_CENTER;
                firmaCell.VerticalAlignment = Element.ALIGN_MIDDLE;
                firmaCell.FixedHeight = 80f;
                firmaCell.Padding = 10f;

                if (firma.Estado == "Firmado" && !string.IsNullOrEmpty(firma.FirmaHash))
                {
                    var firmaPhrase = new Phrase();
                    firmaPhrase.Add(new Chunk($"{firma.Rol}\n", fontNegrita));
                    
                    if (!string.IsNullOrEmpty(firma.FirmanteNombre))
                    {
                        firmaPhrase.Add(new Chunk($"{firma.FirmanteNombre}\n", fontNormal));
                    }
                    
                    if (firma.FechaFirma.HasValue)
                    {
                        firmaPhrase.Add(new Chunk($"Firmado: {firma.FechaFirma.Value:dd/MM/yyyy HH:mm}\n", fontPequeno));
                    }
                    
                    if (!string.IsNullOrEmpty(firma.Comentario))
                    {
                        firmaPhrase.Add(new Chunk($"Observación: {firma.Comentario}\n", fontPequeno));
                    }
                    
                    // Hash de firma como validación
                    firmaPhrase.Add(new Chunk($"Hash: {firma.FirmaHash.Substring(0, Math.Min(16, firma.FirmaHash.Length))}...", fontPequeno));
                    
                    firmaCell.Phrase = firmaPhrase;
                }
                else
                {
                    firmaCell.Phrase = new Phrase("FIRMA NO DISPONIBLE", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 8, new BaseColor(128, 128, 128)));
                }

                firmasTable.AddCell(firmaCell);
            }

            document.Add(firmasTable);
            document.Add(new Paragraph(" "));
        }

        private void GenerarFooterFirmaParcial(Document document, PazYSalvoResponse pazYSalvo, string rolFirmante, Font fontPequeno)
        {
            // Footer específico para firma parcial
            var footer = new Paragraph();
            footer.Alignment = Element.ALIGN_CENTER;
            footer.SpacingBefore = 30;

            var firma = pazYSalvo.Firmas?.FirstOrDefault(f => f.Rol == rolFirmante);
            if (firma != null && !string.IsNullOrEmpty(firma.FirmaHash))
            {
                footer.Add(new Chunk($"Paz y Salvo #{pazYSalvo.Id} – Firma {rolFirmante} – Hash: {firma.FirmaHash.Substring(0, 16)}...", fontPequeno));
                footer.Add(new Chunk($"\nFecha de generación: {DateTime.Now:dd/MM/yyyy HH:mm}", fontPequeno));
            }

            document.Add(footer);
        }

        /// <summary>
        /// Generar PDF de previsualización sin firmas (formato exacto como se muestra en la imagen)
        /// </summary>
        public byte[] GenerarPazYSalvoPdfPrevisualizacion(PazYSalvoResponse pazYSalvo, string? empresaEmpleado = null)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                Document document = new Document(PageSize.A4, 15, 15, 15, 15);
                PdfWriter writer = PdfWriter.GetInstance(document, ms);
                document.Open();

                // Configurar fuentes
                var fontTitulo = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, new BaseColor(0, 0, 0));
                var fontNormal = FontFactory.GetFont(FontFactory.HELVETICA, 8, new BaseColor(0, 0, 0));
                var fontNegrita = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 8, new BaseColor(0, 0, 0));
                var fontPequeno = FontFactory.GetFont(FontFactory.HELVETICA, 6, new BaseColor(0, 0, 0));

                // Encabezado con logos y título
                GenerarHeaderCompleto(document, fontNormal, fontTitulo, fontPequeno);

                // Datos del empleado (formato exacto de la imagen)
                GenerarDatosEmpleadoCorrecto(document, pazYSalvo, fontNormal, fontNegrita);

                // Sección de firmas por roles
                GenerarSeccionFirmasPorRoles(document, fontNormal, fontNegrita);

                // Sección Paz y Salvo con empresas
                GenerarSeccionPazYSalvoEmpresas(document, fontNormal, fontNegrita, empresaEmpleado);

                // Autorización y Valor Humano
                GenerarAutorizacionYValorHumano(document, fontNormal, fontNegrita);

                // Observaciones
                GenerarSeccionObservaciones(document, fontNormal, fontNegrita);

                // Cláusulas
                GenerarSeccionClausulas(document, fontNormal, fontNegrita);

                // Footer
                GenerarFooterCorrecto(document, pazYSalvo, fontPequeno);

                // Agregar borde alrededor de toda la página
                AgregarBordePagina(document, writer);

                document.Close();
                return ms.ToArray();
            }
        }

        private void GenerarHeaderCompleto(Document document, Font fontNormal, Font fontTitulo, Font fontPequeno)
        {
            // Tabla principal del encabezado
            var headerTable = new PdfPTable(3);
            headerTable.WidthPercentage = 100;
            headerTable.SetWidths(new float[] { 1.8f, 2f, 1.2f });
            headerTable.SpacingAfter = 5;

            // Logo izquierdo (BUNZL)
            var logoCell = new PdfPCell();
            logoCell.Border = Rectangle.NO_BORDER;
            logoCell.HorizontalAlignment = Element.ALIGN_LEFT;
            logoCell.VerticalAlignment = Element.ALIGN_TOP;
            logoCell.Padding = 0;
            
            try
            {
                string[] logoPaths = {
                    Path.Combine("wwwroot", "images", "logo.png"),
                    Path.Combine("wwwroot", "img", "logo.png"),
                    Path.Combine("wwwroot", "assets", "logo.png"),
                    "logo.png"
                };

                Image logo = null;
                foreach (var logoPath in logoPaths)
                {
                    if (File.Exists(logoPath))
                    {
                        logo = Image.GetInstance(logoPath);
                        break;
                    }
                }

                if (logo != null)
                {
                    logo.ScaleToFit(80, 40);
                    logoCell.AddElement(logo);
                }
                else
                {
                    logoCell.AddElement(new Phrase("LOGO", fontNormal));
                }
            }
            catch (Exception)
            {
                logoCell.AddElement(new Phrase("LOGO", fontNormal));
            }
            
            headerTable.AddCell(logoCell);

            // Título central
            var tituloCell = new PdfPCell();
            tituloCell.Border = Rectangle.NO_BORDER;
            tituloCell.HorizontalAlignment = Element.ALIGN_CENTER;
            tituloCell.VerticalAlignment = Element.ALIGN_TOP;
            tituloCell.Padding = 0;
            
            var titulo = new Paragraph("PAZ Y SALVO", fontTitulo);
            titulo.Alignment = Element.ALIGN_CENTER;
            tituloCell.AddElement(titulo);
            
            var version = new Paragraph("VERSION:1 Ultima actualizacion 01-07-2024", fontPequeno);
            version.Alignment = Element.ALIGN_CENTER;
            tituloCell.AddElement(version);
            
            headerTable.AddCell(tituloCell);

            // Logos derechos (empresas) - en fila horizontal
            var logosDerecha = new PdfPCell();
            logosDerecha.Border = Rectangle.NO_BORDER;
            logosDerecha.HorizontalAlignment = Element.ALIGN_RIGHT;
            logosDerecha.VerticalAlignment = Element.ALIGN_TOP;
            logosDerecha.Padding = 0;
            
            // Crear una tabla horizontal para los logos
            var logosTable = new PdfPTable(8);
            logosTable.WidthPercentage = 100;
            logosTable.SetWidths(new float[] { 1f, 1f, 1f, 1f, 1f, 1f, 1f, 1f });

            string[] empresas = {
                "HOSPITALIA", "VICSA SAFETY", "BEST SHOES", "Tecnoboga",
                "DPS TU NEGOCIO", "CRECE", "B2BWeb", "eCommerce"
            };

            foreach (var empresa in empresas)
            {
                var empresaCell = new PdfPCell(new Phrase(empresa, fontPequeno));
                empresaCell.Border = Rectangle.NO_BORDER;
                empresaCell.HorizontalAlignment = Element.ALIGN_CENTER;
                empresaCell.Padding = 1;
                logosTable.AddCell(empresaCell);
            }

            logosDerecha.AddElement(logosTable);
            
            headerTable.AddCell(logosDerecha);

            document.Add(headerTable);
        }

        private void GenerarDatosEmpleadoCorrecto(Document document, PazYSalvoResponse pazYSalvo, Font fontNormal, Font fontNegrita)
        {
            // Texto certificación
            var certificacion = new Paragraph("Certificamos que el(la) señor(a)", fontNormal);
            certificacion.SpacingAfter = 1;
            document.Add(certificacion);

            // Nombre del empleado con línea
            var nombre = new Paragraph(pazYSalvo.UsuarioNombre ?? "N/A", fontNormal);
            nombre.SpacingAfter = 2;
            document.Add(nombre);

            // Línea para subrayar el nombre
            var line = new Paragraph("_________________________________________________", fontNormal);
            line.SpacingAfter = 4;
            document.Add(line);

            // RUT
            var rutText = new Paragraph("Identificado con el rut", fontNormal);
            rutText.SpacingAfter = 1;
            document.Add(rutText);

            var rut = new Paragraph(pazYSalvo.UsuarioRut ?? "N/A", fontNormal);
            rut.SpacingAfter = 2;
            document.Add(rut);

            var line2 = new Paragraph("_________________________________________________", fontNormal);
            line2.SpacingAfter = 4;
            document.Add(line2);

            // Fecha de salida
            var fechaSalidaText = new Paragraph("Fecha de Salida", fontNormal);
            fechaSalidaText.SpacingAfter = 1;
            document.Add(fechaSalidaText);

            var fechaSalida = new Paragraph(pazYSalvo.FechaSalida.ToString("dd-MM-yyyy"), fontNormal);
            fechaSalida.SpacingAfter = 2;
            document.Add(fechaSalida);

            var line3 = new Paragraph("_________________________________________________", fontNormal);
            line3.SpacingAfter = 4;
            document.Add(line3);

            // Motivo de salida
            var motivoText = new Paragraph("Motivo Salida", fontNormal);
            motivoText.SpacingAfter = 1;
            document.Add(motivoText);

            var motivo = new Paragraph(pazYSalvo.MotivoSalida?.ToUpper() ?? "N/A", fontNormal);
            motivo.SpacingAfter = 2;
            document.Add(motivo);

            var line4 = new Paragraph("_________________________________________________", fontNormal);
            line4.SpacingAfter = 5;
            document.Add(line4);
        }

        private void GenerarSeccionFirmasPorRoles(Document document, Font fontNormal, Font fontNegrita)
        {
            // Tabla de firmas por roles
            var table = new PdfPTable(4);
            table.WidthPercentage = 100;
            table.SetWidths(new float[] { 1f, 1f, 1f, 1f });
            table.SpacingAfter = 5;

            // Headers de la tabla
            AddCell(table, "Jefe Inmediato (1)", fontNegrita, Element.ALIGN_CENTER, true);
            AddCell(table, "Contabilidad (2)", fontNegrita, Element.ALIGN_CENTER, true);
            AddCell(table, "Informatica (3)", fontNegrita, Element.ALIGN_CENTER, true);
            AddCell(table, "Gerencia Finanzas (4)", fontNegrita, Element.ALIGN_CENTER, true);

            // Recuadros para firmas (sin contenido)
            for (int i = 0; i < 4; i++)
            {
                var cell = new PdfPCell(new Phrase("", fontNormal));
                cell.FixedHeight = 40;
                cell.Border = Rectangle.BOX;
                cell.BorderColor = new BaseColor(0, 0, 0);
                cell.HorizontalAlignment = Element.ALIGN_CENTER;
                cell.VerticalAlignment = Element.ALIGN_MIDDLE;
                cell.Padding = 5;
                table.AddCell(cell);
            }

            document.Add(table);
        }

        private void GenerarSeccionPazYSalvoEmpresas(Document document, Font fontNormal, Font fontNegrita, string? empresaEmpleado = null)
        {
            // Título de la sección
            var titulo = new Paragraph("Se encuentra a PAZ y SALVO con la empresa", fontNegrita);
            titulo.SpacingAfter = 3;
            document.Add(titulo);

            // Lista de empresas reales del portal (obtenidas de NominaUsuarios)
            string[] empresas = {
                "DPS CHILE COMERCIAL LTDA.",
                "VICSA SAFETY COMERCIAL LTDA.",
                "VICSA Shanghai",
                "VICSA Uruguay",
                "B2B WEB DISTRIBUCAO DE PRODUCTOS",
                "TECNO BOGA COMERCIAL LTDA.",
                "HOSPITALIA"
            };

            foreach (var empresa in empresas)
            {
                // Determinar si esta empresa debe estar marcada
                bool isMarked = !string.IsNullOrEmpty(empresaEmpleado) && 
                               empresa.Equals(empresaEmpleado, StringComparison.OrdinalIgnoreCase);
                
                // Crear checkbox cuadrado real
                var empresaLine = new Paragraph();
                
                // Agregar checkbox cuadrado (☐ para vacío, ☑ para marcado)
                var checkbox = isMarked ? "☑" : "☐";
                empresaLine.Add(new Chunk(checkbox, fontNormal));
                empresaLine.Add(new Chunk($" {empresa}", fontNormal));
                
                empresaLine.SpacingAfter = 1;
                document.Add(empresaLine);
            }

            document.Add(new Paragraph(" ", fontNormal)); // Espacio
        }

        private void GenerarAutorizacionYValorHumano(Document document, Font fontNormal, Font fontNegrita)
        {
            // Tabla para autorización y valor humano
            var table = new PdfPTable(2);
            table.WidthPercentage = 100;
            table.SetWidths(new float[] { 1f, 1f });
            table.SpacingAfter = 5;

            // Lado izquierdo: Autorización para pago finiquito
            var autorizacionCell = new PdfPCell();
            autorizacionCell.Border = Rectangle.NO_BORDER;
            autorizacionCell.HorizontalAlignment = Element.ALIGN_LEFT;
            autorizacionCell.VerticalAlignment = Element.ALIGN_TOP;
            autorizacionCell.Padding = 5;

            var autorizacionText = new Paragraph("Autorizado para pago finiquito", fontNormal);
            autorizacionText.SpacingAfter = 2;
            autorizacionCell.AddElement(autorizacionText);

            // Línea para firma
            var lineaAutorizacion = new Paragraph("_________________________________________________", fontNormal);
            autorizacionCell.AddElement(lineaAutorizacion);

            table.AddCell(autorizacionCell);

            // Lado derecho: Valor Humano
            var valorHumanoCell = new PdfPCell();
            valorHumanoCell.Border = Rectangle.NO_BORDER;
            valorHumanoCell.HorizontalAlignment = Element.ALIGN_LEFT;
            valorHumanoCell.VerticalAlignment = Element.ALIGN_TOP;
            valorHumanoCell.Padding = 5;

            var valorHumanoTitulo = new Paragraph("(5) VALOR HUMANO", fontNegrita);
            valorHumanoTitulo.SpacingAfter = 2;
            valorHumanoCell.AddElement(valorHumanoTitulo);

            var encuestaText = new Paragraph("Se realizo encuesta", fontNormal);
            encuestaText.SpacingAfter = 2;
            valorHumanoCell.AddElement(encuestaText);

            var siText = new Paragraph("☐ SI", fontNormal);
            siText.SpacingAfter = 0;
            valorHumanoCell.AddElement(siText);

            var noText = new Paragraph("☐ NO", fontNormal);
            valorHumanoCell.AddElement(noText);

            table.AddCell(valorHumanoCell);

            document.Add(table);
            
            // Línea horizontal que separa las dos secciones
            var lineaHorizontal = new Paragraph("_____________________________________________________________________________", fontNormal);
            lineaHorizontal.SpacingAfter = 5;
            document.Add(lineaHorizontal);
        }

        private void GenerarSeccionObservaciones(Document document, Font fontNormal, Font fontNegrita)
        {
            // Título de observaciones
            var titulo = new Paragraph("OBSERVACIONES", fontNegrita);
            titulo.SpacingAfter = 3;
            document.Add(titulo);

            // Solo las líneas para observaciones adicionales (sin texto de ejemplo)

            // Líneas para observaciones adicionales
            for (int i = 0; i < 3; i++)
            {
                var linea = new Paragraph("_________________________________________________", fontNormal);
                document.Add(linea);
                document.Add(new Paragraph(" ", fontNormal)); // Espacio
            }
        }

        private void GenerarSeccionClausulas(Document document, Font fontNormal, Font fontNegrita)
        {
            // Título de cláusulas
            var titulo = new Paragraph("CLAUSULAS:", fontNegrita);
            titulo.SpacingAfter = 3;
            document.Add(titulo);

            // Lista de cláusulas
            string[] clausulas = {
                "(1) INFORMES, TRABAJOS PENDIENTES, DOCUMENTOS CONFIDENCIALES",
                "(2) ANTICIPOS, CAJAS CHICAS, PRESTAMOS, ETC",
                "(3) HERRAMIENTAS DE COMPUTACION, CELULARES, CONTRASEÑAS, BAJAS DE SISTEMA, ENTRE OTROS",
                "(4) INFORMES PENDIENTES , DAR DE BAJA EN INDICADORES Y BANCOS",
                "(5)DADO DE BAJA EN ERP NOMINA, ENCUESTA DE SALIDA"
            };

            foreach (var clausula in clausulas)
            {
                var clausulaText = new Paragraph(clausula, fontNormal);
                clausulaText.SpacingAfter = 1;
                document.Add(clausulaText);
            }

            document.Add(new Paragraph(" ", fontNormal)); // Espacio
        }

        private void AgregarBordePagina(Document document, PdfWriter writer)
        {
            // Obtener el contenido de la página
            var pageSize = document.PageSize;
            
            // Crear un rectángulo que cubra toda la página con un margen pequeño
            var rect = new iTextSharp.text.Rectangle(
                pageSize.Left + 10, 
                pageSize.Bottom + 10, 
                pageSize.Right - 10, 
                pageSize.Top - 10
            );
            
            // Agregar el borde usando el canvas del writer
            var canvas = writer.DirectContent;
            canvas.SetLineWidth(1.5f);
            canvas.SetColorStroke(new BaseColor(0, 0, 0));
            canvas.Rectangle(rect.Left, rect.Bottom, rect.Width, rect.Height);
            canvas.Stroke();
        }

        private void GenerarFooterCorrecto(Document document, PazYSalvoResponse pazYSalvo, Font fontPequeno)
        {
            var footer = new Paragraph();
            footer.Add(new Chunk($"Paz y Salvo #{pazYSalvo.Id} – Previsualización", fontPequeno));
            footer.Add(new Chunk($"\nFecha de generación: {DateTime.Now:dd/MM/yyyy HH:mm}", fontPequeno));
            document.Add(footer);
        }

        private void AddCell(PdfPTable table, string text, Font font, int alignment, bool hasBorder)
        {
            var cell = new PdfPCell(new Phrase(text, font));
            cell.HorizontalAlignment = alignment;
            cell.VerticalAlignment = Element.ALIGN_MIDDLE;
            cell.Padding = 5;
            
            if (hasBorder)
            {
                cell.Border = Rectangle.BOX;
                cell.BorderColor = new BaseColor(0, 0, 0);
            }
            else
            {
                cell.Border = Rectangle.NO_BORDER;
            }
            
            table.AddCell(cell);
        }
    }
}
