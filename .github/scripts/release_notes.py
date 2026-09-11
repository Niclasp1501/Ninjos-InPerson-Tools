"""Den Changelog-Abschnitt der auszuliefernden Version als Release-Text herausschneiden.

Ohne das bleibt die Release-Seite leer, und mit ihr die `notes`-Adresse, die im
Foundry-Paketkatalog steht. Wer wissen will, was sich geaendert hat oder wem zu
danken ist, findet dann nichts.

Uebernommen aus der DnD5e-Uebersetzung. Ein Unterschied: Dort heissen die
Ueberschriften `## [14.2609.1]`, hier `## 14.2611.75 - Datum` ohne Klammern.
Das Muster laesst beides zu, damit die Datei in jedes Modul passt.
"""
import os
import re
import sys

version = os.environ["VERSION"]
text = open("CHANGELOG.md", encoding="utf-8").read()

# Der Abschnitt dieser Version, bis zur naechsten Versionsueberschrift oder zum Dateiende.
muster = r"^## \[?%s\]?[^\n]*\n(.*?)(?=^## |\Z)" % re.escape(version)
treffer = re.search(muster, text, re.S | re.M)
notizen = treffer.group(1).strip() if treffer else ""

if not notizen:
    # Nicht scheitern, aber auch nicht stillschweigend leer bleiben.
    notizen = "Kein Changelog-Abschnitt fuer %s gefunden." % version
    print("WARNUNG: %s" % notizen, file=sys.stderr)

open("release-notes.md", "w", encoding="utf-8").write(notizen + "\n")
print("Release-Text: %d Zeichen" % len(notizen))
