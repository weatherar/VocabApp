import React, { useState, useEffect } from "react";
import dotenv from 'dotenv';
dotenv.config();
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
	onSnapshot,
} from "firebase/firestore";

import { db } from "../config/firebase";
import axios from "axios";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { translateWordService } from "../services/translate";
import UserAvatar from "../components/User.avatar";
import TranslateIndoToEngSection from "../components/TranslateSection";
const MAX_RETRIES = 3;

interface Vocabulary {
	id: string;
	word: string;
	meaning: string;
	example: string;
	partOfSpeech: string;
	pronunciation?: string;
	synonyms?: string[];
	antonyms?: string[];
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

	const handleSignOut = async () => {
		try {
			await auth.signOut();
			navigate("/login");
		} catch (error) {
			console.error("Error signing out:", error);
		}
	};

	useEffect(() => {
		fetchVocabulary();
	}, []);

	// Ambil data vocabulary dari Firestore
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

			// Sort dari yang terbaru
			vocabList.sort((a, b) => {
				const dateA = a.createdAt?.toDate?.() || new Date(0);
				const dateB = b.createdAt?.toDate?.() || new Date(0);
				return dateB.getTime() - dateA.getTime();
			});

			setVocabulary(vocabList);
			setExistingWords(
				new Set(vocabList.map((item) => item.word.toLowerCase()))
			);
		} catch (error) {
			console.error("Error fetching vocabulary:", error);
		}
	};

	// Ambil kata acak
	const getRandomWords = async (count = 5): Promise<string[]> => {
		try {
			const res = await fetch(
				`https://random-word-api.herokuapp.com/word?number=${count}`
			);
			return await res.json();
		} catch (error) {
			console.error("Error fetching random words:", error);
			return [];
		}
	};

	// Cek apakah definisi valid
	const isValidDefinition = (wordData: any): boolean => {
		const meaning = wordData?.meanings?.[0];
		const definition = meaning?.definitions?.[0];
		return !!(meaning && definition && definition.definition);
	};

	// Ubah ke bentuk Vocabulary
	const mapToVocabulary = (wordData: any): Vocabulary => {
		const meaning = wordData.meanings[0];
		const definition = meaning.definitions[0];

		return {
			id: wordData.word,
			word: wordData.word,
			pronunciation: wordData.phonetics?.[0]?.text ?? "",
			meaning: definition.definition,
			partOfSpeech: meaning.partOfSpeech ?? "",
			example: definition.example ?? "",
			synonyms: definition.synonyms ?? [],
			antonyms: definition.antonyms ?? [],
		};
	};

	// Ambil data definisi dari Dictionary API
	const getWordDefinition = async (word: string) => {
		try {
			const res = await fetch(
				`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
			);
			if (!res.ok) return null;

			const data = await res.json();
			return data[0]; // format mentah untuk `mapToVocabulary`
		} catch (error) {
			console.error("Error fetching definition for", word, error);
			return null;
		}
	};

	// Handle generate vocabulary dari kata acak
	const handleGenerateVocabulary = async () => {
		setLoading(true);
		setSuccessCount(0);
		setErrorCount(0);

		const randomWords = await getRandomWords(5);
		let success = 0;
		let error = 0;

		for (const word of randomWords) {
			try {
				const wordData = await getWordDefinition(word);

				if (wordData && isValidDefinition(wordData)) {
					const vocab = mapToVocabulary(wordData);

					await addDoc(collection(db, "vocabulary"), {
						...vocab,
						createdAt: serverTimestamp(),
						userId: auth.currentUser?.uid,
					});
					success++;
				} else {
					error++;
				}
			} catch (err) {
				console.error("Failed to process word:", word, err);
				error++;
			}
		}

		setSuccessCount(success);
		setErrorCount(error);
		await fetchVocabulary();
		setLoading(false);
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
	const [translations, setTranslations] = useState<{
		[id: string]: { word?: string; example?: string };
	}>({}); // id vocab : hasil translate
	const [translating, setTranslating] = useState<{
		[id: string]: { word?: boolean; example?: boolean };
	}>({});

	const translateVocabPart = async (
		id: string,
		text: string,
		type: "word" | "example"
	) => {
		setTranslating((prev) => ({
			...prev,
			[id]: { ...prev[id], [type]: true },
		}));
		try {
			const translated = await translateWordService(text);
			setTranslations((prev) => ({
				...prev,
				[id]: { ...prev[id], [type]: translated },
			}));
		} catch {
			setTranslations((prev) => ({
				...prev,
				[id]: { ...prev[id], [type]: "Terjemahan gagal" },
			}));
		} finally {
			setTranslating((prev) => ({
				...prev,
				[id]: { ...prev[id], [type]: false },
			}));
		}
	};

	// Tambahkan di dalam komponen Home (setelah deklarasi state lain)
	const [translateInput, setTranslateInput] = useState("");
	const [translateResult, setTranslateResult] = useState("");
	const [translateLoading, setTranslateLoading] = useState(false);

	const handleTranslateManual = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!translateInput.trim()) return;
		setTranslateLoading(true);
		setTranslateResult("");
		try {
			const result = await translateWordService(translateInput.trim());
			setTranslateResult(result);
		} catch {
			setTranslateResult("Terjemahan gagal");
		} finally {
			setTranslateLoading(false);
		}
	};

	// fitur 3 :  arrange sentence

	// State untuk latihan kalimat, grammar feedback, loading, dan score
	// State untuk 1 form latihan kalimat

	const [sentenceInput, setSentenceInput] = useState("");
	const [grammarSuggestion, setGrammarSuggestion] = useState("");
	const [grammarFeedback, setGrammarFeedback] = useState("");
	const [grammarLoading, setGrammarLoading] = useState(false);
	const [sentenceScore, setSentenceScore] = useState<number | null>(null);
	const [matchedWords, setMatchedWords] = useState<string[]>([]);

	// Cek kata-kata vocab mana saja yang ada di kalimat
	const getMatchedWords = (sentence: string, words: string[]) => {
		return words.filter((word) =>
			sentence.toLowerCase().includes(word.toLowerCase())
		);
	};

	// fitur 4 : check grammar
	const getGrammarSuggestion = async (sentence: string) => {
		const options = {
			method: "POST",
			url: "https://grammar-genius.p.rapidapi.com/dev/grammar",
			headers: {
				"content-type": "application/json",
				"X-RapidAPI-Key": "process.env.VITE_API_KEY", // Ganti dengan API key kamu
				"X-RapidAPI-Host": "grammar-genius.p.rapidapi.com",
			},
			data: {
				text: sentence,
				lang: "en",
			},
		};
		try {
			const response = await axios.request(options);
			// Hasil: response.data.corrections[0].correctedText
			return response.data?.corrections?.[0]?.correctedText || "";
		} catch (error) {
			console.error("Grammar API error:", error);
			return "";
		}
	};
	const checkGrammar = async (sentence: string) => {
		try {
			const response = await axios.post(
				"https://api.languagetoolplus.com/v2/check",
				new URLSearchParams({
					text: sentence,
					language: "en-US",
				}),
				{ headers: { "Content-Type": "application/x-www-form-urlencoded" } }
			);
			const matches = response.data.matches;
			if (!matches || matches.length === 0) {
				return "Grammar looks good!";
			}
			return matches.map((m: any) => m.message).join("; ");
		} catch (err) {
			return "Grammar check failed.";
		}
	};
	const handleGrammarCheck = async (sentence: string) => {
		setGrammarFeedback("Checking...");
		setGrammarSuggestion("");

		const feedback = await checkGrammar(sentence);
		setGrammarFeedback(feedback);

		const suggestion = await getGrammarSuggestion(sentence);
		if (suggestion) setGrammarSuggestion(suggestion);
	};

	const handleSentenceSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setGrammarLoading(true);
		getGrammarSuggestion(""); // reset suggestion
		setGrammarFeedback("");
		// Ambil semua kata dari vocabulary
		const words = vocabulary.map((v) => v.word);
		const matched = getMatchedWords(sentenceInput, words);
		setMatchedWords(matched);

		const score = matched?.length ?? 0;
		setSentenceScore(score);

		// Grammar check
		const feedback = await checkGrammar(sentenceInput);
		setGrammarFeedback(feedback);

		// Jika grammar salah, minta suggestion dari Grammar Genius
		if (feedback !== "Grammar looks good!") {
			const suggestion = await getGrammarSuggestion(sentenceInput);
			setGrammarSuggestion(suggestion);
		}

		setGrammarLoading(false);

		// Simpan ke Firestore
		const saveSentencePractice = async ({
			vocabIds,
			vocabWords,
			matchedWords,
			sentence,
			grammarFeedback,
			score,
		}: {
			vocabIds: string[];
			vocabWords: string[];
			matchedWords: string[];
			sentence: string;
			grammarFeedback: string;
			score: number;
		}) => {
			// Guard: Pastikan user sudah login
			if (!auth.currentUser || !auth.currentUser.uid) {
				console.error("User belum login, data tidak disimpan.");
				alert("Anda harus login untuk menyimpan latihan.");
				return;
			}

			// Validasi field
			const dataToSave = {
				userId: auth.currentUser.uid,
				vocabIds: Array.isArray(vocabIds) ? vocabIds : [],
				vocabWords: Array.isArray(vocabWords) ? vocabWords : [],
				matchedWords: Array.isArray(matchedWords) ? matchedWords : [],
				sentence: typeof sentence === "string" ? sentence : "",
				grammarFeedback:
					typeof grammarFeedback === "string" ? grammarFeedback : "",
				score: typeof score === "number" && !isNaN(score) ? score : 0,
				createdAt: serverTimestamp(),
			};

			// Logging sebelum simpan
			console.log("Data yang akan disimpan ke Firestore:", dataToSave);

			try {
				await addDoc(collection(db, "sentencePractices"), dataToSave);
				console.log("Berhasil menyimpan latihan ke Firestore.");
			} catch (err) {
				console.error(
					"Gagal menyimpan latihan kalimat ke Firestore:",
					err,
					dataToSave
				);
				alert("Gagal menyimpan ke Firestore. Lihat console untuk detail.");
			}
		};

		await saveSentencePractice({
			vocabIds: vocabulary.map((v) => v.id),
			vocabWords: words,
			matchedWords: matched,
			sentence: sentenceInput,
			grammarFeedback: feedback,
			score,
		});
		if (score === words.length && feedback === "Grammar looks good!") {
			window.alert(
				"Selamat! Kalimat Anda sudah benar dan mengandung semua kata kunci."
			);
			setSentenceInput(""); // Kosongkan textarea
			setSentenceScore(null);
			setMatchedWords([]);
			getGrammarSuggestion("");
			setGrammarFeedback("");
		}
	};

	useEffect(() => {
		setSentenceInput("");
		setSentenceScore(null);
		setMatchedWords([]);
		setGrammarFeedback("");
		getGrammarSuggestion("");
	}, [vocabulary]);

	const saveSentencePractice = async ({
		vocabIds,
		vocabWords,
		matchedWords,
		sentence,
		grammarFeedback,
		score,
	}: {
		vocabIds: string[];
		vocabWords: string[];
		matchedWords: string[];
		sentence: string;
		grammarFeedback: string;
		score: number;
	}) => {
		try {
			await addDoc(collection(db, "sentencePractices"), {
				userId: auth.currentUser?.uid,
				vocabIds,
				vocabWords,
				matchedWords,
				sentence,
				grammarFeedback,
				score,
				createdAt: serverTimestamp(),
			});
		} catch (err) {
			console.error("Gagal menyimpan latihan kalimat:", err);
		}
	};

	//   progres bar
	const levelThresholds = [100, 200, 500, 1000, 2000, 3000];
	const [progressWords, setProgressWords] = useState(0);
	const [progressLevel, setProgressLevel] = useState(1);
	const [progressPercent, setProgressPercent] = useState(0);

	useEffect(() => {
		if (!auth.currentUser) return;

		const q = query(
			collection(db, "sentencePractices"),
			where("userId", "==", auth.currentUser.uid)
		);

		// Pasang listener real-time
		const unsubscribe = onSnapshot(q, (querySnapshot) => {
			let allWords: string[] = [];
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				if (Array.isArray(data.matchedWords)) {
					allWords = allWords.concat(
						data.matchedWords.map((w: string) => w.toLowerCase())
					);
				}
			});

			// Hitung kata unik
			const uniqueWords = Array.from(new Set(allWords));
			setProgressWords(uniqueWords.length);

			// Hitung level dan persen
			let level = 1;
			for (let i = 0; i < levelThresholds.length; i++) {
				if (uniqueWords.length >= levelThresholds[i]) level = i + 1;
			}
			setProgressLevel(level);

			const prev = level > 1 ? levelThresholds[level - 2] : 0;
			const next =
				levelThresholds[level - 1] ||
				levelThresholds[levelThresholds.length - 1];
			const percent = Math.min(
				100,
				Math.round(((uniqueWords.length - prev) / (next - prev)) * 100)
			);
			setProgressPercent(percent);
		});

		// Cleanup listener saat komponen unmount atau user logout
		return () => unsubscribe();
	}, [auth.currentUser]);

	//avatar
	const [user, setUser] = useState(() => auth.currentUser);
	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
		return () => unsubscribe();
	}, []);

	// console.log('vocabulary:', vocabulary);
	const [practiceInputs, setPracticeInputs] = useState<{
		[id: string]: string;
	}>({});
	return (
		<>
			{/* User avatar di pojok kiri atas */}
			<UserAvatar />

			{/* Header utama aplikasi */}
			{/* <Header onSignOut={handleSignOut} /> */}

			<div className="min-h-screen w-screen overflow-x-hidden bg-gray-100 flex flex-col">
				{/* Section 1: Header */}

				{/* Section 2: Action Buttons */}
				<section className="bg-white border-b border-gray-200 w-full overflow-x-hidden">
					<div className="w-full px-4 sm:px-6 lg:px-8 py-4">
						<div className="flex flex-col sm:flex-row justify-center items-center gap-3">
							<button
								className="w-full sm:w-full max-w-[250px] px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-blue-700 transition text-sm text-center"
								onClick={handleGenerateVocabulary}
								disabled={loading}
							>
								{loading ? "Generating..." : "Generate Vocabulary"}
							</button>
							<button
								onClick={handleClearVocabulary}
								disabled={loading}
								className="w-full sm:w-full max-w-[250px] px-4 py-2 rounded-md text-white bg-red-500 hover:bg-black font-semibold disabled:opacity-50 transition text-sm text-center"
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

				{/* Progress Bar */}

				<section className="max-w-lg mx-auto mt-8 mb-6">
					<div className="mb-1 flex justify-between items-center">
						<span className="text-sm font-semibold text-indigo-700">
							Progress Kata: {progressWords}
						</span>
						<span className="text-xs text-gray-600">
							Level {progressLevel} ({progressWords}/
							{levelThresholds[progressLevel - 1] ||
								levelThresholds[levelThresholds.length - 1]}
							)
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-4">
						<div
							className="bg-indigo-600 h-4 rounded-full transition-all"
							style={{ width: `${progressPercent}%` }}
						></div>
					</div>
					<div className="text-xs text-gray-500 mt-1">
						{progressLevel < levelThresholds.length
							? `Menuju Level ${progressLevel + 1}: ${
									levelThresholds[progressLevel - 1]
							  } kata`
							: "Level Maksimal Tercapai"}
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
										key={`${item.id}-${idx}`}
										className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100"
									>
										<div className="p-4 sm:p-5 flex flex-col h-full">
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
												<h3 className="text-lg font-semibold text-gray-900 break-words">
													{item.word}
												</h3>
												{/* <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full whitespace-nowrap">
													{item.partOfSpeech}
												</span> */}
												<span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full whitespace-nowrap">
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
												{/* Translate judul vocab */}
												<button
													className="px-3 py-1 text-xs rounded-md bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition"
													onClick={() =>
														translateVocabPart(item.id, item.word, "word")
													}
													disabled={!!translating[item.id]?.word}
												>
													{translating[item.id]?.word
														? "Translating..."
														: "Translate Word"}
												</button>
												{translations[item.id]?.word && (
													<div className="mt-2 text-xs text-gray-700 bg-gray-100 rounded px-2 py-1">
														{translations[item.id].word}
													</div>
												)}

												{item.example && (
													<>
														<button
															className="px-3 py-1 text-xs rounded-md bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition mt-2"
															onClick={() =>
																translateVocabPart(
																	item.id,
																	item.example,
																	"example"
																)
															}
															disabled={!!translating[item.id]?.example}
														>
															{translating[item.id]?.example
																? "Translating..."
																: "Translate Example"}
														</button>
														{translations[item.id]?.example && (
															<div className="mt-2 text-xs text-gray-700 bg-gray-100 rounded px-2 py-1">
																{translations[item.id].example}
															</div>
														)}
													</>
												)}
											</div>
										</div>
									</div>
								))}

								{vocabulary.map((vocab) => (
									<div
										key={vocab.id}
										className="mb-6 p-4 border border-gray-300 rounded-lg shadow-lg bg-white opacity-90 hover:opacity-100 transition-opacity duration-300"
									>
										<div className="font-semibold text-xl text-gray-800">
											{vocab.word}
										</div>
										{/* Bagian latihan menulis */}
										<textarea
											className="mt-3 w-full border border-gray-300 rounded-lg p-3 text-gray-700 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 opacity-100 transition-all duration-300"
											placeholder={`Latihan menulis: ${vocab.word}`}
											value={practiceInputs[vocab.id] || ""}
											onChange={(e) =>
												setPracticeInputs((prev) => ({
													...prev,
													[vocab.id]: e.target.value,
												}))
											}
											rows={3}
										/>
									</div>
								))}
							</div>
						)}
					</div>

					{/* //Section arrange sentence */}

					<div className="mt-12 flex flex-col gap-8 lg:flex-row lg:gap-8 max-w-5xl mx-auto">
						{/* Section 1: Alat Translate Kata */}
						<section className="flex-1 bg-white shadow rounded-xl p-6 mb-30">
							{/* ...isi Alat Translate Kata */}
							<section className="mt-12 max-w-lg mx-auto bg-white shadow rounded-xl p-6 mb-30">
								<h2 className="text-lg font-semibold mb-3 text-indigo-700">
									Alat Translate Kata
								</h2>
								<form
									onSubmit={handleTranslateManual}
									className="flex flex-col gap-3"
								>
									{/* <input
								type="text"
								className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
								placeholder="Masukkan kata dalam bahasa Inggris"
								value={translateInput}
								onChange={(e) => setTranslateInput(e.target.value)}
								disabled={translateLoading}
							/> */}
									<textarea
										rows={3} // Atur tinggi awalnya
										className="w-full border rounded px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
										placeholder="Masukkan kata atau kalimat dalam bahasa Inggris"
										value={translateInput}
										onChange={(e) => setTranslateInput(e.target.value)}
										disabled={translateLoading}
									/>

									<button
										type="submit"
										className="bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 transition"
										disabled={translateLoading}
									>
										{translateLoading ? "Menerjemahkan..." : "Terjemahkan"}
									</button>
								</form>
								{translateResult && (
									<div className="mt-4 p-3 bg-gray-50 rounded text-gray-800 border border-gray-200">
										<span className="font-medium text-gray-700">
											Hasil terjemahan:
										</span>
										<br />
										<span>{translateResult}</span>
									</div>
								)}
							</section>
						</section>
						{/* Section 2: Latihan Merangkai Kalimat */}
						<section className="flex-1 bg-white shadow rounded-xl p-6 mb-30">
							{/* ...isi Latihan Merangkai Kalimat */}
							<section className="mt-12 max-w-lg mx-auto bg-white shadow rounded-xl p-6 mb-30">
								<h2 className="text-lg font-semibold mb-3 text-indigo-700">
									Latihan Merangkai Kalimat
								</h2>
								<div className="mb-2 text-sm text-gray-700">
									Kata kunci yang harus ada di kalimat:
									<span className="font-semibold text-indigo-600 ml-1">
										{vocabulary.map((v) => v.word).join(", ")}
									</span>
								</div>
								<form
									onSubmit={handleSentenceSubmit}
									className="flex flex-col gap-3"
								>
									<textarea
										rows={4}
										className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
										placeholder="Buat kalimat yang mengandung semua kata di atas"
										value={sentenceInput}
										onChange={(e) => setSentenceInput(e.target.value)}
										disabled={grammarLoading}
									/>
									<button
										type="submit"
										className="bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 transition"
										disabled={grammarLoading}
									>
										{grammarLoading ? "Memeriksa..." : "Cek Kalimat & Simpan"}
									</button>
								</form>
								{sentenceScore !== null && (
									<div className="mt-3 text-sm">
										<span className="font-medium">
											Score: {sentenceScore} / {vocabulary.length}
										</span>
										<br />
										<span className="text-gray-700">
											Kata yang ditemukan: {matchedWords.join(", ") || "-"}
										</span>
									</div>
								)}

								{grammarFeedback && (
									<div className="mt-2 text-xs text-gray-700">
										Grammar: {grammarFeedback}
									</div>
								)}

								{grammarSuggestion && (
									<div className="mt-1 text-xs text-blue-700">
										Saran kalimat benar: <strong>{grammarSuggestion}</strong>
									</div>
								)}
							</section>
						</section>
					</div>
					<TranslateIndoToEngSection />
				</main>
			</div>
		</>
	);
};
