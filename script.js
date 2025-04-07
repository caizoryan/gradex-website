import { render, mut, sig, mem, eff_on, each, if_then } from "./solid/monke.js"
import { hdom } from "./solid/hdom/index.js"
import CSS from "./css/css.js"

import * as ArenaType from "./arena.js"
import * as Tapri from "./solid/monke.js"

let canvas_dom
let timeout = undefined

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
const mouse_x = sig(0)
const mouse_y = sig(0)
const autoscroll = sig(true)

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
			scroll_canvas(150)
			seek(value)
		} else {
			scroll_canvas(-150)
			seek(value)
		}
	}, 10)
}

/**@type {Array<ArenaType.Channel>}*/
const channels = mut([])

fetch("./data.json")
	.then((res) => res.json())
	.then(res => res.forEach((r) => channels.push(r)))

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
		slug: string,
		name: string,

		bio: string,
		links: string,
		images: ArenaType.Block[]
		videos: ArenaType.Block[]

	}} Student
 * @type {() => Student[]}*/
const students = mem(() => channels.reduce(
	/**@param {Student[]} students */
	(students, channel) => {
		// each channel is a student
		const name = channel.title
		const bio = channel.metadata.description
		const slug = channel.slug
		const website = channel.contents.find((block) => block.title == "Website" && block.class == "Link")
		const links = channel.contents.find((block) => block.title == "Links" && block.class == "Text")

		const images = channel.contents.reduce((acc, block) => {
			if (block.class == "Image") acc.push(block)
			return acc
		}, [])

		const videos = channel.contents.reduce((acc, block) => {
			if (block.class == "Attachment" && block.attachment.extension == "mp4") acc.push(block)
			return acc
		}, [])

		students.push({ name, images, bio, website, links, videos, slug })
		return students
	}, []))


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
let tool_btn = (name) => button(
	function() { toggle_tool(name) },
	{
		style: () => CSS.css({
			opacity: tool() == name ? 1 : .1
		})
	},
	name
)

/**
 * @param {string} name
 * @param {Tapri.Signal} signal
 * */
let option_btn = (signal, name) => button(
	function() { signal(!signal()) },
	{ style: () => CSS.css({ opacity: signal() ? 1 : .1 }) },
	name
)

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
		[".scroll", each(students, student_page)]
	]

	/**@param {Student} student*/
	let layer = (student) => {
		let selected = mem(() => selected_student()?.slug == student.slug)
		let children = hdom([
			['p.layer', "name: ", student.name],
			['p.layer', "bio"],
			...student.images.map(b => ["p.layer", b.image?.filename])
		])

		return hdom(["p.layer", {
			onclick: () => {
				let index = students().findIndex((b) => b.slug == student.slug)
				seek(() => calc_z(index))
			},
			style: () => CSS.css({ "background-color": selected() ? "yellow" : "none" })
		}, student.name,

			() => if_then([
				selected(),
				children
			])

		])

	}

	let layers = [
		".layers",
		["h4", "Layers"],
		[".scroll", each(students, layer)]
	]

	let sidebar =
		[".sidebar",
			[".name", name],
			layers,
			[".metadata",
				// ["p", 'modified: ', updated],
				// ["p", 'created: ', created],
			]
		]

	return hdom([
		loader(),
		[".main",
			toolbar,
			canvas,
			sidebar
		]
	])
}


/**@type {(val: number, min: number, max: number) => boolean}*/
let between = (val, min, max) => (val > min && val < max)
let calc_z = (index) => -scroll() + (index * 5000)

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

	let top = Math.random() * 50
	let left = Math.random() * 400

	let style = mem(() => {
		let x = ((mouse_x() / window.innerWidth) - .5) * (i() * 30)
		let y = ((mouse_y() / window.innerHeight) - .5) * (i() * 30)

		if (between(root_z(), -550, -100)) selected_student(student)

		let { css, px } = CSS
		return css({
			position: "fixed",
			left: px(left),
			top: px(top),
			"background-color": "#fff8",
			width: px(800),
			height: px(800),
			border: hover() ? "5px dotted black" : "none",
			opacity: opacity(),
			transform: "perspective(1000px) " + `translate3d(${x}px, ${y}px, ${root_z()}px)`,
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
