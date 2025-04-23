import React, { useState, useEffect } from "react";
import "../index.css";
// import { VocabularyList } from "../components/VocabularyList";
import Header from "../components/Header";
import { auth } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import {
	collection,
	addDoc,
	serverTimestamp,
	query,
	where,
	getDocs,
	orderBy,
	deleteDoc,
	doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import axios from "axios";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const MAX_RETRIES = 3;
// const COMMON_WORDS = [
// 	"apple",
// 	"book",
// 	"cat",
// 	"dog",
// 	"elephant",
// 	"fish",
// 	"garden",
// 	"house",
// 	"ice",
// 	"jump",
// 	"king",
// 	"love",
// 	"moon",
// 	"night",
// 	"orange",
// 	"peace",
// 	"queen",
// 	"rain",
// 	"sun",
// 	"tree",
// 	"umbrella",
// 	"voice",
// 	"water",
// 	"xylophone",
// 	"yellow",
// 	"zoo",
// ];

interface Vocabulary {
	id: string;
	word: string;
	meaning: string;
	example: string;
	partOfSpeech: string;
	pronunciation?: string;
	phonetic?: string;
	createdAt?: any; // Firestore timestamp
}

export const Home = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [successCount, setSuccessCount] = useState(0);
	const [errorCount, setErrorCount] = useState(0);
	const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
	const [existingWords, setExistingWords] = useState<Set<string>>(new Set());

	useEffect(() => {
		fetchVocabulary();
	}, []);

	const fetchVocabulary = async () => {
		try {
			const q = query(
				collection(db, "vocabulary"),
				where("userId", "==", auth.currentUser?.uid)
			);
			const querySnapshot = await getDocs(q);
			const vocabList = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Vocabulary[];
			// Sort by createdAt in memory instead of using orderBy
			vocabList.sort((a, b) => {
				const dateA = a.createdAt?.toDate?.() || new Date(0);
				const dateB = b.createdAt?.toDate?.() || new Date(0);
				return dateB.getTime() - dateA.getTime();
			});
			setVocabulary(vocabList);
			// Update existing words set
			setExistingWords(
				new Set(vocabList.map((item) => item.word.toLowerCase()))
			);
		} catch (error) {
			console.error("Error fetching vocabulary:", error);
		}
	};

	const getRandomWord = async (): Promise<string> => {
		try {
			// Get a random word from the dictionary API
			const response = await axios.get(
				"https://random-word-api.herokuapp.com/word?number=1"
			);
			const word = response.data[0];

			// Check if word already exists
			if (existingWords.has(word.toLowerCase())) {
				return getRandomWord(); // Try again if word exists
			}

			return word;
		} catch (error) {
			console.error("Error getting random word:", error);
			throw error;
		}
	};

	const handleSignOut = async () => {
		try {
			await auth.signOut();
			navigate("/login");
		} catch (error) {
			console.error("Error signing out:", error);
		}
	};

	const getWordDefinition = async (
		word: string,
		retryCount = 0
	): Promise<any | null> => {
		try {
			const response = await axios.get(
				`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
			);
			const wordData = response.data[0];

			if (
				!wordData ||
				!wordData.meanings ||
				!wordData.meanings[0]?.definitions?.[0]
			) {
				throw new Error("Invalid word data structure");
			}

			if (word.length < 4) {
				throw new Error("Word too short");
			}

			return wordData;
		} catch (error: any) {
			if (error.response?.status === 404) {
				console.warn(`⚠️ Word not found: "${word}"`);
			}

			if (retryCount < 3) {
				const newWord = await getRandomWord();
				return getWordDefinition(newWord, retryCount + 1);
			}

			return null; // ← kalau semua retry gagal, return null
		}
	};

	const handleGenerateVocabulary = async () => {
		setLoading(true);
		setSuccessCount(0);
		setErrorCount(0);

		const newWords: Vocabulary[] = [];

		try {
			while (newWords.length < 3 && newWords.length < 5) {
				const word = await getRandomWord();
				const wordData = await getWordDefinition(word);

				if (!wordData) {
					setErrorCount((prev) => prev + 1);
					continue;
				}

				const meaning = wordData.meanings?.[0];
				const definition = meaning?.definitions?.[0];

				if (!meaning || !definition || !definition.definition) {
					setErrorCount((prev) => prev + 1);
					continue;
				}

				const newVocab: Vocabulary = {
					id: "", // nanti diisi Firestore
					word: wordData.word || word,
					meaning: definition.definition,
					example: definition.example || "",
					partOfSpeech: meaning.partOfSpeech || "unknown",
					pronunciation:
						wordData.phonetic || wordData.phonetics?.[0]?.text || "",
					phonetic: wordData.phonetic || "",
					createdAt: serverTimestamp(),
				};

				if (
					!newVocab.word ||
					!newVocab.meaning ||
					!newVocab.pronunciation ||
					existingWords.has(newVocab.word.toLowerCase())
				) {
					setErrorCount((prev) => prev + 1);
					continue;
				}

				newWords.push(newVocab);
			}

			for (const vocab of newWords) {
				await addDoc(collection(db, "vocabulary"), {
					...vocab,
					userId: auth.currentUser?.uid,
				});
				setExistingWords(
					(prev) => new Set([...prev, vocab.word.toLowerCase()])
				);
				setSuccessCount((prev) => prev + 1);
			}

			await fetchVocabulary();
		} catch (error) {
			console.error("❌ Error generating vocabulary:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleClearVocabulary = async () => {
		if (
			!window.confirm("Are you sure you want to delete all your vocabulary?")
		) {
			return;
		}

		try {
			const q = query(
				collection(db, "vocabulary"),
				where("userId", "==", auth.currentUser?.uid)
			);
			const querySnapshot = await getDocs(q);

			// Delete all documents
			const deletePromises = querySnapshot.docs.map((doc) =>
				deleteDoc(doc.ref)
			);
			await Promise.all(deletePromises);

			// Clear local state
			setVocabulary([]);
			setExistingWords(new Set());
		} catch (error) {
			console.error("Error clearing vocabulary:", error);
		}
	};

	const [translations, setTranslations] = useState<{ [id: string]: string }>({}); // id vocab : hasil translate
	const [translatingId, setTranslatingId] = useState<string | null>(null);

	const translateWord = async (id: string, word: string) => {
		if (translations[id]) return;
		setTranslatingId(id);
		try {
			const res = await axios.post(
				"https://translate.argosopentech.com/translate",
				{
					q: word,
					source: "en",
					target: "id",
					format: "text",
				},
				{
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
				}
			);
			setTranslations(prev => ({
				...prev,
				[id]: res.data.translatedText,
			}));
		} catch (e) {
			setTranslations(prev => ({
				...prev,
				[id]: "Terjemahan gagal",
			}));
		} finally {
			setTranslatingId(null);
		}
	};
	


	return (
		<div className="min-h-screen w-screen overflow-x-hidden bg-gray-100 flex flex-col">
			{/* Section 1: Header */}

			{/* Section 2: Action Buttons */}
			<section className="bg-white border-b border-gray-200 w-full  overflow-x-hidden">
				<div className="w-full px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<button
							onClick={handleGenerateVocabulary}
							disabled={loading}
							className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
						>
							{loading ? "Generating..." : "Generate Vocabulary"}
						</button>
						<button
							onClick={handleClearVocabulary}
							disabled={loading}
							className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
						>
							Clear All
						</button>
					</div>
					{loading && (
						<div className="mt-3 text-sm text-gray-600 text-center">
							✅ Success: {successCount} | ❌ Fail: {errorCount}
						</div>
					)}
				</div>
			</section>

			{/* Section 3: Vocabulary Cards */}
			<main className="flex-grow py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{loading ? (
						<div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-600 gap-4">
							<div className="w-48 h-48">
								<DotLottieReact
									src="https://lottie.host/39548f35-9573-42bb-8922-4febb7c5745c/cHTJuAco7l.lottie"
									loop
									autoplay
								/>
							</div>
							<p className="text-lg font-medium flex items-center gap-2">
								<span>Generating vocabulary</span>
								<span className="animate-pulse text-2xl">🤖</span>
							</p>
							<p className="text-sm text-gray-500">
								Please wait<span className="animate-pulse">...</span>
							</p>
							<p className="text-sm text-gray-400">
								✅ Success: {successCount} | ❌ Fail: {errorCount}
							</p>
						</div>
					) : vocabulary.length === 0 ? (
						<div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
							<div className="text-center">
								<h2 className="text-xl font-semibold text-gray-600 mb-2">
									No vocabulary yet
								</h2>
								<p className="text-gray-500">
									Click "Generate Vocabulary" to start learning!
								</p>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
							{vocabulary.map((item, idx) => (
     <div
	 key={item.id || `${item.word}-${idx}`}
	 className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100"
   >
        <div className="p-4 sm:p-5 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 break-words">
                    {item.word}
                </h3>
                <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full whitespace-nowrap">
                    {item.partOfSpeech}
                </span>
            </div>
            <div className="space-y-3 flex-grow">
                {item.pronunciation && (
                    <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-700">
                            Pronunciation:
                        </span>{" "}
                        {item.pronunciation}
                    </p>
                )}
                <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">
                        Meaning:
                    </span>{" "}
                    {item.meaning}
                </p>
                {item.example && (
                    <div className="pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500 italic">
                            "{item.example}"
                        </p>
                    </div>
                )}
            </div>
            {/* Tombol translate */}
            <div className="mt-4">
                <button
                    className="relative px-3 py-1 text-xs rounded-md bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition group-hover:bg-blue-100"
                    onClick={() => translateWord(item.id, item.word)}
                    onFocus={() => translateWord(item.id, item.word)}
                >
                    Translate
                    {/* Hasil translate muncul saat hover tombol */}
                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[120px] z-10 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-pre-line">
                        {translatingId === item.id
                            ? "Translating..."
                            : translations[item.id] || ""}
                    </span>
                </button>
            </div>
        </div>
    </div>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	);
};
