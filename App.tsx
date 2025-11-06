import React, { useState, useCallback } from 'react';
import { VoiceName } from './types';
import { generateSpeech } from './services/geminiService';
import { decode, createWavBlob } from './utils/audioUtils';

const App: React.FC = () => {
    const initialText = "Agent หนึ่ง — Market Strategist วิเคราะห์สัญญาณตลาด และค้นหาโอกาสใหม่ เพื่อให้เราเริ่มต้นจากข้อมูลที่แม่นยำ";
    const [text, setText] = useState<string>(initialText);
    const [style, setStyle] = useState<string>('');
    const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.KORE);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [audioData, setAudioData] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const CHARACTER_LIMIT = 5000;

    const handleGenerateSpeech = useCallback(async () => {
        if (!text.trim()) {
            setError("Please enter some text to generate speech.");
            return;
        }
        if (text.length > CHARACTER_LIMIT) {
            setError(`Text exceeds the ${CHARACTER_LIMIT} character limit.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        setAudioData(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }

        try {
            const prompt = style.trim() ? `${style.trim()}: ${text}` : text;
            const base64Audio = await generateSpeech(prompt, selectedVoice);
            setAudioData(base64Audio);

            const audioBytes = decode(base64Audio);
            const wavBlob = createWavBlob(audioBytes, {
                sampleRate: 24000,
                numChannels: 1,
                bytesPerSample: 2,
            });
            const url = URL.createObjectURL(wavBlob);
            setAudioUrl(url);

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [text, style, selectedVoice, audioUrl]);

    const handleDownload = useCallback(() => {
        if (!audioData) return;

        try {
            const audioBytes = decode(audioData);
            const wavBlob = createWavBlob(audioBytes, {
                sampleRate: 24000,
                numChannels: 1,
                bytesPerSample: 2, // 16-bit audio
            });

            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'gemini-speech.wav';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Failed to create download link:", err);
            setError("Could not prepare the audio file for download.");
        }
    }, [audioData]);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 border border-gray-700">
                <div className="text-center">
                    <div className="flex justify-center items-center gap-3">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M7 7h2v2H7zm0 4h2v2H7zm0 4h2v2H7zm4-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm4-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z"></path><path d="M5 22h14c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2H5c-1.103 0-2 .897-2 2v16c0 1.103.897 2 2 2zM5 4h14v16H5V4z"></path>
                        </svg>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-100">Gemini Text-to-Speech</h1>
                    </div>
                    <p className="text-gray-400 mt-2">Transform your text into lifelike speech.</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="text-input" className="block text-sm font-medium text-gray-300 mb-2">
                            Enter Text
                        </label>
                        <textarea
                            id="text-input"
                            rows={6}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-none"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type your text here..."
                        />
                        <div className={`text-sm text-right mt-1 pr-1 ${text.length > CHARACTER_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
                            {text.length} / {CHARACTER_LIMIT}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="style-input" className="block text-sm font-medium text-gray-300 mb-2">
                            Speaking Style (Optional)
                        </label>
                        <input
                            id="style-input"
                            type="text"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            placeholder="e.g., cheerfully, sadly, like a robot"
                        />
                    </div>
                    <div>
                        <label htmlFor="voice-select" className="block text-sm font-medium text-gray-300 mb-2">
                            Select Voice
                        </label>
                        <select
                            id="voice-select"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 appearance-none"
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
                        >
                            {Object.values(VoiceName).map((voice) => (
                                <option key={voice} value={voice}>
                                    {voice}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                        <p>{error}</p>
                    </div>
                )}
                
                {audioUrl && (
                    <div className="mt-4">
                        <audio controls src={audioUrl} className="w-full">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <button
                        onClick={handleGenerateSpeech}
                        disabled={isLoading}
                        className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:scale-100"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.636 5.636a9 9 0 0112.728 0m-12.728 12.728a9 9 0 010-12.728" />
                                </svg>
                                <span>Generate Speech</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!audioData || isLoading}
                        className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:scale-100"
                        aria-label="Download generated speech as WAV file"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download WAV</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;