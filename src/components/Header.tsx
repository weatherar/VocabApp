import React from "react";
import { Home } from "../pages/Home";
interface HeaderProps {
	onSignOut: () => void;
}

export default function Header({ onSignOut }: HeaderProps) {
	const handleSignOut = () => {
		if (onSignOut) onSignOut();
	};

	return (
		<>
			{/* Sticky Header */}
			<header className="bg-white shadow-sm sticky top-0 z-10 w-full">
				<div className="px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						{/* Kiri (desktop only) */}
						<div className="hidden sm:flex items-center">
							{/* Avatar atau tombol */}
						</div>

						{/* Kanan (desktop only) */}
						<div className="hidden sm:flex justify-end">
							{/* Sign Out atau lainnya */}
						</div>
					</div>
				</div>
			</header>

			{/* Konten Biasa - Bisa scroll */}
			<div className="text-center mt-6 px-4">
				<h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
					<span className="block">English</span>
					<span className="block">Vocabulary</span>
				</h1>
				<div className="text-sm text-black flex items-center justify-center gap-1 mt-1">
					<span className="hidden sm:inline">Learn with Antara</span>
					<span className="text-xl">🤖</span>
				</div>
			</div>
		</>
	);
}
