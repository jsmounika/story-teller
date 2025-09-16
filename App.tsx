/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useState} from 'react';
import {ErrorModal} from './components/ErrorModal';
import {SavingProgressPage} from './components/SavingProgressPage';
import {VideoPlayer} from './components/VideoPlayer';
import {
  RUTHVIKA_IMAGE_BASE64,
  STORY_PAGE_1_PROMPT,
  STORY_TITLE,
} from './constants';
import {Video} from './types';

import {GoogleGenAI} from '@google/genai';

const VEO_MODEL_NAME = 'veo-2.0-generate-001';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// ---

function bloblToBase64(blob: Blob) {
  return new Promise<string>(async (resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      resolve(url.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

// ---

async function generateVideo(
  prompt: string,
  imageBase64: string,
): Promise<string> {
  let operation = await ai.models.generateVideos({
    model: VEO_MODEL_NAME,
    prompt,
    image: {
      imageBytes: imageBase64,
      mimeType: 'image/jpeg',
    },
    config: {
      numberOfVideos: 1,
      aspectRatio: '16:9',
    },
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({operation});
  }

  if (operation?.response) {
    const videos = operation.response?.generatedVideos;
    if (videos === undefined || videos.length === 0) {
      throw new Error('No videos generated');
    }

    const generatedVideo = videos[0];
    const url = decodeURIComponent(generatedVideo.video.uri);
    const res = await fetch(`${url}&key=${process.env.API_KEY}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
    }
    const blob = await res.blob();
    return bloblToBase64(blob);
  } else {
    throw new Error('No videos generated');
  }
}

/**
 * Main component for the Ruthvika's Story Video Adventure app.
 */
export const App: React.FC = () => {
  const [prompt, setPrompt] = useState(STORY_PAGE_1_PROMPT);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string[] | null>(
    null,
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setPlayingVideo(null);

    try {
      console.log('Generating video...', prompt);
      const videoBase64 = await generateVideo(prompt, RUTHVIKA_IMAGE_BASE64);
      console.log('Generated video data received.');

      const newVideo: Video = {
        id: self.crypto.randomUUID(),
        title: "Ruthvika's Adventure - Scene 1",
        description: prompt,
        videoUrl: `data:video/mp4;base64,${videoBase64}`,
      };

      setPlayingVideo(newVideo);
    } catch (error) {
      console.error('Video generation failed:', error);
      setGenerationError([
        'Video generation failed. Veo is only available on the Paid Tier.',
        'Please select your Cloud Project to get started',
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClosePlayer = () => {
    setPlayingVideo(null);
  };

  if (isGenerating) {
    return <SavingProgressPage />;
  }

  return (
    <div className="min-h-screen bg-yellow-50 text-gray-800 font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white p-6 md:p-8 rounded-lg shadow-2xl animate-fade-in">
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-pink-500">
            {STORY_TITLE}
          </h1>
        </header>
        <main className="flex flex-col md:flex-row gap-6 items-center">
          <div className="md:w-1/3 flex-shrink-0">
            <img
              src={`data:image/jpeg;base64,${RUTHVIKA_IMAGE_BASE64}`}
              alt="Ruthvika"
              className="rounded-lg shadow-md w-full"
            />
          </div>
          <div className="flex-1 w-full">
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-2">
              Story Scene Prompt
            </label>
            <textarea
              id="prompt"
              rows={8}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-shadow duration-200"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              aria-label="Story scene prompt"
            />
            <button
              onClick={handleGenerate}
              className="mt-4 w-full px-6 py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold transition-colors text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Generate Video Scene
            </button>
          </div>
        </main>
      </div>

      {playingVideo && (
        <VideoPlayer video={playingVideo} onClose={handleClosePlayer} />
      )}

      {generationError && (
        <ErrorModal
          message={generationError}
          onClose={() => setGenerationError(null)}
          onSelectKey={async () => await window.aistudio?.openSelectKey()}
        />
      )}
    </div>
  );
};