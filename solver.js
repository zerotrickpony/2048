

function Board(that) {
    this.score = -1;  // unknown
    this.board = [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
    ];

    if (that) {
        for (var i = 0; i < 16; i++) {
            this.board[i] = that.board[i];
        }
    }
};

Board.prototype.toString = function() {
    var s = "";
    for (var j = 0; j < 4; j++) {  // y
        for (var i = 0; i < 4; i++) {  // x
            s += "\t" + this.board[j * 4 + i];
        }
        s += "\n"
    }
    return s;
};

// Returns the vertical mirror of this board.
Board.prototype.flip = function() {
    var b = new Board();
    for (var j = 0; j < 4; j++) {  // y
        for (var i = 0; i < 4; i++) {  // x
            b.board[(3 - j) * 4 + (3 - i)] = this.board[j * 4 + i];
        }
    }
    return b;
};

// Returns the transpose of this board.
Board.prototype.transpose = function() {
    var b = new Board();
    for (var j = 0; j < 4; j++) {  // y
        for (var i = 0; i < 4; i++) {  // x
            b.board[i * 4 + j] = this.board[j * 4 + i];
        }
    }
    return b;
};

// Returns the board packed downwards. Will be equal to this if nothing changed.
Board.prototype.packDown = function() {
    var b = new Board(this);
    return b.packDown_() ? b : this;
};

// Returns the board packed upwards. Will be equal to this if nothing changed.
Board.prototype.packUp = function() {
    var b = new Board(this).flip();
    return b.packDown_() ? b.flip() : this;
};

// Returns the board packed leftwards. Will be equal to this if nothing changed.
Board.prototype.packLeft = function() {
    var b = new Board(this).transpose();
    return b.packDown_() ? b.transpose() : this;
};

// Returns the board packed rightwards. Will be equal to this if nothing changed.
Board.prototype.packRight = function() {
    var b = new Board(this).transpose().flip();
    return b.packDown_() ? b.flip().transpose() : this;
};

// Same as above but modifies in place. Returns false if nothing changed.
Board.prototype.packDown_ = function() {
    var isChanged = false;
    for (var j = 3; 0 <= j; j--) {  // y
        for (var i = 3; 0 <= i; i--) {  // x
            var value = this.board[j * 4 + i];
            var fallRow = this.getFloor_(i, j);
            var aboveRow = this.getAbove_(i, j);
            var above = aboveRow == -1 ? 0 : this.board[aboveRow * 4 + i];

            if (value) {
                if (value == above) {
                    // combine
                    value = value * 2;
                    this.board[aboveRow * 4 + i] = 0;
                    isChanged = true;
                }
                this.board[fallRow * 4 + i] = value;

                if (fallRow != j) {
                    // fall
                    this.board[j * 4 + i] = 0;
                    isChanged = true;
                }
            }
        }
    }

    return isChanged;
};

// Returns the value at the given cell
Board.prototype.get = function(x, y) {
    return this.board[y * 4 + x];
};

// Returns the row to which the given square falls to. Returns y if it
// is already on bottom
Board.prototype.getFloor_ = function(x, y) {
    for (var j = y + 1; j < 4; j++) {
        if (this.board[j * 4 + x]) {
            return j - 1;
        }
    }
    return 3;
};

// Returns the score for this board
Board.prototype.getScore = function() {
    if (this.score != -1) {
        return this.score;
    }
    // 2=2 = 2^1 = 2
    // 4=2*2 + 4 = 2^2 * 2 = 8
    // 8=2*4 + 4*2 + 8 = 2^3 * 3 = 24
    // 16=2*8 + 4*4 + 8*2 + 16 = 2^4 * 4 = 64
    // 32=2*16 + 4*8 + 8*4 + 16*2 + 32 = 2^5 * 5 = 160

    var score = 0;
    for (var i = 0, n = this.board.length; i < n; i++) {
        var value = this.board[i];
        if (value > 2) {
            score += Math.floor(Math.log(value) / Math.log(2)) * value;
        }
    }
    this.score = score;
    return this.score;
};

// Returns the number of free cells
Board.prototype.getFree = function() {
    var count = 0;
    for (var i = 0, n = this.board.length; i < n; i++) {
        count += (this.board[i] == 0 ? 1 : 0);
    }
    return count;
};

// Returns the largest cell value
Board.prototype.getMax = function() {
    var max = 0;
    for (var i = 0, n = this.board.length; i < n; i++) {
        max = Math.max(max, this.board[i]);
    }
    return max;
};

// Sets the nth free cell to the given value
Board.prototype.setFree_ = function(pos, value) {
    var count = 0;
    for (var i = 0, n = this.board.length; i < n; i++) {
        if (this.board[i] == 0) {
            if (count == pos) {
                this.board[i] = value;
                return;
            }
            count++;
        }
    }
};

// Returns the row of the next non-empty block above this one, or -1
// if the column is empty above this block.
Board.prototype.getAbove_ = function(x, y) {
    for (var j = y - 1; 0 <= j; j--) {
        if (this.board[j * 4 + x]) {
            return j;
        }
    }
    return -1;
};

Board.prototype.setRandomCell = function(value) {
    var count = this.getFree();
    if (count) {
        var index = Math.floor(Math.random() * count);
        this.setFree_(index, value);
    }
};



// makes a move using the simplistic AI. Returns the board and what it did.
function moveSimple(board) {
    // 16:	7
    // 32:	697
    // 64:	8962
    // 128:	39316
    // 256:	46421
    // 512:	4594
    // 1024:	3
    var action = "";
    var down = board.packDown();
    if (down != board) {
        action = "\\/";
        board = down;
    } else {
        var left = board.packLeft();
        if (left != board) {
            action = "<--";
            board = left;
        } else {
            var right = board.packRight();
            if (right != board) {
                action = "-->";
                board = right;
            } else {
                var up = board.packUp();
                if (up != board) {
                    action = "/\\";
                    board = up;
                } else {
                    return null;  // can't move
                }
            }
        }
    }
    return {board: board, action: action};
}



// tries to combine cells if it can
function moveCombine(board) {
    // 16:	5
    // 32:	257
    // 64:	5982
    // 128:	34726
    // 256:	46257
    // 512:	12674
    // 1024:	99
    var moves = getMoves(board);
    var scores = getScores(moves);
    var best = getBest(moves, scores);
    return best ? {board: best} : null;
}


function moveRobey(board) {
    // Choose the highest of:
    // - one move lookahead puts high pieces next to each other (down, left, right)
    // - combine high tiles with a down, left, right

};




// tries to combine cells if it can, but avoids up regardless.
function moveCombineDown(board) {
    // 16:	3
    // 32:	290
    // 64:	5886
    // 128:	35257
    // 256:	45891
    // 512:	12563
    // 1024:	110
    var moves = getMoves(board);
    var scores = getScores(moves);
    scores[3] = 0;  // always punish the up move
    var best = getBest(moves, scores);
    return best ? {board: best} : null;
}

// Returns an array of the 4 moves. Up is always last. Null if the move was illegal.
function getMoves(board) {
    var results = [
        board.packDown(),
        board.packLeft(),
        board.packRight(),
        board.packUp()
    ];
    for (var i = 0; i < results.length; i++) {
        if (results[i] == board) {
            results[i] = null;  // no move was possible.
        }
    }
    return results;
}

// Returns an array of the scores of each board
function getScores(boards) {
    var scores = [];
    for (var i = 0; i < boards.length; i++) {
        scores.push(boards[i] ? boards[i].getScore() : -1);
    }
    return scores;
}

// Returns the board with the best score.
function getBest(boards, scores) {
    var bestBoard = null;
    var bestScore = -100;
    for (var i = 0; i < boards.length; i++) {
        if (bestScore < scores[i]) {
            bestBoard = boards[i];
            bestScore = scores[i];
        }
    }
    return bestBoard;
}




// looks ahead one move and chooses the best two-move outcome.
function moveLookahead(board) {
    // 64:	1
    // 128:	126
    // 256:	1724
    // 512:	5803
    // 1024:	2339
    // 2048:	7
    var moves = getMoves(board);
    var bests = [];
    for (var i = 0; i < moves.length; i++) {
        if (moves[i]) {
            var ms = getMoves(moves[i]);
            var ss = getScores(ms);
            bests.push(getBest(ms, ss));
        } else {
            bests.push(null);
        }
    }

    // choose the best best
    var bs = getScores(bests);
    var best2 = getBest(bests, getScores(bests));  // double compute

    // find which move corresponded to best2
    for (var i = 0; i < bests.length; i++) {
        if (bests[i] == best2) {
            return moves[i] ? {board: moves[i]} : moveCombineDown(board);
        }
    }
    return null;
}



// makes a move at random.
function moveRandom(board) {
    // 8:	3
    // 16:	333
    // 32:	7317
    // 64:	38770
    // 128:	46623
    // 256:	6940
    // 512:	14
    var no = [];
    var move = Math.floor(Math.random() * 4);
    while (no.length < 4) {
        switch (move) {
        case 0:
            var down = board.packDown();
            if (down != board) {
                return {board: down};
            } else {
                no.push(0);
            }
        case 1:
            var left = board.packLeft();
            if (left != board) {
                return {board: left};
            } else {
                no.push(1);
            }
        case 2:
            var right = board.packRight();
            if (right != board) {
                return {board: right};
            } else {
                no.push(2);
            }
        case 3:
            var up = board.packUp();
            if (up != board) {
                return {board: up};
            } else {
                no.push(3);
                move = 0;
            }
        }
    }
    return null;
}




function play(ai) {
    // Simulate a game

    var board = new Board();
    var moves = 0;

    while (true) {
        console.log("Move " + moves + ":\n" + board);
        board.setRandomCell(Math.random() < 0.9 ? 2 : 4);
        console.log("Add cell:\n" + board);

        var result = ai(board);
        if (result) {
            console.log(result.action);
            board = result.board;
        } else {
            break;  // lose!
        }
        moves++;
    }

    console.log("Got " + board.getMax() + " after " + moves + " moves, final:\n" + board);
}





function makeTest() {
    var b = new Board();
    for (var i = 0; i < 16; i++) {
        b.board[i] = i;
    }
    return b;
};

function testTransform() {
    var b = makeTest();
    console.log("" + b);
    console.log("" + b.flip());
    console.log("" + b.transpose());
    console.log("" + b.transpose().transpose());
    console.log("" + b.transpose().flip().flip().transpose());
};


function playHistogram(ai, games) {
    var most = 0;
    var bestbest = 0;
    var histogram = {};

    for (var i = 0; i < games; i++) {
        // play one game
        var board = new Board();
        while (true) {
            board.setRandomCell(Math.random() < 0.9 ? 2 : 4);
            var result = ai(board);
            if (result) {
                board = result.board;
            } else {
                break;  // lose!
            }
        }
        var best = board.getMax();
        if (!histogram[best]) {
            histogram[best] = 0;
        }
        histogram[best]++;
        bestbest = Math.max(bestbest, best);
        most = Math.max(histogram[best], most);
    }

    // print histogram
    for (var i = 0; i <= bestbest; i++) {
        if (histogram[i]) {
            console.log("" + i + ":\t" + histogram[i]);
        }
    }
};



playHistogram(moveLookahead, 10000);
//testTransform();
//play(moveLookahead);
