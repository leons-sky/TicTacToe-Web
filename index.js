const GIPHY_API_KEY = "GvsWgbN7o067MhkftJaEm20K1BVqiTJd" //no way to hide this, so if you find this, have fun :)

function isWin(board, player) {
    let regex = new RegExp(`^(?:(?:...){0,2}(${player})\\1\\1|.{0,2}(${player})..\\2..\\2|(${player})...\\3...\\3|..(${player}).\\4.\\4)`, "g")
    return regex.test(board)
}

function isFull(board) {
    return !/[1-9]/.test(board)
}

function minimax(board, depth, player) {
    depth++;

    if (isWin(board, "o")) {
        return {
            score: 10 - depth
        }
    } else if (isWin(board, "x")) {
        return {
            score: depth - 10
        }
    } else if (isFull(board)) {
        return {
            score: 0
        }
    }

    let moves = []

    for (let space of board.match(/[1-9]/g)) {
        let possibleBoard = board.replace(space, player)
        let move = {
            choice: space,
            score: minimax(possibleBoard, depth, player == "x" ? "o" : "x").score
        }
        moves.push(move)
    }

    let bestMove;
    if (player == "o") {
        let highscore = -Infinity
        for (let move of moves) {
            if (move.score > highscore) {
                highscore = move.score
                bestMove = move
            }
        }
    } else {
        let highscore = Infinity
        for (let move of moves) {
            if (move.score < highscore) {
                highscore = move.score
                bestMove = move
            }
        }
    }

    return bestMove
}

class TicTacToe {
    constructor(startingPlayer = "x") {
        this.board = "123456789"
        this.player = startingPlayer

        this.resolvePromise;
        this.promise = new Promise((resolve) => {
            this.resolvePromise = resolve
        })

        this.cleanElements = []
        this.listeners = []

        for (let i = 0; i < 9; i++) {
            let element = document.getElementById(i.toString())
            this.cleanElements.push(element.cloneNode(true))

            let listener = event => {
                this.play((i + 1).toString())
            }

            this.listeners.push(listener)
            element.addEventListener("click", listener, true)
        }

        this._giphyPromiseDraw = giphyRandom(GIPHY_API_KEY, {
            tag: "cry"
        })
        this._giphyPromiseWin = giphyRandom(GIPHY_API_KEY, {
            tag: "celebrate laughing"
        })

        this.render()
        this.aiPlay()
    }

    _getPlayer(player) {
        player = player ?? this.player
        return player === "x" ? "Player1" : "Player2"
    }

    _checkForWin() {
        for (let player of ["x", "o"]) {
            if (isWin(this.board, player)) {
                return {
                    name: this._getPlayer(player),
                    shape: player
                }
            }
        }

        return null
    }

    render() {
        let turnElement = document.getElementById("turn")
        turnElement.style.backgroundColor = this.player == "x" ? "#4897d8" : "#00daf1"
        turnElement.innerHTML = `<h1>${this._getPlayer()}'s turn:</h1>`

        for (let i = 0; i < 9; i++) {
            let shape = this.board[i]
            let element = document.getElementById(i.toString())
            if (/[1-9]/.test(shape)) {
                element.style.backgroundImage = ""
            } else {
                element.style.backgroundImage = `url(./images/${shape}.svg)`
            }
        }
    }

    play(place) {
        if (!this.board.includes(place)) {
            return
        }

        this.board = this.board.replace(place, this.player)
        this.player = this.player === "x" ? "o" : "x"

        this.render()

        let win = this._checkForWin()
        let result = {
            winner: win?.name,
            winnerShape: win?.shape,
            draw: isFull(this.board) && !win
        }
        if (result.winner || result.draw) {
            for (let [i, listener] of this.listeners.entries()) {
                let element = document.getElementById(i.toString())
                element.removeEventListener("click", listener, true)
            }

            let resElement = document.getElementById("turn")
            resElement.style.backgroundColor = result.winner == "Player1" || result.draw ? "#4897d8" : "#00daf1"

            resElement.innerHTML = "<h5>Loading...</h5>"
            let promise = result.draw ? this._giphyPromiseDraw : this._giphyPromiseWin
            promise.then(res => {
                let html = ""
                let winner = result.winner ? result.winner + " wins!" : "Draw"
                html += `<h1 style="text-align: center;margin-bottom: 0.5rem;font-size:3rem">${winner}</h1>
                <img class="gif" src="${res.data.images.original.url}" alt="funny gif" />`
                resElement.innerHTML = html
            })

            this.resolvePromise(result)
            return
        }

        this.aiPlay()
    }

    aiPlay() {
        if (this.player == "o" && document.getElementById("computer").checked) {
            let move = minimax(this.board, 0, "o")
            this.play(move.choice)
        }
    }

    onFinish() {
        return this.promise
    }

    cleanup() {
        let resElement = document.getElementById("turn")
        resElement.innerHTML = ""

        for (let i = 0; i < 9; i++) {
            let element = document.getElementById(i.toString())
            element.parentNode.replaceChild(this.cleanElements[i], element)
        }
        this.cleanElements = null
        this.resolvePromise(null)
    }
}

let game
let startingPlayer = "x"
let points = [0, 0]

const myConfetti = confetti.create(document.getElementById("particles"), {
    resize: true,
    useWorker: true
})

function newGame() {
    if (game) {
        game.cleanup()
    }
    game = new TicTacToe(startingPlayer)
    game.onFinish().then(result => {
        if (!result) return;
        if (result.winnerShape) {
            let index = result.winnerShape == "x" ? 0 : 1
            points[index] += 10

            document.getElementById(`${result.winner.toLowerCase()}points`).innerHTML = points[index]

            myConfetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.8 }
            });
        }
    })
}

document.getElementById("resetpoints").addEventListener("click", event => {
    points = [0, 0]
    document.getElementById("player1points").innerHTML = "0"
    document.getElementById("player2points").innerHTML = "0"
})

document.getElementById("resetboard").addEventListener("click", event => {
    newGame()
})

document.getElementById("computer").addEventListener("change", event => {
    newGame()
})

document.getElementById("player2start").addEventListener("change", event => {
    startingPlayer = event.currentTarget.checked ? "o" : "x"
    newGame()
})

document.getElementById("github").addEventListener("click", event => {
    window.open("https://github.com/leonsemmens-sky/TicTacToe-Web")
})

newGame()