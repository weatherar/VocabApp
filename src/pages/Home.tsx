import React, { useState, useEffect } from "react";
import "../index.css";
// import { VocabularyList } from "../components/VocabularyList";
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


const MAX_RETRIES = 3;
const COMMON_WORDS = [
	"apple",
	"book",
	"cat",
	"dog",
	"elephant",
	"fish",
	"garden",
	"house",
	"ice",
	"jump",
	"king",
	"love",
	"moon",
	"night",
	"orange",
	"peace",
	"queen",
	"rain",
	"sun",
	"tree",
	"umbrella",
	"voice",
	"water",
	"xylophone",
	"yellow",
	"zoo",
];

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

		try {
			const wordsToProcess = await Promise.all(
				Array(5)
					.fill(null)
					.map(() => getRandomWord())
			);

			for (const word of wordsToProcess) {
				try {
					const wordData = await getWordDefinition(word);
					if (!wordData) {
						console.log(`⚠️ Skipped word "${word}" due to invalid data`);
						setErrorCount((prev) => prev + 1);
						continue;
					}

					const meaning = wordData.meanings[0];
					const definition = meaning.definitions[0];

					if (existingWords.has(word.toLowerCase())) {
						console.log(`ℹ️ Word "${word}" already exists, skipping...`);
						continue;
					}

					const vocabularyData = {
						word: wordData.word || word,
						meaning: definition.definition || "No definition available",
						example: definition.example || "",
						partOfSpeech: meaning.partOfSpeech || "unknown",
						pronunciation:
							wordData.phonetic || wordData.phonetics?.[0]?.text || "",
						phonetic: wordData.phonetic || "",
						userId: auth.currentUser?.uid,
						createdAt: serverTimestamp(),
					};

					if (!vocabularyData.word || !vocabularyData.meaning) {
						throw new Error("Missing required fields");
					}

					await addDoc(collection(db, "vocabulary"), vocabularyData);
					console.log(`✅ Successfully added word: ${word}`);

					setExistingWords((prev) => new Set([...prev, word.toLowerCase()]));
					setSuccessCount((prev) => prev + 1);
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					console.log(`❌ Failed to process word "${word}": ${errorMessage}`);
					setErrorCount((prev) => prev + 1);
				}
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

	return (
		<div className="min-h-screen bg-gray-100">
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">
							English Vocabulary
						</h1>
						<div className="flex flex-wrap justify-center sm:justify-end gap-2">
							<button
								onClick={handleGenerateVocabulary}
								disabled={loading}
								className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
							>
								{loading ? "Generating..." : "Generate Vocabulary"}
							</button>
							<button
								onClick={handleClearVocabulary}
								disabled={loading}
								className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
							>
								Clear All
							</button>
							<button
								onClick={handleSignOut}
								className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
							>
								Sign Out
							</button>
						</div>
					</div>
					{loading && (
						<div className="mt-4 text-sm text-gray-600 text-center sm:text-left">
							Successfully added: {successCount} words | Failed: {errorCount}
						</div>
					)}
				</div>
			</header>
			<main className="py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{vocabulary.length === 0 ? (
						<div className="text-center py-12">
							<h2 className="text-xl font-semibold text-gray-600">
								No vocabulary yet. Click "Generate Vocabulary" to start
								learning!
							</h2>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{vocabulary.map((item) => (
								<div
									key={item.id}
									className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100"
								>
									<div className="p-5">
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
											<h3 className="text-lg font-semibold text-gray-900 break-words">
												{item.word}
											</h3>
											<span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full whitespace-nowrap">
												{item.partOfSpeech}
											</span>
										</div>
										<div className="space-y-3">
											{item.pronunciation && (
												<div>
													<p className="text-sm text-gray-600">
														<span className="font-medium text-gray-700">
															Pronunciation:
														</span>{" "}
														{item.pronunciation}
													</p>
												</div>
											)}
											<div>
												<p className="text-sm text-gray-600">
													<span className="font-medium text-gray-700">
														Meaning:
													</span>{" "}
													{item.meaning}
												</p>
											</div>
											{item.example && (
												<div className="pt-3 border-t border-gray-100">
													<p className="text-sm text-gray-500 italic">
														"{item.example}"
													</p>
												</div>
											)}
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
