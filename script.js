import { render, mut, sig, mem, eff_on, each, if_then } from "./solid/monke.js"
import { hdom } from "./solid/hdom/index.js"
import CSS from "./css/css.js"

import * as ArenaType from "./arena.js"
import * as Tapri from "./solid/monke.js"

let canvas_dom
let timeout = undefined

const lerp = (start, stop, amt) => amt * (stop - start) + start
const invlerp = (x, y, a) => clamp((a - x) / (y - x));
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a));
const not = (value) => !value
const calc_z = (index) => -scroll() + (index * 5000)

/**@type {(val: number, min: number, max: number) => boolean}*/
const between = (val, min, max) => (val > min && val < max)

/**
 * @type Tapri.Signal<null> 
 * */
const selected_student = sig(null)

/**
 * @typedef {("select" | "scroll" | "none")} ToolName
 * @type Tapri.Signal<ToolName>
 * */
const tool = sig("select")
const scroll = sig(0)
const autoscroll = sig(true)
const mouse_x = sig(0)
const mouse_y = sig(0)

/**@param {ToolName} t*/
const toggle_tool = (t) => {
	if (tool() == t) { tool("none") }
	else { tool(t) }
}

const translate2D = (x, y) => `translate(${x}, ${y})`
const scroll_canvas = (value) => canvas_dom.scrollTop += value
const seek = (value) => {
	let _value = value()
	if (timeout) clearTimeout(timeout)
	timeout = setTimeout(() => {
		if (_value > -500 && _value < -150) {
			return
		} else if (_value > -150) {
			let difference = _value - (-150)
			let amt = difference * .05
			scroll_canvas(amt)
			seek(value)
		} else {
			let difference = _value - (-150)
			let amt = difference * .05
			scroll_canvas(amt)
			seek(value)
		}
	}, 10)
}

/**@type {Array<ArenaType.Channel>}*/
const channels = mut([])

fetch("./data.json")
	.then((res) => res.json())
	.then(res => res.forEach((r) => channels.push(r)))
	.then(_ => init_students(channels))


const students = mut([])

/**@param {ArenaType.Channel[]} channels */
function init_students(channels) {
	channels.reduce(
		(students, channel) => {
			// each channel is a student
			const name = channel.title
			const bio = channel.metadata.description
			const slug = channel.slug

			const images = channel.contents.reduce((acc, block) => {
				if (block.class == "Image") acc.push(block)
				return acc
			}, [])

			const videos = channel.contents.reduce((acc, block) => {
				if (block.class == "Attachment" && block.attachment.extension == "mp4") acc.push(block)
				return acc
			}, [])

			students.push({ name, images, bio, videos, slug })

			return students
		}, [])
		.forEach(s => students.push(s))
}

const images = mem(() => students
	.reduce((acc, student) => {
		acc.push(student.images)
		return acc
	}, []).flat()
)

// -----------------------
// Event Listeners
// -----------------------
document.body.onmousemove = (e) => {
	mouse_x(e.clientX)
	mouse_y(e.clientY)
}
// -----------------------


// -----------------------
// (u) COMPONENT: Tool Button
// -----------------------
/**@param {ToolName} name*/
let check_btn = (name, toggle, eq) => button(
	toggle,
	{
		style: () => CSS.css({
			opacity: eq() ? 1 : .1
		})
	},
	name
)

// -----------------------
// (u) COMPONENT: Tool Button
// -----------------------
/**@param {ToolName} name*/
let tool_btn = (name) => check_btn(name, () => toggle_tool(name), () => tool() == name)

/**
 * @param {string} name
 * @param {Tapri.Signal} signal
 * */
let option_btn = (signal, name) => check_btn(name, () => signal(!signal), signal)

// -----------------------
// (u) COMPONENT: Button
// -----------------------
let button = (click_fn, one, two) => {
	let atts = { onclick: click_fn }
	let text = two

	if (typeof one == "object") Object.assign(atts, one)
	else if (typeof one == "string") text = one

	return ["button", atts, text]
}

// -----------------------
// (u) COMPONENT: label number input
// -----------------------
function label_number_input(label, getter, setter) {
	return [
		".label-input",
		["span.label", label],
		() => hdom(["input", {
			value: getter,
			type: "number",
			oninput: (e) => {
				let value = parseInt(e.target.value)
				if (isNaN(value)) value = 0
				setter(value)
			}
		}])
	]
}

// -----------------------
// (c) COMPONENT: Editors
// -----------------------
/**@param {Student} student*/
let transition_editor = (student) => [
	".2d",
	label_number_input("ms: ",
		() => student.transition.ms,
		v => student.transition.ms = v),
]

/**@param {Student} student*/
let dimension_editor = (student) => [
	".2d",
	label_number_input("width: ",
		() => student.dimension.width,
		v => student.dimension.width = v),

	label_number_input("height: ",
		() => student.dimension.height,
		v => student.dimension.height = v),
]

/**@param {Student} student*/
let rotation_editor = (student) => [
	".2d",
	["h4", "rotation"],
	label_number_input("x: ", () => student.rotation.x, v => student.rotation.x = v),
	label_number_input("y: ", () => student.rotation.y, v => student.rotation.y = v),
	label_number_input("z: ", () => student.rotation.z, v => student.rotation.z = v),
]



// -----------------------
// COMPONENT: Main
// -----------------------
const Main = () => {
	let ref = e => {
		canvas_dom = e
		setInterval(x => autoscroll() ? e.scrollTop += 5 : null, 100)
		e.onscroll = x => scroll(e.scrollTop)
	}

	let name = mem(() => selected_student() ? selected_student()?.name : "")


	let toolbar = [
		".toolbar",
		option_btn(autoscroll, "autoscroll"),
		tool_btn("select"),
		tool_btn("scroll")
	]

	let canvas = [
		".canvas",
		{ ref },
		//	[".scroll", () => each(students, student_page)]
	]


	let layer = (student) => {
		let selected = mem(() => selected_student()?.slug == student.slug)

		let child_nodes = () => if_then([
			selected(),
			hdom([
				['p.layer', "name: ", student.name],
				['p.layer', "bio"],
				...student.images.map(b => ["p.layer", b.image?.filename])
			])
		])

		const seek_layer = () => {
			let index = students.findIndex((b) => b.slug == student.slug)
			seek(() => calc_z(index))
		}

		return hdom(
			["p.layer", {
				onclick: seek_layer,
				style: () => CSS.css({ "background-color": selected() ? "yellow" : "none" })
			},
				student.name,
				child_nodes
			])
	}

	let layers = [
		".layers",
		["h4", "Layers"],
		[".scroll", () => each(students, layer)]
	]

	// figure out how to store these in local storage
	let properties = [
		".properties",
		["h4", "Properties"],
		() => hdom(dimension_editor(selected_student())),
		() => hdom(rotation_editor(selected_student())),
		() => hdom(transition_editor(selected_student()))
	]

	let sidebar =
		[".sidebar",
			[".name", name],
			() => if_then(
				[
					selected_student(),
					hdom(properties)
				],
				[
					not(selected_student()),
					hdom(["p", "No Student Selected"])
				]
			),
			hdom(layers),
		]

	return hdom([
		//loader(),
		[".main",
			hdom(toolbar),
			hdom(canvas),
			hdom(sidebar)
		]
	])
}

render(Main, document.body)
