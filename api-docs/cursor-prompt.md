# CURSOR PROMPT: Chatbot Frontend für n8n Backend Integration

## KONTEXT
Du erhältst ein vollständiges Chatbot-Frontend (index.html) mit Mock-Daten und Test-Logik. Deine Aufgabe ist es, dieses Frontend für die Integration mit einem produktiven n8n Workflow-Backend vorzubereiten.

## DEIN ZIEL
Transformiere das Frontend von Mock-Daten zu echten API-Calls, während die komplette UI/UX erhalten bleibt.

---

## SCHRITT 1: MOCK-LOGIK IDENTIFIZIEREN UND ENTFERNEN

### Was MUSS entfernt werden:
1. **Mock-Antworten in der `sendMessage()` Funktion**
   - Alle hardcodierten Bot-Antworten (z.B. "Hallo! Wie kann ich dir helfen?")
   - Alle if/else-Logik für Keyword-Matching
   - Alle setTimeout() für simulierte Bot-Antworten

2. **Mock-Daten in allen Funktionen**
   - `submitBookingForm()` - Mock-Erfolg-Responses
   - `submitFeedbackForm()` - Mock-Feedback-Verarbeitung
   - `submitContactForm()` - Mock-Kontakt-Bestätigungen

3. **Simulations-Code**
   - Alle `console.log()` Statements, die Mock-Daten ausgeben
   - Fake Typing-Delays ohne echte API-Calls

---

## SCHRITT 2: API-INTEGRATION IMPLEMENTIEREN

### 2.1 Session Management hinzufügen
```javascript
// Am Anfang des <script> Bereichs
let sessionId = localStorage.getItem('chatbot_session_id');
if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('chatbot_session_id', sessionId);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
```

### 2.2 API-Konfiguration
```javascript
const API_CONFIG = {
    baseUrl: 'https://DEINE-N8N-DOMAIN.com',
    endpoints: {
        chat: '/webhook/chat',
        booking: '/webhook/booking-ops',
        feedback: '/webhook/feedback',
        handover: '/webhook/handover'
    },
    timeout: 12000
};
```

### 2.3 Generische API-Call-Funktion
```javascript
async function apiCall(endpoint, data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.');
        }
        
        throw error;
    }
}
```

---

## SCHRITT 3: FUNKTIONEN ANPASSEN

### 3.1 sendMessage() Funktion
**ERSETZE die komplette Mock-Logik durch:**

```javascript
async function sendMessage() {
    const textarea = document.getElementById('messageInput');
    const message = textarea.value.trim();
    
    if (!message || isBotTyping) return;
    
    // User-Nachricht anzeigen (bleibt wie gehabt)
    // ... [bestehender UI-Code] ...
    
    // Bot-Antwort holen
    isBotTyping = true;
    showTypingText();
    
    try {
        const response = await apiCall(API_CONFIG.endpoints.chat, {
            content: message,
            session_id: sessionId
        });
        
        hideTypingText();
        
        // Bot-Nachricht anzeigen
        addBotMessage(response.message);
        
        // Quick Replies anzeigen (falls vorhanden)
        if (response.quick_replies && response.quick_replies.length > 0) {
            addQuickReplies(response.quick_replies);
        }
        
        // Feedback-Buttons anzeigen
        setTimeout(() => {
            addFeedbackButtons();
        }, 500);
        
    } catch (error) {
        hideTypingText();
        addBotMessage(`Entschuldigung, es gab einen Fehler: ${error.message}. Bitte versuche es erneut.`);
        console.error('Chat API Error:', error);
    } finally {
        isBotTyping = false;
    }
}
```

### 3.2 submitBookingForm() Funktion
**ERSETZE die Mock-Logik durch:**

```javascript
async function submitBookingForm() {
    // Validierung (bleibt wie gehabt)
    // ... [bestehender Validierungs-Code] ...
    
    if (!isValid) return;
    
    // UI Update: Loading State
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gebucht...';
    
    try {
        // Datum von deutschem Format (DD.MM.YYYY) zu ISO (YYYY-MM-DD) konvertieren
        const dateISO = formatDateISO(date); // Nutze Helper-Funktion
        
        const response = await apiCall(API_CONFIG.endpoints.booking, {
            action: 'create',
            session_id: sessionId,
            booking_data: {
                service: service,
                date: dateISO, // ISO-Format für API
                time: time,
                customer_name: name,
                customer_email: email,
                customer_phone: phone || ''
            }
        });
        
        if (response.success) {
            submitBtn.textContent = 'Gebucht ✓';
            
            setTimeout(() => {
                closeBookingForm();
                
                // Bestätigungsnachricht mit deutschem Datumsformat
                const confirmationText = response.message + 
                    (response.confirmation_details ? 
                        `\n\nDetails:\nService: ${response.confirmation_details.service}\nDatum: ${formatDateGerman(response.confirmation_details.date)}\nUhrzeit: ${response.confirmation_details.time}` 
                        : '');
                
                addBotMessage(confirmationText);
                
                // Formular zurücksetzen
                resetBookingForm();
            }, 2000);
        }
        
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Termin buchen';
        alert(`Fehler beim Buchen: ${error.message}`);
        console.error('Booking API Error:', error);
    }
}
```

### 3.3 submitFeedbackForm() Funktion
**ERSETZE die Mock-Logik durch:**

```javascript
async function submitFeedbackForm() {
    const rating = document.querySelector('input[name="rating"]:checked');
    const comment = document.getElementById('feedbackComment').value.trim();
    
    if (!rating) {
        alert('Bitte wähle eine Bewertung aus.');
        return;
    }
    
    const submitBtn = document.getElementById('feedbackSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet...';
    
    try {
        const response = await apiCall(API_CONFIG.endpoints.feedback, {
            session_id: sessionId,
            rating: parseInt(rating.value),
            comment: comment || '',
            type: 'general'
        });
        
        if (response.success) {
            submitBtn.textContent = 'Gesendet ✓';
            
            setTimeout(() => {
                closeFeedbackForm();
                addBotMessage(response.message || 'Vielen Dank für dein Feedback!');
                resetFeedbackForm();
            }, 1500);
        }
        
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Feedback senden';
        alert(`Fehler beim Senden: ${error.message}`);
        console.error('Feedback API Error:', error);
    }
}
```

### 3.4 submitContactForm() Funktion
**ERSETZE die Mock-Logik durch:**

```javascript
async function submitContactForm() {
    // Validierung (bleibt wie gehabt)
    // ... [bestehender Validierungs-Code] ...
    
    if (!isValid) return;
    
    const submitBtn = document.getElementById('contactSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet...';
    
    try {
        const response = await apiCall(API_CONFIG.endpoints.handover, {
            session_id: sessionId,
            reason: 'Kontaktformular',
            customer_name: name,
            customer_email: email,
            customer_message: message
        });
        
        if (response.success) {
            submitBtn.textContent = 'Gesendet ✓';
            
            setTimeout(() => {
                closeContactForm();
                addBotMessage(response.message);
                resetContactForm();
            }, 2000);
        }
        
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Nachricht senden';
        alert(`Fehler beim Senden: ${error.message}`);
        console.error('Handover API Error:', error);
    }
}
```

### 3.5 handleFeedback() Funktion für Thumbs Up/Down
**NEUE Funktion hinzufügen:**

```javascript
async function handleFeedback(type, button) {
    // Bestehenden UI-Code behalten
    // ... [bestehender Feedback-UI-Code] ...
    
    // API-Call hinzufügen
    try {
        await apiCall(API_CONFIG.endpoints.feedback, {
            session_id: sessionId,
            rating: type === 'up' ? 5 : 1,
            type: 'message',
            message_id: button.closest('.message').dataset.messageId || ''
        });
    } catch (error) {
        console.error('Feedback tracking error:', error);
        // Fehler nicht dem User anzeigen, nur loggen
    }
}
```

---

## SCHRITT 4: HELPER-FUNKTIONEN HINZUFÜGEN

```javascript
// Datumsformat-Konvertierung: ISO → Deutsch (DD.MM.YYYY)
function formatDateGerman(isoDate) {
    // Input: "2025-02-15" → Output: "15.02.2025"
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}.${year}`;
}

// Datumsformat-Konvertierung: Deutsch → ISO (YYYY-MM-DD)
function formatDateISO(germanDate) {
    // Input: "15.02.2025" → Output: "2025-02-15"
    const [day, month, year] = germanDate.split('.');
    return `${year}-${month}-${day}`;
}

// Aktuelles Datum im deutschen Format
function getCurrentDateGerman() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}.${month}.${year}`;
}

// Bot-Nachricht hinzufügen (vereinfacht bestehenden Code)
function addBotMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    
    const now = Date.now();
    const isGrouped = lastBotMessageTime && (now - lastBotMessageTime) < 10000;
    if (isGrouped) markPreviousBotAsGrouped();
    lastBotMessageTime = now;
    
    const messageEl = document.createElement('div');
    messageEl.className = isGrouped ? 'message bot grouped' : 'message bot';
    messageEl.innerHTML = `
        <div class="message-avatar">
            <!-- SVG Avatar -->
        </div>
        <div>
            <div class="message-content">${text}</div>
            <div class="message-timestamp">
                <span>${getCurrentTime()}</span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageEl);
    lastBotMessageElement = messageEl;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Quick Replies hinzufügen
function addQuickReplies(replies) {
    const chatMessages = document.getElementById('chatMessages');
    
    const quickRepliesEl = document.createElement('div');
    quickRepliesEl.className = 'quick-replies';
    
    replies.forEach(reply => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = reply.text;
        btn.onclick = () => {
            document.getElementById('messageInput').value = reply.payload;
            sendMessage();
            quickRepliesEl.remove();
        };
        quickRepliesEl.appendChild(btn);
    });
    
    chatMessages.appendChild(quickRepliesEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
```

---

## SCHRITT 5: ERROR HANDLING VERBESSERN

```javascript
// Globaler Error Handler
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Optional: User-Feedback bei kritischen Fehlern
    if (isBotTyping) {
        hideTypingText();
        addBotMessage('Entschuldigung, es ist ein unerwarteter Fehler aufgetreten. Bitte lade die Seite neu.');
        isBotTyping = false;
    }
});
```

---

## SCHRITT 6: KONFIGURATION ANPASSEN

**WICHTIG: Ersetze die Placeholder-URL:**
```javascript
const API_CONFIG = {
    baseUrl: 'https://n8n.DEINE-DOMAIN.de',  // <-- HIER ECHTE URL EINTRAGEN
    // ...
};
```

---

## WAS BLEIBT UNVERÄNDERT:
✅ Komplettes UI/UX Design
✅ Alle Animationen und Transitions
✅ HTML-Struktur
✅ CSS-Styles
✅ Formular-Validierungen (Client-Side)
✅ Event-Listener
✅ Popup-Management
✅ Typing-Indikator UI
✅ Feedback-Button-Interaktionen (nur UI-State)

---

## TESTING CHECKLIST:

Nach der Anpassung teste:
- [ ] Session-ID wird generiert und persistiert
- [ ] Chat-Nachrichten werden korrekt an API gesendet
- [ ] Bot-Antworten werden korrekt angezeigt
- [ ] Buchungsformular sendet Daten an API
- [ ] Feedback-System funktioniert
- [ ] Kontaktformular sendet Daten an API
- [ ] Error-Handling funktioniert (Timeout, Netzwerk-Fehler)
- [ ] Loading-States werden angezeigt
- [ ] Quick-Replies funktionieren (falls vom Backend unterstützt)

---

## ZUSÄTZLICHE HINWEISE:

1. **Session-Persistenz:** Überlege, ob Session pro Tab oder pro Browser gewünscht ist
2. **Debug-Modus:** Füge optional einen Debug-Toggle hinzu für Console-Logs
3. **Offline-Handling:** Optional eine Offline-Nachricht anzeigen
4. **Rate-Limiting:** Optional Client-seitiges Rate-Limiting implementieren

---

## FINALE STRUKTUR:

Das fertige Frontend sollte:
1. ✅ Session-Management haben
2. ✅ Alle API-Endpoints korrekt aufrufen
3. ✅ Error-Handling implementiert haben
4. ✅ Loading-States zeigen
5. ✅ Die komplette UI/UX behalten
6. ✅ Produktionsbereit sein

---

## WICHTIG:
- Entferne ALLE console.log() Statements mit Mock-Daten
- Behalte ALLE UI/UX Funktionen bei
- Teste jeden API-Call einzeln
- Nutze die bereitgestellte API-Dokumentation (cursor-context-api-docs.json)
- **DATUMSFORMAT: Immer ISO (YYYY-MM-DD) an API senden, aber deutsches Format (DD.MM.YYYY) in der UI anzeigen**
- Nutze die bereitgestellten Helper-Funktionen für Datumskonvertierung
