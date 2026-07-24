# Handoff: Tab Organizer mit Claude Code

Dieses Dokument ist an mich selbst gerichtet und deshalb das einzige auf Deutsch.
Alles andere im Repo ist Englisch — so wie es bei ADP auch sein wird, und weil das
Modell auf englischen Konventionen sauberer arbeitet.

## Was hier drin liegt

    CLAUDE.md                 Projektverfassung. Wird bei jedem Start geladen.
    .claude/settings.json     Permissions: was Claude Code ohne Rückfrage darf.
    .claude/rules/            Modulare Regeln, per @-Import aus CLAUDE.md geladen.
    .claude/commands/         Eigene Slash-Commands: /ticket /review /adr /wrapup
    .claude/agents/reviewer   Read-only Subagent, der Diffs gegen den Standard prüft.
    docs/ARCHITECTURE.md      Der eigentliche Entwurf. Kerntypen inklusive.
    docs/adr/                 Architekturentscheidungen mit Begründung.
    docs/tickets/             Backlog + drei ausformulierte Beispieltickets.
    .gitignore

Kopier den Inhalt in dein leeres Repo. `/init` brauchst du danach nicht mehr — die
CLAUDE.md, die `/init` generieren würde, beschreibt nur, was im Repo *steht*. Diese
hier beschreibt, wie gearbeitet wird, und das ist der Teil, der Wert hat.

## Korrektur zu vorhin

Ich hatte Firefox 137 für die Tab-Groups-API genannt. Das war die Version, in der
Tab-Gruppen als *Nutzerfeature* ausgeliefert wurden. Die WebExtension-APIs kamen
später: `tabs.group()` in **138**, die vollständige `tabGroups`-API mit Titel,
Farbe und Collapsed-State in **139**. Deshalb steht im Manifest
`strict_min_version: "139.0"`.

## Die erste Session, wörtlich

    cd tab-organizer
    claude

Dann, der Reihe nach:

1. `/status` — prüft, ob `.claude/settings.json` tatsächlich geladen wurde. Wenn
   die Datei nicht in der Liste der Setting-Sources auftaucht, ist das JSON kaputt.
2. `Lies CLAUDE.md, docs/ARCHITECTURE.md und docs/tickets/README.md. Fass in
   fünf Sätzen zusammen, was wir bauen und wie wir arbeiten. Nenn mir alles, was
   dir widersprüchlich oder unterspezifiziert vorkommt.`

   Der zweite Satz ist der wichtige. Die Antwort ist dein erster Hinweis darauf,
   wo deine eigenen Dokumente noch unscharf sind — und es ist billiger, das jetzt
   zu erfahren als in Ticket 7.
3. `/ticket T-001`

Ab da läuft die Schleife.

## Die Schleife

    /ticket T-00X          Plan lesen, Rückfragen beantworten, "go" sagen
    (Claude implementiert, Tests zuerst)
    /review                Diff gegen den Qualitätsstandard
    git diff               selbst lesen, Zeile für Zeile
    git commit             du, nicht er
    /wrapup                Log-Eintrag fürs Vault
    /clear                 vor dem nächsten Ticket

`/clear` zwischen Tickets ist keine Kosmetik. Ein Kontext voller abgeschlossener
Arbeit macht das Modell schlechter, nicht besser — es zieht Muster aus dem alten
Ticket in das neue. Ein Ticket, eine Session.

## Wenn es aus dem Ruder läuft

**Es schreibt Code, obwohl du einen Plan wolltest.** Escape drücken, unterbrechen,
`Stopp. Du hast angefangen zu implementieren, bevor ich "go" gesagt habe. Verwirf
die Änderungen und zeig mir erst den Plan.` Nicht durchwinken — das ist genau der
Moment, in dem aus deinem Prozess Vibe Coding wird.

**Der Diff ist zu groß zum Lesen.** Nicht durchscrollen und committen. `Der Diff
ist zu groß für ein sinnvolles Review. Teil das in drei Schritte, die einzeln
mergebar sind, und mach nur den ersten.`

**Es erfindet eine Begründung.** Passiert am ehesten bei `/adr`. Wenn du in einem
ADR eine Überlegung liest, die du nie hattest: löschen und selbst schreiben. Ein
plausibel klingendes ADR mit erfundener Begründung ist schlimmer als keins, weil
du ihm in sechs Monaten glaubst.

**Es steckt fest und dreht sich im Kreis.** Nach dem zweiten fehlgeschlagenen
Versuch abbrechen. `Erklär mir, warum der bisherige Ansatz nicht funktioniert,
bevor du einen dritten versuchst.` Meistens stellt sich heraus, dass das Problem
im Ticket liegt und nicht im Code.

## Was du entscheidest, was er entscheidet

| Du | Er |
|---|---|
| Datenmodell, Modulgrenzen | Implementierung innerhalb der Grenzen |
| Welche Heuristik, mit welcher Begründung | Wie die Heuristik effizient umgesetzt wird |
| Welche Abhängigkeit ins Projekt kommt | Wie die Abhängigkeit benutzt wird |
| Was ein Ticket bedeutet | Welche Testfälle das Ticket verlangt |
| Ob der Diff gut genug ist | Ob der Code kompiliert |

Die linke Spalte ist die Arbeit, die dich zum Senior macht. Sie ist auch die
Spalte, die sich am ehesten anfühlt, als könnte man sie delegieren. Tu es nicht.

## Zwei-Wochen-Plan

| Tage | Tickets | Ergebnis |
|---|---|---|
| 1–2 | T-001, T-013 | Es baut, es testet, CI ist grün |
| 3–5 | T-002, T-003, T-009 | Der Kern rechnet richtig |
| 6–8 | T-004, T-005 | `buildPlan()` liefert einen echten Plan |
| 9–11 | T-006, T-007, T-008 | Preview, Apply, Undo — ab hier benutzbar |
| 12–14 | T-010, Politur, AMO | Installierbar, signiert |

Ab Tag 15 liegt es im Browser und du benutzt es. Was dich dann in der Praxis
stört, ist deine echte Backlog für v1.1 — und deutlich besser als alles, was du
dir jetzt am Schreibtisch ausdenkst.
