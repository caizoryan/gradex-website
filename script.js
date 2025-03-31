import { render, mut, html, sig, mem, eff_on, each } from "./solid/monke.js"
import { hdom } from "./solid/hdom/index.js"


import * as Types from "./arena.js"

/**@type {Array<Types.Channel>}*/
let data = mut([])

fetch("./data.json")
	.then((res) => res.json())
	.then(res => res.forEach((r) => data.push(r)))

eff_on(() => data, () => console.log(data))

const images = mem(() => {
	let imgs = []
	data.forEach((channel) => {
		channel.contents.forEach((block) => {
			block.parent = channel
			if (block.class == "Image") { imgs.push(block) }
		})
	})

	return imgs
})

/**@type {() => (Types.Block | null)}*/
let selected = sig(null)

let tool = sig("select")
let toggle_tool = (t) => {
	if (tool() == t) { tool("") }
	else { tool(t) }
}


let scroll = sig(0)
let mouse_x = sig(0)
let mouse_y = sig(0)

document.onmousemove = (e => {
	mouse_x(e.clientX)
	mouse_y(e.clientY)
})

document.body.onscroll = (event) => {
	console.log("SCROLLO")
	scroll(window.scrollY)
};

function random_rects(box_state) {
	let box = (e, i) => hdom([".box", {
		style: mem(() => `
			position: absolute;
			width: ${e.w}vw;
			height:${e.h}vh;
			top: ${e.y}vh;
			transform:
				translate(${mouse_x() / window.innerWidth * ((i() % 4) * 150)}px,
				${mouse_y() / window.innerHeight * ((i() % 4) * 150)}px);
			left: ${e.x}vw; `
		)
	}])

	return hdom([
		".rects",
		{ style: "position:fixed;top:0;left:0;z-index:100" },
		() => each(box_state, box),
		["h1", { style: "position:fixed;top:25vh;left:25vw;" }, "Work In Progress..."]])
}

let canvas_dom

let scroll_canvas = (value) => canvas_dom.scrollTop += value

let App = () => {

	const box_state = mut([]);
	for (let i = 0; i < 41; i++) {
		box_state.push(
			{ x: Math.random() * 25, y: Math.random() * 20 + i * 20, w: Math.random() * 20 + 30, h: 20, o: 0.2, c: "" },
		)

		setInterval(() => {
			box_state[i].x = Math.random() * 35
			box_state[i].y = Math.random() * i * 10
			box_state[i].w = Math.random() * 60 + 10
			box_state[i].h = Math.random() * 30 + 10
		}, (i + 1) * 400)
	}

	let name = mem(() => selected() ? selected().parent.title : "")
	let updated = mem(() => selected() ? selected().updated_at : "")
	let created = mem(() => selected() ? selected().created_at : "")
	let content_type = mem(() => selected() ? selected().image?.content_type : "")


	let ref = e => {
		canvas_dom = e
		setInterval(() => e.scrollTop += 5, 100)

		e.onscroll = (event) => {
			scroll(e.scrollTop)
		};
	}

	let blend_mode = sig("")
	let blend_modes = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "luminosity", "plus-darker", "plus-lighter"]
	let cur = 0
	setInterval(() => {
		cur++
		if (cur >= blend_modes.length) {
			cur = 0
		}
		blend_mode(blend_modes[cur])
	}, 1500)

	let btn = (click_fn, one, two) => {
		let atts = {
			onclick: click_fn
		}
		let text = two
		if (typeof one == "object") {
			Object.assign(atts, one)
		}
		else if (typeof one == "string") {
			text = one
		}

		return ["button", atts, text]
	}
	let tool_btn = (name) =>
		btn(
			() => toggle_tool(name),
			{ style: mem(() => `opacity: ${tool() == name ? 1 : .1}`) }
			, name)

	let loader = [
		".loader",
		{ style: () => "mix-blend-mode:" + blend_mode() + ";" },
		() => random_rects(box_state)
	]

	let toolbar = [
		".toolbar",
		tool_btn("select"),
		tool_btn("scroll")
	]

	let canvas = [
		".canvas",
		{ ref },
		[".scroll", () => each(images, image)]
	]

	let sidebar =
		[".sidebar",
			[".name", name],
			[".metadata",
				["p", 'modified: ', updated],
				["p", 'created: ', created],
				["p", 'content type: ', content_type]]
		]

	return hdom([

		loader,
		[".main",
			toolbar,
			canvas,
			sidebar
		]

	])
}


let timeout = undefined

function image(block, i) {
	let hover = sig(false)
	let top = Math.random() * window.innerHeight / 2 - window.innerHeight / 8
	let left = Math.random() * window.innerWidth / 2 - window.innerWidth / 8

	eff_on(hover, () => {
		if (hover()) selected(block)
		else selected(null)
	})

	let z = mem(() => -scroll() + (i() * 2000))

	let translate = mem(() => {
		let t = z()
		let o = 1

		if (t > -150) {
			o = (t * -1) / 150
		}

		let x = ((mouse_x() / window.innerWidth) - .5) * (i() * 30)
		let y = ((mouse_y() / window.innerHeight) - .5) * (i() * 30)

		if (t > -550 && t < -100) {
			selected(block)
		}

		return ` 
		${`border: ${hover() ? "5px dotted black;" : ";"}`}
		left: ${left}px;
		top: ${top}px;
		${tool() == "select" ? "" : "pointer-events: none;"}
		${(t > -150 ? "pointer-events: none;" : "")}
		opacity: ${o};
		transform: 
			perspective(1000px)
			translate3d(${x}px, ${y}px, ${t}px);
` })

	let seek = (value) => {
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

	return hdom([
		"img", {
			src: block.image.display.url,
			onmouseover: () => hover(true),
			onmouseleave: () => hover(false),
			onclick: () => seek(z),
			style: translate
		}])
}

/**
 * @template A
 * @typedef {[(arg1: A) => void, A]} Arg1
 **/

/**
 * @template A, B
 * @typedef {[(arg1: A, arg2: B) => void, A, B] } Arg2
 * */

/**
 * @template A, B
 * @param {(Arg1<A> | Arg2<A, B>)} arr */
function mapper(arr) { }

/**
 * @param {() => void} a 
 * */
function gen(a) { }

/**
 * @param {() => void} a 
 * @param {string} b 
 * */
function gen2(a, b) { }
mapper([gen2, () => { }, "string"])

render(App, document.body)
