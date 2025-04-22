import React from "react";
import { AuthForm } from "../components/AuthForm";

export const Login = () => {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<AuthForm />
			</div>
		</div>
	);
};
