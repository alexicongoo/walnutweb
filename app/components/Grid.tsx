"use client";

import React, { useState, useEffect } from 'react';

const Grid: React.FC = () => {
    const gridSize = 10; // 10x10 grid

    type Position = { row: number; col: number };

    const [userPosition, setUserPosition] = useState<Position>({ row: 0, col: 0 });
    const randomGoal = (): Position => ({
        row: Math.floor(Math.random() * gridSize),
        col: Math.floor(Math.random() * gridSize),
    });
    const [goalPosition, setGoalPosition] = useState<Position>(randomGoal);

    const [score, setScore] = useState<number>(0); // Track score
    const [startTime, setStartTime] = useState<number>(Date.now()); // Track start time
    const [timeRemaining, setTimeRemaining] = useState<number>(40); // Game timer
    const [isGameOver, setIsGameOver] = useState<boolean>(false); // Game state
    const [totalBits, setTotalBits] = useState<number>(0); // Track total bits transmitted

    const restartGame = () => {
        setUserPosition({ row: 0, col: 0 });
        setGoalPosition(randomGoal());
        setScore(0);
        setTimeRemaining(40);
        setTotalBits(0);
        setStartTime(Date.now());
        setIsGameOver(false);
    };

    useEffect(() => {
        if (isGameOver) return; // Do nothing if the game is over

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsGameOver(true); // End the game
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer); // Cleanup the timer
    }, [timeRemaining]); // Depend on timeRemaining

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isGameOver) return; // Ignore input if the game is over

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

                if (newPosition !== prev) {
                    setTotalBits((prevBits) => prevBits + 2); // Add 2 bits per move
                }

                return newPosition;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGameOver]);

    useEffect(() => {
        if (isGameOver) return; // Stop updates if the game is over

        if (
            userPosition.row === goalPosition.row &&
            userPosition.col === goalPosition.col
        ) {
            const timeTaken = (Date.now() - startTime) / 1000; // Time in seconds
            setScore((prevScore) => prevScore + 1); // Increment score
            setTotalBits((prevBits) => prevBits + 2); // Add 2 bits for reaching the goal
            setGoalPosition(randomGoal()); // Set a new goal
            setStartTime(Date.now()); // Reset start time
            alert(`Goal reached! Time taken: ${timeTaken.toFixed(2)} seconds`);
        }
    }, [userPosition, goalPosition, startTime, isGameOver]);

    const grid = Array.from({ length: gridSize }, (_, row) =>
        Array.from({ length: gridSize }, (_, col) => ({ row, col }))
    );

    const totalTimeElapsed = (40 - timeRemaining) || 1; // Avoid division by zero
    const bps = (totalBits / totalTimeElapsed).toFixed(2);

    return (
        <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">Speech Webgrid</h1>
            <div className="text-lg font-semibold mb-4">
                Time Remaining: {timeRemaining}s
            </div>
            <div className="text-lg font-semibold mb-4">Score: {score}</div>
            <div className="text-lg font-semibold mb-4">BPS: {bps}</div>
            {isGameOver ? (
                <div className="text-center text-xl font-bold text-red-500">
                    Game Over! Final Score: {score}
                    <br />
                    Total Bits: {totalBits}
                    <br />
                    Final BPS: {bps}
                    <button
                        onClick={restartGame}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                    >
                        Restart Game
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-10 gap-1 bg-gray-100 p-4 border border-gray-300 w-max">
                    {grid.flat().map((cell) => {
                        const isUser =
                            cell.row === userPosition.row && cell.col === userPosition.col;
                        const isGoal =
                            cell.row === goalPosition.row && cell.col === goalPosition.col;

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
        </div>
    );
};

export default Grid;

