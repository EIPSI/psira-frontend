"""Human-readable workbook content. XLSForm identifiers and expressions stay unchanged."""
from copy import deepcopy

LANGS = ('en', 'de', 'nl')

def t(en, de, nl):
    return dict(zip(LANGS, (en, de, nl)))

SHEET_NAMES = {
    'LEEME': t('README', 'BITTE_LESEN', 'LEESMIJ'),
    'EJEMPLO_PASO_A_PASO': t('STEP_BY_STEP', 'SCHRITT_FUER_SCHRITT', 'STAP_VOOR_STAP'),
    'DICCIONARIO': t('DICTIONARY', 'WOERTERBUCH', 'WOORDENLIJST'),
    'TIPOS': t('TYPES', 'TYPEN', 'TYPEN'),
    'APARIENCIAS': t('APPEARANCES', 'DARSTELLUNG', 'WEERGAVE'),
    'CONDICIONES': t('CONDITIONS', 'BEDINGUNGEN', 'VOORWAARDEN'),
    'COMPATIBILIDAD': t('COMPATIBILITY', 'KOMPATIBILITAET', 'COMPATIBILITEIT'),
    'PRUEBAS': t('TESTS', 'TESTS', 'TESTS'),
}

# Each entry translates a whole cell, never fragments of an XLSForm expression.
TEXT = {}
def text(source, en, de, nl):
    TEXT[source] = t(en, de, nl)

text('Tipos básicos y condiciones', 'Basic types and conditions', 'Grundtypen und Bedingungen', 'Basistypen en voorwaarden')
text('Este cuestionario es una demostración. Editá una copia; conservá los nombres de las hojas técnicas.', 'This is a demonstration questionnaire. Edit a copy; keep the technical sheet names.', 'Dies ist ein Beispielfragebogen. Bearbeiten Sie eine Kopie und behalten Sie die technischen Blattnamen bei.', 'Dit is een voorbeeldvragenlijst. Bewerk een kopie en behoud de technische bladnamen.')
text('¿Qué te gustaría contarnos?', 'What would you like to tell us?', 'Was möchten Sie uns mitteilen?', 'Wat wilt u ons vertellen?')
text('Máximo 250 caracteres.', 'Maximum 250 characters.', 'Höchstens 250 Zeichen.', 'Maximaal 250 tekens.')
text('Escribí tu comentario para continuar.', 'Enter your comment to continue.', 'Geben Sie Ihren Kommentar ein, um fortzufahren.', 'Voer uw opmerking in om verder te gaan.')
text('¿Cuántos días hiciste actividad física?', 'On how many days were you physically active?', 'An wie vielen Tagen waren Sie körperlich aktiv?', 'Op hoeveel dagen was u lichamelijk actief?')
text('Número entero.', 'Whole number.', 'Ganze Zahl.', 'Geheel getal.')
text('¿Cuántas horas dormiste?', 'How many hours did you sleep?', 'Wie viele Stunden haben Sie geschlafen?', 'Hoeveel uur heeft u geslapen?')
text('Admite decimales.', 'Decimals are allowed.', 'Dezimalzahlen sind möglich.', 'Decimalen zijn toegestaan.')
text('Fecha de referencia', 'Reference date', 'Bezugsdatum', 'Referentiedatum')
text('Hora de referencia', 'Reference time', 'Bezugsuhrzeit', 'Referentietijd')
text('Fecha y hora de referencia', 'Reference date and time', 'Bezugsdatum und Uhrzeit', 'Referentiedatum en -tijd')
text('Confirmo que leí las instrucciones', 'I confirm that I have read the instructions', 'Ich bestätige, dass ich die Anweisungen gelesen habe', 'Ik bevestig dat ik de instructies heb gelezen')
text('Una casilla; marcar y desmarcar guarda verdadero o falso.', 'One checkbox; checking or clearing it saves true or false.', 'Ein Kontrollkästchen; Aktivieren oder Deaktivieren speichert true oder false.', 'Eén selectievakje; aan- of uitvinken slaat true of false op.')
text('¿Realizaste alguna actividad?', 'Did you do any physical activity?', 'Haben Sie sich körperlich betätigt?', 'Heeft u lichamelijke activiteit gedaan?')
text('¿Qué actividad realizaste?', 'What activity did you do?', 'Welche Aktivität haben Sie ausgeübt?', 'Welke activiteit heeft u gedaan?')
text('Seleccioná entre uno y dos síntomas', 'Select one or two symptoms', 'Wählen Sie ein oder zwei Symptome', 'Selecteer één of twee symptomen')
text('Esta nota aparece cuando días es mayor que tres.', 'This note appears when the number of days is greater than three.', 'Dieser Hinweis erscheint, wenn die Anzahl der Tage größer als drei ist.', 'Deze opmerking verschijnt als het aantal dagen groter is dan drie.')
text('Describí el dolor seleccionado', 'Describe the pain you selected', 'Beschreiben Sie den ausgewählten Schmerz', 'Beschrijf de geselecteerde pijn')
text('Actividad confirmada y más de tres días.', 'Activity confirmed and more than three days.', 'Aktivität bestätigt und mehr als drei Tage.', 'Activiteit bevestigd en meer dan drie dagen.')
text('También podés incluir imágenes en las preguntas.', 'You can also include images in questions.', 'Sie können auch Bilder in Fragen einfügen.', 'U kunt ook afbeeldingen in vragen opnemen.')
text('Opciones y apariencias', 'Choices and appearances', 'Antwortoptionen und Darstellung', 'Antwoordopties en weergave')
text('Respuesta única habitual', 'Standard single choice', 'Standard-Einzelauswahl', 'Standaard enkele keuze')
text('El valor guardado es choices.name.', 'The stored value is choices.name.', 'Der gespeicherte Wert ist choices.name.', 'De opgeslagen waarde is choices.name.')
text('Respuesta única con tarjetas', 'Single choice with cards', 'Einzelauswahl mit Karten', 'Enkele keuze met kaarten')
text('Escala Likert individual', 'Individual Likert scale', 'Einzelne Likert-Skala', 'Afzonderlijke Likertschaal')
text('Respuesta múltiple habitual', 'Standard multiple choice', 'Standard-Mehrfachauswahl', 'Standaard meervoudige keuze')
text('Opciones con imágenes', 'Choices with images', 'Antwortoptionen mit Bildern', 'Antwoordopties met afbeeldingen')
text('Matriz Likert', 'Likert matrix', 'Likert-Matrix', 'Likertmatrix')
text('Tuve energía', 'I had energy', 'Ich hatte Energie', 'Ik had energie')
text('Pude concentrarme', 'I was able to concentrate', 'Ich konnte mich konzentrieren', 'Ik kon me concentreren')
text('Considerá la última semana.', 'Think about the past week.', 'Denken Sie an die vergangene Woche.', 'Denk aan de afgelopen week.')
text('Descansé bien', 'I rested well', 'Ich habe mich gut erholt', 'Ik ben goed uitgerust')
text('Matriz compatible con archivos anteriores', 'Matrix compatible with earlier files', 'Mit älteren Dateien kompatible Matrix', 'Matrix die compatibel is met eerdere bestanden')
text('Me sentí bien', 'I felt well', 'Ich fühlte mich gut', 'Ik voelde me goed')
text('Sentí apoyo', 'I felt supported', 'Ich fühlte mich unterstützt', 'Ik voelde me gesteund')
text('Deslizadores y escalas VAS', 'Sliders and VAS scales', 'Schieberegler und VAS-Skalen', 'Schuifregelaars en VAS-schalen')
text('Deslizador entero de 0 a 10', 'Integer slider from 0 to 10', 'Ganzzahliger Schieberegler von 0 bis 10', 'Schuifregelaar met gehele getallen van 0 tot 10')
text('Deslizador de 0 a 1 en pasos de 0,1', 'Slider from 0 to 1 in steps of 0.1', 'Schieberegler von 0 bis 1 in Schritten von 0,1', 'Schuifregelaar van 0 tot 1 in stappen van 0,1')
text('VAS continua con etiquetas en extremos', 'Continuous VAS with endpoint labels', 'Kontinuierliche VAS mit Endpunktbeschriftungen', 'Continue VAS met labels aan de uiteinden')
text('Se guarda un número solo cuando interactuás con la escala. Sin interacción sigue sin responder.', 'A number is saved only after you interact with the scale. Without interaction it remains unanswered.', 'Ein Wert wird erst nach einer Interaktion mit der Skala gespeichert. Ohne Interaktion bleibt die Frage unbeantwortet.', 'Een getal wordt pas opgeslagen na interactie met de schaal. Zonder interactie blijft de vraag onbeantwoord.')
text('VAS con etiquetas intermedias, posiciones y estilo personalizados', 'VAS with intermediate labels, custom positions and styling', 'VAS mit Zwischenbeschriftungen, eigenen Positionen und Gestaltung', 'VAS met tussenlabels, aangepaste posities en opmaak')
text('VAS sin mostrar el número seleccionado', 'VAS with the selected number hidden', 'VAS ohne Anzeige des ausgewählten Zahlenwerts', 'VAS zonder weergave van het geselecteerde getal')
text('Nada', 'None', 'Gar nicht', 'Helemaal niet')
text('Máxima intensidad', 'Maximum intensity', 'Höchste Intensität', 'Maximale intensiteit')
text('Máximo', 'Maximum', 'Maximum', 'Maximum')
text('Muy desagradable', 'Very unpleasant', 'Sehr unangenehm', 'Zeer onaangenaam')
text('Muy agradable', 'Very pleasant', 'Sehr angenehm', 'Zeer aangenaam')
text('Sí', 'Yes', 'Ja', 'Ja')
text('No', 'No', 'Nein', 'Nee')
text('Cansancio', 'Fatigue', 'Müdigkeit', 'Vermoeidheid')
text('Dolor', 'Pain', 'Schmerz', 'Pijn')
text('Estrés', 'Stress', 'Stress', 'Stress')
text('Muy insatisfecho', 'Very dissatisfied', 'Sehr unzufrieden', 'Zeer ontevreden')
text('Insatisfecho', 'Dissatisfied', 'Unzufrieden', 'Ontevreden')
text('Neutral', 'Neutral', 'Neutral', 'Neutraal')
text('Satisfecho', 'Satisfied', 'Zufrieden', 'Tevreden')
text('Muy satisfecho', 'Very satisfied', 'Sehr zufrieden', 'Zeer tevreden')
text('Nunca', 'Never', 'Nie', 'Nooit')
text('A veces', 'Sometimes', 'Manchmal', 'Soms')
text('Frecuentemente', 'Often', 'Häufig', 'Vaak')
text('Siempre', 'Always', 'Immer', 'Altijd')
text('Imagen de ejemplo', 'Example image', 'Beispielbild', 'Voorbeeldafbeelding')
text('Otra opción', 'Another option', 'Andere Option', 'Andere optie')
text('Leve', 'Mild', 'Leicht', 'Licht')
text('Moderado', 'Moderate', 'Mäßig', 'Matig')
text('Alto', 'High', 'Hoch', 'Hoog')
text('¿Cómo te sentís?', 'How do you feel?', 'Wie fühlen Sie sich?', 'Hoe voelt u zich?')
text('Pensá en la última semana.', 'Think about the past week.', 'Denken Sie an die vergangene Woche.', 'Denk aan de afgelopen week.')
text('Respondé antes de continuar.', 'Answer before continuing.', 'Antworten Sie, bevor Sie fortfahren.', 'Beantwoord de vraag voordat u verdergaat.')

# Rows use exactly the same sequence as the Spanish guide; technical columns are not translated.
GUIDE = [
 (t('Contents', 'Inhalt', 'Inhoud'), t('survey, choices and settings form a real questionnaire. The documentation sheets can remain in the uploaded file.', 'survey, choices und settings bilden einen echten Fragebogen. Die Dokumentationsblätter dürfen in der hochgeladenen Datei bleiben.', 'survey, choices en settings vormen een echte vragenlijst. De documentatiebladen mogen in het geüploade bestand blijven.')),
 (t('Getting started', 'Erste Schritte', 'Aan de slag'), t('Save a copy, change form_id and form_title in settings, then edit survey. Keep the technical column headers.', 'Speichern Sie eine Kopie, ändern Sie form_id und form_title in settings und bearbeiten Sie survey. Behalten Sie die technischen Spaltenüberschriften bei.', 'Sla een kopie op, wijzig form_id en form_title in settings en bewerk survey. Behoud de technische kolomkoppen.')),
 (t('Compatibility', 'Kompatibilität', 'Compatibiliteit'), t('Earlier files still work. New columns are optional. This is the PSIRA format, not the entire XLSForm standard.', 'Ältere Dateien funktionieren weiterhin. Neue Spalten sind optional. Dies ist das PSIRA-Format, nicht der vollständige XLSForm-Standard.', 'Eerdere bestanden blijven werken. Nieuwe kolommen zijn optioneel. Dit is het PSIRA-formaat, niet de volledige XLSForm-standaard.')),
 (t('Structure', 'Struktur', 'Structuur'), t('Put every question between begin_group and end_group. Do not nest groups. Question names must be unique.', 'Platzieren Sie jede Frage zwischen begin_group und end_group. Verschachteln Sie keine Gruppen. Fragenamen müssen eindeutig sein.', 'Plaats elke vraag tussen begin_group en end_group. Gebruik geen geneste groepen. Vraagidentificatoren moeten uniek zijn.')),
 (t('Pages', 'Seiten', 'Pagina’s'), t('In survey, use page_break_before=TRUE on begin_group to start a page. These pages combine with bundle pages, randomization and rich headers/footers, without splitting matrices or creating empty pages.', 'Verwenden Sie in survey page_break_before=TRUE bei begin_group für eine neue Seite. Dies ergänzt Paketseiten, Randomisierung sowie Kopf- und Fußzeilen, ohne Matrizen zu teilen oder leere Seiten zu erzeugen.', 'Gebruik in survey page_break_before=TRUE bij begin_group voor een nieuwe pagina. Dit werkt samen met pakketpagina’s, randomisatie en kop- en voetteksten, zonder matrices te splitsen of lege pagina’s te maken.')),
 (t('Stored codes', 'Gespeicherte Codes', 'Opgeslagen codes'), t('name identifies a question; choices.name identifies an answer. Changing codes in instruments already in use can affect scripts and historical comparisons.', 'name identifiziert eine Frage, choices.name eine Antwort. Änderungen an Codes bereits verwendeter Instrumente können Skripte und historische Vergleiche beeinflussen.', 'name identificeert een vraag; choices.name identificeert een antwoord. Codes wijzigen in gebruikte instrumenten kan scripts en historische vergelijkingen beïnvloeden.')),
 (t('Choices and scales', 'Auswahl und Skalen', 'Keuzes en schalen'), t('Likert preserves choices codes. VAS/slider store a numeric numberValue. An untouched control is not an answer.', 'Likert behält die Codes aus choices bei. VAS/slider speichern einen numerischen numberValue. Ein unberührtes Feld gilt nicht als Antwort.', 'Likert behoudt de codes uit choices. VAS/slider slaan een numerieke numberValue op. Een onaangeraakt veld telt niet als antwoord.')),
 (t('Displayed value', 'Angezeigter Wert', 'Weergegeven waarde'), t('The display shows up to three decimal places; the stored value retains its precision. Touch or move the scale, or confirm with Enter.', 'Die Anzeige zeigt bis zu drei Nachkommastellen; der gespeicherte Wert behält seine Genauigkeit. Berühren oder bewegen Sie die Skala oder bestätigen Sie mit Enter.', 'De weergave toont maximaal drie decimalen; de opgeslagen waarde behoudt haar precisie. Raak de schaal aan, verplaats deze of bevestig met Enter.')),
 (t('Continuous VAS', 'Kontinuierliche VAS', 'Continue VAS'), t('Use type=decimal and range_step=any. Continuity is limited by numeric precision and device resolution; it is not infinite mathematical precision.', 'Verwenden Sie type=decimal und range_step=any. Die Kontinuität ist durch Zahlengenauigkeit und Geräteauflösung begrenzt; sie bedeutet keine unendliche mathematische Genauigkeit.', 'Gebruik type=decimal en range_step=any. Continuïteit is beperkt door numerieke precisie en apparaatresolutie; dit is geen oneindige wiskundige precisie.')),
 (t('Languages', 'Sprachen', 'Talen'), t('Prepare one questionnaire per language and select that language in PSIRA. Columns such as label::es/label::en do not create a multilingual form.', 'Erstellen Sie einen Fragebogen je Sprache und wählen Sie die Sprache in PSIRA aus. Spalten wie label::es/label::en erzeugen kein mehrsprachiges Formular.', 'Maak één vragenlijst per taal en selecteer die taal in PSIRA. Kolommen zoals label::es/label::en maken geen meertalig formulier.')),
 (t('Versions', 'Versionen', 'Versies'), t('Updating the file through PSIRA uses its versioning system. settings.version does not replace that system.', 'Dateiaktualisierungen über PSIRA verwenden dessen Versionsverwaltung. settings.version ersetzt dieses System nicht.', 'Bestanden bijwerken via PSIRA gebruikt het versiebeheersysteem. settings.version vervangt dat systeem niet.')),
 (t('Preview', 'Vorschau', 'Voorbeeld bekijken'), t('Upload this guide as a test questionnaire before adapting a real instrument. Visual changes alone do not justify changing the content or scoring of validated instruments.', 'Laden Sie diese Anleitung zuerst als Testfragebogen hoch. Rein optische Änderungen rechtfertigen keine Änderung von Inhalt oder Auswertung validierter Instrumente.', 'Upload deze handleiding eerst als testvragenlijst. Visuele wijzigingen rechtvaardigen geen verandering van inhoud of scoring van gevalideerde instrumenten.')),
 (t('Worked example', 'Schrittweises Beispiel', 'Uitgewerkt voorbeeld'), t('STEP_BY_STEP explains how to build each component. The separate complete example includes a TESTS sheet with expected results.', 'SCHRITT_FUER_SCHRITT erklärt den Aufbau der einzelnen Komponenten. Das separate vollständige Beispiel enthält ein Blatt TESTS mit erwarteten Ergebnissen.', 'STAP_VOOR_STAP legt uit hoe u elk onderdeel opbouwt. Het aparte volledige voorbeeld bevat een blad TESTS met verwachte resultaten.')),
 (t('Column reference', 'Spaltenreferenz', 'Kolomreferentie'), t('Read DICTIONARY for every column and COMPATIBILITY to distinguish working features, metadata and unsupported features.', 'WOERTERBUCH beschreibt alle Spalten; KOMPATIBILITAET unterscheidet unterstützte Funktionen, Metadaten und nicht implementierte Funktionen.', 'Lees WOORDENLIJST voor alle kolommen en COMPATIBILITEIT voor het onderscheid tussen werkende functies, metadata en niet-ondersteunde functies.')),
]

# Technical examples deliberately retain the same name/list_name codes in every language.
STEPS = [
 (t('Define the form', 'Formular definieren', 'Formulier definiëren'), t('settings: form_title=My questionnaire; form_id=mi_cuestionario; language=en.', 'settings: form_title=Mein Fragebogen; form_id=mi_cuestionario; language=de.', 'settings: form_title=Mijn vragenlijst; form_id=mi_cuestionario; language=nl.'), t('Select the name and language when uploading in PSIRA.', 'Wählen Sie Name und Sprache beim Hochladen in PSIRA.', 'Selecteer de naam en taal bij het uploaden in PSIRA.')),
 (t('Open a group', 'Gruppe öffnen', 'Groep openen'), t('survey: type=begin_group; name=mi_grupo; label=Initial questions; page_break_before=TRUE.', 'survey: type=begin_group; name=mi_grupo; label=Erste Fragen; page_break_before=TRUE.', 'survey: type=begin_group; name=mi_grupo; label=Eerste vragen; page_break_before=TRUE.'), t('Every question belongs to a group. Groups cannot be nested.', 'Jede Frage gehört zu einer Gruppe. Gruppen dürfen nicht verschachtelt werden.', 'Elke vraag hoort bij een groep. Groepen mogen niet worden genest.')),
 (t('Required question', 'Pflichtfrage', 'Verplichte vraag'), t('survey: type=text; name=comentario; label=How do you feel?; required=TRUE; required_message=Please answer.', 'survey: type=text; name=comentario; label=Wie fühlen Sie sich?; required=TRUE; required_message=Bitte antworten.', 'survey: type=text; name=comentario; label=Hoe voelt u zich?; required=TRUE; required_message=Beantwoord de vraag.'), t('Try to continue without an answer: progress must be blocked.', 'Versuchen Sie ohne Antwort fortzufahren: Dies muss verhindert werden.', 'Probeer zonder antwoord verder te gaan: dit moet worden geblokkeerd.')),
 (t('Define choices', 'Antwortoptionen definieren', 'Antwoordopties definiëren'), t('choices: list_name=si_no; name=si; label=Yes. Second row: list_name=si_no; name=no; label=No.', 'choices: list_name=si_no; name=si; label=Ja. Zweite Zeile: list_name=si_no; name=no; label=Nein.', 'choices: list_name=si_no; name=si; label=Ja. Tweede rij: list_name=si_no; name=no; label=Nee.'), t('name is the stored code; label is the visible text.', 'name ist der gespeicherte Code; label ist der sichtbare Text.', 'name is de opgeslagen code; label is de zichtbare tekst.')),
 (t('Use choices', 'Antwortoptionen verwenden', 'Antwoordopties gebruiken'), t('survey: type=select_one si_no; name=actividad; label=Were you active?; appearance=cards.', 'survey: type=select_one si_no; name=actividad; label=Waren Sie aktiv?; appearance=cards.', 'survey: type=select_one si_no; name=actividad; label=Was u actief?; appearance=cards.'), t('Two cards appear; only one can be selected.', 'Zwei Karten erscheinen; nur eine kann ausgewählt werden.', 'Er verschijnen twee kaarten; er kan er maar één worden geselecteerd.')),
 (t('Conditional visibility', 'Bedingte Sichtbarkeit', 'Voorwaardelijke zichtbaarheid'), t("survey: type=text; name=detalle_actividad; label=Which activity?; relevant=${actividad} = 'si'.", "survey: type=text; name=detalle_actividad; label=Welche Aktivität?; relevant=${actividad} = 'si'.", "survey: type=text; name=detalle_actividad; label=Welke activiteit?; relevant=${actividad} = 'si'."), t('Choose Yes, then No: the detail must appear and disappear.', 'Wählen Sie Ja und dann Nein: Die Detailfrage muss erscheinen und verschwinden.', 'Kies Ja en daarna Nee: de detailvraag moet verschijnen en verdwijnen.')),
 (t('Build a matrix', 'Matrix erstellen', 'Matrix maken'), t('Close with end_group. Open begin_group with appearance=likert-matrix. Add select_one frecuencia questions.', 'Schließen Sie mit end_group. Öffnen Sie begin_group mit appearance=likert-matrix. Fügen Sie Fragen mit select_one frecuencia hinzu.', 'Sluit af met end_group. Open begin_group met appearance=likert-matrix. Voeg vragen met select_one frecuencia toe.'), t('Questions using the same choice list become matrix rows.', 'Fragen mit derselben Antwortliste bilden die Matrixzeilen.', 'Vragen met dezelfde keuzelijst worden rijen van de matrix.')),
 (t('Build a VAS', 'VAS erstellen', 'VAS maken'), t('Inside a standard group: type=decimal; name=vas; label=Intensity; appearance=vas; range_min=0; range_max=100; range_step=any.', 'In einer normalen Gruppe: type=decimal; name=vas; label=Intensität; appearance=vas; range_min=0; range_max=100; range_step=any.', 'Binnen een gewone groep: type=decimal; name=vas; label=Intensiteit; appearance=vas; range_min=0; range_max=100; range_step=any.'), t('Untouched means unanswered; interacting saves a number, including zero.', 'Ohne Interaktion bleibt die Frage unbeantwortet; eine Interaktion speichert eine Zahl, auch null.', 'Zonder interactie blijft de vraag onbeantwoord; interactie slaat een getal op, ook nul.')),
 (t('Intermediate labels', 'Zwischenbeschriftungen', 'Tussenlabels'), t('range_label_list=etiquetas_vas. In choices use name=0,25,50,75,100; label_position=above/below; label_align=left/center/right.', 'range_label_list=etiquetas_vas. In choices: name=0,25,50,75,100; label_position=above/below; label_align=left/center/right.', 'range_label_list=etiquetas_vas. Gebruik in choices: name=0,25,50,75,100; label_position=above/below; label_align=left/center/right.'), t('Each label keeps its position and alignment. See vas_completa in survey.', 'Jede Beschriftung behält Position und Ausrichtung. Siehe vas_completa in survey.', 'Elk label behoudt zijn positie en uitlijning. Zie vas_completa in survey.')),
 (t('Style the scale', 'Skala gestalten', 'Schaal opmaken'), t('range_labels_boxed=TRUE; range_labels_bold=TRUE; range_gradient=custom; range_color_start=#800000; range_color_end=#008080.', 'range_labels_boxed=TRUE; range_labels_bold=TRUE; range_gradient=custom; range_color_start=#800000; range_color_end=#008080.', 'range_labels_boxed=TRUE; range_labels_bold=TRUE; range_gradient=custom; range_color_start=#800000; range_color_end=#008080.'), t('Check boxes, bold labels and gradient. Read DICTIONARY before changing values.', 'Prüfen Sie Rahmen, Fettschrift und Farbverlauf. Lesen Sie WOERTERBUCH, bevor Sie Werte ändern.', 'Controleer kaders, vetgedrukte labels en kleurverloop. Lees WOORDENLIJST voordat u waarden wijzigt.')),
 (t('Close and test', 'Abschließen und testen', 'Afsluiten en testen'), t('End the group with type=end_group. Save as .xlsx and upload in Questionnaires.', 'Beenden Sie die Gruppe mit type=end_group. Speichern Sie als .xlsx und laden Sie die Datei unter Fragebögen hoch.', 'Sluit de groep af met type=end_group. Sla op als .xlsx en upload onder Vragenlijsten.'), t('survey/choices/settings contain a complete uploadable example. Documentation sheets are not executed.', 'survey/choices/settings enthalten ein vollständig hochladbares Beispiel. Dokumentationsblätter werden nicht ausgeführt.', 'survey/choices/settings bevatten een volledig uploadbaar voorbeeld. Documentatiebladen worden niet uitgevoerd.')),
 (t('Another language', 'Andere Sprache', 'Andere taal'), t('Download the workbook for the desired language. Translate label, hint, required_message and choices text when adapting it; keep name codes.', 'Laden Sie die Datei in der gewünschten Sprache herunter. Übersetzen Sie bei Anpassungen label, hint, required_message und die Texte in choices; behalten Sie name-Codes bei.', 'Download het bestand voor de gewenste taal. Vertaal bij aanpassingen label, hint, required_message en de teksten in choices; behoud de name-codes.'), t('Select the matching language in PSIRA when uploading.', 'Wählen Sie beim Hochladen in PSIRA die passende Sprache aus.', 'Selecteer bij het uploaden in PSIRA de bijbehorende taal.')),
]

DESCRIPTIONS = {}
def description(key, en, de, nl):
    DESCRIPTIONS[key] = t(en, de, nl)

description('survey.type', 'Question type or delimiter. For choices use select_one LIST or select_multiple LIST.', 'Fragetyp oder Gruppenbegrenzung. Für Auswahlfragen: select_one LISTE oder select_multiple LISTE.', 'Vraagtype of groepsbegrenzing. Gebruik voor keuzes select_one LIJST of select_multiple LIJST.')
description('survey.name', 'Stable unique identifier without spaces; also identifies groups.', 'Stabile eindeutige Kennung ohne Leerzeichen; identifiziert auch Gruppen.', 'Stabiele unieke identificator zonder spaties; identificeert ook groepen.')
description('survey.label', 'Question, note or group text. Plain text; rich page content is configured in questionnaire bundles.', 'Text einer Frage, eines Hinweises oder einer Gruppe. Klartext; formatierte Seiteninhalte werden in Fragebogenpaketen eingerichtet.', 'Tekst van de vraag, opmerking of groep. Platte tekst; opgemaakte pagina-inhoud wordt in vragenlijstpakketten ingesteld.')
description('survey.hint', 'Instruction displayed below the question.', 'Anweisung unterhalb der Frage.', 'Instructie die onder de vraag wordt weergegeven.')
description('survey.required', 'true/false or yes/no. Questions are optional when omitted.', 'true/false oder yes/no. Ohne Angabe ist die Frage optional.', 'true/false of yes/no. Zonder deze waarde is de vraag optioneel.')
description('survey.required_message', 'Required-answer message. Keeps existing validation behavior.', 'Meldung bei fehlender Pflichtantwort. Die bestehende Validierung bleibt erhalten.', 'Melding bij een ontbrekend verplicht antwoord. Het bestaande validatiegedrag blijft behouden.')
description('survey.appearance', 'Empty, cards, likert, slider or vas on questions. Use table-list or likert-matrix on begin_group.', 'Bei Fragen: leer, cards, likert, slider oder vas. Bei begin_group: table-list oder likert-matrix.', 'Bij vragen: leeg, cards, likert, slider of vas. Bij begin_group: table-list of likert-matrix.')
description('survey.page_break_before', 'true starts a page before this group; false continues the current page. Combines with bundle pages without splitting matrices or creating empty pages.', 'true beginnt vor dieser Gruppe eine neue Seite; false setzt die aktuelle Seite fort. Ergänzt Paketseiten, ohne Matrizen zu teilen oder leere Seiten zu erzeugen.', 'true begint een pagina vóór deze groep; false gaat door op de huidige pagina. Werkt samen met pakketpagina’s zonder matrices te splitsen of lege pagina’s te maken.')
description('survey.min_length', 'Minimum number of select_multiple choices. Not a general numeric minimum or VAS lower bound.', 'Mindestanzahl gewählter Optionen bei select_multiple. Keine allgemeine numerische Untergrenze und kein VAS-Minimum.', 'Minimumaantal keuzes bij select_multiple. Geen algemeen numeriek minimum of ondergrens voor VAS.')
description('survey.max_length', 'Maximum text characters, multiple-choice selections or legacy numeric maximum. For VAS use range_max.', 'Maximale Textlänge, Anzahl der Mehrfachauswahlen oder bisheriges numerisches Maximum. Für VAS: range_max.', 'Maximumaantal teksttekens, meervoudige keuzes of bestaand numeriek maximum. Gebruik voor VAS range_max.')
description('survey.relevant', 'Conditional visibility using limited PSIRA syntax. See CONDITIONS.', 'Bedingte Sichtbarkeit mit eingeschränkter PSIRA-Syntax. Siehe BEDINGUNGEN.', 'Voorwaardelijke zichtbaarheid met beperkte PSIRA-syntaxis. Zie VOORWAARDEN.')
description('survey.image', 'Question image URL, accessible from the browser. Images pasted inside cells are not imported.', 'Bild-URL der Frage, die im Browser erreichbar sein muss. In Zellen eingefügte Bilder werden nicht importiert.', 'Afbeeldings-URL van de vraag, bereikbaar vanuit de browser. Afbeeldingen die in cellen zijn geplakt worden niet geïmporteerd.')
description('survey.range_min', 'Inclusive minimum. Default: 0.', 'Einschließlich geltendes Minimum. Standard: 0.', 'Inclusief minimum. Standaard: 0.')
description('survey.range_max', 'Inclusive maximum, greater than the minimum. Default: 100.', 'Einschließlich geltendes Maximum, größer als das Minimum. Standard: 100.', 'Inclusief maximum, groter dan het minimum. Standaard: 100.')
description('survey.range_step', 'Increment: integer slider 1, decimal slider 0.1. VAS empty/any is continuous. Integers require whole-number bounds and steps. The step must divide the interval exactly.', 'Schrittweite: ganzzahliger Slider 1, dezimaler Slider 0.1. VAS mit leer/any ist kontinuierlich. Bei integer müssen Grenzen und Schritte ganzzahlig sein. Der Schritt muss das Intervall genau teilen.', 'Stapgrootte: gehele slider 1, decimale slider 0.1. VAS met leeg/any is continu. Bij integer moeten grenzen en stappen geheel zijn. De stap moet het interval exact delen.')
description('survey.range_label_list', 'choices list for intermediate labels. choices.name must be numeric and within the range. Replaces endpoint labels.', 'choices-Liste für Zwischenbeschriftungen. choices.name muss numerisch und innerhalb des Bereichs sein. Ersetzt die Endpunktbeschriftungen.', 'choices-lijst voor tussenlabels. choices.name moet numeriek zijn en binnen het bereik vallen. Vervangt de eindlabels.')
description('survey.range_min_label', 'Minimum endpoint text when range_label_list is not used. Default: the minimum number.', 'Text am unteren Endpunkt ohne range_label_list. Standard: der Zahlenwert des Minimums.', 'Tekst bij het minimum als range_label_list niet wordt gebruikt. Standaard: het minimumgetal.')
description('survey.range_max_label', 'Maximum endpoint text when range_label_list is not used. Default: the maximum number.', 'Text am oberen Endpunkt ohne range_label_list. Standard: der Zahlenwert des Maximums.', 'Tekst bij het maximum als range_label_list niet wordt gebruikt. Standaard: het maximumgetal.')
description('survey.range_labels_position', 'General above/below position. Default: above. Individual choices rows may override it.', 'Allgemeine Position above/below. Standard: above. Einzelne choices-Zeilen können sie überschreiben.', 'Algemene positie above/below. Standaard: above. Afzonderlijke choices-rijen kunnen dit overschrijven.')
description('survey.range_value_position', 'Show the number above, below or hidden. Default: above.', 'Zahlenwert oberhalb (above), unterhalb (below) oder verborgen (hidden). Standard: above.', 'Toon het getal boven (above), onder (below) of verborgen (hidden). Standaard: above.')
description('survey.range_label_size', 'Label size from 10 to 28 pixels. Default: 14.', 'Beschriftungsgröße von 10 bis 28 Pixeln. Standard: 14.', 'Labelgrootte van 10 tot 28 pixels. Standaard: 14.')
description('survey.range_value_size', 'Value size from 10 to 28 pixels. Default: 18.', 'Größe des Zahlenwerts von 10 bis 28 Pixeln. Standard: 18.', 'Grootte van de waarde van 10 tot 28 pixels. Standaard: 18.')
description('survey.range_labels_boxed', 'true/false: put labels in boxes. Default: false.', 'true/false: Beschriftungen einrahmen. Standard: false.', 'true/false: labels in kaders plaatsen. Standaard: false.')
description('survey.range_labels_bold', 'true/false: bold labels. Default: false.', 'true/false: Beschriftungen fett darstellen. Standard: false.', 'true/false: vetgedrukte labels. Standaard: false.')
description('survey.range_gradient', 'none, ascending, descending or custom. Default: none. Does not change stored values.', 'none, ascending, descending oder custom. Standard: none. Ändert keine gespeicherten Werte.', 'none, ascending, descending of custom. Standaard: none. Verandert de opgeslagen waarden niet.')
description('survey.range_color_start', 'Starting color in #RRGGBB format. Default: #800000.', 'Anfangsfarbe im Format #RRGGBB. Standard: #800000.', 'Beginkleur in #RRGGBB-formaat. Standaard: #800000.')
description('survey.range_color_end', 'Ending color in #RRGGBB format. Default: #008080.', 'Endfarbe im Format #RRGGBB. Standard: #008080.', 'Eindkleur in #RRGGBB-formaat. Standaard: #008080.')
description('survey.constraint', 'Imported as metadata. Arbitrary XLSForm expressions are not executed; do not rely on them for validation.', 'Wird als Metadatum importiert. Beliebige XLSForm-Ausdrücke werden nicht ausgeführt; verlassen Sie sich bei der Validierung nicht darauf.', 'Wordt als metadata geïmporteerd. Willekeurige XLSForm-expressies worden niet uitgevoerd; vertrouw hier niet op voor validatie.')
description('survey.constraint_message', 'Error message text. Does not activate a constraint expression by itself.', 'Fehlermeldungstext. Aktiviert für sich allein keinen constraint-Ausdruck.', 'Tekst van de foutmelding. Activeert op zichzelf geen constraint-expressie.')
description('survey.calculation', 'Stored as metadata, without activating XLSForm formulas. Scoring scripts are configured separately in PSIRA.', 'Wird als Metadatum gespeichert, ohne XLSForm-Formeln zu aktivieren. Auswertungsskripte werden separat in PSIRA eingerichtet.', 'Wordt als metadata opgeslagen zonder XLSForm-formules te activeren. Scoringsscripts worden apart in PSIRA ingesteld.')
description('survey.default', 'Imported as metadata; does not guarantee an initial answer. VAS does not record an initial value.', 'Wird als Metadatum importiert und garantiert keine Anfangsantwort. VAS speichert keinen Anfangswert.', 'Wordt als metadata geïmporteerd en garandeert geen beginantwoord. VAS slaat geen beginwaarde op.')
description('survey.choice_filter', 'Dynamic filtering of lists with XLSForm expressions is not implemented.', 'Dynamische Listenfilterung mit XLSForm-Ausdrücken ist nicht implementiert.', 'Dynamisch filteren van lijsten met XLSForm-expressies is niet geïmplementeerd.')
description('choices.list_name', 'Name of the list referenced by survey.', 'Name der in survey referenzierten Liste.', 'Naam van de lijst waarnaar survey verwijst.')
description('choices.name', 'Stored answer code. For VAS labels: numeric position within the range.', 'Gespeicherter Antwortcode. Bei VAS-Beschriftungen: numerische Position im Bereich.', 'Opgeslagen antwoordcode. Voor VAS-labels: numerieke positie binnen het bereik.')
description('choices.label', 'Visible text of the choice or label.', 'Sichtbarer Text der Option oder Beschriftung.', 'Zichtbare tekst van de keuze of het label.')
description('choices.media::image', 'Image URL for an answer choice.', 'Bild-URL einer Antwortoption.', 'Afbeeldings-URL voor een antwoordoptie.')
description('choices.label_position', 'VAS labels only: above/below. Empty uses range_labels_position.', 'Nur VAS-Beschriftungen: above/below. Leer verwendet range_labels_position.', 'Alleen VAS-labels: above/below. Leeg gebruikt range_labels_position.')
description('choices.label_align', 'VAS labels only: auto/left/center/right. Every label is centered on its value, including endpoints; align only changes text alignment.', 'Nur VAS-Beschriftungen: auto/left/center/right. Jede Beschriftung ist auf ihrem Wert zentriert, auch an Endpunkten; align ändert nur die Textausrichtung.', 'Alleen VAS-labels: auto/left/center/right. Elk label is gecentreerd op zijn waarde, ook aan de uiteinden; align verandert alleen de tekstuitlijning.')
description('settings.form_title', 'Suggested name; the name entered in PSIRA takes precedence.', 'Vorgeschlagener Name; der in PSIRA eingegebene Name hat Vorrang.', 'Voorgestelde naam; de naam die in PSIRA is ingevoerd heeft voorrang.')
description('settings.form_id', 'Identifier or abbreviation; choose a new one when creating another questionnaire.', 'Kennung oder Abkürzung; wählen Sie beim Erstellen eines weiteren Fragebogens eine neue.', 'Identificator of afkorting; kies een nieuwe als u een andere vragenlijst maakt.')
description('settings.version', 'Legacy metadata; PSIRA manages file versions.', 'Bisheriges Metadatum; PSIRA verwaltet Dateiversionen.', 'Bestaande metadata; PSIRA beheert bestandsversies.')
description('settings.language', 'Metadata; select the language when uploading in PSIRA.', 'Metadatum; wählen Sie die Sprache beim Hochladen in PSIRA.', 'Metadata; selecteer de taal bij het uploaden in PSIRA.')
description('settings.questionnaire_type', 'Metadata recognized by the reader, without effect on this import.', 'Vom Leser erkanntes Metadatum ohne Auswirkung auf diesen Import.', 'Metadata die de lezer herkent, zonder effect op deze import.')
description('settings.submission_url', 'Does not change the submission destination; answers are stored in PSIRA.', 'Ändert nicht das Übermittlungsziel; Antworten werden in PSIRA gespeichert.', 'Verandert de verzendbestemming niet; antwoorden worden in PSIRA opgeslagen.')

APPLICATION = {
 'Solo begin_group': t('begin_group only', 'Nur begin_group', 'Alleen begin_group'),
 'Obligatorio': t('Required', 'Erforderlich', 'Verplicht'),
 'Obligatorio salvo end_group': t('Required except end_group', 'Erforderlich außer end_group', 'Verplicht behalve end_group'),
 'Opcional': t('Optional', 'Optional', 'Optioneel'),
 'Condicional': t('Conditional', 'Bedingt', 'Voorwaardelijk'),
 'slider/vas': t('slider/vas', 'slider/vas', 'slider/vas'),
 'Sin ejecución general': t('Not generally executed', 'Keine allgemeine Ausführung', 'Geen algemene uitvoering'),
 'Sin aplicación automática': t('Not automatically applied', 'Keine automatische Anwendung', 'Niet automatisch toegepast'),
 'Tres primeras obligatorias': t('First three columns required', 'Erste drei Spalten erforderlich', 'Eerste drie kolommen verplicht'),
 'form_title/form_id recomendados': t('form_title/form_id recommended', 'form_title/form_id empfohlen', 'form_title/form_id aanbevolen'),
}

TYPE_USES = [
 t('Free text; textarea', 'Freitext; Textbereich', 'Vrije tekst; tekstvak'),
 t('Whole number', 'Ganze Zahl', 'Geheel getal'),
 t('Decimal number', 'Dezimalzahl', 'Decimaal getal'),
 t('One true/false checkbox', 'Ein true/false-Kontrollkästchen', 'Eén true/false-selectievakje'),
 t('Date', 'Datum', 'Datum'), t('Time', 'Uhrzeit', 'Tijd'), t('Date and time', 'Datum und Uhrzeit', 'Datum en tijd'),
 t('One choice from choices', 'Eine Option aus choices', 'Eén keuze uit choices'),
 t('Several choices from choices', 'Mehrere Optionen aus choices', 'Meerdere keuzes uit choices'),
 t('Informational text, no answer', 'Informationstext ohne Antwort', 'Informatieve tekst, geen antwoord'),
 t('Required file grouping; no nesting', 'Erforderliche Dateigruppierung; keine Verschachtelung', 'Verplichte groepering; niet nesten'),
]
APPEARANCES = [
 t('Improved standard presentation, compatible with earlier files.', 'Verbesserte Standarddarstellung, kompatibel mit älteren Dateien.', 'Verbeterde standaardweergave, compatibel met eerdere bestanden.'),
 t('Selectable cards; stored codes do not change.', 'Auswählbare Karten; gespeicherte Codes bleiben gleich.', 'Selecteerbare kaarten; opgeslagen codes veranderen niet.'),
 t('Individual scale using choices options.', 'Einzelne Skala mit Optionen aus choices.', 'Afzonderlijke schaal met opties uit choices.'),
 t('Matrix of select_one questions. Use the same list for matching columns.', 'Matrix aus select_one-Fragen. Verwenden Sie dieselbe Liste für übereinstimmende Spalten.', 'Matrix met select_one-vragen. Gebruik dezelfde lijst voor overeenkomende kolommen.'),
 t('Compatible legacy matrix.', 'Kompatible bisherige Matrix.', 'Compatibele bestaande matrix.'),
 t('Stepped slider with configurable labels.', 'Schieberegler mit Schritten und konfigurierbaren Beschriftungen.', 'Schuifregelaar met stappen en instelbare labels.'),
 t('Continuous scale; default step is any. An explicit step is also allowed if required by the protocol.', 'Kontinuierliche Skala; Standardschritt ist any. Ein expliziter Schritt ist möglich, wenn das Protokoll ihn verlangt.', 'Continue schaal; de standaardstap is any. Een expliciete stap is ook mogelijk als het protocol dit vereist.'),
]
CONDITIONS = [
 t('Show if a single-choice answer has code si.', 'Anzeigen, wenn eine Einzelauswahl den Code si hat.', 'Tonen als een enkelvoudig antwoord de code si heeft.'),
 t('Numeric greater-than comparison.', 'Numerischer Größer-als-Vergleich.', 'Numerieke groter-dan-vergelijking.'),
 t('Numeric less-than comparison.', 'Numerischer Kleiner-als-Vergleich.', 'Numerieke kleiner-dan-vergelijking.'),
 t('Show if multiple-choice answers include code dolor.', 'Anzeigen, wenn die Mehrfachauswahl den Code dolor enthält.', 'Tonen als de meervoudige keuzes de code dolor bevatten.'),
 t('Simple combinations are evaluated left to right. Do not assume operator precedence or nested parentheses.', 'Einfache Kombinationen werden von links nach rechts ausgewertet. Gehen Sie nicht von Operatorrangfolge oder verschachtelten Klammern aus.', 'Eenvoudige combinaties worden van links naar rechts geëvalueerd. Ga niet uit van operatorvoorrang of geneste haakjes.'),
 t('Keep question names stable. Test every branch in PSIRA before publishing.', 'Behalten Sie stabile Fragenamen bei. Testen Sie jeden Zweig in PSIRA vor der Veröffentlichung.', 'Houd vraagidentificatoren stabiel. Test elke vertakking in PSIRA vóór publicatie.'),
]
COMPATIBILITY = [
 (t('Text, numbers, date, time, choices and notes', 'Text, Zahlen, Datum, Uhrzeit, Auswahl und Hinweise', 'Tekst, getallen, datum, tijd, keuzes en opmerkingen'), t('Available; see TYPES.', 'Verfügbar; siehe TYPEN.', 'Beschikbaar; zie TYPEN.')),
 (t('Matrices and appearances in this example', 'Matrizen und Darstellungen in diesem Beispiel', 'Matrices en weergaven in dit voorbeeld'), t('Available in this update.', 'In dieser Aktualisierung verfügbar.', 'Beschikbaar in deze update.')),
 (t('Images', 'Bilder', 'Afbeeldingen'), t('Use URLs in image/media::image, not images pasted into Excel.', 'Verwenden Sie URLs in image/media::image, keine in Excel eingefügten Bilder.', 'Gebruik URL’s in image/media::image, geen afbeeldingen die in Excel zijn geplakt.')),
 (t('relevant', 'relevant', 'relevant'), t('Limited to the documented conditions, not all XPath/XLSForm.', 'Auf die dokumentierten Bedingungen beschränkt, nicht auf den gesamten XPath/XLSForm-Umfang.', 'Beperkt tot de beschreven voorwaarden, niet alle XPath/XLSForm.')),
 (t('constraint/calculation/default/choice_filter', 'constraint/calculation/default/choice_filter', 'constraint/calculation/default/choice_filter'), t('Metadata or features without general execution. Do not assume ODK behavior.', 'Metadaten oder Funktionen ohne allgemeine Ausführung. Gehen Sie nicht vom ODK-Verhalten aus.', 'Metadata of functies zonder algemene uitvoering. Ga niet uit van ODK-gedrag.')),
 (t('Text min_length / legacy numeric minimum', 'min_length bei Text / bisheriges numerisches Minimum', 'min_length voor tekst / bestaand numeriek minimum'), t('Not validated as a general limit. Use range_min for new scales. Multiple-choice min_length does limit the selection count.', 'Wird nicht als allgemeine Grenze validiert. Verwenden Sie bei neuen Skalen range_min. Bei Mehrfachauswahl begrenzt min_length die Anzahl.', 'Wordt niet als algemene grens gevalideerd. Gebruik range_min voor nieuwe schalen. Bij meervoudige keuzes beperkt min_length wel het aantal.')),
 (t('label::LANGUAGE and multilingual XLSForms', 'label::SPRACHE und mehrsprachige XLSForms', 'label::TAAL en meertalige XLSForms'), t('Not implemented. Use one version per language and select it on upload.', 'Nicht implementiert. Verwenden Sie je Sprache eine Version und wählen Sie diese beim Hochladen aus.', 'Niet geïmplementeerd. Gebruik één versie per taal en selecteer die bij het uploaden.')),
 (t('visual_analog_scales (legacy type)', 'visual_analog_scales (bisheriger Typ)', 'visual_analog_scales (bestaand type)'), t('Not the new numeric VAS. Use decimal + appearance=vas.', 'Nicht die neue numerische VAS. Verwenden Sie decimal + appearance=vas.', 'Niet de nieuwe numerieke VAS. Gebruik decimal + appearance=vas.')),
 (t('Nested groups / questions outside groups', 'Verschachtelte Gruppen / Fragen außerhalb von Gruppen', 'Geneste groepen / vragen buiten groepen'), t('Not supported by the current import format.', 'Im aktuellen Importformat nicht unterstützt.', 'Niet ondersteund door het huidige importformaat.')),
 (t('Pages and rich headers/footers', 'Seiten und formatierte Kopf-/Fußzeilen', 'Pagina’s en opgemaakte kop-/voetteksten'), t('Bundles define pages and rich text. page_break_before adds internal questionnaire pages while preserving bundle pages.', 'Pakete definieren Seiten und formatierte Texte. page_break_before ergänzt interne Fragebogenseiten und erhält Paketseiten.', 'Pakketten definiëren pagina’s en opgemaakte tekst. page_break_before voegt interne vragenlijstpagina’s toe en behoudt de pakketpagina’s.')),
 (t('Changing codes and scales of validated instruments', 'Codes und Skalen validierter Instrumente ändern', 'Codes en schalen van gevalideerde instrumenten wijzigen'), t('Review scoring scripts and methodology. Appearance alone does not change scoring.', 'Prüfen Sie Auswertungsskripte und Methodik. Die Darstellung allein ändert die Auswertung nicht.', 'Controleer scoringsscripts en methodologie. Alleen de weergave veranderen wijzigt de scoring niet.')),
]

HEADERS = {
 'LEEME': [t('Topic', 'Thema', 'Onderwerp'), t('Instructions', 'Anweisungen', 'Instructies')],
 'EJEMPLO_PASO_A_PASO': [t('Step', 'Schritt', 'Stap'), t('What to build', 'Was erstellen?', 'Wat maken?'), t('Sheet and example', 'Blatt und Beispiel', 'Blad en voorbeeld'), t('What to check in PSIRA', 'Was in PSIRA prüfen?', 'Wat controleren in PSIRA?')],
 'DICCIONARIO': [t('Sheet', 'Blatt', 'Blad'), t('Column', 'Spalte', 'Kolom'), t('Applicability', 'Anwendung', 'Toepassing'), t('Description', 'Beschreibung', 'Beschrijving'), t('Example', 'Beispiel', 'Voorbeeld')],
 'TIPOS': [t('Type', 'Typ', 'Type'), t('Usage', 'Verwendung', 'Gebruik'), t('Stored answer', 'Gespeicherte Antwort', 'Opgeslagen antwoord')],
 'APARIENCIAS': [t('Where', 'Wo', 'Waar'), t('appearance', 'appearance', 'appearance'), t('Configuration', 'Konfiguration', 'Configuratie')],
 'CONDICIONES': [t('relevant expression', 'relevant-Ausdruck', 'relevant-expressie'), t('Usage', 'Verwendung', 'Gebruik')],
 'COMPATIBILIDAD': [t('Feature', 'Funktion', 'Functie'), t('Status', 'Status', 'Status')],
 'PRUEBAS': [t('Question or section', 'Frage oder Abschnitt', 'Vraag of onderdeel'), t('Test', 'Test', 'Test'), t('Expected result', 'Erwartetes Ergebnis', 'Verwacht resultaat')],
}
GUIDE_TITLE = t('Complete PSIRA questionnaire guide', 'Vollständige PSIRA-Fragebogenanleitung', 'Volledige PSIRA-vragenlijsthandleiding')
EXAMPLE_TITLE = t('Complete PSIRA feature test', 'Vollständiger PSIRA-Funktionstest', 'Volledige PSIRA-functietest')


def translated(value, lang):
    """Translate complete human-facing cells; unknown values indicate a missing translation."""
    if not value:
        return value
    return TEXT[value][lang]


def localize_sheets(source, lang):
    sheets = deepcopy(source)
    for index, (name, data, widths) in enumerate(sheets):
        if name == 'survey':
            columns = data[0]
            for row in data[1:]:
                for field in ('label', 'hint', 'required_message', 'range_min_label', 'range_max_label'):
                    position = columns.index(field)
                    row[position] = translated(row[position], lang)
                if row[columns.index('image')]:
                    row[columns.index('image')] = f'assets/templates/psira-example-{lang}.svg'
        elif name == 'choices':
            for row in data[1:]:
                row[2] = translated(row[2], lang)
                if row[3]:
                    row[3] = f'assets/templates/psira-example-{lang}.svg'
        elif name == 'settings':
            data[1][0] = GUIDE_TITLE[lang]
            data[1][1] = f'psira_guia_{lang}_v1'
            data[1][3] = lang
        elif name == 'LEEME':
            assert len(data) == len(GUIDE) + 1
            data = [[value[lang] for value in row] for row in GUIDE]
        elif name == 'EJEMPLO_PASO_A_PASO':
            assert len(data) == len(STEPS) + 1
            data = [[number] + [value[lang] for value in row] for number, row in enumerate(STEPS, 1)]
        elif name == 'DICCIONARIO':
            data = [[row[0], row[1], APPLICATION[row[2]][lang], DESCRIPTIONS[f'{row[0]}.{row[1]}'][lang],
                     TEXT[row[4]][lang] if row[4] in TEXT else row[4]] for row in data[1:]]
        elif name == 'TIPOS':
            assert len(data) == len(TYPE_USES) + 1
            data = [[row[0].replace('LISTA', 'LIST'), TYPE_USES[i][lang],
                     t('dateValue and textValue', 'dateValue und textValue', 'dateValue en textValue')[lang] if i == 6 else
                     t('multipleChoiceValue = codes', 'multipleChoiceValue = Codes', 'multipleChoiceValue = codes')[lang] if i == 8 else
                     t('None', 'Keine', 'Geen')[lang] if i == 9 else
                     t('Not an answer', 'Keine Antwort', 'Geen antwoord')[lang] if i == 10 else row[2]]
                    for i, row in enumerate(data[1:])]
        elif name == 'APARIENCIAS':
            assert len(data) == len(APPEARANCES) + 1
            data = [[t('Question', 'Frage', 'Vraag')[lang] if i == 0 else row[0],
                     t('empty', 'leer', 'leeg')[lang] if i == 0 else row[1], APPEARANCES[i][lang]]
                    for i, row in enumerate(data[1:])]
        elif name == 'CONDICIONES':
            assert len(data) == len(CONDITIONS) + 1
            data = [[t('Warning', 'Hinweis', 'Waarschuwing')[lang] if row[0] == 'Advertencia' else row[0], CONDITIONS[i][lang]]
                    for i, row in enumerate(data[1:])]
        elif name == 'COMPATIBILIDAD':
            assert len(data) == len(COMPATIBILITY) + 1
            data = [[value[lang] for value in row] for row in COMPATIBILITY]
        else:
            raise ValueError(f'No localization defined for sheet {name}')
        if name in HEADERS:
            data.insert(0, [value[lang] for value in HEADERS[name]])
        sheets[index] = (SHEET_NAMES[name][lang] if name in SHEET_NAMES else name, data, widths)
    return sheets


def test_checklist(survey, lang):
    data = [[value[lang] for value in HEADERS['PRUEBAS']]]
    for row in survey[1:]:
        item = dict(zip(survey[0], row))
        if item['type'] in ('begin_group', 'end_group'):
            continue
        instruction = t('Answer and reopen the assessment.', 'Antworten Sie und öffnen Sie die Erhebung erneut.', 'Beantwoord de vraag en open de meting opnieuw.')[lang]
        expected = t('The answer is retained with its original type.', 'Die Antwort bleibt mit ihrem ursprünglichen Typ erhalten.', 'Het antwoord blijft met het oorspronkelijke type bewaard.')[lang]
        if item['type'] == 'note':
            instruction = t('Read the note.', 'Lesen Sie den Hinweis.', 'Lees de opmerking.')[lang]
            expected = t('Informational content appears without an answer field.', 'Informationen erscheinen ohne Antwortfeld.', 'Informatieve inhoud verschijnt zonder antwoordveld.')[lang]
        if item['appearance'] == 'vas':
            instruction = t('Open without touching, then choose zero, an intermediate point and the maximum.', 'Öffnen Sie ohne Berührung. Wählen Sie anschließend null, einen Zwischenwert und das Maximum.', 'Open zonder aan te raken en kies daarna nul, een tussenpunt en het maximum.')[lang]
            expected = t('Without interaction there is no answer. Each selected value is saved. Check the labels and styling configured in survey.', 'Ohne Interaktion gibt es keine Antwort. Jeder gewählte Wert wird gespeichert. Prüfen Sie die in survey definierten Beschriftungen und die Gestaltung.', 'Zonder interactie is er geen antwoord. Elke geselecteerde waarde wordt opgeslagen. Controleer de labels en opmaak die in survey zijn ingesteld.')[lang]
        elif item['appearance'] == 'slider':
            instruction = t('Move using the mouse, touch or keyboard arrows.', 'Bewegen Sie den Regler mit Maus, Touch oder Pfeiltasten.', 'Verplaats met de muis, aanraking of pijltoetsen.')[lang]
            expected = t('Respects range_min, range_max and range_step. Opening alone does not save an answer.', 'Beachtet range_min, range_max und range_step. Bloßes Öffnen speichert keine Antwort.', 'Respecteert range_min, range_max en range_step. Alleen openen slaat geen antwoord op.')[lang]
        elif item['type'].startswith('select_'):
            expected = t('Choices and appearance match choices/appearance; stored codes are preserved.', 'Optionen und Darstellung entsprechen choices/appearance; gespeicherte Codes bleiben erhalten.', 'Keuzes en weergave komen overeen met choices/appearance; opgeslagen codes blijven behouden.')[lang]
        if item['relevant']:
            instruction = t('Change the answer to the question referenced in relevant.', 'Ändern Sie die Antwort auf die in relevant referenzierte Frage.', 'Wijzig het antwoord op de vraag waarnaar relevant verwijst.')[lang]
            expected = t('Only appears when this condition is met: ', 'Erscheint nur, wenn diese Bedingung erfüllt ist: ', 'Verschijnt alleen als aan deze voorwaarde is voldaan: ')[lang] + item['relevant']
        if item['required']:
            instruction += t(' Try to continue without answering.', ' Versuchen Sie ohne Antwort fortzufahren.', ' Probeer zonder antwoord verder te gaan.')[lang]
            expected += t(' Continuing without an answer is blocked.', ' Ohne Antwort wird das Fortfahren verhindert.', ' Verdergaan zonder antwoord wordt geblokkeerd.')[lang]
        data.append([item['name'], instruction, expected])
    return data
