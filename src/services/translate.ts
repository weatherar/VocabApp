import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();

export const translateWordService = async (word: string): Promise<string> => {
  try {
    const response = await axios.post(
      "https://openl-translate.p.rapidapi.com/translate",
      {
        target_lang: "id",
        text: word
      },
      {
        headers: {
          "Content-Type": "application/json", 
          "x-rapidapi-host": "openl-translate.p.rapidapi.com",
          "x-rapidapi-key":process.env.VITE_API_KEY
        }
      }
    );
    // Ambil hasil terjemahan dari field yang benar
    return response.data.translatedText || "Tidak ditemukan";
  } catch (e) {
    console.error("Translate error:", e);
    return "Terjemahan gagal";
  }
};

export const translateIndoToEngService = async (word: string): Promise<string> => {
  try {
    const response = await axios.post(
      "https://openl-translate.p.rapidapi.com/translate",
      {
        target_lang: "en",
        text: word
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "openl-translate.p.rapidapi.com",
          "x-rapidapi-key":process.env.VITE_API_KEY
        }
      }
    );
    return response.data.translatedText || "Tidak ditemukan";
  } catch (e) {
    console.error("Translate error:", e);
    return "Terjemahan gagal";
  }
};
