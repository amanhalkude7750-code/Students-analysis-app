import React from 'react';
import { Language } from '../types';

export default function LanguageSelector() {
  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
  ];

  return (
    <div className="bg-white rounded shadow p-4">
      <label className="block mb-2 font-medium">Target language</label>
      <select className="w-full border rounded p-2">
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
