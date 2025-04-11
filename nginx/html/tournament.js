import { startGame } from '/pong.js';

export class PongTournament {
    constructor(formSelector, launchBtnSelector, resetTournamentBtnSelector, matchInfoSelector, roundDetailsSelector, matchDetailsSelector, tournamentResultSelector) {
        this.form = document.querySelector(formSelector);
        this.textarea = this.form.querySelector('textarea');
        this.launchBtn = document.querySelector(launchBtnSelector);
        this.resetTournamentBtn = document.querySelector(resetTournamentBtnSelector)
        this.matchInfo = document.querySelector(matchInfoSelector);
        this.roundDetails = document.querySelector(roundDetailsSelector);
        this.matchDetails = document.querySelector(matchDetailsSelector);
        this.tournamentResult = document.querySelector(tournamentResultSelector);
        this.canvas = document.getElementById('webgl');

        this.bindEvents();
        this.resetTournamentPage();
    }
    //good
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.launchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.players.length >= 2) {
                this.launchBtn.style.display = 'none';
                this.startTournament();
            }
        });
        this.resetTournamentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetTournamentPage();
        });
    }

    showRoundPlayers() {
        this.roundDetails.innerHTML = 'Current round players : ';
        for (const player of this.currentRound) {
            this.roundDetails.innerHTML += `${player} `;
        }
        this.roundDetails.style.display = 'block';
    }

    resetTournamentPage() {
        this.form.style.display = 'block';
        this.textarea.value = '';
        this.textarea.style.border = '';
        this.players = [];
        this.winners = [];
        this.currentRound = [];
        this.currentMatchIndex = 0;
        this.finalists = [];
        this.resetTournamentBtn.style.display = 'none';
        this.tournamentResult.style.display = 'none';

    }
    hasDuplicate(array) {
        const seen = new Set();
        for (const item of array) {
            if (seen.has(item)) {
                return true;
            }
            seen.add(item);
        }
        return false;
    }

    //good
    handleFormSubmit(e) {
        e.preventDefault();
        const rawInput = this.textarea.value.trim();
        this.players = rawInput.split('\n').map(p => p.trim()).filter(p => p);

        if (this.players.length < 2 || this.hasDuplicate(this.players)) {
            this.textarea.style.border = '2px solid red';
        } else {
            this.launchBtn.style.display = 'block';
            this.form.style.display = 'none';
        }
    }

    startTournament() {
        this.currentRound = [...this.players];
        this.shuffle(this.currentRound);
        this.winners = [];
        this.finalists = [];
        this.currentMatchIndex = 0;
        this.showRoundPlayers();
        this.nextMatch();
    }

    nextMatch() {
        if (this.currentMatchIndex >= this.currentRound.length) {
            this.endRound();
            return;
        }

        const player1 = this.currentRound[this.currentMatchIndex++];
        let player2 = null;

        if (this.currentMatchIndex < this.currentRound.length) {
            player2 = this.currentRound[this.currentMatchIndex++];
        }

        this.showMatch(player1, player2);
    }

    showMatch(player1, player2) {
        this.matchInfo.style.display = 'block';
        const startLink = document.createElement('a');
        startLink.href = '#';
        startLink.className = 'btn btn-warning mt-3';
        startLink.addEventListener('click', async (e) => {
            e.preventDefault();
            if (player2) {
                const winnerSide = startGame(true); // Must return 'left' or 'right'
                const winner = winnerSide === 'left' ? player1 : player2;
                this.winners.push(winner);
                this.matchDetails.innerHTML = `${player1} vs ${player2} — <strong>${winner} wins</strong>`;
            }
            startLink.remove();
            if (player2) {
                setTimeout(() => this.nextMatch(), 1500);
            }
            else {
                this.nextMatch();
            }
        });
        if (player2) {
            this.matchDetails.innerHTML = `${player1} (left) vs ${player2} (right)`;
            startLink.textContent = 'Start Game';
        }
        else {
            this.matchDetails.innerHTML = `Odd number of players on this round <strong>${player1} advances !</strong>`;
            this.winners.push(player1);
            startLink.textContent = 'Next Round';
        }
        this.matchInfo.appendChild(startLink);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    endRound() {
        this.currentMatchIndex = 0;

        if (this.winners.length <= 2) {
            this.finalists = [...this.winners];
            this.resolveFinal();
        }
        else {
            this.currentRound = [...this.winners];
            this.shuffle(this.currentRound);
            this.showRoundPlayers();
            this.winners = [];
            this.nextMatch();
        }
    }

    resolveFinal() {
        this.roundDetails.style.display = 'none';
        const finalists = [...this.finalists];
        this.matchInfo.style.display = 'block';
        const startLink = document.createElement('a');
        startLink.href = '#';
        startLink.className = 'btn btn-warning mt-3';
        startLink.addEventListener('click', async (e) => {
            e.preventDefault();
            this.matchInfo.style.display = 'none';
            const winnerSide = startGame(true); // Must return 'left' or 'right' this is the launch game
            this.showPodium(winnerSide === 'left' ? [finalists[0], finalists[1]] : [finalists[1], finalists[0]], []);
            startLink.remove();
            // setTimeout(() => this.nextMatch(), 1500);
        });
        this.matchDetails.innerHTML = `FINAL GAME : ${finalists[0]} (left) vs ${finalists[1]} (right)`;
        startLink.textContent = 'Start Game';
        this.matchInfo.appendChild(startLink);
    }

    showPodium([first, second, third]) {
        this.tournamentResult.innerHTML = `<h4>🏆 Tournament Results</h4>
        <p><strong>1st:</strong> ${first}</p>
        <p><strong>2nd:</strong> ${second}</p>
        ${third ? `<p><strong>3rd:</strong> ${third}</p>` : ''}`;
        this.tournamentResult.style.display = 'block';
        this.resetTournamentBtn.style.display = 'block';
    }
}
