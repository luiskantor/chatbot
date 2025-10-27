// ============================================================
// DATUMSFORMAT-HELPER-FUNKTIONEN FÜR DEUTSCHES FORMAT
// ============================================================
//
// WICHTIG: In Deutschland nutzen wir DD.MM.YYYY
// Die API erwartet aber ISO-Format: YYYY-MM-DD
// 
// Diese Funktionen konvertieren zwischen den Formaten
// ============================================================

/**
 * Konvertiert ISO-Datum zu deutschem Format
 * @param {string} isoDate - Datum im Format "YYYY-MM-DD"
 * @returns {string} Datum im Format "DD.MM.YYYY"
 * @example formatDateGerman("2025-02-15") // returns "15.02.2025"
 */
function formatDateGerman(isoDate) {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}.${year}`;
}

/**
 * Konvertiert deutsches Datum zu ISO-Format
 * @param {string} germanDate - Datum im Format "DD.MM.YYYY"
 * @returns {string} Datum im Format "YYYY-MM-DD"
 * @example formatDateISO("15.02.2025") // returns "2025-02-15"
 */
function formatDateISO(germanDate) {
    if (!germanDate) return '';
    const [day, month, year] = germanDate.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Gibt aktuelles Datum im deutschen Format zurück
 * @returns {string} Aktuelles Datum im Format "DD.MM.YYYY"
 * @example getCurrentDateGerman() // returns "15.02.2025"
 */
function getCurrentDateGerman() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Validiert deutsches Datumsformat
 * @param {string} germanDate - Datum im Format "DD.MM.YYYY"
 * @returns {boolean} true wenn gültig, false wenn ungültig
 * @example validateGermanDate("15.02.2025") // returns true
 * @example validateGermanDate("32.13.2025") // returns false
 */
function validateGermanDate(germanDate) {
    if (!germanDate) return false;
    
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = germanDate.match(dateRegex);
    
    if (!match) return false;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Grundlegende Validierung
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    // Erstelle Date-Objekt zur weiteren Validierung
    const date = new Date(year, month - 1, day);
    
    // Prüfe ob Datum gültig ist (z.B. kein 31.02.)
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
}

/**
 * Prüft ob Datum in der Vergangenheit liegt
 * @param {string} germanDate - Datum im Format "DD.MM.YYYY"
 * @returns {boolean} true wenn in Vergangenheit, false wenn heute oder Zukunft
 * @example isDateInPast("15.02.2020") // returns true
 * @example isDateInPast("15.02.2030") // returns false
 */
function isDateInPast(germanDate) {
    const [day, month, year] = germanDate.split('.').map(Number);
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Nur Datum vergleichen, nicht Zeit
    
    return inputDate < today;
}

/**
 * Formatiert Date-Objekt zu deutschem Datumsstring
 * @param {Date} dateObj - JavaScript Date-Objekt
 * @returns {string} Datum im Format "DD.MM.YYYY"
 * @example formatDateObjectToGerman(new Date()) // returns "15.02.2025"
 */
function formatDateObjectToGerman(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Formatiert deutsches Datum schön lesbar mit ausgeschriebenem Monat
 * @param {string} germanDate - Datum im Format "DD.MM.YYYY"
 * @returns {string} Datum im Format "15. Februar 2025"
 * @example formatDateGermanReadable("15.02.2025") // returns "15. Februar 2025"
 */
function formatDateGermanReadable(germanDate) {
    const months = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    
    const [day, month, year] = germanDate.split('.').map(Number);
    return `${day}. ${months[month - 1]} ${year}`;
}

// ============================================================
// VERWENDUNGS-BEISPIELE
// ============================================================

/**
 * BEISPIEL 1: Beim Senden an die API
 * Das Buchungsformular enthält ein Datum-Input im deutschen Format
 */
function submitBookingExample() {
    const germanDate = document.getElementById('bookingDate').value; // "15.02.2025"
    
    // Validierung
    if (!validateGermanDate(germanDate)) {
        alert('Bitte gib ein gültiges Datum ein (DD.MM.YYYY)');
        return;
    }
    
    // Prüfe ob in Vergangenheit
    if (isDateInPast(germanDate)) {
        alert('Das Datum darf nicht in der Vergangenheit liegen');
        return;
    }
    
    // Konvertiere zu ISO für API
    const isoDate = formatDateISO(germanDate); // "2025-02-15"
    
    // API-Call
    apiCall('/webhook/booking-ops', {
        action: 'create',
        booking_data: {
            date: isoDate, // ISO-Format für API
            // ...
        }
    });
}

/**
 * BEISPIEL 2: Beim Anzeigen von API-Responses
 * Die API gibt Datum im ISO-Format zurück
 */
function displayBookingConfirmation(response) {
    // API Response enthält: date: "2025-02-15"
    const isoDate = response.confirmation_details.date;
    
    // Konvertiere zu deutschem Format für Anzeige
    const germanDate = formatDateGerman(isoDate); // "15.02.2025"
    
    // Optional: Schön formatiert
    const readableDate = formatDateGermanReadable(germanDate); // "15. Februar 2025"
    
    // In UI anzeigen
    const message = `
        Dein Termin wurde gebucht!
        Service: ${response.confirmation_details.service}
        Datum: ${germanDate}
        Uhrzeit: ${response.confirmation_details.time}
    `;
    
    addBotMessage(message);
}

/**
 * BEISPIEL 3: Date-Picker initialisieren
 * Setze Min-Datum auf heute (keine vergangenen Daten)
 */
function initializeDatePicker() {
    const dateInput = document.getElementById('bookingDate');
    
    // Setze Min-Datum auf heute
    const today = new Date();
    const minDate = formatDateObjectToGerman(today);
    
    // Optional: Max-Datum auf 3 Monate in der Zukunft
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxDateStr = formatDateObjectToGerman(maxDate);
    
    // Falls du ein natives HTML5 date input verwendest:
    // Konvertiere zu ISO für min/max Attribute
    dateInput.min = formatDateISO(minDate);
    dateInput.max = formatDateISO(maxDateStr);
}

// ============================================================
// INTEGRATION IN BESTEHENDEN CODE
// ============================================================

/**
 * Füge diese Funktionen am Anfang deines <script> Bereichs ein,
 * direkt nach der API_CONFIG und vor allen anderen Funktionen.
 * 
 * Dann kannst du sie überall in deinem Code verwenden:
 * 
 * - In submitBookingForm(): formatDateISO(date)
 * - In Bot-Nachrichten: formatDateGerman(response.date)
 * - In Validierungen: validateGermanDate(date)
 * - Bei Date-Inputs: getCurrentDateGerman()
 */
