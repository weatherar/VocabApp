import React from "react";
import { useState } from "react";
import { auth } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
} from "firebase/auth";

export const AuthForm = () => {
	const navigate = useNavigate();
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (isLogin) {
				console.log("Attempting to sign in with:", email);
				const userCredential = await signInWithEmailAndPassword(
					auth,
					email,
					password
				);
				console.log("Sign in successful:", userCredential.user);
				navigate("/");
			} else {
				await createUserWithEmailAndPassword(auth, email, password);
				navigate("/");
			}
		} catch (err) {
			console.error("Authentication error:", err);
			if (err instanceof Error) {
				setError(err.message);
			} else if (typeof err === "object" && err !== null && "code" in err) {
				const firebaseError = err as { code: string; message: string };
				setError(firebaseError.message);
			} else {
				setError("An error occurred during authentication");
			}
		}
	};

	return (
		<div className=" w-full mx-auto bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 p-4 xl:px-10 2xl:px-130">
  <div className="w-full mx-auto overflow-hidden bg-white rounded-xl shadow-md  flex flex-col md:flex-row">
    {/* Gambar Robot - di atas pada mobile, di kiri pada tablet/desktop */}
    <div className="w-full md:w-1/2 bg-indigo-50 flex items-center justify-center p-8 order-1 md:order-none">
      <img
        src="/assets/robot_modif.svg" // Ganti dengan path gambar robot Anda
        alt="Robot Illustratiod"
        className="w-full max-w-xs h-auto object-contain"
      />
    </div>

    {/* Form Login */}
    <div className="w-full md:w-1/2 p-8 order-2">
      <h2 className="text-center text-2xl font-bold text-gray-900 mb-8">
        {isLogin ? "Sign in to your account" : "Create new account"}
      </h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-200"
        >
          {isLogin ? "Sign in" : "Sign up"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  </div>
</div>
	);
};
