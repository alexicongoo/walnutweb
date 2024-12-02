"use client";

import React, { useState, useEffect } from "react";

const Grid: React.FC = () => {
    const gridSize = 10; // Size of the grid (10x10)

    type Position = { row: number; col: number };

    // State management
    const [userPosition, setUserPosition] = useState<Position>({ row: 0, col: 0 });
    const [goalPosition, setGoalPosition] = useState<Position>({
        row: Math.floor(Math.random() * gridSize),
        col: Math.floor(Math.random() * gridSize),
    });
    const [score, setScore] = useState<number>(0);
    const [timeRemaining, setTimeRemaining] = useState<number>(40);
    const [totalBits, setTotalBits] = useState<number>(0);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const startGame = () => {
        setUserPosition({ row: 0, col: 0 });
        setGoalPosition({
            row: Math.floor(Math.random() * gridSize),
            col: Math.floor(Math.random() * gridSize),
        });
        setScore(0);
        setTimeRemaining(40);
        setTotalBits(0);
        setIsGameOver(false);
        setHasGameStarted(true);
        setError(null);
    };

    const handleVoiceCommand = (command: string) => {
        console.log(`Raw command received: "${command}"`);

        // Correction map for misinterpreted words
        const corrections: { [key: string]: string } = {
            app: "up",
            laughed: "left",
            write: "right",
            downtown: "down",
        };

        const correctedCommand = corrections[command] || command;
        console.log(`Corrected command: "${correctedCommand}"`);

        // Match only valid commands
        if (!["up", "down", "left", "right"].includes(correctedCommand)) {
            console.log(`Ignored command: "${correctedCommand}"`);
            setError(`Unrecognized command: "${command}"`);
            return;
        }

        setUserPosition((prev) => {
            const { row, col } = prev;
            let newPosition = prev;

            switch (correctedCommand) {
                case "up":
                    newPosition = { row: Math.max(0, row - 1), col };
                    break;
                case "down":
                    newPosition = { row: Math.min(gridSize - 1, row + 1), col };
                    break;
                case "left":
                    newPosition = { row, col: Math.max(0, col - 1) };
                    break;
                case "right":
                    newPosition = { row, col: Math.min(gridSize - 1, col + 1) };
                    break;
            }

            console.log(`Moving to new position: row=${newPosition.row}, col=${newPosition.col}`);

            // Add 2 bits for a valid move
            setTotalBits((prevBits) => prevBits + 2);
            setError(null); // Clear errors on valid command
            return newPosition;
        });
    };

    useEffect(() => {
        if (!hasGameStarted) return;

        // Timer logic
        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsGameOver(true);
                    setHasGameStarted(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [hasGameStarted]);

    useEffect(() => {
        if (!hasGameStarted || isGameOver) return;

        if (!("webkitSpeechRecognition" in window)) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const command = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
            handleVoiceCommand(command);
        };

        recognition.onerror = (event) => {
            console.error(`Speech recognition error: ${event.error}`);
            setError(`Speech Recognition Error: ${event.error}`);
        };

        recognition.start();

        return () => recognition.stop();
    }, [hasGameStarted, isGameOver]);

    useEffect(() => {
        if (
            userPosition.row === goalPosition.row &&
            userPosition.col === goalPosition.col
        ) {
            setScore((prevScore) => prevScore + 1);
            setGoalPosition({
                row: Math.floor(Math.random() * gridSize),
                col: Math.floor(Math.random() * gridSize),
            });
            setError(null); // Clear any lingering errors
        }
    }, [userPosition, goalPosition]);

    const grid = Array.from({ length: gridSize }, (_, row) =>
        Array.from({ length: gridSize }, (_, col) => ({ row, col }))
    );

    const totalTimeElapsed = (40 - timeRemaining) || 1;
    const bps = (totalBits / totalTimeElapsed).toFixed(2);

    return (
        <div className="flex flex-col items-center">
            {!hasGameStarted ? (
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Welcome to Speech Webgrid!</h1>
                    <button
                        onClick={startGame}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        Start Game
                    </button>
                </div>
            ) : (
                <>
                    <h1 className="text-2xl font-bold mb-4">Speech Webgrid</h1>
                    <div className="text-lg font-semibold mb-4">
                        Time Remaining: {timeRemaining}s
                    </div>
                    <div className="text-lg font-semibold mb-4">Score: {score}</div>
                    <div className="text-lg font-semibold mb-4">BPS: {bps}</div>
                    {error && <div className="text-red-500 mb-4">Error: {error}</div>}
                    {isGameOver ? (
                        <div className="text-center text-xl font-bold text-red-500">
                            Game Over! Final Score: {score}
                            <br />
                            Total Bits: {totalBits}
                            <br />
                            Final BPS: {bps}
                        </div>
                    ) : (
                        <div className="grid grid-cols-10 gap-1 bg-gray-100 p-4 border border-gray-300 w-max">
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
                                                ? "bg-blue-500 text-white"
                                                : isGoal
                                                ? "bg-green-500 text-white"
                                                : "bg-white"
                                        }`}
                                    >
                                        {isUser ? "U" : isGoal ? "G" : ""}
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




