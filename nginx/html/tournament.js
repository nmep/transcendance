// pong-tournament.js
import { startGame, stopGame, resetGameState } from '/pong.js';


function startPongGame() {

}



export class PongTournament {
    constructor(formSelector, launchBtnSelector, matchInfoSelector, matchDetailsSelector, canvasSelector) {
        this.form = document.querySelector(formSelector);
        this.textarea = this.form.querySelector('textarea');
        this.launchBtn = document.querySelector(launchBtnSelector);
        this.matchInfo = document.querySelector(matchInfoSelector);
        this.matchDetails = document.querySelector(matchDetailsSelector);
        this.canvas = document.querySelector(canvasSelector);

        this.players = [];
        this.winners = [];
        this.currentRound = [];
        this.currentMatchIndex = 0;
        this.finalists = [];

        this.bindEvents();
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.launchBtn.addEventListener('click', () => this.startTournament());
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const rawInput = this.textarea.value.trim();
        this.players = rawInput.split('\n').map(p => p.trim()).filter(p => p);

        if (this.players.length < 2) {
            alert('Please enter at least 2 player names.');
            this.launchBtn.disabled = true;
        } else {
            alert(`${this.players.length} players ready. Launch the tournament!`);
            this.launchBtn.disabled = false;
        }
    }

    startTournament() {
        this.currentRound = [...this.players];
        this.winners = [];
        this.finalists = [];
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
        } else {
            this.winners.push(player1);
            this.nextMatch();
            return;
        }

        this.showMatch(player1, player2);
    }

    showMatch(player1, player2) {
        this.matchInfo.style.display = 'block';
        this.canvas.style.display = 'block';
        this.matchDetails.innerHTML = `${player1} (left) vs ${player2} (right)`;

        const startBtn = document.createElement('button');
        startBtn.textContent = 'Start Game';
        startBtn.className = 'btn btn-warning mt-3';
        startBtn.onclick = async () => {
            const winnerSide = await window.startPongGame(); // Must return 'left' or 'right'
            const winner = winnerSide === 'left' ? player1 : player2;
            this.winners.push(winner);
            this.matchDetails.innerHTML = `${player1} vs ${player2} — <strong>${winner} wins</strong>`;
            startBtn.remove();
            setTimeout(() => this.nextMatch(), 1500);
        };

        this.matchInfo.appendChild(startBtn);
    }

    endRound() {
        this.currentMatchIndex = 0;

        if (this.winners.length <= 3) {
            this.finalists = [...this.winners];
            this.resolveFinal();
        } else {
            this.currentRound = [...this.winners];
            this.winners = [];
            this.nextMatch();
        }
    }

    resolveFinal() {
        const finalists = [...this.finalists];

        if (finalists.length === 2) {
            this.showMatch(finalists[0], finalists[1]);
            window.startPongGame = async () => {
                const side = await window.realStartGame();
                this.showPodium(side === 'left' ? [finalists[0], finalists[1]] : [finalists[1], finalists[0]], []);
                return side;
            };
        } else if (finalists.length === 3) {
            this.showMatch(finalists[0], finalists[1]);
            window.startPongGame = async () => {
                const side1 = await window.realStartGame();
                const winner1 = side1 === 'left' ? finalists[0] : finalists[1];
                const loser1 = side1 === 'left' ? finalists[1] : finalists[0];
                this.showMatch(winner1, finalists[2]);
                window.startPongGame = async () => {
                    const side2 = await window.realStartGame();
                    const winner2 = side2 === 'left' ? winner1 : finalists[2];
                    const second = side2 === 'left' ? finalists[2] : winner1;
                    this.showPodium([winner2, second, loser1]);
                    return side2;
                };
                return side1;
            };
        }
    }

    showPodium([first, second, third]) {
        this.matchInfo.innerHTML = `<h4>🏆 Tournament Results</h4>
        <p><strong>1st:</strong> ${first}</p>
        <p><strong>2nd:</strong> ${second}</p>
        ${third ? `<p><strong>3rd:</strong> ${third}</p>` : ''}`;
    }
}
