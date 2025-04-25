import React from "react";
import { AuthForm } from "../components/AuthForm";

export const Login = () => {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="max-w-7xl mx-auto w-full overflow-hidden">
				<AuthForm />
			</div>
		</div>
	);
};

