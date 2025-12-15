'use client';

import { useState, useEffect } from 'react';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (points: number, discount: number) => void;
}

const REDEMPTION_OPTIONS = [
  { points: 10, discount: 1.00, label: '$1.00 off' },
  { points: 20, discount: 2.00, label: '$2.00 off' },
  { points: 50, discount: 5.00, label: '$5.00 off' },
  { points: 100, discount: 10.00, label: '$10.00 off' },
];

export default function RewardsModal({ isOpen, onClose, onRedeem }: RewardsModalProps) {
  const [rewardspoints, setRewardspoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchRewardsPoints();
    }
  }, [isOpen]);

  const fetchRewardsPoints = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/rewards');
      const data = await response.json();

      if (data.success) {
        setRewardspoints(data.rewardspoints || 0);
      } else {
        setError('Failed to load rewards points');
      }
    } catch (err) {
      console.error('Error fetching rewards:', err);
      setError('Failed to load rewards points');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (points: number, discount: number) => {
    if (rewardspoints < points) {
      setError(`Insufficient points. You have ${rewardspoints} points.`);
      return;
    }

    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pointsToRedeem: points }),
      });

      const data = await response.json();

      if (data.success) {
        setRewardspoints(data.remainingPoints);
        onRedeem(points, discount);
        setError('');
      } else {
        setError(data.error || 'Failed to redeem points');
      }
    } catch (err) {
      console.error('Error redeeming points:', err);
      setError('Failed to redeem points');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Rewards Points</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading rewards...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Your Current Points</p>
                <p className="text-4xl font-bold text-purple-600">{rewardspoints}</p>
                <p className="text-sm text-gray-500 mt-2">10 points = $1.00 discount</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Redeem Points</h3>
              <div className="space-y-2">
                {REDEMPTION_OPTIONS.map((option) => {
                  const canRedeem = rewardspoints >= option.points;
                  return (
                    <button
                      key={option.points}
                      onClick={() => handleRedeem(option.points, option.discount)}
                      disabled={!canRedeem}
                      className={`w-full p-4 rounded-xl font-semibold transition-all ${
                        canRedeem
                          ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 hover:from-pink-300 hover:to-purple-400 shadow-lg'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{option.label}</span>
                        <span className="text-sm">
                          {option.points} pts
                          {!canRedeem && ` (Need ${option.points - rewardspoints} more)`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-sm text-gray-600 text-center">
              <p>Earn 1 point for every $1 spent!</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


