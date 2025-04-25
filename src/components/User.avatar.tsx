import { useState } from "react";
import { auth } from "../config/firebase"; // pastikan path sudah benar
import { signOut } from "firebase/auth"; // jika pakai firebase auth

export default function UserAvatar() {
	const [showPopup, setShowPopup] = useState(false);

	const handleToggle = () => setShowPopup(!showPopup);
	const handleClose = () => setShowPopup(false);

	// Fungsi sign out
	const handleSignOut = async () => {
		await signOut(auth);
		setShowPopup(false);
	};

	return (
		<>
			{/* Avatar pojok kiri atas */}
			<div className="absolute top-0 left-0 z-50 p-4">
				{auth.currentUser ? (
					<div className="relative">
						<button onClick={handleToggle} className="flex items-center gap-2">
							{/* Avatar */}
							{auth.currentUser.photoURL ? (
								<img
									src={auth.currentUser.photoURL}
									alt="avatar"
									className="w-8 h-8 rounded-full border"
								/>
							) : (
								<div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
									{auth.currentUser.displayName
										? auth.currentUser.displayName[0].toUpperCase()
										: auth.currentUser.email
										? auth.currentUser.email[0].toUpperCase()
										: "U"}
								</div>
							)}

							{/* Nama hanya muncul di desktop */}
							<span className="hidden sm:inline text-sm font-medium text-gray-700">
								{auth.currentUser.displayName || auth.currentUser.email}
							</span>
						</button>

						{/* Popup user info */}
						{showPopup && (
							<>
								{/* Klik di luar untuk tutup */}
								<div className="fixed inset-0 z-40" onClick={handleClose}></div>

								<div className="absolute mt-2 left-0 bg-white shadow-lg rounded-lg border p-4 z-50 w-52 text-sm">
									<div className="font-semibold text-gray-800">
										{auth.currentUser.displayName || "User"}
									</div>
									<div className="text-gray-500 break-all text-xs">
										{auth.currentUser.email}
									</div>
									<button
										onClick={handleSignOut}
										className="mt-3 text-red-600 hover:underline text-xs"
									>
										Sign Out
									</button>
								</div>
							</>
						)}
					</div>
				) : (
					<div className="text-sm text-red-500 font-semibold">Belum Login</div>
				)}
			</div>
		</>
	);
}
