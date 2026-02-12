import { useState, useCallback, useEffect } from 'react';

export interface MintedMove {
  id: string;
  moveName: string;
  videoHash: string;
  royalty: number;
  creator: string;
  txSignature: string;
  paymentMethod: 'usdc' | 'sol';
  mintedAt: string;
  verified: boolean;
}

const STORAGE_KEY = 'moveregistry_minted_moves';

const MOCK_MOVES: MintedMove[] = [
  {
    id: 'mock-1',
    moveName: "Asura's Chest Pop",
    videoHash: 'QmX7b2nG...3kRt',
    royalty: 10,
    creator: 'H32YvKp8mNxW4qR9dTgJ5bFcZeL7uA3sPhjb',
    txSignature: '4sGjMWtJewi7qkS8TKg...',
    paymentMethod: 'usdc',
    mintedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    verified: true,
  },
  {
    id: 'mock-2',
    moveName: 'Liquid Wave Arms',
    videoHash: 'QmR9pLqT...7xVm',
    royalty: 7,
    creator: '9xKmHt5rNqWz3vJ8bPcYdFgL2eR6uA4rTz',
    txSignature: '3hRkWnXq9pLvT2mK...',
    paymentMethod: 'sol',
    mintedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    verified: true,
  },
  {
    id: 'mock-3',
    moveName: 'Freeze Frame Drop',
    videoHash: 'QmT4wKvN...2bHj',
    royalty: 15,
    creator: 'UjxYkM7rNpW3qT9dFgH5bLcZeR6vA8sRD5o',
    txSignature: '5tYnXq8pLvR2mK3j...',
    paymentMethod: 'usdc',
    mintedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    verified: true,
  },
];

function loadMoves(): MintedMove[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return MOCK_MOVES;
}

export function useMintedMoves() {
  const [moves, setMoves] = useState<MintedMove[]>(loadMoves);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(moves));
  }, [moves]);

  const addMove = useCallback((move: Omit<MintedMove, 'id' | 'mintedAt' | 'verified'>) => {
    const newMove: MintedMove = {
      ...move,
      id: `mint-${Date.now()}`,
      mintedAt: new Date().toISOString(),
      verified: true,
    };
    setMoves((prev) => [newMove, ...prev]);
  }, []);

  return { moves, addMove };
}
