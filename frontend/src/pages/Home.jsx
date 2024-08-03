import { useEffect, useState } from "react"
import { signInFailure, signInSuccess } from "../redux/user/userSlice"
import { useDispatch } from "react-redux"
import { PlaceholdersAndVanishInput } from "../components/ui/Search"
import Navbar from "../components/Navbar/Navbar"
import Footer from "../components/Footer/Footer"
import backdrop from "../assets/backdrop.png"
import Card from "../components/Card/Card"
import Loading from "../components/Loading/Loading"
import { Link, useNavigate } from "react-router-dom"
import { FaArrowRight } from "react-icons/fa"
import NewTripButton from "../components/NewTripButton/NewTripButton"

const Home = () => {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const [l, setL] = useState([])
	const [data, setData] = useState([])
	const [mostpopular, setMostPopular] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [query, setQuery] = useState("")
	const placeholders = [
		"Roadtrips near Pune",
		"Long highways",
		"Roads with snow-capped mountains",
		"Spiti Valley",
		"Racetracks",
	]

	function toRadians(degrees) {
		return degrees * (Math.PI / 180)
	}

	function haversineDistance(coord1, coord2) {
		const R = 6371

		const lat1 = toRadians(coord1[0])
		const lon1 = toRadians(coord1[1])
		const lat2 = toRadians(coord2[0])
		const lon2 = toRadians(coord2[1])

		const dLat = lat2 - lat1
		const dLon = lon2 - lon1

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

		const distance = R * c

		return distance
	}

	const handleChange = (e) => {
		console.log(e.target.value)
		setQuery(e.target.value)
	}
	const onSubmit = async (e) => {
		e.preventDefault()
		navigate(`/search?query=${query}`)
	}

	useEffect(() => {
		const loadLocation = async () => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const userLocation = [
						position.coords.longitude,
						position.coords.latitude,
					]
					console.log(userLocation)
					setL(l)
					loadAllRoutes(userLocation)
					loadAllRoutesLimited()
				},
				(error) => {
					console.error("Error getting user location:", error)
				}
			)
		}

		const sendRequest = async () => {
			const res = await fetch(`https://motomaps-backend.onrender.com/checkauth`, {
				method: "GET",
				credentials: "include",
			})
			if (!res.ok) {
				dispatch(signInFailure())
				throw Error("Failed to login, please try again")
			} else {
				const data = await res.json()
				dispatch(signInSuccess(data))
				loadLocation()
			}
		}

		sendRequest()

		const sortNearest = (d, loc) => {
			let temp = [
				{ route: d[0], d: 1000000000 },
				{ route: d[1], d: 1000000000 },
				{ route: d[2], d: 1000000000 },
			]

			const swap = (a, b) => {
				const t = temp[a]
				temp[a] = temp[b]
				temp[b] = t
			}

			console.log(loc)

			for (let i = 0; i < d.length; i++) {
				const element = d[i]

				const s = JSON.parse(element.location.waypointsFeatures)
				const start = s[0].geometry.coordinates
				const l = JSON.parse(element.location.waypointsFeatures)
				const last = l[l.length - 1].geometry.coordinates

				const distance1 = haversineDistance(start, loc)
				const distance2 = haversineDistance(last, loc)
				let distance
				if (distance1 > distance2) {
					distance = distance2
				} else {
					distance = distance1
				}
				console.log(`${distance.toFixed(2)} kilometers.`)

				if (i === 0) {
					temp[0].d = distance
				} else if (i === 1) {
					if (temp[0].d > distance) {
						temp[1].d = distance
						swap(0, 1)
					} else {
						temp[1].d = distance
					}
				} else if (i === 2) {
					if (temp[0].d > distance) {
						temp[2].d = distance
						swap(1, 2)
						swap(0, 1)
					} else {
						temp[2].d = distance
						if (temp[1].d > distance) {
							swap(1, 2)
						}
					}
				} else {
					if (temp[0].d > distance) {
						swap(1, 2)
						swap(0, 1)
						temp[0].d = distance
						temp[0].route = element
					} else if (temp[1].d > distance) {
						swap(1, 2)
						temp[1].route = element
						temp[1].d = distance
					} else if (temp[2].d > distance) {
						temp[2].d = distance
						temp[2].route = element
					}
				}
			}

			console.log("gg1" + temp[0].route + temp[0].d)
			console.log("gg1" + temp[1].route + temp[1].d)
			console.log("gg1" + temp[2].route + temp[2].d)
			const n = [temp[0].route, temp[1].route, temp[2].route]
			setData(n)
		}

		const loadAllRoutes = async (loc) => {
			try {
				const res = await fetch(
					`https://motomaps-backend.onrender.com/trip/load-all-mostliked`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: "include",
					}
				)

				if (res.ok) {
					const d = await res.json()
					sortNearest(d, loc)
				} else {
					setError("Failed to load data")
				}
			} catch (err) {
				setError(err.message)
			} finally {
				setLoading(false)
			}
		}

		const loadAllRoutesLimited = async () => {
			try {
				const res = await fetch(
					`https://motomaps-backend.onrender.com/trip/load-all-mostliked-limited`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: "include",
					}
				)

				if (res.ok) {
					const d = await res.json()
					setMostPopular(d)
				} else {
					setError("Failed to load data")
				}
			} catch (err) {
				setError(err.message)
			} finally {
				setLoading(false)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch])

	if (loading) {
		return <Loading />
	}

	if (error) {
		return <div>Error: {error}</div>
	}

	return (
		<>
			<Navbar />

			<div className="relative w-full min-h-screen bg-stone-900">
				<div
					className="relative py-8 w-full h-[300px] bg-cover bg-center"
					style={{ backgroundImage: `url(${backdrop})` }}
				>
					<h2 className="font-kanit font-thin mb-8 mt-4 text-xl text-center sm:text-5xl dark:text-white text-black">
						Search For Your Next Trip
					</h2>
					<PlaceholdersAndVanishInput
						placeholders={placeholders}
						onChange={handleChange}
						onSubmit={onSubmit}
					/>
				</div>

				<div className="fixed bottom-4 right-4 lg:relative lg:bottom-auto lg:right-auto z-[100]">
					<NewTripButton />
				</div>

				<div className="border-b md:border-b-0 bg-stone-900 h-auto lg:border-b mx-6 border-neutral-800">
					<h3 className="font-kanit font-light mt-8 text-xl text-left ml-6 sm:text-2xl dark:text-white text-black">
						Most Popular
					</h3>
					<div className="flex flex-row justify-center">
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 mb-2">
							{mostpopular.map((element) => (
								<div
									className="mx-auto my-auto py-2 "
									key={element.post_id}
								>
									<Card
										title={element.title}
										description={element.description}
										distance={element.distance}
										image={
											element.images &&
											element.images.length > 0 &&
											element.images[0]
										}
										likes={element.likes}
										post_id={element.post_id}
										user_id={element.user_id}
										created_at={element.created_at}
									/>
								</div>
							))}
							<div className="w-full h-10 md:h-96 ">
								<div className="mb-2 w-full h-10 md:h-96 bg-gradient-to-r bg-stone-900 hover:bg-gradient-to-r font-kanit font-medium rounded-lg text-md py-2.5 text-white transition-all duration-200 ease-in-out transform flex items-center justify-center">
									<Link to="/all">
										<span className="hover:underline transition-all duration-300 hover:scale-105 flex flex-row">
											View More
											<FaArrowRight className="ml-2 mt-1" />
										</span>
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-stone-900 h-auto mx-6">
					<h3 className="font-kanit font-light mt-4 text-xl text-left ml-6 sm:text-2xl dark:text-white text-black">
						Near You
					</h3>
					<div className="flex flex-row justify-center">
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 mb-2">
							{data.map((element) => (
								<div
									className="mx-auto my-auto py-2 "
									key={element.post_id}
								>
									<Card
										title={element.title}
										description={element.description}
										distance={element.distance}
										image={
											element.images &&
											element.images.length > 0 &&
											element.images[0]
										}
										likes={element.likes}
										post_id={element.post_id}
										user_id={element.user_id}
										created_at={element.created_at}
									/>
								</div>
							))}
							<div className="w-full h-10 md:h-96 ">
								<div className="mb-2 w-full h-10 md:h-96 bg-gradient-to-r bg-stone-900 hover:bg-gradient-to-r font-kanit font-medium rounded-lg text-md py-2.5 text-white transition-all duration-200 ease-in-out transform flex items-center justify-center">
									<Link to="/all">
										<span className="hover:underline transition-all duration-300 hover:scale-105 flex flex-row">
											View More
											<FaArrowRight className="ml-2 mt-1" />
										</span>
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Footer />
		</>
	)
}

export default Home
