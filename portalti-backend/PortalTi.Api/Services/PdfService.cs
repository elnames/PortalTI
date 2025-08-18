using iTextSharp.text;
using iTextSharp.text.pdf;
using PortalTi.Api.Models;
using System.IO;
using System;

namespace PortalTi.Api.Services
{
    public class PdfService
    {
        public byte[] GenerateActaEntrega(AsignacionActivo asignacion, Activo activo, NominaUsuario usuario, string? userSignaturePath = null, DateTime? fechaEntrega = null)
        {
            return GenerateActaEntregaWithSignatures(asignacion, activo, usuario, null, userSignaturePath, fechaEntrega);
        }

        public byte[] GenerateActaEntregaWithSignatures(AsignacionActivo asignacion, Activo activo, NominaUsuario usuario, string? adminSignaturePath = null, string? userSignaturePath = null, DateTime? fechaEntrega = null)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                Document document = new Document(PageSize.A4, 40, 40, 40, 40);
                PdfWriter writer = PdfWriter.GetInstance(document, ms);
                document.Open();

                // Logo y fecha
                PdfPTable headerTable = new PdfPTable(2);
                headerTable.WidthPercentage = 100;
                headerTable.SetWidths(new float[] { 1f, 1f });

                // Logo (preferir logo nuevo; fallback a anteriores)
                string? resolvedLogoPath = ResolvePreferredLogoPath();
                if (!string.IsNullOrEmpty(resolvedLogoPath) && File.Exists(resolvedLogoPath))
                {
                    var logo = iTextSharp.text.Image.GetInstance(resolvedLogoPath);
                    logo.ScaleToFit(140, 50);
                    PdfPCell logoCell = new PdfPCell(logo);
                    logoCell.Border = Rectangle.NO_BORDER;
                    logoCell.HorizontalAlignment = Element.ALIGN_LEFT;
                    logoCell.VerticalAlignment = Element.ALIGN_MIDDLE;
                    headerTable.AddCell(logoCell);
                }
                else
                {
                    PdfPCell logoCell = new PdfPCell(new Phrase("Portal TI", FontFactory.GetFont(FontFactory.HELVETICA, 14, Font.BOLD)));
                    logoCell.Border = Rectangle.NO_BORDER;
                    headerTable.AddCell(logoCell);
                }

                // Fecha (siempre la fecha actual de generación en la esquina)
                PdfPCell dateCell = new PdfPCell(new Phrase($"Fecha: {DateTime.Now:dd-MM-yyyy}", FontFactory.GetFont(FontFactory.HELVETICA, 10)));
                dateCell.Border = Rectangle.NO_BORDER;
                dateCell.HorizontalAlignment = Element.ALIGN_RIGHT;
                dateCell.VerticalAlignment = Element.ALIGN_TOP;
                headerTable.AddCell(dateCell);

                document.Add(headerTable);
                document.Add(new Paragraph(" "));

                // Título dinámico según categoría
                string tituloActa = GetTituloActa(activo.Categoria);
                Paragraph title = new Paragraph(tituloActa, FontFactory.GetFont(FontFactory.HELVETICA, 14, Font.BOLD));
                title.Alignment = Element.ALIGN_CENTER;
                document.Add(title);
                document.Add(new Paragraph(" "));

                // Texto legal exacto
                string textoLegal = "Este documento establece la entrega del equipamiento (Equipo, móvil, monitor, accesorio, etc) de acuerdo con la Tabla N°1, cuyo equipo será para uso exclusivo de actividades de carácter empresarial.";
                Paragraph legal = new Paragraph(textoLegal, FontFactory.GetFont(FontFactory.HELVETICA, 10));
                legal.Alignment = Element.ALIGN_JUSTIFIED;
                document.Add(legal);
                document.Add(new Paragraph(" "));

                // Título Tabla N°1
                Paragraph tabla1Title = new Paragraph("Tabla N°1", FontFactory.GetFont(FontFactory.HELVETICA, 10, Font.BOLD));
                tabla1Title.Alignment = Element.ALIGN_LEFT;
                document.Add(tabla1Title);
                document.Add(new Paragraph(" "));

                // Tabla de equipos
                PdfPTable equipoTable = CreateEquipmentTable(activo);
                document.Add(equipoTable);
                document.Add(new Paragraph(" "));

                // Texto de responsabilidad (idéntico al ejemplo)
                string textoResp = "El firmante, como cesionario del equipo técnico designado, asume la responsabilidad de su correcto uso y cuidado.\nEn caso de pérdida, sustracción o hurto del dispositivo, se deberá realizar una denuncia (NO CONSTANCIA) en Carabineros de Chile o Fiscalía correspondiente y entregar la documentación al área de SOPORTE, para así tener respaldo de la reposición de los equipos.\nPara fallas técnicas serán revisadas previamente por el área de soporte y se generará un informe técnico, si amerita se realizarán cambios o reparaciones, si la falla es causada por mal uso o negligencia del usuario, el área a la cual pertenece deberá costear los gastos de reparación o reposición. Autorizo expresamente a la empresa mediante este documento a descontar el valor del equipo de los salarios y liquidaciones si el equipo no es devuelto al empleador en ninguna circunstancia.\nRespecto a la Tabla N°2, se describen detalladamente los datos del usuario al que se le asignará el dispositivo.";
                foreach (var line in textoResp.Split("\n"))
                {
                    Paragraph p = new Paragraph(line, FontFactory.GetFont(FontFactory.HELVETICA, 9));
                    p.Alignment = Element.ALIGN_JUSTIFIED;
                    document.Add(p);
                }
                document.Add(new Paragraph(" "));

                // Título Tabla N°2
                Paragraph tabla2Title = new Paragraph("Tabla N°2", FontFactory.GetFont(FontFactory.HELVETICA, 10, Font.BOLD));
                tabla2Title.Alignment = Element.ALIGN_LEFT;
                document.Add(tabla2Title);
                document.Add(new Paragraph(" "));

                // Tabla de usuario (sin título "Tabla N°2")
                PdfPTable userTable = new PdfPTable(6);
                userTable.WidthPercentage = 100;
                userTable.SetWidths(new float[] { 1.5f, 1.5f, 1.5f, 1.5f, 1.5f, 1.5f });
                string[] userHeaders = { "Nombre", "Apellido", "Rut", "Empresa", "Area", "Fecha Entrega" };
                foreach (string h in userHeaders)
                {
                    PdfPCell headerCell = new PdfPCell(new Phrase(h, FontFactory.GetFont(FontFactory.HELVETICA, 9, Font.BOLD)));
                    headerCell.BackgroundColor = new BaseColor(211, 211, 211);
                    headerCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    headerCell.Padding = 5f;
                    userTable.AddCell(headerCell);
                }

                // Datos del usuario
                string fechaEntregaStr = fechaEntrega?.ToString("dd-MM-yyyy") ?? DateTime.Now.ToString("dd-MM-yyyy");
                string[] userData = { 
                    usuario.Nombre ?? "", 
                    usuario.Apellido ?? "", 
                    usuario.Rut ?? "", 
                    usuario.Empresa ?? "", 
                    usuario.Departamento ?? "", 
                    fechaEntregaStr 
                };

                foreach (string data in userData)
                {
                    PdfPCell dataCell = new PdfPCell(new Phrase(data, FontFactory.GetFont(FontFactory.HELVETICA, 9)));
                    dataCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    dataCell.Padding = 5f;
                    userTable.AddCell(dataCell);
                }

                document.Add(userTable);
                document.Add(new Paragraph(" "));

                // Tabla de firmas
                PdfPTable firmasTable = new PdfPTable(2);
                firmasTable.WidthPercentage = 100;
                firmasTable.SetWidths(new float[] { 1f, 1f });

                // Firma usuario (lado izquierdo)
                PdfPCell userFirmaCell = new PdfPCell();
                userFirmaCell.Border = Rectangle.NO_BORDER;
                userFirmaCell.FixedHeight = 60f;
                userFirmaCell.VerticalAlignment = Element.ALIGN_BOTTOM;
                userFirmaCell.HorizontalAlignment = Element.ALIGN_CENTER;

                // Si se proporciona una firma del usuario, usarla; sino, usar línea
                if (!string.IsNullOrEmpty(userSignaturePath))
                {
                    try
                    {
                        string signaturePath = userSignaturePath.StartsWith("/storage/")
                            ? Path.Combine(Directory.GetCurrentDirectory(), "Storage", userSignaturePath.Replace("/storage/", string.Empty))
                            : Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", userSignaturePath.TrimStart('/'));
                        if (System.IO.File.Exists(signaturePath))
                        {
                            iTextSharp.text.Image signature = iTextSharp.text.Image.GetInstance(signaturePath);
                            signature.ScaleAbsolute(80, 40); // Ajustar tamaño de la firma
                            signature.Alignment = Element.ALIGN_CENTER; // Alinear imagen al centro
                            userFirmaCell.AddElement(signature);
                        }
                        else
                        {
                            userFirmaCell.Phrase = new Phrase("\n\n______________________________", FontFactory.GetFont(FontFactory.HELVETICA, 9));
                        }
                    }
                    catch
                    {
                        userFirmaCell.Phrase = new Phrase("\n\n______________________________", FontFactory.GetFont(FontFactory.HELVETICA, 9));
                    }
                }
                else
                {
                    userFirmaCell.Phrase = new Phrase("\n\n______________________________", FontFactory.GetFont(FontFactory.HELVETICA, 9));
                }
                firmasTable.AddCell(userFirmaCell);

                // Firma TI (lado derecho)
                PdfPCell tiFirmaCell = new PdfPCell();
                tiFirmaCell.Border = Rectangle.NO_BORDER;
                tiFirmaCell.FixedHeight = 60f;
                tiFirmaCell.VerticalAlignment = Element.ALIGN_BOTTOM;
                tiFirmaCell.HorizontalAlignment = Element.ALIGN_CENTER;

                // Si se proporciona una firma de admin, usarla; sino, usar línea
                if (!string.IsNullOrEmpty(adminSignaturePath))
                {
                    try
                    {
                        string signaturePath = adminSignaturePath.StartsWith("/storage/")
                            ? Path.Combine(Directory.GetCurrentDirectory(), "Storage", adminSignaturePath.Replace("/storage/", string.Empty))
                            : Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", adminSignaturePath.TrimStart('/'));
                        if (System.IO.File.Exists(signaturePath))
                        {
                            iTextSharp.text.Image signature = iTextSharp.text.Image.GetInstance(signaturePath);
                            signature.ScaleAbsolute(80, 40); // Ajustar tamaño de la firma
                            signature.Alignment = Element.ALIGN_CENTER; // Alinear imagen al centro
                            tiFirmaCell.AddElement(signature);
                        }
                        else
                        {
                            tiFirmaCell.Phrase = new Phrase("\n\n______________________________", FontFactory.GetFont(FontFactory.HELVETICA, 9));
                        }
                    }
                    catch
                    {
                        tiFirmaCell.Phrase = new Phrase("\n\n______________________________", FontFactory.GetFont(FontFactory.HELVETICA, 9));
                    }
                }
                else
                {
                    tiFirmaCell.Phrase = new Phrase("\n\n______________________________", FontFactory.GetFont(FontFactory.HELVETICA, 9));
                }
                firmasTable.AddCell(tiFirmaCell);

                // Nombres bajo firmas
                PdfPCell userNameCell = new PdfPCell(new Phrase($"Nombre: {usuario.Nombre} {usuario.Apellido} | Rut: {usuario.Rut}", FontFactory.GetFont(FontFactory.HELVETICA, 8)));
                userNameCell.Border = Rectangle.NO_BORDER;
                userNameCell.HorizontalAlignment = Element.ALIGN_CENTER;
                firmasTable.AddCell(userNameCell);

                PdfPCell tiNameCell = new PdfPCell(new Phrase("Firma TI", FontFactory.GetFont(FontFactory.HELVETICA, 8)));
                tiNameCell.Border = Rectangle.NO_BORDER;
                tiNameCell.HorizontalAlignment = Element.ALIGN_CENTER;
                firmasTable.AddCell(tiNameCell);

                document.Add(firmasTable);

                document.Close();
                return ms.ToArray();
            }
        }

        private string GetTituloActa(string categoria)
        {
            switch (categoria?.ToLower())
            {
                case "móviles":
                case "moviles":
                    return "Acta de entrega de Movil";
                case "monitores":
                    return "Acta de entrega de Monitor";
                case "periféricos":
                case "perifericos":
                    return "Acta de entrega de Periférico";
                case "accesorios":
                    return "Acta de entrega de Accesorio";
                case "red":
                    return "Acta de entrega de Equipo de Red";
                case "equipos":
                    return "Acta de entrega de Equipo";
                default:
                    return "Acta de entrega de Equipo";
            }
        }

        private string? ResolvePreferredLogoPath()
        {
            var baseDir = Directory.GetCurrentDirectory();
            string[] candidates = new string[]
            {
                // Preferir explícitamente el logo de la carpeta public del proyecto
                Path.GetFullPath(Path.Combine(baseDir, "..", "..", "public", "logo.png")),
                Path.Combine(baseDir, "public", "logo.png"),
                // Luego intentar logos genéricos en wwwroot
                Path.Combine(baseDir, "wwwroot", "logo.png"),
                // Como último recurso, permitir los logos antiguos
                Path.GetFullPath(Path.Combine(baseDir, "..", "..", "public", "logo-vicsa.png")),
                Path.Combine(baseDir, "public", "logo-vicsa.png"),
                Path.Combine(baseDir, "wwwroot", "logo-vicsa.png")
            };

            foreach (var path in candidates)
            {
                try { if (File.Exists(path)) return path; } catch { }
            }
            return null;
        }

        private PdfPTable CreateEquipmentTable(Activo activo)
        {
            // Debug logging para monitores
            if (activo.Categoria?.ToLower() == "monitores")
            {
                Console.WriteLine($"PDF - Monitor datos: Marca={activo.Marca}, Modelo={activo.Modelo}, Serie={activo.Serie}, Pulgadas={activo.Pulgadas}");
            }

            PdfPTable table;
            string[] headers;
            float[] widths;
            
            switch (activo.Categoria?.ToLower())
            {
                case "equipos":
                    // Equipos de escritorio/laptop
                    table = new PdfPTable(7);
                    widths = new float[] { 1.5f, 1.5f, 1f, 1f, 1.5f, 1f, 1.5f };
                    headers = new string[] { "Nombre", "N°Serie", "Marca", "Modelo", "Procesador", "Cantidad RAM", "Almacenamiento" };
                    break;
                    
                case "móviles":
                case "moviles":
                    // Celulares/tablets - solo campos del formulario
                    table = new PdfPTable(5);
                    widths = new float[] { 1.5f, 1.5f, 1.5f, 1.5f, 1.5f };
                    headers = new string[] { "Código", "Marca", "Modelo", "IMEI", "Almacenamiento" };
                    break;
                    
                case "periféricos":
                case "perifericos":
                    // Teclados, mouse, etc.
                    table = new PdfPTable(3);
                    widths = new float[] { 1.5f, 2f, 1f };
                    headers = new string[] { "Código", "Nombre", "Cantidad" };
                    break;
                    
                case "monitores":
                    // Monitores - como en el ejemplo (solo 4 columnas)
                    table = new PdfPTable(4);
                    widths = new float[] { 1.5f, 1.5f, 1.5f, 1.5f };
                    headers = new string[] { "Código", "Marca", "Modelo", "Pulgadas" };
                    break;
                    
                case "red":
                    // Equipos de red
                    table = new PdfPTable(3);
                    widths = new float[] { 1.5f, 2f, 1f };
                    headers = new string[] { "Código", "Nombre", "Cantidad" };
                    break;
                    
                case "accesorios":
                    // Accesorios
                    table = new PdfPTable(3);
                    widths = new float[] { 1.5f, 2f, 1f };
                    headers = new string[] { "Código", "Nombre", "Cantidad" };
                    break;
                    
                default:
                    // Tabla genérica - sin categoría
                    table = new PdfPTable(5);
                    widths = new float[] { 1.5f, 1.5f, 1.5f, 1.5f, 1.5f };
                    headers = new string[] { "Código", "Marca", "Modelo", "Serie", "Estado" };
                    break;
            }
            
            table.WidthPercentage = 100;
            table.SetWidths(widths);
            
            // Agregar headers
            foreach (string h in headers)
            {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.GetFont(FontFactory.HELVETICA, 9, Font.BOLD)));
                cell.BackgroundColor = new BaseColor(211,211,211);
                cell.HorizontalAlignment = Element.ALIGN_CENTER;
                cell.Padding = 4;
                table.AddCell(cell);
            }
            
            // Agregar datos según categoría
            switch (activo.Categoria?.ToLower())
            {
                case "equipos":
                    table.AddCell(new PdfPCell(new Phrase(activo.NombreEquipo ?? activo.Nombre ?? "Sin nombre", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Serie ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Marca ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Modelo ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Procesador ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Ram ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(FormatStorage(activo.DiscosJson ?? ""), FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    break;
                    
                case "móviles":
                case "moviles":
                    table.AddCell(new PdfPCell(new Phrase(activo.Codigo ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Marca ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Modelo ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Imei ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Capacidad ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    break;
                    
                case "periféricos":
                case "perifericos":
                    table.AddCell(new PdfPCell(new Phrase(activo.Codigo ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Nombre ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Cantidad?.ToString() ?? "1", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    break;
                    
                case "monitores":
                    table.AddCell(new PdfPCell(new Phrase(activo.Codigo ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Marca ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Modelo ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Pulgadas ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    break;
                    
                case "red":
                    table.AddCell(new PdfPCell(new Phrase(activo.Codigo ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Nombre ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Cantidad?.ToString() ?? "1", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    break;
                    
                case "accesorios":
                    table.AddCell(new PdfPCell(new Phrase(activo.Codigo ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Nombre ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Cantidad?.ToString() ?? "1", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    break;
                    
                default:
                    table.AddCell(new PdfPCell(new Phrase(activo.Codigo ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Marca ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Modelo ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Serie ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    table.AddCell(new PdfPCell(new Phrase(activo.Estado ?? "N/A", FontFactory.GetFont(FontFactory.HELVETICA, 9))) { Padding = 4 });
                    break;
            }
            
            return table;
        }
        
        private string FormatStorage(string discosJson)
        {
            if (string.IsNullOrEmpty(discosJson))
                return "N/A";
                
            try
            {
                // Intentar deserializar como array de discos
                var discosArray = System.Text.Json.JsonSerializer.Deserialize<dynamic[]>(discosJson);
                if (discosArray != null && discosArray.Length > 0)
                {
                    var primerDisco = discosArray[0];
                    string tipo = primerDisco.GetProperty("tipo").GetString() ?? "";
                    string capacidad = primerDisco.GetProperty("capacidad").GetString() ?? "";
                    
                    if (!string.IsNullOrEmpty(capacidad) && int.TryParse(capacidad, out int gb))
                    {
                        if (gb >= 1024)
                        {
                            return $"{(gb / 1024.0):F0}TB {tipo.ToUpper()}";
                        }
                        else
                        {
                            return $"{gb}GB {tipo.ToUpper()}";
                        }
                    }
                    else
                    {
                        return $"{capacidad}GB {tipo.ToUpper()}";
                    }
                }
                
                // Si no es array, intentar como objeto simple
                var disco = System.Text.Json.JsonSerializer.Deserialize<dynamic>(discosJson);
                if (disco != null)
                {
                    string tipo = disco.GetProperty("tipo").GetString() ?? "";
                    string capacidad = disco.GetProperty("capacidad").GetString() ?? "";
                    
                    if (!string.IsNullOrEmpty(capacidad) && int.TryParse(capacidad, out int gb))
                    {
                        if (gb >= 1024)
                        {
                            return $"{(gb / 1024.0):F0}TB {tipo.ToUpper()}";
                        }
                        else
                        {
                            return $"{gb}GB {tipo.ToUpper()}";
                        }
                    }
                    else
                    {
                        return $"{capacidad}GB {tipo.ToUpper()}";
                    }
                }
            }
            catch
            {
                // Si no se puede parsear, devolver el JSON original
            }
            
            return discosJson;
        }
    }
} 