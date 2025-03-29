import { render, mut, html, sig, mem, eff_on } from "./solid/monke.js"
import * as Types from "./arena.js"

/**@type {Array<Types.Channel>}*/
let data = mut([])

fetch("./data.json")
	.then((res) => res.json())
	.then(res => res.forEach((r) => data.push(r)))

eff_on(() => data, () => console.log(data))

let images = mem(() => {
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

let tool = sig("")
let toggle_tool = (t) => {
	if (tool() == t) { tool.set("") }
	else { tool.set(t) }
}


let App = () => {
	const box_state = mut([]);

	for (let i = 0; i < 12; i++) {
		box_state.push(
			{ x: Math.random() * 25, y: Math.random() * 20 + i * 20, w: Math.random() * 20 + 30, h: 20, o: 0.2, c: "" },
		)

		setInterval(() => {
			box_state[i].x = Math.random() * 35
			box_state[i].y = Math.random() * i * 20
			box_state[i].w = Math.random() * 60 + 10
			box_state[i].h = Math.random() * 30 + 10
		}, (i + 1) * 400)
	}

	let name = mem(() => selected() ? selected().parent.title : "")
	let updated = mem(() => selected() ? selected().updated_at : "")
	let created = mem(() => selected() ? selected().created_at : "")
	let content_type = mem(() => selected() ? selected().image?.content_type : "")

	let random_rects = () => {
		return html` 
			.rects [style=position:fixed;top:0;left:0;z-index:100]

				each of ${box_state} as ${(e) => html`
					.box [
						style=${() => `
							position: absolute;
							width: ${e.w}vw;
							height:${e.h}vh;
							top: ${e.y}vh;
							left: ${e.x}vw;`}]
				`}

				h1 [style=position:fixed;top:25vh;left:25vw;] -- Work In Progress...
			`
	}

	let ref = e => {
		setInterval(() => e.scrollTop += 5, 100)

		e.onscroll = (event) => {
			scroll.set(e.scrollTop)
		};
	}

	return html`
		.loader -- ${random_rects}
		.main
			.toolbar
				button [onclick=${() => toggle_tool("select")}] -- x
			.canvas [ref=${ref}]
				.scroll
					each of ${images} as ${image}  
			.sidebar 
				.name -- ${name}
				.metadata
					p -- modified: ${updated}
					p -- created: ${created}
					p -- content type: ${content_type}`
}

let scroll = sig(0)

let mouse_x = sig(0)
let mouse_y = sig(0)

document.onmousemove = (e => {
	mouse_x.set(e.clientX)
	mouse_y.set(e.clientY)
})

document.body.onscroll = (event) => {
	console.log("SCROLLO")
	scroll.set(window.scrollY)
};

function image(block, i) {
	let hover = sig(false)
	let top = Math.random() * window.innerHeight / 2 - window.innerHeight / 8
	let left = Math.random() * window.innerWidth / 2 - window.innerWidth / 8

	eff_on(hover, () => {
		if (hover()) selected.set(block)
		else selected.set(null)
	})

	let translate = mem(() => {
		let t = -scroll() + (i() * 2000)
		let o = 1

		if (t > -150) {
			o = (t * -1) / 150
		}

		let x = ((mouse_x() / window.innerWidth) - .5) * (i() * 30)
		let y = ((mouse_y() / window.innerHeight) - .5) * (i() * 30)

		if (t > -550 && t < -100) {
			selected.set(block)
		}

		return ` 
		position: fixed;
		padding: 1em;
		${`border: ${hover() ? "1px solid black;" : ";"}`}
		left: ${left}px;
		top: ${top}px;
		${tool() == "select" ? "" : "pointer-events: none;"}
		${(t > -150 ? "pointer-events: none;" : "")}
		width: 600px;
		opacity: ${o};
		transform: 
			perspective(1000px)
			translate3d(${x}px, ${y}px, ${t}px);
`
	})


	return html`
		img [src=${block.image.display.url} 
		onmouseover=${() => hover.set(true)}
		onmouseleave=${() => hover.set(false)}
		style=${translate}]
	`
}

render(App, document.body)
