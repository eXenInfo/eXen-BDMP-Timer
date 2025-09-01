document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const navTimerBtn = document.getElementById('nav-timer');
    const navAdminBtn = document.getElementById('nav-admin');
    const navHelpBtn = document.getElementById('nav-help');
    const timerView = document.getElementById('timer-view');
    const adminView = document.getElementById('admin-view');
    const helpView = document.getElementById('help-view');
    const liveTimerDisplay = document.getElementById('live-timer-display');
    const liveStageName = document.getElementById('live-stage-name');
    const liveTotalProgress = document.getElementById('live-total-progress');
    const liveStartBtn = document.getElementById('live-start-btn');
    const liveResetBtn = document.getElementById('live-reset-btn');
    const liveStagesListContainer = document.getElementById('live-stages-list');
    const liveDisciplineName = document.getElementById('live-discipline-name');
    const adminDisciplineSelect = document.getElementById('admin-discipline-select');
    const adminLoadBtn = document.getElementById('admin-load-btn');
    const adminExportSingleBtn = document.getElementById('admin-export-single-btn');
    const adminDeleteBtn = document.getElementById('admin-delete-btn');
    const adminNewBtn = document.getElementById('admin-new-btn');
    const editingDisciplineName = document.getElementById('editing-discipline-name');
    const adminStagesListContainer = document.getElementById('admin-stages-list');
    const addStageBtn = document.getElementById('add-stage-btn');
    const saveDisciplineBtn = document.getElementById('save-discipline-btn');
    const disciplineNameInput = document.getElementById('discipline-name-input');
    const exportAllBtn = document.getElementById('export-all-btn');
    const importBtn = document.getElementById('import-btn');
    const loadFromServerBtn = document.getElementById('load-from-server-btn');
    const eppTimerSection = document.getElementById('epp-timer-sektion');
    const eppRestzeitAnzeige = document.getElementById('epp-restzeit-anzeige');
    const eppNextStationBtn = document.getElementById('epp-next-station-btn');
    const eppPauseBtn = document.getElementById('epp-pause-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    const testToneBtn = document.getElementById('test-tone-btn');
    const newStageName = document.getElementById('new-stage-name');
    const newStagePrepTime = document.getElementById('new-stage-prep-time');
    const newStageDuration = document.getElementById('new-stage-duration');
    const newStageReps = document.getElementById('new-stage-reps');
    const newStagePause = document.getElementById('new-stage-pause');
    const newStageSoundStart = document.getElementById('new-stage-sound-start');
    const newStageSoundEnd = document.getElementById('new-stage-sound-end');
    const newStagePauseAfter = document.getElementById('new-stage-pause-after');
    const editModal = document.getElementById('edit-modal');
    const editStageIndexInput = document.getElementById('edit-stage-index');
    const editStageNameInput = document.getElementById('edit-stage-name');
    const editStagePrepTimeInput = document.getElementById('edit-stage-prep-time');
    const editStageDurationInput = document.getElementById('edit-stage-duration');
    const editStageRepsInput = document.getElementById('edit-stage-reps');
    const editStagePauseInput = document.getElementById('edit-stage-pause');
    const editStageSoundStartInput = document.getElementById('edit-stage-sound-start');
    const editStageSoundEndInput = document.getElementById('edit-stage-sound-end');
    const editStagePauseAfterInput = document.getElementById('edit-stage-pause-after');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const importModal = document.getElementById('import-modal');
    const importTextArea = document.getElementById('import-text-area');
    const processImportBtn = document.getElementById('process-import-btn');
    const cancelImportBtn = document.getElementById('cancel-import-btn');

    // --- App State ---
    let disciplines = {};
    let editorStages = [];
    let liveStages = [];
    let activeDisciplineName = '';
    let currentlyEditingName = null;
    let isEditorDirty = false;
    let currentStageIndex = 0;
    let currentRepetition = 1;
    let timeLeft = 0;
    let stationTimerInterval = null;
    let mainEppTimerInterval = null;
    let timerState = 'idle';
    let insertionIndex = -1;
    let audioInitialized = false;
    let signalVolume = 0;
    let eppGesamtzeit = 330;
    let istEppAktiv = false;
    let isEditingEpp = false;

    const eppDiscipline = {
        name: "Europäischer Präzisions Parcours (EPP)",
        isEpp: true,
        prepTime: 3,
        phases: [
            { station: "Station 1", distanz: "7 m", anschlag: "Stehend", zeitLimit: 15, pausable: false, warnSignal: 13, stoppSignalDauer: 2, beschreibung: "2x5 Schuss, Magazinwechsel. Zeit ist fix." },
            { station: "Station 2", distanz: "30 m", anschlag: "Liegend", zeitLimit: 0, pausable: true, beschreibung: "Zeit wird durch RO gestoppt." },
            { station: "Station 3", distanz: "25 m", anschlag: "Stehend am Pfosten", zeitLimit: 0, pausable: true, beschreibung: "Zeit wird durch RO gestoppt." },
            { station: "Station 4", distanz: "20 m", anschlag: "Sitzend", zeitLimit: 0, pausable: true, beschreibung: "Zeit wird durch RO gestoppt." },
            { station: "Station 5a", distanz: "15 m", anschlag: "Kniend", zeitLimit: 0, pausable: true, beschreibung: "Zeit wird durch RO gestoppt." },
            { station: "Station 5b", distanz: "15 m", anschlag: "Stehend", zeitLimit: 10, pausable: false, warnSignal: 8, stoppSignalDauer: 2, beschreibung: "Zeit ist fix." },
            { station: "Station 6", distanz: "10 m", anschlag: "Stehend", zeitLimit: 0, pausable: true, beschreibung: "Zeit wird durch RO gestoppt." }
        ]
    };

    // --- View Management ---
    function switchView(viewName) {
        timerView.style.display = 'none';
        adminView.style.display = 'none';
        helpView.style.display = 'none';
        navTimerBtn.classList.remove('active');
        navAdminBtn.classList.remove('active');
        navHelpBtn.classList.remove('active');
        const views = {
            timer: { view: timerView, btn: navTimerBtn },
            admin: { view: adminView, btn: navAdminBtn },
            help: { view: helpView, btn: navHelpBtn }
        };
        if (views[viewName]) {
            views[viewName].view.style.display = 'flex';
            views[viewName].btn.classList.add('active');
        }
    }

    // --- Audio Context & Synth ---
    const initAudio = () => {
        if (audioInitialized || typeof Tone === 'undefined') return;
        if (Tone.context.state !== 'running') {
            Tone.start().then(() => audioInitialized = true).catch(e => console.error("Tone.js start failed:", e));
        } else {
            audioInitialized = true;
        }
    };
    function oneTimeAudioInit() {
        initAudio();
        document.body.removeEventListener('click', oneTimeAudioInit);
        document.body.removeEventListener('touchend', oneTimeAudioInit);
    }
    const playSound = (dauerInSekunden = 0.5) => {
        if (!audioInitialized) return;
        try {
            const soundSynth = new Tone.Synth({
                volume: signalVolume,
                oscillator: { type: "square", count: 16 },
                envelope: { attack: 0.002, decay: 0.025, sustain: 1, release: 0.01 }
            }).toDestination();
            soundSynth.triggerAttackRelease("A5", dauerInSekunden);
            setTimeout(() => { if (soundSynth) soundSynth.dispose(); }, dauerInSekunden * 1000 + 200);
        } catch (e) {
            console.error("Failed to play sound:", e);
        }
    };

    // --- Core Timer Logic (Standard Disziplinen) ---
    const tick = () => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft > 0) return;
        clearInterval(stationTimerInterval);
        stationTimerInterval = null;
        const stage = liveStages[currentStageIndex];
        if (timerState === 'prep') {
            if (stage.soundAtStart) playSound();
        } else {
            if (stage.soundAtEnd) playSound();
        }
        setTimeout(handlePhaseEnd, 100);
    };
    const handlePhaseEnd = () => {
        const stage = liveStages[currentStageIndex];
        if (timerState === 'prep') startMainDuration();
        else if (timerState === 'rep_pause') startNextRepetition();
        else if (currentRepetition < stage.repetitions) {
            currentRepetition++;
            startInterRepPauseOrNextRep();
        } else {
            if (stage.pauseAfter && currentStageIndex < liveStages.length - 1) pauseForNextStage();
            else advanceToNextStage();
        }
    };
    const startMainDuration = () => {
        const stage = liveStages[currentStageIndex];
        timerState = 'running';
        timeLeft = stage.duration;
        updateUiForStateChange();
        if (timeLeft > 0) stationTimerInterval = setInterval(tick, 1000);
        else {
            if (stage.soundAtEnd) playSound();
            setTimeout(handlePhaseEnd, 100);
        }
    };
    const startNextRepetition = () => {
        const stage = liveStages[currentStageIndex];
        timerState = 'running';
        timeLeft = stage.duration;
        if (stage.soundAtStart) playSound();
        updateUiForStateChange();
        if (timeLeft > 0) stationTimerInterval = setInterval(tick, 1000);
        else {
            if (stage.soundAtEnd) playSound();
            setTimeout(handlePhaseEnd, 100);
        }
    };
    const startInterRepPauseOrNextRep = () => {
        const stage = liveStages[currentStageIndex];
        if (stage.pauseDuration > 0) {
            timerState = 'rep_pause';
            timeLeft = stage.pauseDuration;
            updateUiForStateChange();
            stationTimerInterval = setInterval(tick, 1000);
        } else {
            startNextRepetition();
        }
    };

    // --- General Control Logic ---
    const advanceToNextStage = () => {
        currentStageIndex++;
        currentRepetition = 1;
        if (currentStageIndex >= liveStages.length) finishSequence();
        else prepareStage(currentStageIndex);
    };
    const pauseForNextStage = () => {
        timerState = 'paused';
        updateUiForStateChange();
    };
    const startTimer = () => {
        initAudio();
        if (liveStages.length === 0) {
            alert("Bitte im Admin-Bereich eine Disziplin laden.");
            return;
        }
        if (istEppAktiv) handleEppStart();
        else {
            if (timerState === 'paused') {
                currentStageIndex++;
                prepareStage(currentStageIndex);
            } else if (timerState === 'idle' || timerState === 'finished') {
                if (timerState === 'finished') resetCurrentDiscipline(true);
                else loadStage();
            }
        }
    };

    // --- EPP-spezifische Logik ---
    function handleEppStart() {
        const prepTime = disciplines[activeDisciplineName]?.prepTime || 3;
        if (timerState === 'idle') {
            timerState = 'epp_prep';
            timeLeft = prepTime;
            updateUiForStateChange();
            stationTimerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    clearInterval(stationTimerInterval);
                    stationTimerInterval = null;
                    startEppStationProper();
                }
            }, 1000);
        }
    }
    function startEppStationProper() {
        const stage = liveStages[currentStageIndex];
        playSound();
        if (!mainEppTimerInterval && eppGesamtzeit > 0) {
            mainEppTimerInterval = setInterval(() => {
                if (eppGesamtzeit > 0) eppGesamtzeit--;
                if (eppRestzeitAnzeige) eppRestzeitAnzeige.textContent = formatTime(eppGesamtzeit);
            }, 1000);
        }
        if (stage.zeitLimit > 0) {
            timerState = 'epp_running_fixed';
            timeLeft = stage.zeitLimit;
            updateUiForStateChange();
            stationTimerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (stage.warnSignal && timeLeft === (stage.zeitLimit - stage.warnSignal)) {
                    playSound(stage.stoppSignalDauer);
                }
                if (timeLeft <= 0) {
                    naechsteStation(true);
                }
            }, 1000);
        } else {
            timerState = 'epp_running_open';
            timeLeft = 0;
            updateUiForStateChange();
            stationTimerInterval = setInterval(() => {
                timeLeft++;
                updateTimerDisplay();
            }, 1000);
        }
    }
    function naechsteStation(isAutomatic = false) {
        clearInterval(stationTimerInterval);
        stationTimerInterval = null;
        clearInterval(mainEppTimerInterval);
        mainEppTimerInterval = null;
        if (currentStageIndex === liveStages.length - 1) {
            finishSequence();
        } else if (isAutomatic) {
            advanceToNextStage();
        } else {
            currentStageIndex++;
            prepareStage(currentStageIndex);
        }
    }
    function pausiereEppTimer() {
        const stage = liveStages[currentStageIndex];
        if (!stage.pausable) return;
        if (timerState === 'epp_running_open') {
            clearInterval(stationTimerInterval);
            clearInterval(mainEppTimerInterval);
            stationTimerInterval = null;
            mainEppTimerInterval = null;
            timerState = 'epp_paused';
        } else if (timerState === 'epp_paused') {
            timerState = 'epp_running_open';
            startEppStationProper();
        }
        updateUiForStateChange();
    }
    const resetCurrentDiscipline = (skipConfirm = false) => {
        if (!skipConfirm && !confirm("Möchten Sie den aktuellen Ablauf wirklich zurücksetzen?")) return;
        clearInterval(stationTimerInterval);
        stationTimerInterval = null;
        clearInterval(mainEppTimerInterval);
        mainEppTimerInterval = null;
        if (istEppAktiv) {
            eppGesamtzeit = 330;
            if (eppRestzeitAnzeige) eppRestzeitAnzeige.textContent = formatTime(eppGesamtzeit);
        }
        if (liveStages.length > 0) {
            prepareStage(0);
        } else {
            timerState = 'idle';
            timeLeft = 0;
            updateUiForStateChange();
        }
    };
    const finishSequence = () => {
        timerState = 'finished';
        clearInterval(stationTimerInterval);
        clearInterval(mainEppTimerInterval);
        stationTimerInterval = null;
        mainEppTimerInterval = null;
        updateUiForStateChange();
    };
    const prepareStage = (index) => {
        currentStageIndex = index;
        currentRepetition = 1;
        timerState = 'idle';
        updateUiForStateChange();
    };
    const loadStage = () => {
        const stage = liveStages[currentStageIndex];
        currentRepetition = 1;
        if (stage.prepTime > 0) {
            timerState = 'prep';
            timeLeft = stage.prepTime;
        } else {
            timerState = 'running';
            timeLeft = stage.duration;
            if (stage.soundAtStart) playSound();
        }
        updateUiForStateChange();
        if (timeLeft > 0) stationTimerInterval = setInterval(tick, 1000);
        else {
            if (timerState === 'prep' && stage.soundAtStart) playSound();
            if (timerState === 'running' && stage.soundAtEnd) playSound();
            setTimeout(handlePhaseEnd, 100);
        }
    };

    // --- UI Update Logic ---
    const formatTime = (seconds) => {
        const s = Math.max(0, seconds);
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }
    const updateTimerDisplay = () => liveTimerDisplay.textContent = formatTime(timeLeft);
    const updateUiForStateChange = () => {
        liveStartBtn.classList.add('hidden');
        liveResetBtn.classList.add('hidden');
        if (eppTimerSection) eppTimerSection.style.display = 'none';
        if (eppNextStationBtn) eppNextStationBtn.classList.add('hidden');
        if (eppPauseBtn) eppPauseBtn.classList.add('hidden');
        if (!liveStages || liveStages.length === 0 || !liveStages[currentStageIndex]) {
            liveStageName.textContent = 'Disziplin laden...';
            liveTotalProgress.textContent = 'Bitte im Admin-Bereich eine Disziplin laden.';
            liveDisciplineName.textContent = '-';
            liveTimerDisplay.textContent = '00:00';
            return;
        }
        const stage = liveStages[currentStageIndex];
        liveResetBtn.classList.remove('hidden');
        if (istEppAktiv) {
            eppTimerSection.style.display = 'block';
            switch (timerState) {
                case 'idle':
                    liveStageName.textContent = `${stage.station}: ${stage.anschlag}`;
                    liveTotalProgress.textContent = stage.beschreibung;
                    timeLeft = disciplines[activeDisciplineName]?.prepTime || 3;
                    updateTimerDisplay();
                    liveStartBtn.classList.remove('hidden');
                    liveStartBtn.textContent = 'Achtung... (Start)';
                    liveStartBtn.className = 'w-full max-w-xs bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors';
                    if (currentStageIndex > 0) {
                        eppNextStationBtn.classList.remove('hidden');
                        eppNextStationBtn.textContent = (currentStageIndex === liveStages.length - 1) ? 'Match-Ende' : 'Nächste Station';
                    }
                    break;
                case 'epp_prep':
                    liveStageName.textContent = `Vorbereitung: ${stage.station}`;
                    liveTotalProgress.textContent = "Startsignal ertönt gleich...";
                    break;
                case 'epp_running_fixed':
                case 'epp_running_open':
                    liveStageName.textContent = `${stage.station} läuft...`;
                    liveTotalProgress.textContent = stage.beschreibung;
                    if (stage.pausable) {
                        eppPauseBtn.classList.remove('hidden');
                        eppPauseBtn.textContent = 'Störung / Pause';
                        eppPauseBtn.className = 'btn-epp-pause w-full max-w-xs text-white font-bold py-3 px-4 rounded-lg shadow-md';
                    }
                    if (timerState === 'epp_running_open') {
                        eppNextStationBtn.classList.remove('hidden');
                        eppNextStationBtn.textContent = (currentStageIndex === liveStages.length - 1) ? 'Match-Ende' : 'Station beenden';
                    }
                    break;
                case 'epp_paused':
                    liveStageName.textContent = 'Störung / Angehalten';
                    liveTotalProgress.textContent = "Zum Fortsetzen erneut auf 'Fortsetzen' klicken.";
                    eppPauseBtn.classList.remove('hidden');
                    eppPauseBtn.textContent = 'Fortsetzen';
                    eppPauseBtn.className = 'btn-continue w-full max-w-xs text-white font-bold py-3 px-4 rounded-lg shadow-md';
                    break;
                case 'finished':
                    liveStageName.textContent = 'Match beendet!';
                    liveTotalProgress.textContent = `Finale Restzeit: ${formatTime(eppGesamtzeit)}`;
                    liveTimerDisplay.textContent = formatTime(0);
                    break;
            }
        } else {
            switch (timerState) {
                case 'idle':
                    liveStageName.textContent = stage.name;
                    timeLeft = stage.prepTime > 0 ? stage.prepTime : stage.duration;
                    updateTimerDisplay();
                    liveTotalProgress.textContent = `Bereit für Phase ${currentStageIndex + 1} von ${liveStages.length}.`;
                    liveStartBtn.classList.remove('hidden');
                    liveStartBtn.textContent = 'Start';
                    liveStartBtn.className = 'w-full max-w-xs bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors';
                    break;
                case 'prep':
                case 'running':
                case 'rep_pause':
                    liveResetBtn.classList.remove('hidden');
                    if (timerState === 'prep') liveStageName.textContent = 'Vorbereitung';
                    else if (timerState === 'running') liveStageName.textContent = stage.name + (stage.repetitions > 1 ? ` (${currentRepetition}/${stage.repetitions})` : '');
                    else liveStageName.textContent = 'Pause';
                    liveTotalProgress.textContent = `Phase ${currentStageIndex + 1} von ${liveStages.length} läuft...`;
                    break;
                case 'paused':
                    liveStageName.textContent = `Bereit für nächste Phase`;
                    liveTotalProgress.textContent = `Phase ${currentStageIndex + 1} von ${liveStages.length} beendet.`;
                    timeLeft = 0;
                    updateTimerDisplay();
                    liveStartBtn.classList.remove('hidden');
                    liveStartBtn.textContent = 'Weiter';
                    liveStartBtn.className = 'btn-continue w-full max-w-xs text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors';
                    break;
                case 'finished':
                    liveStageName.textContent = 'Fertig!';
                    liveTotalProgress.textContent = `Ablauf beendet.`;
                    timeLeft = 0;
                    updateTimerDisplay();
                    break;
            }
        }
    };

    // --- Admin & Data Management ---
    const renderLiveStagesList = () => {
        liveStagesListContainer.innerHTML = '';
        if (!liveStages || liveStages.length === 0) {
            liveStagesListContainer.innerHTML = `<p class="text-gray-500 text-center italic">Kein Ablauf geladen.</p>`;
            return;
        }
        liveStages.forEach((stage, index) => {
            const stageEl = document.createElement('div');
            stageEl.className = 'bg-gray-700 p-3 rounded-lg flex items-center justify-between';
            let stageHtml;
            if (istEppAktiv) {
                stageHtml = `<div class="flex items-center flex-grow min-w-0"><span class="font-bold text-gray-400 mr-4">${index + 1}.</span><div class="min-w-0"><p class="text-white font-semibold stage-name-display break-word">${stage.station} (${stage.distanz})</p><p class="text-xs text-gray-300 break-word">${stage.anschlag} - ${stage.beschreibung}</p></div></div><button data-action="start-from" data-index="${index}" title="Von hier starten" class="p-2 text-green-400 hover:bg-green-700 hover:text-white rounded-md flex-shrink-0 transition-colors"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg></button>`;
            } else {
                const prepText = stage.prepTime > 0 ? `${stage.prepTime}s Vorl. + ` : '';
                const repText = stage.repetitions > 1 ? ` &times; ${stage.repetitions}` : '';
                const pauseText = stage.pauseDuration > 0 ? ` (+${stage.pauseDuration}s Pause)` : '';
                let soundText = '';
                if (stage.soundAtStart && stage.soundAtEnd) soundText = 'Start/End-Ton';
                else if (stage.soundAtStart) soundText = 'Start-Ton';
                else if (stage.soundAtEnd) soundText = 'End-Ton';
                const pauseAfterText = stage.pauseAfter ? ' | Pause nachher' : '';
                stageHtml = `<div class="flex items-center flex-grow min-w-0"><span class="font-bold text-gray-400 mr-4">${index + 1}.</span><div class="min-w-0"><p class="text-white font-semibold stage-name-display break-word">${stage.name}</p><p class="text-xs text-gray-300 break-word">${prepText}${stage.duration}s ${repText}${pauseText} ${soundText}${pauseAfterText}</p></div></div><button data-action="start-from" data-index="${index}" title="Von hier starten" class="p-2 text-green-400 hover:bg-green-700 hover:text-white rounded-md flex-shrink-0 transition-colors"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg></button>`;
            }
            stageEl.innerHTML = stageHtml;
            liveStagesListContainer.appendChild(stageEl);
        });
    };
    const renderAdminStagesList = () => {
        adminStagesListContainer.innerHTML = '';
        const createInsertButton = (index) => {
            const btn = document.createElement('button');
            btn.className = 'insert-btn w-full p-1.5 bg-gray-700 hover:bg-amber-500 text-gray-400 hover:text-gray-900 rounded-md transition-colors text-xs font-bold';
            btn.textContent = 'HIER EINFÜGEN';
            btn.dataset.index = index;
            btn.addEventListener('click', () => {
                insertionIndex = index;
                document.querySelectorAll('.insert-btn').forEach(b => b.classList.remove('bg-amber-500', 'text-gray-900'));
                btn.classList.add('bg-amber-500', 'text-gray-900');
            });
            adminStagesListContainer.appendChild(btn);
        };
        createInsertButton(0);
        if (editorStages.length === 0) {
            document.querySelector(`.insert-btn[data-index='0']`)?.classList.add('bg-amber-500', 'text-gray-900');
            insertionIndex = 0;
        } else {
            editorStages.forEach((stage, index) => {
                const prepText = stage.prepTime > 0 ? `${stage.prepTime}s Vorl. + ` : '';
                const repText = stage.repetitions > 1 ? ` &times; ${stage.repetitions}` : '';
                const pauseText = stage.pauseDuration > 0 ? ` (+${stage.pauseDuration}s Pause)` : '';
                let soundText = '';
                if (stage.soundAtStart && stage.soundAtEnd) soundText = 'Start/End-Ton';
                else if (stage.soundAtStart) soundText = 'Start-Ton';
                else if (stage.soundAtEnd) soundText = 'End-Ton';
                const pauseAfterText = stage.pauseAfter ? ' | Pause nachher' : '';
                const stageEl = document.createElement('div');
                stageEl.className = 'bg-gray-700 p-2 rounded-lg flex items-center justify-between';
                stageEl.dataset.index = index;
                stageEl.innerHTML = `<div class="flex items-center flex-grow cursor-pointer min-w-0" data-action="edit"><span class="font-bold text-gray-400 mr-3">${index + 1}.</span><div class="flex-grow min-w-0"><p class="text-white font-semibold stage-name-display break-word">${stage.name}</p><p class="text-xs text-gray-300 break-word">${prepText}${stage.duration}s ${repText}${pauseText} ${soundText}${pauseAfterText}</p></div></div><div class="stage-controls flex items-center flex-shrink-0 ml-2"><button data-action="duplicate" title="Duplizieren" class="p-1 hover:bg-gray-600 rounded-md"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button><button data-action="move-up" title="Nach oben" ${index === 0 ? 'disabled' : ''} class="p-1 hover:bg-gray-600 rounded-md"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg></button><button data-action="move-down" title="Nach unten" ${index === editorStages.length - 1 ? 'disabled' : ''} class="p-1 hover:bg-gray-600 rounded-md"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button><button data-action="remove" title="Löschen" class="p-1 text-red-500 hover:bg-red-700 hover:text-white rounded-md ml-1"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button></div>`;
                stageEl.addEventListener('click', (e) => {
                    const action = e.target.closest('button')?.dataset.action || e.target.closest('[data-action="edit"]')?.dataset.action;
                    if (!action) return;
                    switch (action) {
                        case 'edit': openEditModal(index); break;
                        case 'remove': removeStage(index); break;
                        case 'move-up': moveStage(index, -1); break;
                        case 'move-down': moveStage(index, 1); break;
                        case 'duplicate': duplicateStage(index); break;
                    }
                });
                adminStagesListContainer.appendChild(stageEl);
                createInsertButton(index + 1);
            });
        }
        if (insertionIndex === -1 || insertionIndex > editorStages.length) {
            insertionIndex = editorStages.length;
        }
        document.querySelector(`.insert-btn[data-index='${insertionIndex}']`)?.classList.add('bg-amber-500', 'text-gray-900');
    };
    const addStage = () => {
        const duration = parseInt(newStageDuration.value);
        if (isNaN(duration)) { alert("Bitte geben Sie eine gültige Dauer an."); return; }
        const newStage = { name: newStageName.value.trim() || 'Unbenannte Phase', prepTime: parseInt(newStagePrepTime.value) || 0, duration: duration, repetitions: parseInt(newStageReps.value) || 1, pauseDuration: parseInt(newStagePause.value) || 0, soundAtStart: newStageSoundStart.checked, soundAtEnd: newStageSoundEnd.checked, pauseAfter: newStagePauseAfter.checked };
        const finalInsertionIndex = (insertionIndex === -1) ? editorStages.length : insertionIndex;
        editorStages.splice(finalInsertionIndex, 0, newStage);
        insertionIndex = finalInsertionIndex + 1;
        isEditorDirty = true;
        renderAdminStagesList();
        newStageName.value = ''; newStagePrepTime.value = ''; newStageDuration.value = ''; newStageReps.value = '1'; newStagePause.value = '';
        newStageSoundStart.checked = true; newStageSoundEnd.checked = true; newStagePauseAfter.checked = false;
    };
    const removeStage = (index) => { editorStages.splice(index, 1); isEditorDirty = true; renderAdminStagesList(); };
    const moveStage = (index, direction) => { const newIndex = index + direction; if (newIndex < 0 || newIndex >= editorStages.length) return;[editorStages[index], editorStages[newIndex]] = [editorStages[newIndex], editorStages[index]]; isEditorDirty = true; renderAdminStagesList(); };
    const duplicateStage = (index) => { const stageToDuplicate = JSON.parse(JSON.stringify(editorStages[index])); editorStages.splice(index + 1, 0, stageToDuplicate); insertionIndex = index + 2; isEditorDirty = true; renderAdminStagesList(); };
    const openEditModal = (index) => { const stage = editorStages[index]; editStageIndexInput.value = index; editStageNameInput.value = stage.name; editStagePrepTimeInput.value = stage.prepTime || 0; editStageDurationInput.value = stage.duration; editStageRepsInput.value = stage.repetitions; editStagePauseInput.value = stage.pauseDuration || 0; editStageSoundStartInput.checked = stage.soundAtStart; editStageSoundEndInput.checked = stage.soundAtEnd; editStagePauseAfterInput.checked = stage.pauseAfter; editModal.classList.remove('hidden'); };
    const closeEditModal = () => editModal.classList.add('hidden');
    const handleUpdateStage = () => { const index = parseInt(editStageIndexInput.value); const duration = parseInt(editStageDurationInput.value); if (isNaN(duration)) { alert("Bitte geben Sie eine gültige Dauer an."); return; } editorStages[index] = { name: editStageNameInput.value.trim() || 'Unbenannte Phase', prepTime: parseInt(editStagePrepTimeInput.value) || 0, duration: duration, repetitions: parseInt(editStageRepsInput.value) || 1, pauseDuration: parseInt(editStagePauseInput.value) || 0, soundAtStart: editStageSoundStartInput.checked, soundAtEnd: editStageSoundEndInput.checked, pauseAfter: editStagePauseAfterInput.checked }; isEditorDirty = true; renderAdminStagesList(); closeEditModal(); };
    const renderDisciplineSelector = () => { const currentAdminSelection = adminDisciplineSelect.value; adminDisciplineSelect.innerHTML = ''; const names = Object.keys(disciplines).sort((a, b) => a.localeCompare(b)); if (names.length === 0) { adminDisciplineSelect.innerHTML = `<option>Keine Disziplinen</option>`; adminLoadBtn.disabled = true; adminDeleteBtn.disabled = true; return; } names.forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; adminDisciplineSelect.appendChild(option); }); if (disciplines[currentAdminSelection]) adminDisciplineSelect.value = currentAdminSelection; else if (names.length > 0) adminDisciplineSelect.value = names[0]; adminLoadBtn.disabled = false; adminDeleteBtn.disabled = false; };
    const saveDisciplinesToStorage = () => { try { localStorage.setItem('bdmpTimerDisciplines', JSON.stringify(disciplines)); localStorage.setItem('bdmpTimerActiveDiscipline', activeDisciplineName); } catch (e) { console.error("Failed to save to localStorage", e); alert("Fehler beim Speichern der Daten."); } };
    const loadDisciplinesFromStorage = () => { const stored = localStorage.getItem('bdmpTimerDisciplines'); if (stored) { try { disciplines = JSON.parse(stored); } catch { disciplines = {}; } } else { disciplines = {}; } const lastActive = localStorage.getItem('bdmpTimerActiveDiscipline'); if (lastActive && disciplines[lastActive]) { loadDisciplineForTimer(lastActive, false); } renderDisciplineSelector(); };
    function createNewDiscipline() {
        if (isEditorDirty && !confirm("Sie haben ungespeicherte Änderungen. Wirklich verwerfen?")) return;
        editorStages = [];
        disciplineNameInput.value = '';
        editingDisciplineName.textContent = 'Neue Disziplin';
        isEditingEpp = false;
        currentlyEditingName = null;
        isEditorDirty = false;
        renderAdminStagesList();
    }
    async function loadDisciplinesFromServer() {
        if (!confirm("Möchten Sie die Standard-Disziplinen & EPP laden? Bestehende Disziplinen mit gleichem Namen werden überschrieben.")) return;
        try {
            const response = await fetch('disziplinen.txt');
            if (!response.ok) {
                if (response.status === 404) throw new Error("Fehler 404: Die Datei 'disziplinen.txt' wurde nicht gefunden.");
                else throw new Error(`Netzwerk-Fehler: ${response.status}`);
            }
            const serverDisciplinesText = await response.text();
            const serverDisciplines = JSON.parse(serverDisciplinesText);
            for (const name in serverDisciplines) {
                disciplines[name] = serverDisciplines[name];
            }
            disciplines[eppDiscipline.name] = eppDiscipline;
            saveDisciplinesToStorage();
            renderDisciplineSelector();
            loadDisciplineForEditor(adminDisciplineSelect.value);
            alert(`Standard-Disziplinen und EPP wurden geladen/aktualisiert.`);
        } catch (error) {
            console.error('Fehler beim Laden der Standard-Disziplinen:', error);
            if (error instanceof SyntaxError) {
                alert("Fehler: Die Datei 'disziplinen.txt' scheint ein ungültiges Format zu haben.");
            } else {
                alert(error.message);
            }
        }
    }
    function loadDisciplineForEditor(name) {
        if (isEditorDirty && !confirm("Sie haben ungespeicherte Änderungen. Wirklich verwerfen?")) return;
        if (!disciplines[name]) {
            createNewDiscipline();
            return;
        }
        currentlyEditingName = name;
        const disciplineToEdit = disciplines[name];
        isEditingEpp = !!disciplineToEdit.isEpp;
        if (isEditingEpp && disciplineToEdit.phases) {
            editorStages = disciplineToEdit.phases.map(p => ({
                name: `${p.station} (${p.distanz}, ${p.anschlag}) - ${p.beschreibung}`,
                prepTime: disciplineToEdit.prepTime || 3,
                duration: p.zeitLimit || 0,
                repetitions: 1, pauseDuration: 0,
                soundAtStart: true, soundAtEnd: p.warnSignal > 0,
                pauseAfter: true
            }));
        } else {
            editorStages = JSON.parse(JSON.stringify(disciplineToEdit));
        }
        disciplineNameInput.value = name;
        editingDisciplineName.textContent = name;
        insertionIndex = editorStages.length;
        isEditorDirty = false;
        renderAdminStagesList();
    }
    function handleSaveDiscipline() {
        const newName = disciplineNameInput.value.trim();
        if (!newName) { alert("Bitte geben Sie einen Namen an."); return; }
        if (editorStages.length === 0) { alert("Ablauf ist leer."); return; }
        if (disciplines[newName] && newName !== currentlyEditingName) {
            if (!confirm(`Die Disziplin "${newName}" existiert bereits. Überschreiben?`)) return;
        }
        let disciplineData;
        if (isEditingEpp) {
            const originalDiscipline = disciplines[currentlyEditingName] || eppDiscipline;
            const newEppPhases = editorStages.map((stage, index) => {
                const originalPhase = originalDiscipline.phases[index] || { station: 'Unbekannt', distanz: '', anschlag: '', beschreibung: '' };
                return { ...originalPhase, zeitLimit: stage.duration || 0, pausable: (stage.duration === 0), warnSignal: stage.soundAtEnd ? Math.max(0, (stage.duration || 0) - 2) : 0, stoppSignalDauer: stage.soundAtEnd ? 2 : 0, };
            });
            disciplineData = { ...originalDiscipline, name: newName, prepTime: editorStages.length > 0 ? editorStages[0].prepTime : 3, phases: newEppPhases };
        } else {
            disciplineData = JSON.parse(JSON.stringify(editorStages));
        }
        if (currentlyEditingName && newName !== currentlyEditingName) {
            delete disciplines[currentlyEditingName];
        }
        disciplines[newName] = disciplineData;
        saveDisciplinesToStorage();
        isEditorDirty = false;
        currentlyEditingName = newName;
        renderDisciplineSelector();
        adminDisciplineSelect.value = newName;
        editingDisciplineName.textContent = newName;
        alert(`Disziplin "${newName}" wurde gespeichert!`);
    }
    function handleDeleteDiscipline() {
        const name = adminDisciplineSelect.value;
        if (disciplines[name] && confirm(`Disziplin "${name}" wirklich löschen?`)) {
            const isDeletingEdited = (currentlyEditingName === name);
            delete disciplines[name];
            if (activeDisciplineName === name) {
                activeDisciplineName = '';
                liveStages = [];
                resetCurrentDiscipline(true);
            }
            saveDisciplinesToStorage();
            renderDisciplineSelector();
            if (isDeletingEdited) {
                createNewDiscipline();
            } else if (Object.keys(disciplines).length > 0) {
                loadDisciplineForEditor(adminDisciplineSelect.value);
            } else {
                createNewDiscipline();
            }
        }
    }
    function loadDisciplineForTimer(name, doSwitchView = true) {
        if (!disciplines[name]) { alert(`Disziplin "${name}" konnte nicht gefunden werden.`); return; }
        const disciplineToLoad = disciplines[name];
        istEppAktiv = !!disciplineToLoad.isEpp;
        liveStages = istEppAktiv ? disciplineToLoad.phases : JSON.parse(JSON.stringify(disciplineToLoad));
        activeDisciplineName = name;
        liveDisciplineName.textContent = name;
        saveDisciplinesToStorage();
        renderLiveStagesList();
        resetCurrentDiscipline(true);
        if (doSwitchView) switchView('timer');
    }
    function copyToClipboard(text, successMessage) {
        navigator.clipboard.writeText(text).then(() => {
            alert(successMessage);
        }).catch(err => {
            console.error('Fehler beim Kopieren: ', err);
            alert('Kopieren fehlgeschlagen.');
        });
    }
    function handleExportAll() {
        if (Object.keys(disciplines).length === 0) { alert("Keine Disziplinen zum Kopieren vorhanden."); return; }
        const dataStr = JSON.stringify(disciplines, null, 2);
        copyToClipboard(dataStr, "Die gesamte Sammlung wurde in die Zwischenablage kopiert.");
    }
    function handleExportSingle() {
        const name = adminDisciplineSelect.value;
        if (!disciplines[name]) { alert("Bitte eine gültige Disziplin zum Kopieren auswählen."); return; }
        const singleDiscipline = { [name]: disciplines[name] };
        const dataStr = JSON.stringify(singleDiscipline, null, 2);
        copyToClipboard(dataStr, `Disziplin "${name}" wurde in die Zwischenablage kopiert.`);
    }
    function handleImport() {
        importTextArea.value = '';
        importModal.classList.remove('hidden');
    }
    function processImportFromText() {
        const importedData = importTextArea.value;
        if (!importedData.trim()) { alert("Das Textfeld ist leer."); return; }
        try {
            const importedDisciplines = JSON.parse(importedData);
            let importedCount = 0;
            let overwrittenCount = 0;
            for (const name in importedDisciplines) {
                const isValidDiscipline = (Array.isArray(importedDisciplines[name]) || importedDisciplines[name].isEpp);
                if (Object.prototype.hasOwnProperty.call(importedDisciplines, name) && isValidDiscipline) {
                    if (disciplines[name]) {
                        if (confirm(`Disziplin "${name}" existiert bereits. Überschreiben?`)) {
                            disciplines[name] = importedDisciplines[name];
                            overwrittenCount++;
                        }
                    } else {
                        disciplines[name] = importedDisciplines[name];
                        importedCount++;
                    }
                }
            }
            if (importedCount > 0 || overwrittenCount > 0) {
                saveDisciplinesToStorage();
                renderDisciplineSelector();
                loadDisciplineForEditor(adminDisciplineSelect.value);
                alert(`${importedCount} Disziplin(en) importiert, ${overwrittenCount} überschrieben.`);
            } else {
                alert("Keine neuen Disziplinen gefunden.");
            }
        } catch (e) {
            alert("Fehler beim Verarbeiten der Daten. Falsches Format?");
            console.error(e);
        } finally {
            importModal.classList.add('hidden');
        }
    }

    // --- Audio Volume Control Logic ---
    function updateVolume(value) {
        const percentage = parseInt(value, 10);
        volumeDisplay.textContent = percentage;
        if (percentage === 0) {
            signalVolume = -Infinity;
        } else {
            signalVolume = Tone.gainToDb(percentage / 100);
        }
        localStorage.setItem('bdmpTimerVolume', percentage);
    }
    function loadVolumeSetting() {
        const savedVolume = localStorage.getItem('bdmpTimerVolume');
        if (savedVolume !== null) {
            volumeSlider.value = savedVolume;
            updateVolume(savedVolume);
        } else {
            updateVolume(100);
        }
    }

    // --- Event Listeners ---
    document.body.addEventListener('click', oneTimeAudioInit, { once: true });
    document.body.addEventListener('touchend', oneTimeAudioInit, { once: true });
    navTimerBtn.addEventListener('click', () => switchView('timer'));
    navAdminBtn.addEventListener('click', () => switchView('admin'));
    navHelpBtn.addEventListener('click', () => switchView('help'));
    liveStartBtn.addEventListener('click', startTimer);
    liveResetBtn.addEventListener('click', () => resetCurrentDiscipline(false));
    liveStagesListContainer.addEventListener('click', (event) => { const btn = event.target.closest('[data-action="start-from"]'); if (btn) { initAudio(); const index = parseInt(btn.dataset.index, 10); if (!isNaN(index)) { resetCurrentDiscipline(true); prepareStage(index); } } });
    addStageBtn.addEventListener('click', addStage);
    saveDisciplineBtn.addEventListener('click', handleSaveDiscipline);
    adminLoadBtn.addEventListener('click', () => loadDisciplineForTimer(adminDisciplineSelect.value));
    adminNewBtn.addEventListener('click', createNewDiscipline);
    adminDisciplineSelect.addEventListener('change', () => loadDisciplineForEditor(adminDisciplineSelect.value));
    adminDeleteBtn.addEventListener('click', handleDeleteDiscipline);
    saveEditBtn.addEventListener('click', handleUpdateStage);
    cancelEditBtn.addEventListener('click', closeEditModal);
    if (loadFromServerBtn) loadFromServerBtn.addEventListener('click', loadDisciplinesFromServer);
    if (eppNextStationBtn) eppNextStationBtn.addEventListener('click', () => naechsteStation(false));
    if (eppPauseBtn) eppPauseBtn.addEventListener('click', pausiereEppTimer);
    importBtn.addEventListener('click', handleImport);
    cancelImportBtn.addEventListener('click', () => importModal.classList.add('hidden'));
    processImportBtn.addEventListener('click', processImportFromText);
    exportAllBtn.addEventListener('click', handleExportAll);
    adminExportSingleBtn.addEventListener('click', handleExportSingle);
    if (volumeSlider) { volumeSlider.addEventListener('input', (e) => updateVolume(e.target.value)); }
    if (testToneBtn) { testToneBtn.addEventListener('click', () => { initAudio(); playSound(); }); }

    // --- Initial Load ---
    loadDisciplinesFromStorage();
    loadVolumeSetting();
    if (Object.keys(disciplines).length > 0) {
        loadDisciplineForEditor(adminDisciplineSelect.value);
    } else {
        createNewDiscipline();
    }
    
    // --- PWA Update Notification Logic ---
    let newWorker;
    function showUpdateNotification() {
        const notification = document.getElementById('update-notification');
        const reloadButton = document.getElementById('reload-button');
        if (!notification || !reloadButton) return;
        reloadButton.addEventListener('click', () => {
            newWorker.postMessage({ action: 'skipWaiting' });
        });
        notification.classList.remove('hidden');
        setTimeout(() => notification.classList.add('show'), 10);
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateNotification();
                    }
                });
            });
        });
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    }
});