Beim Zusammenspiel von Kurs, Steuern und Gebühren kann es ggf. zu Verwirrungen kommen, welche Werte für den `amount` einer Aktivität genommen werden soll. Nehmen wir folgende Aktivitäten als Beispiel:
![image](https://user-images.githubusercontent.com/2399810/82758263-b5b79380-9de5-11ea-8f76-d9a266e8b3d7.png)

In T1 dreht sich alles um die Wertpapiere. Die Liste der Aktivitäten soll somit die Beträge darstellen, die den Wert des Wertpapieres wieder spiegeln.

Deshalb gilt:
`price * shares === amount` // true

Bei einem Kauf, zahlt man Gebühren und Steuern _vor dem Kauf_.
Bei einem Verkauf, zahlt man Gebühren und Steuern _nach dem Verkauf_.
Bei einer Dividende, zahlt man Gebühren und Steuern _nach der Gutschrift_.

Und das wiederum bedeutet, dass bei einem Kauf der `amount` Betrag _ohne_ Gebühren und Steuern ist - also Netto. Während der Betrag bei einem Verkauf und von Dividenden Brutto ist, da die Gebühren erst danach abgezogen werden.

Beispiel:
comdirect Verkauf
![image](https://user-images.githubusercontent.com/2399810/82758363-67ef5b00-9de6-11ea-8428-43d4c28a8279.png)

Hier muss, da `share * price === amount // true` gilt, der obige Betrag `5201,81` als `amount` geparsed werden.

Trade Republic Marriott Kauf
![image](https://user-images.githubusercontent.com/2399810/82758391-953c0900-9de6-11ea-82ea-c6e34fcd879b.png)

Hier muss ebenfalls der obige Betrag von `548,31` als `amount` geparsed werden. Nur so gilt `share * price === amount // true`.

### Berechnung in T1

Das bedeutet, dass die Netto-Gewinn-Berechnung in T1 nur die Gebühren der Verkäufe berücksichtigt, da diese im Nachhinein abgezogen werden müssen. Gebühren der Käufe sind gar nicht erst Teil des investierten Kapitals.
Im Dropdown, werden jedoch trotzdem alle Gebühren gelistet als Information für den User.

![image](https://user-images.githubusercontent.com/2399810/82758472-0976ac80-9de7-11ea-92a5-27d88afb2d31.png)

Wie man sieht, fehlt hier circa 1€ zwischen Kursgewinn - Gebühren und dem Bruttogewinn. Das ist der 1€ der Kaufgebühr für Marriott war.

Hoffe das macht soweit Sinn - ich wollte hier lediglich etwas Klarheit schaffen, da wir eben einen Bug diesbezüglich in T1 entdeckt hatten (bei der Gewinn-Berechnung, nicht beim PDF parsen)
