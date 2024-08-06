import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { cn } from "../utils/cn"
import { Label } from "../components/ui/Label"
import { Input } from "../components/ui/Input"
import { IconBrandGoogle } from "@tabler/icons-react"
import { useDispatch } from "react-redux"
import { signInFailure, signInSuccess } from "../redux/user/userSlice"
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth"
import { app } from "../firebase"

export default function Signup() {
	const [formData, setFormData] = useState({})
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState(null)
	const [OTPerror, setOTPError] = useState(null)
	const [isOTPLoading, setIsOTPLoading] = useState(false)
	const [isVerified, setisVerified] = useState(false)
	const [sentOTP, setSentOTP] = useState(false)

	const dispatch = useDispatch()
	const navigate = useNavigate()

	const handleSubmit = async (e) => {
		e.preventDefault()

		setIsLoading(true)

		const requiredFields = [
			"firstname",
			"lastname",
			"username",
			"email",
			"password",
			"confirmpassword",
		]
		const isFormValid = requiredFields.every((field) => formData[field])

		if (!isFormValid) {
			dispatch(signInFailure())
			setError("All field are required")
			setIsLoading(false)
			return
		}

		if (!isVerified) {
			dispatch(signInFailure())
			setError("Email Verification failed")
			setIsLoading(false)
			return
		}

		if (formData.password !== formData.confirmpassword) {
			dispatch(signInFailure())
			setError("Passwords do not match")
			setIsLoading(false)
			return
		}

		try {
			const res = await fetch(
				"https://motomaps-backend.onrender.com/auth/signup",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formData),
					credentials: "include",
				}
			)
			const data = await res.json()

			if (!res.ok) {
				dispatch(signInFailure())
				setError(data.error)
				setIsLoading(false)
			}

			if (res.ok) {
				dispatch(signInSuccess(data))
				setIsLoading(false)
				navigate("/home")
			}
		} catch (e) {
			setIsLoading(false)
		}
	}

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.id]: e.target.value,
		})
	}

	const handleGoogleSignUp = async () => {
		try {
			setIsLoading(true)
			const provider = new GoogleAuthProvider()
			const auth = getAuth(app)
			const result = await signInWithPopup(auth, provider)

			const res = await fetch(
				"https://motomaps-backend.onrender.com/auth/google",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: result.user.displayName,
						email: result.user.email,
						profile_pic: result.user.photoURL,
					}),
					credentials: "include",
				}
			)

			const data = await res.json()

			if (!res.ok) {
				dispatch(signInFailure())
				setError(data.error)
				setIsLoading(false)
			}

			if (res.ok) {
				dispatch(signInSuccess(data))
				setIsLoading(false)
				navigate("/home")
			}
		} catch (e) {
			setIsLoading(false)
		}
	}

	const sendOTP = async () => {
		setIsOTPLoading(true)

		if (!formData.email) {
			setError("Please enter email for OTP verification")
			setIsOTPLoading(false)
			return
		}
		const res = await fetch("https://motomaps-backend.onrender.com/auth/sendotp", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: formData.email,
			}),
		})
		if (res.ok) {
			setSentOTP(true)
			setIsOTPLoading(false)
			return
		}
		if (!res.ok) {
			setOTPError("Failure to send OTP please try again later")
			setIsOTPLoading(false)
			return
		}
	}

	const verifyOTP = async () => {
		setIsOTPLoading(true)
		const res = await fetch(
			"https://motomaps-backend.onrender.com/auth/verifyotp",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					otp: formData.otp,
					email: formData.email,
				}),
			}
		)

		if (res.status === 200) {
			setisVerified(true)
		} else {
			setError("Incorrect OTP")
		}
		setIsOTPLoading(false)
	}

	return (
		<div className="w-full min-h-screen bg-stone-950 flex flex-row">
			<div className="w-1/4 min-h-screen bg-black text-neutral-200 pt-[8rem] max-lg:hidden">
				<span className="font-kanit text-5xl ml-2 p-2">MotoMaps.</span>
				<p className="mt-10 ml-2 p-2 font-kanit font-light text-xl">
					Discover the ultimate road trip companion with MotoMaps—share your
					adventures, explore curated routes, and find your next epic journey!
				</p>

				<Link to="/">
					<div className="flex justify-start mt-6 ml-4">
						<button className="p-[2px] relative">
							<div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-300 rounded-lg" />
							<div className="px-8 py-2  bg-black rounded-[6px]  relative group transition duration-200 text-neutral-200 hover:bg-transparent font-kanit font-light">
								Explore more!
							</div>
						</button>
					</div>
				</Link>
			</div>
			<div className="w-3/4 min-h-screen mt-10 lg:mt-20 max-lg:w-full">
				<div className="lg:hidden flex justify-center mb-2">
					<span className="font-kanit text-4xl text-neutral-200">
						MotoMaps.
					</span>
				</div>
				<div className="max-w-md w-full mx-[6rem] rounded-xl md:rounded-2xl p-4 md:p-8 shadow-input max-lg:mx-auto">
					<h2 className="font-bold text-xl  text-neutral-200 text-center">
						Sign Up
					</h2>

					<form className="my-8" onSubmit={handleSubmit} autoComplete="off">
						<div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
							<LabelInputContainer>
								<Label htmlFor="firstname">First name</Label>
								<Input
									id="firstname"
									placeholder="James"
									type="text"
									onChange={handleChange}
								/>
							</LabelInputContainer>
							<LabelInputContainer>
								<Label htmlFor="lastname">Last name</Label>
								<Input
									id="lastname"
									placeholder="Bond"
									type="text"
									onChange={handleChange}
								/>
							</LabelInputContainer>
						</div>
						<LabelInputContainer className="mb-4">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								placeholder="JamesBond007"
								type="username"
								onChange={handleChange}
							/>
						</LabelInputContainer>
						<LabelInputContainer className="mb-4">
							<Label htmlFor="email">Email Address</Label>
							<Input
								id="email"
								placeholder="JamesBond007@mi6.com"
								type="text"
								onChange={handleChange}
							/>
						</LabelInputContainer>
						<button
							type="button"
							onClick={sendOTP}
							className=" mb-4 relative flex items-center justify-center bg-gradient-to-br group/btn  from-zinc-900 to-zinc-900  bg-zinc-800 w-full text-neutral-200 rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
						>
							{isOTPLoading ? (
								<>
									<svg
										aria-hidden="true"
										className="inline w-5 h-5  animate-spin text-gray-600  fill-gray-300"
										viewBox="0 0 100 101"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
											fill="currentColor"
										/>
										<path
											d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
											fill="currentFill"
										/>
									</svg>
								</>
							) : (
								<>Send OTP</>
							)}
							<BottomGradient />
						</button>

						{sentOTP && (
							<>
								<Label htmlFor="otp">OTP</Label>
								<div className="flex flex-row w-full">
									<LabelInputContainer className="w-2/3 mr-2 mb-4">
										<Input
											id="otp"
											placeholder="OTP"
											type="text"
											onChange={handleChange}
											className="w-full"
										/>
									</LabelInputContainer>

									<button
										type="button"
										onClick={verifyOTP}
										className="w-1/3 mb-4 py-[1.3rem] relative flex items-center justify-center bg-gradient-to-br group/btn  from-zinc-900 to-zinc-900  bg-zinc-800 text-neutral-200 rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
									>
										{isOTPLoading ? (
											<>
												<svg
													aria-hidden="true"
													className="inline w-5 h-5  animate-spin text-gray-600  fill-gray-300"
													viewBox="0 0 100 101"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
														fill="currentColor"
													/>
													<path
														d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
														fill="currentFill"
													/>
												</svg>
											</>
										) : (
											<>Verify OTP</>
										)}
										<BottomGradient />
									</button>
								</div>
								{OTPerror && (
									<p className="text-red-600 font-kanit font-thin mb-4 text-sm">
										{OTPerror}
									</p>
								)}
								{isVerified && (
									<p className="text-green-600 font-kanit font-thin mb-4 text-sm">
										OTP verified succesfully
									</p>
								)}
							</>
						)}
						<LabelInputContainer className="mb-4">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								placeholder="••••••••"
								type="password"
								onChange={handleChange}
							/>
						</LabelInputContainer>
						<LabelInputContainer className="mb-8">
							<Label htmlFor="confirmpassword">Confirm password</Label>
							<Input
								id="confirmpassword"
								placeholder="••••••••"
								type="password"
								onChange={handleChange}
							/>
						</LabelInputContainer>

						<button
							className="relative flex items-center justify-center bg-gradient-to-br group/btn  from-zinc-900 to-zinc-900  bg-zinc-800 w-full text-neutral-200 rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
							type="submit"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<svg
										aria-hidden="true"
										className="inline w-5 h-5  animate-spin text-gray-600  fill-gray-300"
										viewBox="0 0 100 101"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
											fill="currentColor"
										/>
										<path
											d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
											fill="currentFill"
										/>
									</svg>
								</>
							) : (
								<>Signup &rarr;</>
							)}
							<BottomGradient />
						</button>
						{error && (
							<p className="text-red-600 font-kanit font-thin mt-2 text-sm">
								{error}
							</p>
						)}

						<div className="bg-gradient-to-r from-transparent  via-neutral-700 to-transparent my-8 h-[1px] w-full" />

						<div className="flex flex-col space-y-4">
							<button
								className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium bg-zinc-900 shadow-[0px_0px_1px_1px_var(--neutral-800)]"
								type="button"
								onClick={handleGoogleSignUp}
							>
								{isLoading ? (
									<>
										<svg
											aria-hidden="true"
											className="inline w-5 h-5  animate-spin text-gray-600  fill-gray-300 mx-auto"
											viewBox="0 0 100 101"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
												fill="currentColor"
											/>
											<path
												d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
												fill="currentFill"
											/>
										</svg>
									</>
								) : (
									<>
										<IconBrandGoogle className="h-4 w-4  text-neutral-300" />
										<span className=" text-neutral-300 text-sm">
											Signup with Google
										</span>
									</>
								)}

								<BottomGradient />
							</button>
						</div>
					</form>
					<p className="text-sm max-w-s text-neutral-400 ">
						Already a rider?{"    "}
						<Link
							to="/login"
							className="hover:text-neutral-100 font-bold transition-all"
						>
							Login
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

const BottomGradient = () => {
	return (
		<>
			<span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
			<span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
		</>
	)
}

const LabelInputContainer = ({ children, className }) => {
	return (
		<div className={cn("flex flex-col space-y-2 w-full", className)}>
			{children}
		</div>
	)
}
