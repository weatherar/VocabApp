import React from "react";
import { Home } from "../pages/Home";
interface HeaderProps {
	onSignOut: () => void;
}

export default function Header({ onSignOut } : HeaderProps) {
	const handleSignOut = () => {
		if (onSignOut) onSignOut();
	};

	return (
		// <header className="bg-white shadow-sm sticky top-0 z-10 w-full">
		// 	{" "}
		// 	<div className="px-4 sm:px-6 lg:px-8">
		// 		{" "}
		// 		<div className="flex items-center justify-between py-4">
		// 			{" "}
		// 			{/* Kiri kosong */} <div className="w-1/3" />
		// 			{/* Tengah */}
		// 			<div className="w-1/3 text-center">
		// 				<h1 className="text-xl sm:text-2xl font-bold text-gray-900">
		// 					English Vocabulary
		// 				</h1>
		// 				<div className="text-sm text-indigo-600 flex items-center justify-center gap-1">
		// 					<span>Learn with Antara</span>
		// 					<span className="text-xl">🤖</span>
		// 				</div>
		// 			</div>
		// 			{/* Kanan */}
		// 			<div className="w-1/3 flex justify-end">
		// 				<button
		// 					onClick={handleSignOut}
		// 					className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-1"
		// 				>
		// 					<svg
		// 						xmlns="http://www.w3.org/2000/svg"
		// 						className="h-5 w-5 sm:hidden"
		// 						fill="none"
		// 						viewBox="0 0 24 24"
		// 						stroke="currentColor"
		// 					>
		// 						<path
		// 							strokeLinecap="round"
		// 							strokeLinejoin="round"
		// 							strokeWidth={2}
		// 							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5"
		// 						/>
		// 					</svg>
		// 					<span className="hidden sm:inline">Sign Out</span>
		// 				</button>
		// 			</div>
		// 		</div>
		// 	</div>
		// </header>

		<header className="bg-white shadow-sm sticky top-0 z-10 w-full overflow-x-hidden">
			<div className="px-4 sm:px-6 lg:px-8 ">
				<div className="relative flex items-center justify-between py-4">
					{/* Spacer kiri (desktop only) */}
					<div className="hidden sm:block w-1/3" />

					{/* Tengah */}
					<div className="absolute inset-x-0 flex justify-center sm:static sm:w-1/3 sm:text-center">
						<div className="text-center">
							<h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
								<span className="block">English</span>
								<span className="block">Vocabulary</span>
							</h1>
							<div className="text-sm text-indigo-600 flex items-center justify-center gap-1 mt-1">
								<span>Learn with Antara</span>
								<span className="text-xl">🤖</span>
							</div>
						</div>
					</div>

					{/* Kanan */}
					<div className="flex-1 flex justify-end pr-4 mt-40">
						{/* Mobile - hamburger/logout icon */}
						<button
							onClick={handleSignOut}
							className="p-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition sm:hidden"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 16l4-4m0 0l-4-4m4 4H7"
								/>
							</svg>
						</button>

						{/* Desktop - full logout button */}
						<button
							onClick={handleSignOut}
							className="hidden sm:flex px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 items-center gap-1"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 16l4-4m0 0l-4-4m4 4H7"
								/>
							</svg>
							<span>Sign Out</span>
						</button>
					</div>
				</div>
			</div>
		</header>
	);
}