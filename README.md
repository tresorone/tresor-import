# Tresor-Import - The File Import of Tresor One

This is the PDF and PP-CSV Import used on [tresor.one](https://tresor.one)

### Contribute

To contribute:

1. fork the repo
2. install and start `npm i && npm start`
3. open [`http://localhost:5000`](http://localhost:5000) in your browser
4. Import a PDF. Content is shown in your Javascript console
5. Write a parser in `src/brokers` to parse that content - see `src/brokers/comdirect.js` for inspiration
6. Add and run all tests `npm t`
7. Create a Pull Request

# Guide zum Auslesen des Amounts
Diese Erklärung stammt von Sumit aus Issue #44
Beim Zusammenspiel von Kurs, Steuern und Gebühren kann es ggf. zu Verwirrungen kommen, welche Werte für den amount einer Aktivität genommen werden soll.

Nehmen wir folgende Aktivitäten als Beispiel:
![](https://user-images.githubusercontent.com/2399810/82758263-b5b79380-9de5-11ea-8f76-d9a266e8b3d7.png)
In T1 dreht sich alles um die Wertpapiere. Die Liste der Aktivitäten soll somit die Beträge darstellen, die den Wert des Wertpapieres wieder spiegeln.

Deshalb gilt:
```price * shares === amount // true```

Bei einem Kauf, zahlt man Gebühren vor dem Kauf.
Bei einem Verkauf, zahlt man Gebühren nach dem Verkauf.

Und das wiederum bedeutet, dass bei einem Kauf der amount Betrag ohne Gebühren ist - also Netto. Während der Betrag bei einem Verkauf Brutto ist, da die Gebühren erst danach abgezogen werden.

Beispiel:
comdirect Verkauf
![](https://user-images.githubusercontent.com/2399810/82758363-67ef5b00-9de6-11ea-8428-43d4c28a8279.png)
Hier muss, da ```share * price === amount // true``` gilt, der obige Betrag 5201,81 als amount geparsed werden.

Trade Republic Marriott Kauf
![](https://user-images.githubusercontent.com/2399810/82758391-953c0900-9de6-11ea-82ea-c6e34fcd879b.png)  
Hier muss ebenfalls der obige Betrag von ```548,31``` als amount geparsed werden. Nur so gilt ```share * price === amount // true```.
## Berechnung in T1

Das bedeutet, dass die Netto-Gewinn-Berechnung in T1 nur die Gebühren der Verkäufe berücksichtigt, da diese im Nachhinein abgezogen werden müssen. Gebühren der Käufe sind gar nicht erst Teil des investierten Kapitals.
Im Dropdown, werden jedoch trotzdem alle Gebühren gelistet als Information für den User.

![](https://user-images.githubusercontent.com/2399810/82758472-0976ac80-9de7-11ea-92a5-27d88afb2d31.png)
Wie man sieht, fehlt hier circa 1€ zwischen Kursgewinn - Gebühren und dem Bruttogewinn. Das ist der 1€ der Kaufgebühr für Marriott war.

Hoffe das macht soweit Sinn - ich wollte hier lediglich etwas Klarheit schaffen, da wir eben einen Bug diesbezüglich in T1 entdeckt hatten (bei der Gewinn-Berechnung, nicht beim PDF parsen)