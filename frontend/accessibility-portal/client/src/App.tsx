import React from 'react';
import VideoFeed from './components/VideoFeed';
import TranslationDisplay from './components/TranslationDisplay';
import LanguageSelector from './components/LanguageSelector';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Sign Language Translator</h1>
      </header>
      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <VideoFeed />
        <div className="space-y-4">
          <LanguageSelector />
          <TranslationDisplay />
        </div>
      </main>
    </div>
  );
}
