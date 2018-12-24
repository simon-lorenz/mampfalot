# Mögliche API-Errors

Die API schickt immer nur einen Error-Typ pro Anfrage zurück. Sollte die Anfrage mehrere Fehler unterschiedlicher Typen enthalten, müssen diese nicht sofort alle bei der ersten Anfrage erkannt werden.

Reihenfolge, in der Fehler auftreten können:

1. AuthenticationError
2. MethodNotAllowedError
3. RequestError
4. NotFoundError
5. AuthorizationError
6. ValidationError

## Error-Typen:

### AuthenticationError

*Beschreibung:*
Tritt bei Authentifizierungsfehlern auf.

*Beispiele:*
- Eine Authentifizierung ist erforderlich, aber nicht vorhanden.
- Die Authentifizierung eines Users ist fehlgeschlagen (z.B. bei ungültigen Zugangsdaten)

*Error-Struktur:*

```javascript
{
	type: "AuthenticationError",
	message: "This request requires authentication." || "The provided credentials are incorrect."
}
```

*HTTP-Status:*
401

### MethodNotAllowedError

*Beschreibung:*
Tritt auf, wenn der User eine bekannte Route mit einer nicht unterstützen HTTP-Methode anspricht.

*Beispiel:*
- DELETE-Anfrage an /users

*Error-Struktur:*

```javascript
{
	type: "MethodNotAllowedError",
	method: string
	allowed: string[]
	message: "This method is not allowed for this route."
}
```

*HTTP-Status:*
405

### NotFoundError

*Beschreibung:*
Tritt auf, wenn eine Route oder Resource nicht gefunden werden konnte.

*Beispiele:*
- Die Resource /places/123 existiert nicht
- Die Route /foo existiert nicht

*Error-Struktur:*

```javascript
{
	type: "NotFoundError",
	resource: string,
	id: number,
	message: "The requested resource/route could not be found."
}
```

*HTTP-Status:*
404

### RequestError

*Beschreibung:*
Dieser Fehlertyp ist für alle Grenzfälle vorgesehen, für die die anderen Errorarten nicht passen.

*Beispiele:*
- Ein User spricht die Router GET /users ohne Query an. Statt 404 schicken wir einen RequestError mit einem Hinweis.
- Eine GET-Anfrage der Route /auth enthält keinen Authorization-Header

*Error-Struktur:*

```javascript
{
	type: "RequestError",
	message: string
}
```

*HTTP-Status:*
400

### AuthorizationError

*Beschreibung:*
Tritt auf, wenn die Berechtigung eines User für einen CRUD-Vorgang nicht ausreicht

*Beispiele:*
- GET-Zugriff auf Gruppenresource, wenn der User kein Gruppenmitglied ist
- POST-Zugriff auf Gruppenresource, wenn der User kein Gruppenadmin ist

*Error-Struktur:*

```javascript
{
	type: "AuthorizationError",
	resource: string,
	id: number,
	operation: string,
	message: string
}
```

*HTTP-Status:*
403 Forbidden

### ValidationError

*Beschreibung:*
Dieser Error tritt auf, sobald ein ungültiger Wert für eine Ressource angegeben wird.

*Beispiele:*

- Zahlen außerhalb gültigem Bereich
- Ungültige E-Mail-Adresse
- Leerer Wert
- Fehlender Wert

*Error-Struktur:*

```javascript
{
	type: "ValidationError",
	errors: [
		{
			field: string,
			value: any,
			message: string
		}
	]
}
```

*HTTP-Status:*
400

### ServerError

*Beschreibung:*
Ein serverseitiger Fehler ist aufgetreten. Weitere Details sollten zu Debug-Zwecken in Logs gespeichert werden.

*Beispiele:*
- Die Verbindung zur Datenbank schlägt fehl.
- Programmierfehler führen zu nicht beachteten Exceptions

*Error-Struktur:*

```javascript
{
	type: "ServerError",
	message: "An internal error occurred."
}
```

*HTTP-Status:*
500
