document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const chessBoard = document.getElementById('chess-board');
    const messageElement = document.getElementById('message');
    const resetButton = document.getElementById('reset-button');
    const queenButton = document.getElementById('queen-button');
    const turnColor = document.getElementById('turn-color');
    const turnText = document.getElementById('turn-text');
    const lastMoveElement = document.getElementById('last-move');
    const lastMoveText = document.getElementById('last-move-text');
    const queenCounter = document.getElementById('queen-counter');
    const moveCounterElement = document.getElementById('move-counter');
    const queenAlert = document.getElementById('queen-alert');

    // Estado inicial do tabuleiro
    const initialBoard = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    // Estado do jogo
    let board = JSON.parse(JSON.stringify(initialBoard));
    let selectedPiece = null;
    let turn = 'red';
    let gameOver = false;
    let reinforcementCount = 0;
    let yellowQueen = null;
    let moveCounter = 0;
    let lastMove = null;
    let queenAlertTimeout = null;

    // Símbolos das peças
    const pieceSymbols = {
        'p': '♙', 'P': '♙',
        'r': '♜', 'R': '♖',
        'n': '♞', 'N': '♘',
        'b': '♝', 'B': '♗',
        'q': '♛', 'Q': '♕',
        'k': '♚', 'K': '♔'
    };

    // Verificadores de cor das peças
    const isRedPiece = (piece) => piece !== ' ' && piece === piece.toUpperCase();
    const isBluePiece = (piece) => piece !== ' ' && piece === piece.toLowerCase();

    // Funções auxiliares
    const getPieceName = (piece) => {
        const pieceType = piece.toUpperCase();
        const color = isRedPiece(piece) ? 'vermelha' : 'azul';
        
        switch (pieceType) {
            case 'P': return `Peão ${color}`;
            case 'R': return `Torre ${color}`;
            case 'N': return `Cavalo ${color}`;
            case 'B': return `Bispo ${color}`;
            case 'Q': return `Rainha ${color}`;
            case 'K': return `Rei ${color}`;
            default: return '';
        }
    };

    // Renderizar o tabuleiro
    function renderBoard() {
        chessBoard.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                const isLight = (row + col) % 2 === 0;
                square.className = `square ${isLight ? 'square-light' : 'square-dark'}`;
                
                // Adicionar classes para destacar seleção e último movimento
                if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                    square.classList.add('square-selected');
                }
                
                if (lastMove) {
                    if (lastMove.from.row === row && lastMove.from.col === col) {
                        square.classList.add('square-last-from');
                    }
                    if (lastMove.to.row === row && lastMove.to.col === col) {
                        square.classList.add('square-last-to');
                    }
                }
                
                // Adicionar notação da casa (ex: a1, h8)
                const notation = document.createElement('div');
                notation.className = 'square-notation';
                notation.textContent = `${String.fromCharCode(97 + col)}${8 - row}`;
                square.appendChild(notation);
                
                // Adicionar a peça ou rainha amarela
                const hasYellowQueen = yellowQueen && yellowQueen.row === row && yellowQueen.col === col;
                const piece = board[row][col];
                
                if (hasYellowQueen) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece piece-yellow';
                    pieceElement.textContent = '♛';
                    square.appendChild(pieceElement);
                } else if (piece !== ' ') {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${isRedPiece(piece) ? 'piece-red' : 'piece-blue'}`;
                    pieceElement.textContent = pieceSymbols[piece];
                    square.appendChild(pieceElement);
                }
                
                // Adicionar evento de clique
                square.addEventListener('click', () => handleSquareClick(row, col));
                
                // Adicionar ao tabuleiro
                chessBoard.appendChild(square);
            }
        }
        
        // Atualizar informações de jogo
        updateGameInfo();
    }

    // Atualizar informações de jogo
    function updateGameInfo() {
        // Atualizar mensagem
        if (gameOver) {
            messageElement.classList.add('checkmate');
        } else {
            messageElement.classList.remove('checkmate');
        }
        
        // Atualizar indicador de turno
        turnColor.className = 'turn-color ' + (turn === 'red' ? 'red' : 'blue');
        turnText.textContent = turn === 'red' ? 'Vermelhas' : 'Azuis';
        
        // Atualizar contador de rainha
        if (yellowQueen) {
            queenCounter.classList.remove('hidden');
            moveCounterElement.textContent = (3 - moveCounter).toString();
        } else {
            queenCounter.classList.add('hidden');
        }
        
        // Atualizar último movimento
        if (lastMove) {
            lastMoveElement.classList.remove('hidden');
            lastMoveText.textContent = `${String.fromCharCode(97 + lastMove.from.col)}${8 - lastMove.from.row} → ${String.fromCharCode(97 + lastMove.to.col)}${8 - lastMove.to.row}`;
        } else {
            lastMoveElement.classList.add('hidden');
        }
        
        // Atualizar botão de rainha
        queenButton.textContent = `Criar Rainha Amarela (${reinforcementCount})`;
        queenButton.disabled = gameOver;
    }

    // Função para adicionar a rainha amarela
    function spawnYellowQueen() {
        if (gameOver) return;
        
        // Mostrar alerta da rainha
        showQueenAlert();
        
        // Encontrar um espaço vazio no tabuleiro
        const emptyPositions = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === ' ' && !(yellowQueen && yellowQueen.row === row && yellowQueen.col === col)) {
                    emptyPositions.push({ row, col });
                }
            }
        }
        
        if (emptyPositions.length ===
 0) {
            setMessage('Não há espaço para a rainha amarela! O tabuleiro está cheio.');
            return;
        }
        
        // Escolher uma posição aleatória
        const randomIndex = Math.floor(Math.random() * emptyPositions.length);
        const position = emptyPositions[randomIndex];
        
        // Colocar a rainha amarela
        yellowQueen = position;
        setMessage(`A rainha amarela surge na posição ${String.fromCharCode(97 + position.col)}${8 - position.row}! Cuidado, ela é hostil!`);
        reinforcementCount++;
        moveCounter = 0;
        
        renderBoard();
    }
    
    // Função para mostrar o alerta da rainha
    function showQueenAlert() {
        queenAlert.classList.remove('hidden');
        setTimeout(() => {
            queenAlert.classList.add('hidden');
        }, 2000);
    }

    // Função para mover a rainha amarela
    function moveYellowQueen() {
        if (!yellowQueen || gameOver) return;
        
        // Possíveis movimentos (horizontal, vertical, diagonal)
        const possibleMoves = [];
        
        // Movimentos horizontais e verticais
        for (let i = 0; i < 8; i++) {
            if (i !== yellowQueen.row) possibleMoves.push({ row: i, col: yellowQueen.col });
            if (i !== yellowQueen.col) possibleMoves.push({ row: yellowQueen.row, col: i });
        }
        
        // Movimentos diagonais
        for (let i = 1; i < 8; i++) {
            // Superior direita
            if (yellowQueen.row - i >= 0 && yellowQueen.col + i < 8) {
                possibleMoves.push({ row: yellowQueen.row - i, col: yellowQueen.col + i });
            }
            // Superior esquerda
            if (yellowQueen.row - i >= 0 && yellowQueen.col - i >= 0) {
                possibleMoves.push({ row: yellowQueen.row - i, col: yellowQueen.col - i });
            }
            // Inferior direita
            if (yellowQueen.row + i < 8 && yellowQueen.col + i < 8) {
                possibleMoves.push({ row: yellowQueen.row + i, col: yellowQueen.col + i });
            }
            // Inferior esquerda
            if (yellowQueen.row + i < 8 && yellowQueen.col - i >= 0) {
                possibleMoves.push({ row: yellowQueen.row + i, col: yellowQueen.col - i });
            }
        }
        
        // Filtrar movimentos válidos, priorizando capturas
        const capturePositions = [];
        const validMoves = [];
        
        for (const move of possibleMoves) {
            const piece = board[move.row][move.col];
            if (piece !== ' ') {
                capturePositions.push(move);
            } else {
                validMoves.push(move);
            }
        }
        
        // Priorizar capturas se houver
        let moveOptions = capturePositions.length > 0 ? capturePositions : validMoves;
        
        if (moveOptions.length === 0) return;
        
        // Escolher movimento aleatório
        const randomIndex = Math.floor(Math.random() * moveOptions.length);
        const newPosition = moveOptions[randomIndex];
        
        // Verificar se vai capturar uma peça
        const isCapturing = board[newPosition.row][newPosition.col] !== ' ';
        const capturedPiece = board[newPosition.row][newPosition.col];
        
        // Criar tempOrário para o último movimento da rainha
        const oldPosition = { ...yellowQueen };
        lastMove = { from: oldPosition, to: newPosition };
        
        // Processar captura
        if (isCapturing) {
            createExplosion(newPosition.row, newPosition.col);
            
            // Verificar se capturou um rei
            if (capturedPiece === 'k' || capturedPiece === 'K') {
                setMessage(`CHECKMATE! A rainha amarela venceu o jogo capturando o rei ${capturedPiece === 'k' ? 'azul' : 'vermelho'}!`);
                gameOver = true;
            } else {
                setMessage(`A rainha amarela capturou um ${getPieceName(capturedPiece)}!`);
            }
            
            board[newPosition.row][newPosition.col] = ' ';
        } else {
            setMessage(`A rainha amarela se moveu.`);
        }
        
        // Atualizar posição da rainha
        yellowQueen = newPosition;
        renderBoard();
    }

    // Função para criar explosão
    function createExplosion(row, col) {
        const squares = chessBoard.querySelectorAll('.square');
        const index = row * 8 + col;
        
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        squares[index].appendChild(explosion);
        
        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.parentNode.removeChild(explosion);
            }
        }, 800);
    }

    // Função para verificar se um movimento é válido
    function isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        const targetPiece = board[toRow][toCol];
        
        // Não pode capturar peça da mesma cor
        if ((isRedPiece(piece) && isRedPiece(targetPiece)) || (isBluePiece(piece) && isBluePiece(targetPiece))) {
            return false;
        }
        
        // Lógica de movimento para cada tipo de peça
        
        // Peão vermelho
        if (piece === 'P') {
            // Movimento para frente
            if (fromCol === toCol && targetPiece === ' ') {
                // Uma casa
                if (fromRow - 1 === toRow) return true;
                // Duas casas da posição inicial
                if (fromRow === 6 && fromRow - 2 === toRow && board[fromRow - 1][fromCol] === ' ') return true;
            }
            // Captura diagonal
            if ((fromCol - 1 === toCol || fromCol + 1 === toCol) && fromRow - 1 === toRow && isBluePiece(targetPiece)) {
                return true;
            }
        }
        // Peão azul
        else if (piece === 'p') {
            // Movimento para frente
            if (fromCol === toCol && targetPiece === ' ') {
                // Uma casa
                if (fromRow + 1 === toRow) return true;
                // Duas casas da posição inicial
                if (fromRow === 1 && fromRow + 2 === toRow && board[fromRow + 1][fromCol] === ' ') return true;
            }
            // Captura diagonal
            if ((fromCol - 1 === toCol || fromCol + 1 === toCol) && fromRow + 1 === toRow && isRedPiece(targetPiece)) {
                return true;
            }
        }
        
        // Torre - movimento em linha reta
        else if (piece.toUpperCase() === 'R') {
            if (fromRow === toRow || fromCol === toCol) {
                // Verificar caminho livre
                if (fromRow === toRow) {
                    const start = Math.min(fromCol, toCol);
                    const end = Math.max(fromCol, toCol);
                    for (let i = start + 1; i < end; i++) {
                        if (board[fromRow][i] !== ' ') return false;
                    }
                } else {
                    const start = Math.min(fromRow, toRow);
                    const end = Math.max(fromRow, toRow);
                    for (let i = start + 1; i < end; i++) {
                        if (board[i][fromCol] !== ' ') return false;
                    }
                }
                return true;
            }
        }
        
        // Cavalo - movimento em L
        else if (piece.toUpperCase() === 'N') {
            const rowDiff = Math.abs(fromRow - toRow);
            const colDiff = Math.abs(fromCol - toCol);
            return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        }
        
        // Bispo - movimento diagonal
        else if (piece.toUpperCase() === 'B') {
            const rowDiff = Math.abs(fromRow - toRow);
            const colDiff = Math.abs(fromCol - toCol);
            if (rowDiff === colDiff) {
                const rowStep = toRow > fromRow ? 1 : -1;
                const colStep = toCol > fromCol ? 1 : -1;
                for (let i = 1; i < rowDiff; i++) {
                    if (board[fromRow + i * rowStep][fromCol + i * colStep] !== ' ') return false;
                }
                return true;
            }
        }
        
        // Rainha - combinação de torre e bispo
        else if (piece.toUpperCase() === 'Q') {
            const rowDiff = Math.abs(fromRow - toRow);
            const colDiff = Math.abs(fromCol - toCol);
            
            // Movimento em linha reta (como torre)
            if (fromRow === toRow || fromCol === toCol) {
                if (fromRow === toRow) {
                    const start = Math.min(fromCol, toCol);
                    const end = Math.max(fromCol, toCol);
                    for (let i = start + 1; i < end; i++) {
                        if (board[fromRow][i] !== ' ') return false;
                    }
                } else {
                    const start = Math.min(fromRow, toRow);
                    const end = Math.max(fromRow, toRow);
                    for (let i = start + 1; i < end; i++) {
                        if (board[i][fromCol] !== ' ') return false;
                    }
                }
                return true;
            }
            
            // Movimento diagonal (como bispo)
            else if (rowDiff === colDiff) {
                const rowStep = toRow > fromRow ? 1 : -1;
                const colStep = toCol > fromCol ? 1 : -1;
                for (let i = 1; i < rowDiff; i++) {
                    if (board[fromRow + i * rowStep][fromCol + i * colStep] !== ' ') return false;
                }
                return true;
            }
        }
        
        // Rei - movimento de uma casa em qualquer direção
        else if (piece.toUpperCase() === 'K') {
            const rowDiff = Math.abs(fromRow - toRow);
            const colDiff = Math.abs(fromCol - toCol);
            return rowDiff <= 1 && colDiff <= 1;
        }
        
        return false;
    }

    // Manipulador de clique para selecionar e mover peças
    function handleSquareClick(row, col) {
        if (gameOver) return;

        // Selecionar uma peça
        if (!selectedPiece) {
            const piece = board[row][col];
            if (piece === ' ') return;
            
            // Verificar se é a vez correta
            if ((turn === 'red' && !isRedPiece(piece)) || (turn === 'blue' && !isBluePiece(piece))) {
                setMessage(`Agora é a vez das ${turn === 'red' ? 'vermelhas' : 'azuis'}`);
                return;
            }
            
            selectedPiece = { row, col, piece };
            setMessage(`Peça selecionada: ${getPieceName(piece)}`);
            renderBoard();
        } 
        // Mover a peça selecionada
        else {
            // Cancelar seleção ao clicar na mesma casa
            if (selectedPiece.row === row && selectedPiece.col === col) {
                selectedPiece = null;
                setMessage(`Seleção cancelada`);
                renderBoard();
                return;
            }
            
            // Verificar movimento válido
            if (isValidMove(selectedPiece.row, selectedPiece.col, row, col)) {
                // Verificar captura
                const isCapturing = board[row][col] !== ' ';
                const capturedPiece = board[row][col];
                const isKingCapture = capturedPiece === 'k' || capturedPiece === 'K';
                
                // Animação de explosão na captura
                if (isCapturing) {
                    createExplosion(row, col);
                }
                
                // Registrar o movimento
                lastMove = {
                    from: { row: selectedPiece.row, col: selectedPiece.col },
                    to: { row, col }
                };
                
                // Mover a peça
                board[row][col] = selectedPiece.piece;
                board[selectedPiece.row][selectedPiece.col] = ' ';
                
                // Verificar fim de jogo
                if (isKingCapture) {
                    gameOver = true;
                    setMessage(`CHECKMATE! ${turn === 'red' ? 'VERMELHAS' : 'AZUIS'} VENCERAM O JOGO!`);
                } else {
                    // Continuar jogo
                    turn = turn === 'red' ? 'blue' : 'red';
                    
                    if (isCapturing) {
                        setMessage(`${turn === 'blue' ? 'Vermelhas' : 'Azuis'} capturaram uma peça! Agora é a vez das ${turn === 'red' ? 'vermelhas' : 'azuis'}.`);
                    } else {
                        setMessage(`${turn === 'blue' ? 'Vermelhas' : 'Azuis'} moveram ${getPieceName(selectedPiece.piece)}. Agora é a vez das ${turn === 'red' ? 'vermelhas' : 'azuis'}.`);
                    }
                    
                    // Incrementar contador de movimentos para a rainha amarela
                    if (yellowQueen) {
                        moveCounter++;
                        
                        // Mover rainha amarela a cada 3 movimentos
                        if (moveCounter >= 3) {
                            moveCounter = 0;
                            setTimeout(() => moveYellowQueen(), 500);
                        }
                    }
                }
                
                selectedPiece = null;
                renderBoard();
            } else {
                setMessage('Movimento inválido');
            }
        }
    }

    // Função para definir a mensagem
    function setMessage(msg) {
        messageElement.textContent = msg;
    }

    // Função para reiniciar o jogo
    function resetGame() {
        board = JSON.parse(JSON.stringify(initialBoard));
        selectedPiece = null;
        turn = 'red';
        setMessage('Jogo reiniciado. Vermelhas jogam.');
        gameOver = false;
        reinforcementCount = 0;
        yellowQueen = null;
        moveCounter = 0;
        lastMove = null;
        
        // Limpar qualquer timeout existente
        if (queenAlertTimeout) {
            clearTimeout(queenAlertTimeout);
            queenAlertTimeout = null;
        }
        
        queenAlert.classList.add('hidden');
        
        renderBoard();
    }

    // Eventos dos botões
    resetButton.addEventListener('click', resetGame);
    queenButton.addEventListener('click', spawnYellowQueen);

    // Inicializar o jogo
    setMessage('Vermelhas jogam');
    renderBoard();
});