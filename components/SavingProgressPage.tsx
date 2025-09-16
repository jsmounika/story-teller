/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

/**
 * A fullscreen overlay that displays a loading animation and text indicating that
 * a video story scene is being created.
 */
export const SavingProgressPage: React.FC = () => {
  return (
    <div
      className="fixed inset-0 bg-yellow-50 flex flex-col items-center justify-center z-50 animate-fade-in"
      aria-live="polite"
      aria-busy="true">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-pink-500"></div>
      <h2 className="text-2xl font-bold text-pink-500 mt-8">
        Bringing Ruthvika's adventure to life...
      </h2>
      <p className="text-gray-600 mt-2">
        Please wait while we create the magical jungle scene.
      </p>
    </div>
  );
};