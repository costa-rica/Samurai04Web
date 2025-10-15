"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { loginUser } from "@/store/features/user/userSlice";

// export default function SignInForm() {
export default function LoginForm() {
	const [showPassword, setShowPassword] = useState(false);
	const [email, emailSetter] = useState(
		process.env.NEXT_PUBLIC_MODE === "workstation" ? "nrodrig1@gmail.com" : ""
	);
	const [password, passwordSetter] = useState(
		process.env.NEXT_PUBLIC_MODE === "workstation" ? "test" : ""
	);
	const dispatch = useAppDispatch();
	const router = useRouter();
	// const userReducer = useSelector((state) => state.user);
	const userReducer = useAppSelector((s) => s.user);

	useEffect(() => {
		// Auto-redirect if user is already logged in
		if (userReducer.token) {
			router.push("/home");
			return;
		}
	}, [userReducer.token, router]);

	const handleClickLogin = async () => {
		console.log(
			"Login ---> API URL:",
			`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/login`
		);
		console.log("- handleClickLogin 👀");
		console.log("- email:", email);

		const bodyObj = { email, password };

		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/login`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(bodyObj),
			}
		);

		console.log("Received response:", response.status);

		let resJson = null;
		const contentType = response.headers.get("Content-Type");

		if (contentType?.includes("application/json")) {
			resJson = await response.json();
		}

		if (response.ok) {
			// if (resJson.user.isAdminForKvManagerWebsite) {
			console.log(resJson);
			resJson.email = email;
			try {
				dispatch(loginUser(resJson));
				router.push("/home");
			} catch (error) {
				console.error("Error logging in:", error);
				alert("Error logging in");
			}
		} else {
			const errorMessage =
				resJson?.error || `There was a server error: ${response.status}`;
			alert(errorMessage);
		}
	};

	return (
		<div className="flex flex-col flex-1  w-full">
			<div className="grid grid-cols-1 lg:grid-cols-2 w-full h-screen mt-5">
				<div className="flex flex-col justify-center px-6 lg:px-12 w-full h-full">
					<div className="mb-5 sm:mb-8">
						<h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
							Sign In
						</h1>
					</div>
					<div>
						<form>
							<div className="space-y-6">
								<div>
									<Label>
										Email <span className="text-error-500">*</span>{" "}
									</Label>
									<Input
										placeholder="info@gmail.com"
										type="email"
										value={email}
										onChange={(e) => emailSetter(e.target.value)}
									/>
								</div>
								<div>
									<Label>
										Password <span className="text-error-500">*</span>{" "}
									</Label>
									<div className="relative">
										<Input
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(e) => passwordSetter(e.target.value)}
											placeholder="Enter your password"
										/>
										<span
											onClick={() => setShowPassword(!showPassword)}
											className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
										>
											{showPassword ? (
												<EyeIcon className="fill-gray-500 dark:fill-gray-400" />
											) : (
												<EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
											)}
										</span>
									</div>
								</div>
								<div className="flex items-center justify-end">
									<Link
										href="/reset-password"
										className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
									>
										Forgot password?
									</Link>
								</div>
								<div>
									<Button
										type="button"
										className="w-full"
										size="sm"
										// onClick={handleClickLogin}
										onClick={() => {
											console.log("Submitted email:", email);
											console.log("Submitted password:", password);
											handleClickLogin();
											// You can call your submit logic or dispatch here
										}}
									>
										Sign in
									</Button>
								</div>
							</div>
						</form>

						<div className="mt-5">
							<p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
								Don&apos;t have an account? {""}
								<Link
									href="/signup"
									className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
								>
									Sign Up
								</Link>
							</p>
						</div>
					</div>
				</div>
				<div className="hidden lg:flex items-center justify-center w-full h-full p-10">
					<Image
						width={1500}
						height={1500}
						className="w-full h-full object-contain"
						src="/images/DashDataV3_calibri_teal_iosIcon.png"
						alt="DashData Logo"
					/>
				</div>
			</div>
		</div>
	);
}
