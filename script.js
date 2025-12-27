class DigitalClock {
    constructor() {
        this.currentTime = new Date();
        this.timezone = 'local';
        this.isTwelveHour = true;
        this.showSeconds = true;
        this.showDate = true;
        this.showAnalog = true;
        this.enableSounds = false;

        // États des modules
        this.stopwatch = {
            isRunning: false,
            startTime: null,
            elapsedTime: 0,
            laps: []
        };

        this.timer = {
            isRunning: false,
            isPaused: false,
            totalTime: 300000, // 5 minutes en ms
            remainingTime: 300000,
            interval: null
        };

        this.alarms = this.loadAlarms();

        this.initializeElements();
        this.attachEventListeners();
        this.initializeAnalogClock();
        this.loadSettings();
        this.startClock();
        this.updateDisplay();
    }

    initializeElements() {
        // Horloge digitale
        this.hoursElement = document.getElementById('hours');
        this.minutesElement = document.getElementById('minutes');
        this.secondsElement = document.getElementById('seconds');
        this.periodElement = document.getElementById('period');
        this.dayNameElement = document.getElementById('dayName');
        this.dayElement = document.getElementById('day');
        this.monthElement = document.getElementById('month');
        this.yearElement = document.getElementById('year');

        // Horloge analogique
        this.hourHand = document.getElementById('hourHand');
        this.minuteHand = document.getElementById('minuteHand');
        this.secondHand = document.getElementById('secondHand');
        this.analogClock = document.getElementById('analogClock');

        // Chronomètre
        this.swMinutesElement = document.getElementById('swMinutes');
        this.swSecondsElement = document.getElementById('swSeconds');
        this.swMillisecondsElement = document.getElementById('swMilliseconds');
        this.startStopBtn = document.getElementById('startStopBtn');
        this.lapBtn = document.getElementById('lapBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.lapsContainer = document.getElementById('lapsContainer');

        // Minuteur
        this.timerHoursInput = document.getElementById('timerHours');
        this.timerMinutesInput = document.getElementById('timerMinutes');
        this.timerSecondsInput = document.getElementById('timerSeconds');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerProgress = document.getElementById('timerProgress');
        this.timerStartBtn = document.getElementById('timerStartBtn');
        this.timerPauseBtn = document.getElementById('timerPauseBtn');
        this.timerStopBtn = document.getElementById('timerStopBtn');

        // Contrôles
        this.showAnalogCheckbox = document.getElementById('showAnalog');
        this.showSecondsCheckbox = document.getElementById('showSeconds');
        this.showDateCheckbox = document.getElementById('showDate');
        this.twelveHourCheckbox = document.getElementById('twelveHour');
        this.timezoneSelect = document.getElementById('timezoneSelect');
        this.enableSoundsCheckbox = document.getElementById('enableSounds');
        this.testSoundBtn = document.getElementById('testSound');

        // Alarmes
        this.addAlarmBtn = document.getElementById('addAlarmBtn');
        this.alarmsList = document.getElementById('alarmsList');
        this.alarmModal = document.getElementById('alarmModal');
        this.alarmModalClose = document.getElementById('alarmModalClose');
        this.alarmCancel = document.getElementById('alarmCancel');
        this.alarmSave = document.getElementById('alarmSave');
        this.alarmNotification = document.getElementById('alarmNotification');
        this.alarmDismiss = document.getElementById('alarmDismiss');

        // Informations système
        this.lastUpdateElement = document.getElementById('lastUpdate');
        this.precisionElement = document.getElementById('precision');
    }

    attachEventListeners() {
        // Contrôles d'affichage
        this.showAnalogCheckbox.addEventListener('change', (e) => {
            this.showAnalog = e.target.checked;
            this.toggleAnalogClock();
            this.saveSettings();
        });

        this.showSecondsCheckbox.addEventListener('change', (e) => {
            this.showSeconds = e.target.checked;
            this.updateDisplay();
            this.saveSettings();
        });

        this.showDateCheckbox.addEventListener('change', (e) => {
            this.showDate = e.target.checked;
            this.toggleDateDisplay();
            this.saveSettings();
        });

        this.twelveHourCheckbox.addEventListener('change', (e) => {
            this.isTwelveHour = e.target.checked;
            this.updateDisplay();
            this.saveSettings();
        });

        // Fuseau horaire
        this.timezoneSelect.addEventListener('change', (e) => {
            this.timezone = e.target.value;
            this.updateDisplay();
            this.saveSettings();
        });

        // Thèmes
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setTheme(btn.dataset.theme));
        });

        // Sons
        this.enableSoundsCheckbox.addEventListener('change', (e) => {
            this.enableSounds = e.target.checked;
            this.saveSettings();
        });

        this.testSoundBtn.addEventListener('click', () => this.playSound('tick'));

        // Chronomètre
        this.startStopBtn.addEventListener('click', () => this.toggleStopwatch());
        this.lapBtn.addEventListener('click', () => this.recordLap());
        this.resetBtn.addEventListener('click', () => this.resetStopwatch());

        // Minuteur
        this.timerStartBtn.addEventListener('click', () => this.startTimer());
        this.timerPauseBtn.addEventListener('click', () => this.pauseTimer());
        this.timerStopBtn.addEventListener('click', () => this.stopTimer());

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setTimerPreset(btn.dataset.time));
        });

        // Alarmes
        this.addAlarmBtn.addEventListener('click', () => this.showAlarmModal());
        this.alarmModalClose.addEventListener('click', () => this.hideAlarmModal());
        this.alarmCancel.addEventListener('click', () => this.hideAlarmModal());
        this.alarmSave.addEventListener('click', () => this.saveAlarm());
        this.alarmDismiss.addEventListener('click', () => this.dismissAlarmNotification());

        // Fermeture des modals
        [this.alarmModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAlarmModal();
                }
            });
        });
    }

    initializeAnalogClock() {
        // Générer les marques de minutes
        const minuteMarksContainer = this.analogClock.querySelector('.minute-marks');
        for (let i = 0; i < 60; i++) {
            if (i % 5 !== 0) { // Ne pas créer sur les heures
                const mark = document.createElement('div');
                mark.className = 'minute-mark';
                mark.style.setProperty('--rotation', `${i * 6}deg`);
                minuteMarksContainer.appendChild(mark);
            }
        }
    }

    startClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => {
            this.updateClock();
        }, 1000);

        // Mise à jour haute précision pour les secondes
        this.highPrecisionInterval = setInterval(() => {
            this.updateSeconds();
            this.updateAnalogClock();
            this.checkAlarms();
        }, 50);
    }

    updateClock() {
        this.currentTime = this.getCurrentTime();
        this.updateDisplay();
        this.updateAnalogClock();
        this.updateSystemInfo();
    }

    getCurrentTime() {
        if (this.timezone === 'local') {
            return new Date();
        } else {
            // Utiliser un fuseau horaire spécifique
            return new Date(new Date().toLocaleString("en-US", {timeZone: this.timezone}));
        }
    }

    updateDisplay() {
        const hours = this.currentTime.getHours();
        const minutes = this.currentTime.getMinutes();
        const seconds = this.currentTime.getSeconds();
        const day = this.currentTime.getDate();
        const month = this.currentTime.getMonth();
        const year = this.currentTime.getFullYear();
        const dayName = this.currentTime.toLocaleDateString('fr-FR', { weekday: 'long' });
        const monthName = this.currentTime.toLocaleDateString('fr-FR', { month: 'long' });

        // Format heures
        let displayHours = hours;
        let period = '';

        if (this.isTwelveHour) {
            period = hours >= 12 ? 'PM' : 'AM';
            displayHours = hours % 12 || 12;
        }

        // Mise à jour des éléments
        this.hoursElement.textContent = displayHours.toString().padStart(2, '0');
        this.minutesElement.textContent = minutes.toString().padStart(2, '0');

        if (this.showSeconds) {
            this.secondsElement.textContent = seconds.toString().padStart(2, '0');
            this.secondsElement.style.display = 'inline';
            document.querySelectorAll('.separator')[1].style.display = 'inline';
        } else {
            this.secondsElement.style.display = 'none';
            document.querySelectorAll('.separator')[1].style.display = 'none';
        }

        if (this.isTwelveHour) {
            this.periodElement.textContent = period;
            this.periodElement.style.display = 'inline-block';
        } else {
            this.periodElement.style.display = 'none';
        }

        // Date
        if (this.showDate) {
            this.dayNameElement.textContent = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            this.dayElement.textContent = day;
            this.monthElement.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            this.yearElement.textContent = year;
            document.querySelector('.date-display').style.display = 'block';
        } else {
            document.querySelector('.date-display').style.display = 'none';
        }
    }

    updateSeconds() {
        if (this.showSeconds) {
            const seconds = this.getCurrentTime().getSeconds();
            this.secondsElement.textContent = seconds.toString().padStart(2, '0');
        }
    }

    updateAnalogClock() {
        if (!this.showAnalog) return;

        const now = this.getCurrentTime();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // Calcul des angles
        const hourAngle = ((hours % 12) * 30) + (minutes * 0.5);
        const minuteAngle = (minutes * 6) + (seconds * 0.1);
        const secondAngle = seconds * 6;

        // Application des rotations
        this.hourHand.style.transform = `translateX(-50%) rotate(${hourAngle}deg)`;
        this.minuteHand.style.transform = `translateX(-50%) rotate(${minuteAngle}deg)`;
        this.secondHand.style.transform = `translateX(-50%) rotate(${secondAngle}deg)`;
    }

    toggleAnalogClock() {
        this.analogClock.style.display = this.showAnalog ? 'block' : 'none';
    }

    toggleDateDisplay() {
        document.querySelector('.date-display').style.display = this.showDate ? 'block' : 'none';
    }

    // Chronomètre
    toggleStopwatch() {
        if (this.stopwatch.isRunning) {
            this.pauseStopwatch();
        } else {
            this.startStopwatch();
        }
    }

    startStopwatch() {
        this.stopwatch.isRunning = true;
        this.stopwatch.startTime = Date.now() - this.stopwatch.elapsedTime;

        this.stopwatch.interval = setInterval(() => {
            this.stopwatch.elapsedTime = Date.now() - this.stopwatch.startTime;
            this.updateStopwatchDisplay();
        }, 10);

        this.startStopBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
        this.lapBtn.disabled = false;
    }

    pauseStopwatch() {
        this.stopwatch.isRunning = false;
        clearInterval(this.stopwatch.interval);

        this.startStopBtn.innerHTML = '<i class="fas fa-play"></i><span>Reprendre</span>';
        this.lapBtn.disabled = true;
    }

    resetStopwatch() {
        this.stopwatch.isRunning = false;
        this.stopwatch.elapsedTime = 0;
        this.stopwatch.laps = [];
        clearInterval(this.stopwatch.interval);

        this.updateStopwatchDisplay();
        this.updateLapsDisplay();
        this.startStopBtn.innerHTML = '<i class="fas fa-play"></i><span>Démarrer</span>';
        this.lapBtn.disabled = true;
    }

    updateStopwatchDisplay() {
        const time = this.stopwatch.elapsedTime;
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const milliseconds = Math.floor((time % 1000) / 10);

        this.swMinutesElement.textContent = minutes.toString().padStart(2, '0');
        this.swSecondsElement.textContent = seconds.toString().padStart(2, '0');
        this.swMillisecondsElement.textContent = milliseconds.toString().padStart(2, '0');
    }

    recordLap() {
        if (!this.stopwatch.isRunning) return;

        const lapTime = this.stopwatch.elapsedTime;
        this.stopwatch.laps.push({
            number: this.stopwatch.laps.length + 1,
            time: lapTime,
            timestamp: new Date()
        });

        this.updateLapsDisplay();
    }

    updateLapsDisplay() {
        this.lapsContainer.innerHTML = '';

        // Afficher les derniers tours (maximum 10)
        const recentLaps = this.stopwatch.laps.slice(-10);

        recentLaps.forEach(lap => {
            const lapElement = document.createElement('div');
            lapElement.className = 'lap-item';

            const lapNumber = document.createElement('span');
            lapNumber.className = 'lap-number';
            lapNumber.textContent = `Tour ${lap.number}`;

            const lapTime = document.createElement('span');
            lapTime.className = 'lap-time';
            lapTime.textContent = this.formatStopwatchTime(lap.time);

            lapElement.appendChild(lapNumber);
            lapElement.appendChild(lapTime);
            this.lapsContainer.appendChild(lapElement);
        });
    }

    formatStopwatchTime(time) {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const milliseconds = Math.floor((time % 1000) / 10);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }

    // Minuteur
    setTimerPreset(seconds) {
        const totalSeconds = parseInt(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        this.timerHoursInput.value = hours;
        this.timerMinutesInput.value = minutes;
        this.timerSecondsInput.value = secs;

        this.updateTimerTotal();
    }

    updateTimerTotal() {
        const hours = parseInt(this.timerHoursInput.value) || 0;
        const minutes = parseInt(this.timerMinutesInput.value) || 0;
        const seconds = parseInt(this.timerSecondsInput.value) || 0;

        this.timer.totalTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
        this.timer.remainingTime = this.timer.totalTime;

        this.updateTimerDisplay();
    }

    startTimer() {
        if (this.timer.totalTime <= 0) {
            alert('Veuillez définir une durée valide pour le minuteur.');
            return;
        }

        this.timer.isRunning = true;
        this.timer.isPaused = false;
        this.timer.remainingTime = this.timer.totalTime;

        this.timer.interval = setInterval(() => {
            if (!this.timer.isPaused) {
                this.timer.remainingTime -= 1000;

                if (this.timer.remainingTime <= 0) {
                    this.timer.remainingTime = 0;
                    this.timerFinished();
                }

                this.updateTimerDisplay();
            }
        }, 1000);

        this.updateTimerButtons();
    }

    pauseTimer() {
        this.timer.isPaused = !this.timer.isPaused;
        this.updateTimerButtons();
    }

    stopTimer() {
        this.timer.isRunning = false;
        this.timer.isPaused = false;
        this.timer.remainingTime = this.timer.totalTime;
        clearInterval(this.timer.interval);

        this.updateTimerDisplay();
        this.updateTimerButtons();
    }

    timerFinished() {
        clearInterval(this.timer.interval);
        this.timer.isRunning = false;

        this.playSound('alarm');
        this.showAlarmNotification('Minuteur terminé !', 'Le temps est écoulé.');

        this.updateTimerButtons();
    }

    updateTimerDisplay() {
        const totalSeconds = Math.ceil(this.timer.remainingTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        this.timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Barre de progression
        const progress = ((this.timer.totalTime - this.timer.remainingTime) / this.timer.totalTime) * 100;
        this.timerProgress.innerHTML = `<div class="progress-fill" style="width: ${progress}%"></div>`;
    }

    updateTimerButtons() {
        if (this.timer.isRunning) {
            if (this.timer.isPaused) {
                this.timerStartBtn.disabled = false;
                this.timerStartBtn.innerHTML = '<i class="fas fa-play"></i><span>Reprendre</span>';
                this.timerPauseBtn.disabled = true;
                this.timerStopBtn.disabled = false;
            } else {
                this.timerStartBtn.disabled = true;
                this.timerPauseBtn.disabled = false;
                this.timerStopBtn.disabled = false;
            }
        } else {
            this.timerStartBtn.disabled = false;
            this.timerStartBtn.innerHTML = '<i class="fas fa-play"></i><span>Démarrer</span>';
            this.timerPauseBtn.disabled = true;
            this.timerStopBtn.disabled = true;
        }
    }

    // Alarmes
    showAlarmModal(alarmToEdit = null) {
        this.editingAlarm = alarmToEdit;

        if (alarmToEdit) {
            document.getElementById('alarmModalTitle').textContent = 'Modifier l\'alarme';
            document.getElementById('alarmHours').value = alarmToEdit.hours;
            document.getElementById('alarmMinutes').value = alarmToEdit.minutes;
            document.getElementById('alarmLabel').value = alarmToEdit.label;
            document.getElementById('alarmRepeat').checked = alarmToEdit.repeat;
        } else {
            document.getElementById('alarmModalTitle').textContent = 'Nouvelle alarme';
            document.getElementById('alarmHours').value = '8';
            document.getElementById('alarmMinutes').value = '0';
            document.getElementById('alarmLabel').value = '';
            document.getElementById('alarmRepeat').checked = false;
        }

        this.alarmModal.classList.add('show');
    }

    hideAlarmModal() {
        this.alarmModal.classList.remove('show');
        this.editingAlarm = null;
    }

    saveAlarm() {
        const hours = parseInt(document.getElementById('alarmHours').value);
        const minutes = parseInt(document.getElementById('alarmMinutes').value);
        const label = document.getElementById('alarmLabel').value.trim();
        const repeat = document.getElementById('alarmRepeat').checked;

        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            alert('Veuillez entrer une heure valide.');
            return;
        }

        const alarm = {
            id: this.editingAlarm ? this.editingAlarm.id : Date.now().toString(),
            hours: hours,
            minutes: minutes,
            label: label || `Alarme ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
            repeat: repeat,
            active: true
        };

        if (this.editingAlarm) {
            const index = this.alarms.findIndex(a => a.id === this.editingAlarm.id);
            if (index !== -1) {
                this.alarms[index] = alarm;
            }
        } else {
            this.alarms.push(alarm);
        }

        this.saveAlarms();
        this.updateAlarmsDisplay();
        this.hideAlarmModal();
    }

    deleteAlarm(alarmId) {
        this.alarms = this.alarms.filter(alarm => alarm.id !== alarmId);
        this.saveAlarms();
        this.updateAlarmsDisplay();
    }

    toggleAlarm(alarmId) {
        const alarm = this.alarms.find(a => a.id === alarmId);
        if (alarm) {
            alarm.active = !alarm.active;
            this.saveAlarms();
            this.updateAlarmsDisplay();
        }
    }

    checkAlarms() {
        const now = this.getCurrentTime();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();

        this.alarms.forEach(alarm => {
            if (alarm.active && alarm.hours === currentHours && alarm.minutes === currentMinutes) {
                // Vérifier si l'alarme n'a pas déjà sonné dans cette minute
                if (!alarm.triggered) {
                    this.triggerAlarm(alarm);
                    alarm.triggered = true;

                    // Réinitialiser après 1 minute
                    setTimeout(() => {
                        alarm.triggered = false;
                    }, 60000);
                }
            }
        });
    }

    triggerAlarm(alarm) {
        this.playSound('alarm');
        this.showAlarmNotification('Alarme !', alarm.label);

        if (!alarm.repeat) {
            alarm.active = false;
            this.saveAlarms();
            this.updateAlarmsDisplay();
        }
    }

    showAlarmNotification(title, message) {
        document.getElementById('alarmNotificationTitle').textContent = title;
        document.getElementById('alarmNotificationMessage').textContent = message;
        this.alarmNotification.classList.add('show');

        // Auto-dismiss après 10 secondes
        setTimeout(() => {
            this.dismissAlarmNotification();
        }, 10000);
    }

    dismissAlarmNotification() {
        this.alarmNotification.classList.remove('show');
    }

    updateAlarmsDisplay() {
        if (this.alarms.length === 0) {
            this.alarmsList.innerHTML = `
                <div class="no-alarms">
                    <i class="fas fa-bell-slash"></i>
                    <p>Aucune alarme définie</p>
                </div>
            `;
            return;
        }

        this.alarmsList.innerHTML = this.alarms.map(alarm => `
            <div class="alarm-item">
                <span class="alarm-time">${alarm.hours.toString().padStart(2, '0')}:${alarm.minutes.toString().padStart(2, '0')}</span>
                <span class="alarm-label">${alarm.label}</span>
                <div class="alarm-actions">
                    <div class="alarm-toggle ${alarm.active ? 'active' : ''}" onclick="clock.toggleAlarm('${alarm.id}')"></div>
                    <button class="alarm-delete" onclick="clock.deleteAlarm('${alarm.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Thèmes
    setTheme(theme) {
        document.body.className = `${theme}-theme`;

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });

        localStorage.setItem('clock-theme', theme);
    }

    // Sons
    playSound(type) {
        if (!this.enableSounds) return;

        // Simulation de sons (en production, utiliser des fichiers audio)
        console.log(`Playing ${type} sound`);

        // Ici vous pourriez utiliser l'API Web Audio ou des fichiers audio
        // const audio = new Audio(`sounds/${type}.mp3`);
        // audio.play();
    }

    // Sauvegarde
    saveSettings() {
        const settings = {
            timezone: this.timezone,
            isTwelveHour: this.isTwelveHour,
            showSeconds: this.showSeconds,
            showDate: this.showDate,
            showAnalog: this.showAnalog,
            enableSounds: this.enableSounds,
            theme: document.body.className
        };
        localStorage.setItem('clock-settings', JSON.stringify(settings));
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('clock-settings') || '{}');

        this.timezone = settings.timezone || 'local';
        this.isTwelveHour = settings.isTwelveHour !== false;
        this.showSeconds = settings.showSeconds !== false;
        this.showDate = settings.showDate !== false;
        this.showAnalog = settings.showAnalog !== false;
        this.enableSounds = settings.enableSounds || false;

        // Appliquer les paramètres
        this.timezoneSelect.value = this.timezone;
        this.showAnalogCheckbox.checked = this.showAnalog;
        this.showSecondsCheckbox.checked = this.showSeconds;
        this.showDateCheckbox.checked = this.showDate;
        this.twelveHourCheckbox.checked = this.isTwelveHour;
        this.enableSoundsCheckbox.checked = this.enableSounds;

        if (settings.theme) {
            this.setTheme(settings.theme.replace('-theme', ''));
        }

        this.toggleAnalogClock();
        this.toggleDateDisplay();
    }

    saveAlarms() {
        localStorage.setItem('clock-alarms', JSON.stringify(this.alarms));
    }

    loadAlarms() {
        return JSON.parse(localStorage.getItem('clock-alarms') || '[]');
    }

    updateSystemInfo() {
        this.lastUpdateElement.textContent = new Date().toLocaleTimeString('fr-FR');
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.clock = new DigitalClock();
});

// Gestion des erreurs
window.addEventListener('error', (e) => {
    console.error('Erreur dans l\'horloge digitale:', e.message);
});

// Mise à jour des inputs du minuteur
document.addEventListener('input', (e) => {
    if (e.target.matches('#timerHours, #timerMinutes, #timerSeconds')) {
        clock.updateTimerTotal();
    }
});
