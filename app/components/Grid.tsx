"use client";

import React, { useState, useEffect } from 'react';

const Grid: React.FC = () => {
    const gridSize = 10; // 10x10 grid

    type Position = { row: number; col: number };

    const [userPosition, setUserPosition] = useState<Position>({ row: 0, col: 0 });
    const [startingPosition, setStartingPosition] = useState<Position>({ row: 0, col: 0 });
    const [goalPosition, setGoalPosition] = useState<Position>({
        row: Math.floor(Math.random() * gridSize),
        col: Math.floor(Math.random() * gridSize),
    });
    const [score, setScore] = useState<number>(0);
    const [timeRemaining, setTimeRemaining] = useState<number>(40);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);

    const [totalBits, setTotalBits] = useState<number>(0);
    const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
    
    // Add states for voice control
    const [isListening, setIsListening] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<string>('');
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);

    // We'll store the real time (in ms) when the game starts
    const [startTime, setStartTime] = useState<number>(0);

    // Function to handle movement based on voice command
    const handleVoiceCommand = (command: string) => {
        if (!hasGameStarted || isGameOver) return;

        const lowerCommand = command.toLowerCase().trim();
        
        setUserPosition((prev) => {
            const { row, col } = prev;
            let newPosition = prev;

            if (lowerCommand.includes('up')) {
                newPosition = { row: Math.max(0, row - 1), col };
            } else if (lowerCommand.includes('down')) {
                newPosition = { row: Math.min(gridSize - 1, row + 1), col };
            } else if (lowerCommand.includes('left')) {
                newPosition = { row, col: Math.max(0, col - 1) };
            } else if (lowerCommand.includes('right')) {
                newPosition = { row, col: Math.min(gridSize - 1, col + 1) };
            }

            return newPosition;
        });
    };

    // Start voice recognition
    const startVoiceRecognition = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            
            recorder.ondataavailable = (event) => {
                setAudioChunks(chunks => [...chunks, event.data]);
            };
            
            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                
                // Send to our transcription API
                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: audioBlob,
                    headers: {
                        'Content-Type': 'audio/wav',
                    },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setTranscript(data.text);
                    handleVoiceCommand(data.text);
                    
                    // Restart recording if still listening
                    if (isListening) {
                        startRecording();
                    }
                }
            };
            
            startRecording();
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };
    
    // Helper function to start recording
    const startRecording = () => {
        if (mediaRecorder) {
            setAudioChunks([]);
            mediaRecorder.start();
            
            // Record in short intervals for faster response
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 1500); // 1.5 second intervals
        }
    };

    const startGame = () => {
        const initialPosition = { row: 0, col: 0 };
        setUserPosition(initialPosition);
        setStartingPosition(initialPosition);
        setGoalPosition({
            row: Math.floor(Math.random() * gridSize),
            col: Math.floor(Math.random() * gridSize),
        });
        setScore(0);
        setTimeRemaining(40);
        setTotalBits(0);
        setIsGameOver(false);
        setHasGameStarted(true);
        setIsListening(true);

        // Store the real time stamp (ms)
        setStartTime(Date.now());
        
        // Start voice recognition
        startVoiceRecognition();
    };
    
    // Stop listening when game is over
    useEffect(() => {
        if (isGameOver && isListening) {
            setIsListening(false);
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
            
            // Stop all tracks in the stream
            if (mediaRecorder) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [isGameOver, isListening]);

    useEffect(() => {
        if (!hasGameStarted || isGameOver) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsGameOver(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [hasGameStarted, isGameOver]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!hasGameStarted || isGameOver) return;

            setUserPosition((prev) => {
                const { row, col } = prev;
                let newPosition = prev;

                switch (event.key) {
                    case 'ArrowUp':
                        newPosition = { row: Math.max(0, row - 1), col };
                        break;
                    case 'ArrowDown':
                        newPosition = { row: Math.min(gridSize - 1, row + 1), col };
                        break;
                    case 'ArrowLeft':
                        newPosition = { row, col: Math.max(0, col - 1) };
                        break;
                    case 'ArrowRight':
                        newPosition = { row, col: Math.min(gridSize - 1, col + 1) };
                        break;
                    default:
                        return prev;
                }

                // We do NOT increment bits on move — only on hitting the goal
                return newPosition;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasGameStarted, isGameOver]);

    useEffect(() => {
        if (!hasGameStarted || isGameOver) return;

        // Only increment bits on target hit
        if (userPosition.row === goalPosition.row && userPosition.col === goalPosition.col) {
            setScore((prevScore) => prevScore + 1);

            // Calculate bits based on the starting position to goal
            const stepsFromStart = Math.abs(startingPosition.row - goalPosition.row) + 
                                 Math.abs(startingPosition.col - goalPosition.col);
            const bitsToAdd = stepsFromStart * 2;
            
            // Generate new goal position
            const newGoalPosition = {
                row: Math.floor(Math.random() * gridSize),
                col: Math.floor(Math.random() * gridSize),
            };

            // Update total bits and set new goal
            setTotalBits(prevBits => prevBits + bitsToAdd);
            setGoalPosition(newGoalPosition);
            // Update starting position for next goal
            setStartingPosition(userPosition);
        }
    }, [userPosition, goalPosition, hasGameStarted, isGameOver]);

    // Create the grid
    const grid = Array.from({ length: gridSize }, (_, row) =>
        Array.from({ length: gridSize }, (_, col) => ({ row, col }))
    );

    // Calculate Bits Per Second using real elapsed time
    let bps = 0;
    if (hasGameStarted) {
        const now = Date.now();
        const elapsedSeconds = (now - startTime) / 1000;
        const safeElapsed = elapsedSeconds > 0 ? elapsedSeconds : 1;
        bps = totalBits / safeElapsed;
    }

    return (
        <div className="flex flex-col items-center">
            {!hasGameStarted ? (
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-5 text-black">Welcome to WalnutWeb!</h1>
                    <p className="mb-4 text-black">Use voice commands: "up", "down", "left", "right" to move</p>
                    <button
                        onClick={startGame}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        Start Game
                    </button>
                </div>
            ) : (
                <>
                    <div className="text-lg font-semibold mb-4 text-black">Time Remaining: {timeRemaining}s</div>
                    <div className="text-lg font-semibold mb-4 text-black">Total bits communicated: {totalBits}</div>
                    <div className="text-lg font-semibold mb-4 text-black">BPS: {bps.toFixed(2)}</div>
                    <div className="text-lg font-semibold mb-2 text-black">
                        Voice command: <span className="text-blue-600">{transcript}</span>
                    </div>
                    {isGameOver ? (
                        <div className="text-center text-lg font-bold text-black">
                            <button
                                onClick={startGame}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Restart Game
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-10 gap-1 bg-gray-900 p-4 border border-gray-500 w-max">
                            {grid.flat().map((cell) => {
                                const isUser =
                                    cell.row === userPosition.row &&
                                    cell.col === userPosition.col;
                                const isGoal =
                                    cell.row === goalPosition.row &&
                                    cell.col === goalPosition.col;

                                return (
                                    <div
                                        key={`${cell.row}-${cell.col}`}
                                        className={`w-10 h-10 flex items-center justify-center border border-gray-300 ${
                                            isUser
                                                ? 'bg-blue-500 text-white'
                                                : isGoal
                                                ? 'bg-green-500 text-white'
                                                : 'bg-white'
                                        }`}
                                    >
                                        {isUser ? 'U' : isGoal ? 'G' : ''}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Grid;
