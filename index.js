function isWin(board, player) {
    let regex = new RegExp(`^(?:(?:...){0,2}(${player})\\1\\1|.{0,2}(${player})..\\2..\\2|(${player})...\\3...\\3|..(${player}).\\4.\\4)`, "g")
    return regex.test(board)
}

function isDraw(board) {
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
    } else if (isDraw(board)) {
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
        // console.log(possibleBoard, move)
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
    constructor() {
        this.board = "123456789"
        this.player = "x"

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

        this.render()
    }

    _getPlayer(player) {
        player = player ?? this.player
        return player === "x" ? "Player1" : "Player2"
    }

    _checkForWin() {
        for (let player of ["x", "o"]) {
            if (isWin(this.board, player)) {
                return this._getPlayer(player)
            }
        }

        return null
    }

    render() {
        let turnElement = document.getElementById("turn")
        turnElement.style.backgroundColor = this.player == "x" ? "#4897d8" : "#00daf1"
        turnElement.innerHTML = `${this._getPlayer()}'s turn:`

        for (let i = 0; i < 9; i++) {
            let shape = this.board[i]
            let element = document.getElementById(i.toString())
            if (/[1-9]/.test(shape)) {
                element.style.backgroundImage = ""
            } else {
                element.style.backgroundImage = `url(./${shape}.svg)`
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

        let result = {
            winner: this._checkForWin(),
            draw: isDraw(this.board)
        }
        if (result.winner || result.draw) {
            for (let [i, listener] of this.listeners.entries()) {
                let element = document.getElementById(i.toString())
                element.removeEventListener("click", listener, true)
            }

            let resElement = document.getElementById("result")
            resElement.classList.add("info")
            if (result.winner) {
                resElement.innerHTML = `<h1>${result.winner} wins!!!</h1>`
            } else {
                resElement.innerHTML = `<h1>Draw!</h1>`
            }

            this.resolvePromise(result)
            return
        }

        if (this.player == "o" && document.getElementById("computer").checked) {
            let move = minimax(this.board, 0, "o")
            this.play(move.choice)
        }
    }

    onFinish() {
        return this.promise
    }

    cleanup() {
        let resElement = document.getElementById("result")
        resElement.classList.remove("info")
        resElement.innerHTML = ""

        for (let i = 0; i < 9; i++) {
            let element = document.getElementById(i.toString())
            element.parentNode.replaceChild(this.cleanElements[i], element)
        }
        this.cleanElements = null
        this.resolvePromise()
    }
}

let game = new TicTacToe()

document.getElementById("reset").addEventListener("click", event => {
    game.cleanup()
    game = new TicTacToe();
})