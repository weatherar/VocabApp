import axios from "axios";

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
          "x-rapidapi-key": "9336f8cc98msh585e9152e9cc1c8p1a03ecjsn584b38e55613"
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
          "x-rapidapi-key": "9336f8cc98msh585e9152e9cc1c8p1a03ecjsn584b38e55613"
        }
      }
    );
    return response.data.translatedText || "Tidak ditemukan";
  } catch (e) {
    console.error("Translate error:", e);
    return "Terjemahan gagal";
  }
};
