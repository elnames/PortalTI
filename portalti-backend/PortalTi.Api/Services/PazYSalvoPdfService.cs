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

        private void GenerarAutorizacionYValorHumano(Document document, Font fontNormal, Font fontNegrita)
        {
            // Tabla para autorización y valor humano
            PdfPTable authTable = new PdfPTable(2);
            authTable.WidthPercentage = 100;
            authTable.SetWidths(new float[] { 1f, 1f });

            // Autorizado para pago finiquito
            PdfPCell authCell = new PdfPCell();
            authCell.Border = Rectangle.NO_BORDER;
            authCell.HorizontalAlignment = Element.ALIGN_LEFT;
            authCell.Phrase = new Phrase("Autorizado para pago finiquito", fontNormal);
            authTable.AddCell(authCell);

            // Valor Humano
            PdfPCell valorHumanoCell = new PdfPCell();
            valorHumanoCell.Border = Rectangle.NO_BORDER;
            valorHumanoCell.HorizontalAlignment = Element.ALIGN_LEFT;
            var valorHumanoPhrase = new Phrase();
            valorHumanoPhrase.Add(new Chunk("(5) VALOR HUMANO\n", fontNegrita));
            valorHumanoPhrase.Add(new Chunk("Se realizó encuesta ", fontNormal));
            valorHumanoPhrase.Add(new Chunk("☐ SI", fontNormal));
            valorHumanoPhrase.Add(new Chunk(" ☐ NO", fontNormal));
            valorHumanoCell.Phrase = valorHumanoPhrase;
            authTable.AddCell(valorHumanoCell);

            document.Add(authTable);
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
    }
}
