// import React from "react";
// import "./index.css";
// import {
// 	BrowserRouter as Router,
// 	Routes,
// 	Route,
// 	Navigate,
// } from "react-router-dom";
// import { Home } from "./pages/Home";
// import { Login } from "./pages/Login";
// import { ProtectedRoute } from "./components/ProtectedRoute";
////////////////////////////////////////
// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Header from "./components/Header";
// import {Home} from "./pages/Home";

// import {SentenceTraining} from "./pages/SentenceTraining";

// function App() {
// 	const handleSignOut = () => {
// 		localStorage.removeItem("token");
// 		window.location.href = "/login";
// 	};

// 	return (
// 		<Router>
// 			<div className="min-h-screen bg-gray-100 flex flex-col">
// 				<Header onSignOut={handleSignOut} />
// 				<main className="flex-1 p-4">
// 					<Routes>
// 						<Route path="/" element={<Home />} />
// 						{/* <Route path="/generate" element={<Generate />} />
// 						<Route path="/sentence" element={<SentenceTraining />} /> */}
// 					</Routes>
// 				</main>
// 			</div>
// 		</Router>
// 	);
// }

// export default App;

//////////////]

// function App() {
// 	return (
// 		<Router future={{ v7_startTransition: true }}>
// 			<Routes>
// 				<Route path="/login" element={<Login />} />
// 				<Route
// 					path="/"
// 					element={
// 						<ProtectedRoute>
// 							<Home />
// 						</ProtectedRoute>
// 					}
// 				/>
// 				<Route path="*" element={<Navigate to="/" />} />
// 			</Routes>
// 		</Router>
// 	);
// }

// export default App;
import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	useLocation,
	Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";

const AppLayout = () => {
	const location = useLocation();
	const hideHeaderRoutes = ["/login", "/register"];

	const handleSignOut = () => {
		localStorage.removeItem("token");
		window.location.href = "/login";
	};

	return (
		<div className="min-h-screenw-full overflow-x-hidden flex flex-col ">
			{!hideHeaderRoutes.includes(location.pathname) && (
				<Header onSignOut={handleSignOut} />
			)}
			<main className="flex-1 p-4">
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<Home />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" />} />
				</Routes>
			</main>
		</div>
	);
};

export default function App() {
	return (
		<Router>
			<AppLayout />
		</Router>
	);
}
