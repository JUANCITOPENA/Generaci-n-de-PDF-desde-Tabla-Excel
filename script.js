// Función para cargar archivos Excel y llenar la tabla

        async function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) {
                console.error("No se ha seleccionado un archivo.");
                return;
            }

            if (!file.name.endsWith('.xlsx')) {
                console.error("Formato de archivo no soportado. Por favor, suba un archivo Excel (.xlsx).");
                return;
            }

            const reader = new FileReader();
            reader.onload = async function (e) {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const jsonData = extractFirstSheetAsJson(workbook);

                    populateTable(jsonData);
                    $('#generateQRModal').modal('show'); // Mostrar el modal para generar códigos QR
                } catch (error) {
                    console.error("Error leyendo el archivo:", error);
                }
            };

            reader.readAsBinaryString(file);
        }

        // Función para extraer datos de Excel
        function extractFirstSheetAsJson(workbook) {
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            return XLSX.utils.sheet_to_json(worksheet);
        }

        // Función para poblar la tabla con datos JSON
        function populateTable(data) {
            const tableBody = document.getElementById("dataBody");
            tableBody.innerHTML = ''; // Limpiar cualquier contenido anterior

            data.forEach((row, index) => {
                const newRow = document.createElement('tr');

                // Agregar datos a la fila
                for (const key in row) {
                    const cell = document.createElement('td');
                    cell.textContent = row[key];
                    newRow.appendChild(cell);
                }

                // Celda para el código QR
                const qrCell = document.createElement('td');
                qrCell.id = `qr-code-${index}`;
                newRow.appendChild(qrCell);

                tableBody.appendChild(newRow);
            });
        }

        // Función para generar códigos QR
        function generateQR() {
            const tableBody = document.getElementById("dataBody");

            Array.from(tableBody.children).forEach((row, index) => {
                const code = row.children[0].textContent; // Usar la primera columna para el QR
                const qrCell = document.getElementById(`qr-code-${index}`);

                new QRCode(qrCell, {
                    text: code,
                    width: 50,
                    height: 50,
                });

                row.qrCodeText = `Código QR para: ${code}`; // Texto para referencia
            });

            $('#generateQRModal').modal('hide'); // Cerrar el modal
        }

        // Función para descargar la tabla como PDF
        async function downloadTableAsPDF() {
            const table = document.getElementById("dataTable"); // ID de tu tabla HTML

            if (!table) {
                console.error("No se encontró la tabla para generar el PDF.");
                return;
            }

            try {
                // Capturar la tabla como imagen con html2canvas
                const canvas = await html2canvas(table, {
                    backgroundColor: null, // Asegurarse de que el fondo sea transparente
                });

                // Convertir la imagen a base64
                const imgData = canvas.toDataURL("image/png");

                // Crear un nuevo documento PDF
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF("p", "pt", "a4");

                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                // Agregar la imagen al PDF
                pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

                // Descargar el PDF
                const pdfFileName = `Tabla_Empleados_${Date.now()}.pdf`;
                pdf.save(pdfFileName); // Descargar el PDF
            } catch (error) {
                console.error("Error al generar el PDF:", error);
            }
        }