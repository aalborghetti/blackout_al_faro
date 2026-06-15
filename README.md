# Blackout al Faro

App web per gestire l'**assegnazione dei ruoli** e la **narrazione delle fasi** di un gioco di deduzione sociale in stile *Lupus in Fabula*, ambientato in un faro isolato durante un blackout.

L'app non implementa la logica di gioco (eliminazioni, controllo delle vittorie, conteggio voti): serve come **strumento per il master/host**. La partita vera e propria si gioca **a voce** tra i partecipanti, usando i ruoli assegnati e le fasi scandite dal narratore.

> ⚠️ Progetto in fase iniziale.

## Come si usa

L'app è composta da soli file statici, senza build né dipendenze. Per avviarla basta aprire `index.html` in un browser, oppure servire la cartella con un server statico:

```bash
# opzione 1: aprire direttamente il file
# basta fare doppio clic su index.html

# opzione 2: server statico locale (consigliato per l'audio su mobile)
python -m http.server 8000
# poi apri http://localhost:8000
```

L'idea è di **passare un unico dispositivo** tra i giocatori: ognuno vede solo il proprio ruolo, poi lo passa al successivo.

## Flusso dell'app

L'app è organizzata in 4 schermate:

1. **Setup** — Si sceglie il numero di giocatori (5–15) e, opzionalmente, la *Modalità Caos*. Il pulsante *Regole ruoli (preview)* mostra l'anteprima della composizione (quanti Sabotatori, Custodi, Speciali) in base ai giocatori selezionati.
2. **Assegnazione** — Per ogni giocatore: si tocca lo schermo per scoprire il proprio ruolo (mostrato con la relativa carta-personaggio illustrata), lo si memorizza e si passa il dispositivo. Tra un giocatore e l'altro lo schermo lampeggia di nero per evitare che il ruolo resti visibile.
3. **Fine** — I ruoli sono assegnati. È disponibile un **riepilogo riservato all'host** (da non mostrare in pubblico). Da qui si può avviare il narratore, fare una nuova assegnazione o tornare al setup.
4. **Narratore** — Scandisce le fasi della partita (Notte → Giorno → Votazione) con voce sintetica (TTS) ed effetti sonori opzionali.

## Ruoli

| Ruolo | Squadra | Quando entra in gioco | Effetto |
|---|---|---|---|
| **Sabotatore** | Team notte | sempre | Di notte i Sabotatori scelgono insieme un bersaglio da eliminare. |
| **Custode** | Team giorno | sempre | Di giorno discute e vota chi sospetta. Costituisce la maggioranza dei giocatori. |
| **Sentinella** | Speciale | ≥ 5 giocatori | Ogni notte può controllare l'allineamento di 1 persona. |
| **Tecnico** | Speciale | ≥ 7 giocatori | Una volta a partita può bloccare la notte: nessuna eliminazione. |
| **Portavoce** | Speciale | ≥ 9 giocatori | Se viene eliminato, lascia un ultimo messaggio (max 10 parole). |
| **Disturbatore** | Neutrale | Modalità Caos, ≥ 13 giocatori | Vince se sopravvive fino alla fine **oppure** se viene votato entro il Giorno 2. |

### Composizione automatica

I ruoli vengono distribuiti automaticamente in base al numero di giocatori:

- **Sabotatori:** 2 (fino a 10 giocatori) oppure 3 (da 11 in su).
- **Speciali:** aggiunti progressivamente — Sentinella (≥5), Tecnico (≥7), Portavoce (≥9), Disturbatore (solo in Modalità Caos, ≥13).
- **Custodi:** tutti i giocatori rimanenti.

I ruoli vengono mescolati con un algoritmo Fisher–Yates per garantire una distribuzione casuale.

### Modalità Caos

Attivabile dal setup, aggiunge il ruolo neutrale **Disturbatore** per partite numerose (13–15 giocatori), introducendo un obiettivo alternativo e più imprevedibilità.

### Illustrazioni

Ogni ruolo ha una **carta-personaggio in formato SVG** (vettoriale, a tema faro/blackout) nella cartella `img/`, mostrata nella schermata di rivelazione del ruolo:

```
img/sabotatore.svg   img/sentinella.svg   img/portavoce.svg
img/custode.svg      img/tecnico.svg      img/disturbatore.svg
```

Il nome del file corrisponde al ruolo in minuscolo. Se un file manca, l'app nasconde l'immagine e mostra comunque nome e descrizione del ruolo.

## Narratore

La schermata narratore guida le fasi della partita con audio:

- **Notte** — Sabotatori, Sentinella e Tecnico agiscono.
- **Giorno** — discussione libera (consigliati 3–6 minuti).
- **Votazione** — al "tre" tutti indicano chi eliminare.

Le fasi si ripetono in ciclo (Notte → Giorno → Votazione → Notte …).

Controlli disponibili:

- **Voce (TTS)** — sintesi vocale via Web Speech API, con preferenza per una voce italiana.
- **Effetti (SFX)** — suoni opzionali per le fasi (file forniti dall'utente, vedi sotto).
- **🌩️ Temporale** — sottofondo di tempesta generato dal vivo (vedi sotto). Attivo di default.
- **Ripeti audio** — riascolta la fase corrente.

### Sottofondo di temporale (procedurale)

Un letto sonoro continuo di pioggia, vento/mare e tuoni, **sintetizzato in tempo reale** con la Web Audio API (nessun file audio richiesto): si genera dal vivo, quindi va in loop all'infinito senza ripetizioni udibili. Cambia atmosfera in base alla fase, con una dissolvenza incrociata:

- **Notte** — più intenso: pioggia battente, vento, tuoni frequenti e vicini.
- **Giorno** — più calmo: pioggia leggera, tuoni radi e lontani.
- **Votazione** — aggiunge un tuono secco come "stoccata".

Mentre il narratore parla, il temporale viene abbassato automaticamente (*ducking*) per non coprire la voce. Si attiva/disattiva con il toggle **🌩️ Temporale** e parte dopo *Abilita audio*.

> 🔊 **Audio su mobile:** premere prima *Abilita audio*. I browser mobili bloccano l'audio finché non c'è un'interazione esplicita dell'utente.

### Effetti sonori (opzionali)

Gli SFX non sono inclusi nel repository e vanno forniti dall'utente. Per abilitarli, inserire i file audio nella cartella `sfx/`:

```
sfx/night.mp3
sfx/day.mp3
sfx/vote.mp3
```

Se i file mancano, l'app funziona comunque: l'effetto viene semplicemente saltato. La narrazione parlata non richiede file audio, perché è generata a runtime dal TTS del browser.

## Struttura del progetto

```
.
├── index.html   # markup delle 4 schermate (setup, assegnazione, fine, narratore)
├── styles.css   # tema scuro, layout mobile-friendly
├── app.js       # logica: composizione ruoli, assegnazione, narratore TTS/SFX
├── img/         # carte-personaggio SVG dei 6 ruoli
└── sfx/         # (opzionale) effetti sonori delle fasi (.mp3 forniti dall'utente)
```

## Tecnologie

- HTML, CSS e JavaScript vanilla — nessuna dipendenza, nessun build step.
- [Web Speech API](https://developer.mozilla.org/docs/Web/API/SpeechSynthesis) per la sintesi vocale.
- Supporto da tastiera durante l'assegnazione: **Spazio/Invio** per scoprire il ruolo, **Invio** per passare al giocatore successivo.

## Stato e prossimi passi

Il progetto è in fase iniziale. L'app oggi copre assegnazione ruoli e narrazione; la gestione della partita (eliminazioni, voti, condizioni di vittoria) è ancora manuale. Possibili sviluppi futuri:

- tracciamento di giocatori vivi/eliminati e conteggio voti;
- verifica automatica delle condizioni di vittoria;
- gestione dei poteri notturni direttamente nell'app;
- inclusione di un set di effetti sonori di default.
