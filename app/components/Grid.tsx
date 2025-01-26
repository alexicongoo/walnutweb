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

    // We'll store the real time (in ms) when the game starts
    const [startTime, setStartTime] = useState<number>(0);

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

        // Store the real time stamp (ms)
        setStartTime(Date.now());
    };

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
                    <h1 className="text-2xl font-bold mb-5 text-black">Welcome to Speech Webgrid!</h1>
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
