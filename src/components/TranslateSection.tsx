import React, { useState } from "react";
import { translateIndoToEngService } from "../services/translate";

const TranslateIndoToEngSection = () => {
	const [input, setInput] = useState("");
	const [result, setResult] = useState("");

	const handleTranslate = async () => {
		const translated = await translateIndoToEngService(input);
		setResult(translated);
	};

	return (
		<section className="p-4 bg-white rounded shadow-md max-w-md mx-auto my-6">
			<h2 className="text-lg font-bold mb-2">
				Terjemahkan Indonesia → Inggris
			</h2>
			<textarea
				className="border rounded px-3 py-2 w-full mb-2"
				placeholder="Ketik kata/kalimat Indonesia"
				value={input}
				onChange={(e) => setInput(e.target.value)}
			/>
			<button
				className="bg-indigo-600 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700 transition"
				onClick={handleTranslate}
			>
				Translate
			</button>
			{result && (
				<div className="mt-3 p-2 bg-gray-50 rounded border">{result}</div>
			)}
		</section>
	);
};

export default TranslateIndoToEngSection;
