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
 * @type Tapri.Signal<Student> 
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
const rel_mouse_x = mem(() => mouse_x() / window.innerWidth)
const rel_mouse_y = mem(() => mouse_y() / window.innerHeight)


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

const images = mem(() => {
	return channels.reduce((acc, channel) => {
		acc.push(channel.contents.reduce((i_acc, block) => {
			if (block.class == "Image") {
				block.parent = channel
				i_acc.push(block)
			}
			return i_acc
		}, []))
		return acc
	}, []).flat()
})

/**
 * @typedef {{
 *	width: number,
 *	height: number
 * }} Dimension
 *
 * @typedef {{
 *	x: number,
 *	y: number,
 *	z: number
 * }} Rotation
 *
 * @typedef {{
 *	x: number,
 *	y: number
 * }} Transform
 *
 * @typedef {{
 *	ms: number,
 * }} Transition
 *
 * @typedef {{
		slug: string,
		name: string,

		dimension: Dimension,
		transform: Transform,
		rotation: Rotation,
		transition: Transition,

		website: ArenaType.Block,
		bio: string,
		links: string,
		images: ArenaType.Block[]
		videos: ArenaType.Block[]
	}} Student
 * @type {Student[]}*/
const students = mut([])

/**@param {ArenaType.Channel[]} channels */
function init_students(channels) {
	channels.reduce(
		/**@param {Student[]} students */
		(students, channel) => {
			// each channel is a student
			const name = channel.title
			const bio = channel.metadata.description
			const slug = channel.slug
			const website = channel.contents.find((block) => block.title == "Website" && block.class == "Link")
			const links = channel.contents.find((block) => block.title == "Links" && block.class == "Text")

			/**@type Dimension*/
			const dimension = { width: 800, height: 800 }

			/**@type Transform*/
			const transform = { x: 5, y: 5 }

			/**@type Rotation*/
			const rotation = { x: 0, y: 0, z: 0 }

			/**@type Transition*/
			const transition = { ms: 50 }

			const images = channel.contents.reduce((acc, block) => {
				if (block.class == "Image") acc.push(block)
				return acc
			}, [])

			const videos = channel.contents.reduce((acc, block) => {
				if (block.class == "Attachment" && block.attachment.extension == "mp4") acc.push(block)
				return acc
			}, [])

			students.push({
				name,
				images,
				bio,
				website,
				transition,
				links,
				videos,
				slug,
				dimension,
				transform,
				rotation
			})

			return students
		}, [])
		.forEach(s => students.push(s))
}

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
// COMPONENT: Loader
// -----------------------
function loader() {
	let blend_mode = sig("")
	let blend_modes = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "luminosity", "plus-darker", "plus-lighter"]
	let cur = 0

	setInterval(() => {
		if (cur++ >= blend_modes.length) cur = 0
		blend_mode(blend_modes[cur])
	}, 1500)

	let { css } = CSS
	let loader = [
		".loader",
		{ style: () => css({ "mix-blend-mode": blend_mode() }) },
		random_rects()
	]

	return loader
}

function random_rects() {
	let { vw, vh, css, px } = CSS

	let dims = (i) => ({
		x: Math.random() * 35,
		y: Math.random() * i * 10,
		w: Math.random() * 60 + 10,
		h: Math.random() * 30 + 10
	})

	const box_state = mut([]);

	for (let i = 0; i < 41; i++) {
		box_state.push(dims(i))
		setInterval(() => Object.assign(box_state[i], dims(i)), (i + 1) * 400)
	}

	let box = (e, i) => hdom([".box", {
		style: () => css({
			position: "absolute",
			width: vw(e.w),
			height: vh(e.h),
			top: vh(e.y),
			left: vw(e.x),
			transform: translate2D(px(mouse_x() / window.innerWidth * ((i() % 4) * 150)), px(mouse_y() / window.innerHeight * ((i() % 4) * 150)))
		})
	}])

	return [".rects",
		each(box_state, box),
		["h1", "Work In Progress..."]]
}


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
	// let updated = mem(() => selected_student() ? selected_student_block().updated_at : "")
	// let created = mem(() => selected_student() ? selected_student_block().created_at : "")


	let toolbar = [
		".toolbar",
		option_btn(autoscroll, "autoscroll"),
		tool_btn("select"),
		tool_btn("scroll")
	]

	let canvas = [
		".canvas",
		{ ref },
		//[".scroll", each(images, image)]
		[".scroll",
			() => students.map((s, i) => student_page(s, () => i))
		]
	]

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

	/**@param {Student} student*/
	let layer = (student) => {
		let selected = mem(() => selected_student()?.slug == student.slug)

		let children = [
			['p.layer', "name: ", student.name],
			['p.layer', "bio"],
			...student.images.map(b => ["p.layer", b.image?.filename])
		]

		return hdom(["p.layer", {
			onclick: () => {
				let index = students.findIndex((b) => b.slug == student.slug)
				seek(() => calc_z(index))
			},
			style: () => CSS.css({ "background-color": selected() ? "yellow" : "none" })
		}, student.name,

			() => if_then([
				selected(),
				hdom(children)
			])

		])
	}

	let layers = [
		".layers",
		["h4", "Layers"],
		[".scroll", each(students, layer)]
	]

	// figure out how to store these in local storage
	let properties = () => [
		".properties",
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
					hdom(properties())
				],
				[
					not(selected_student()),
					hdom(["p", "HEHEHEH"])
				]
			),
			layers,
			[".metadata",
				// ["p", 'modified: ', updated],
				// ["p", 'created: ', created],
			]
		]

	return hdom([
		//loader(),
		[".main",
			toolbar,
			hdom(canvas),
			sidebar
		]
	])
}



/**
 * @param {Student} student 
 * */
function student_page(student, i) {
	// State
	const hover = sig(false)

	eff_on(hover, () => {
		if (hover()) selected_student(student)
		else selected_student(null)
	})

	// will use I to get a position, based on that
	const root_z = mem(() => calc_z(i()))
	const opacity = mem(() => root_z() > -150 ? (root_z() * -1) / 150 : 1)

	let top = Math.random() * 10
	let left = Math.random() * 10

	let style = mem(() => {
		let x = student.transform.x + ((mouse_x() / window.innerWidth) - .5) * (i() * 30)
		let y = student.transform.x + ((mouse_y() / window.innerHeight) - .5) * (i() * 30)
		if (between(root_z(), -550, -100)) selected_student(student)

		let { css, px } = CSS
		return css({
			position: "fixed",
			left: px(left),
			top: px(top),
			"background-color": "#fff8",
			width: px(student.dimension.width),
			height: px(student.dimension.height),
			border: hover() ? "5px dotted black" : "none",
			opacity: opacity(),
			transition: `all ${student.transition.ms}ms`,
			transform: "perspective(1000px) " +
				`translate3d(${x}px, ${y}px, ${root_z()}px) 
					rotateX(${student.rotation.x}deg)
					rotateY(${student.rotation.y}deg)
					rotateZ(${student.rotation.z}deg)`,
			"pointer-events": root_z() > -150 ? "none" : tool() == "select" ? "" : "none",
		})
	})

	let img = (image, i) => {
		return hdom(["img", {
			style: () => CSS.css({
				transform: "perspective(1000px) " + `translate3d(0,0, ${i() * 50}px)`,
			}),
			src: image.image?.display?.url
		}
		])
	}

	return hdom([".student",
		{
			"root-z": root_z,
			style: style,
			onclick: () => seek(root_z),
			onmouseover: () => hover(true),
			onmouseleave: () => hover(false),
		},
		each(student.images, img)
	])

	// lay out images, bio, name and stuff.

}

render(Main, document.body)
