import { render, mut, sig, mem, eff_on, each, if_then } from "./solid/monke.js"
import { drag } from "./drag.js"
import { hdom } from "./solid/hdom/index.js"
import CSS from "./css/css.js"

import * as ArenaType from "./arena.js"
import * as chowk from "./solid/monke.js"

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
 * @type chowk.Signal<null> 
 * */
const selected_student = sig(null)

/**
 * @typedef {("select" | "scroll" | "none")} ToolName
 * @type chowk.Signal<ToolName>
 * */
const tool = sig("select")
const scroll = sig(0)
const autoopen = sig(true)
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
let formsdata

fetch("./formsdata.json")
	.then((res) => res.json())
	.then(res => formsdata = res)
	.then(() => {
		fetch("./data.json")
			.then((res) => res.json())
			.then(res => res.forEach((r) => channels.push(r)))
			.then(_ => init_students(channels))
	})


/**
 *
 * @type {Student[]}
 * */
const students = mut([])

function image(src) {

}

function text(content) {

}

/**@param {ArenaType.Channel[]} channels */
function init_students(channels) {
	channels.reduce(
		(students, channel) => {
			// each channel is a student
			const name = channel.title
			const bio = channel.metadata.description
			const slug = channel.slug

			let data = formsdata.find(e => e.preferred_name == name)

			const images = channel.contents.reduce((acc, block) => {
				if (block.class == "Image") acc.push(block)
				return acc
			}, [])

			const videos = channel.contents.reduce((acc, block) => {
				if (block.class == "Attachment" && block.attachment.extension == "mp4") acc.push(block)
				return acc
			}, [])

			students.push({ name, images, bio, videos, slug, ...data })

			return students
		}, [])
		.forEach(s => students.push(s))

	students.forEach((student) => {
		FS.add(Directory("~/students/" + student.preferred_name))
		student.images.forEach(e => {
			let filename = e.generated_title
			FS.add(File("~/students/" + student.preferred_name + "/" + filename, {
				type: "image", content: e.image.display.url
			}))
		})

		// FS.add(File("~/students/" + student.preferred_name + "/bio.txt", student.bio))
		// FS.add(File("~/students/" + student.preferred_name + "/website.webloc", student.website))
	})

	location("~/students")
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

/**
 * @type {{
 *	add: (content: Content) => void
 *	read: (location: string) => (Content[] | FileContent)
 * }}
 * */
const FS = (function() {
	/**@type {Map<string, Content>}*/
	let fs = new Map()
	let sanitize = location => {
		let split = location.split("/").filter(e => e != "")
		let sanitized = split.join("/") + "/"
		return sanitized
	}

	return {
		add: (content) => {
			// TODO: check if parents are already there if not add...
			content.location = sanitize(content.location)
			fs.set(content.location, content)
		},

		read: (location) => {
			let content = fs.get(sanitize(location))
			if (content.type == "file") return content.content

			else {
				let matcher = location.split("/")
				if (matcher[matcher.length - 1] == "") matcher.pop()
				let under = []

				fs.forEach((value, key) => {
					let tomatch = key.split("/")
					if (tomatch[tomatch.length - 1] == "") tomatch.pop()

					if (tomatch.length != matcher.length + 1) return

					let matched = matcher.reduce((acc, val, i) =>
						acc ?
							// if last was true check again
							tomatch[i] == val
								? true
								: false
							// if is false will be false
							: false

						// start with true
						, true)

					if (matched) under.push(value)
				})

				// return dir files
				return under
			}
		}
	}
})();

FS.add(Directory("~/"))
FS.add(Directory("~/students"))
FS.add(Directory("~/images"))
FS.add(Directory("~/about"))

/**
 * @typedef {("image" | "link" | "text")} FileType
 * @typedef {{type: FileType, content: any}} FileContent
 * @typedef {{
 *	id: number,
 *	rectangle: {x: number, y: number, w: number, h: number},
 *	file: FileContent,
 * }} Window
 * */

/**
 *
 * @param {string} location
 * @returns {Directory}
 * */
function Directory(location) {
	return { type: "dir", location }
}

// ~/ 
// ~/students
// ~/students/omama-mahmood

/**
 *
 * @param {string} location
 * @param {FileContent} content
 * @returns {File}
 * */
function File(location, content) {
	return { type: "file", location, content }
}

let location = sig("~/")
/**@type {() => Content[]}*/
let contents = mem(() => {
	let content = FS.read(location())
	if (Array.isArray(content)) {
		return content
	}
	else return []
})

eff_on(contents, () => {
	if (!autoopen()) return
	contents().forEach((item, i) => {
		console.log("item", item)
		if (item.type == "file") {
			setTimeout(() =>
				WindowManager.add(item.content),
				150 * i + 1
			)
		}
	})
})

// need a location manager and a vfs

// what should a file manager have
// be able to see folders
//
// list view
// column view
// gallery view

let goback = () => {
	if (location() == "~/") return
	let next = location()
		.split("/")
		.filter(e => e != "")
		.slice(0, -1)
		.join("/")

	if (next == "~") next = "~/"

	location(next)
}

// --------------------
// TOolbar
// --------------------
// View area
//
//
// --------------------


let filemanager = [
	".file-manager",
	[".toolbar",
		["button.back", { onclick: goback, }, "<"],
		["button", {
			onclick: () => autoopen(!autoopen()),
			style: mem(() => autoopen() ? "" : "opacity: .2;")
		}, "Auto Open"]
	],

	[".panes",
		[".scroll", () => each(contents, location_item)]
	]
]

const random_pos = () => {
	return {
		x: Math.random() * 55, y: Math.random() * 35,
		w: Math.random() * 15 + 35, h: 60
	}
}

const WindowManager = (function() {
	/**@type {Window[]}*/
	let windows = mut([])

	return {
		/**@param {FileContent} file*/
		add: (file) => {
			let found = windows.find(f => (f.file.type == file.type && f.file.content == file.content))
			if (found) return

			windows.push({
				id: Math.random() * 99999,
				rectangle: random_pos(),
				file
			})
		},
		remove: (id) => {
			let index = windows.findIndex(e => e.id == id)
			if (index != -1)
				windows.splice(index, 1)
		},

		render: () => each(() => windows, windowdom)

	}
})()

/**@param {Window} win */
function windowdom(win) {
	let style = mem(() => CSS.css({
		position: "fixed",
		left: CSS.vw(win.rectangle.x),
		top: CSS.vh(win.rectangle.y),
		width: CSS.vw(win.rectangle.w),
		height: CSS.vh(win.rectangle.h),
		background: "yellow"
	}))

	let ref = (e) => ref = e

	chowk.mounted(() => {
		drag(ref, {
			set_left: (x) => win.rectangle.x = (x / window.innerWidth) * 100,
			set_top: (y) => win.rectangle.y = (y / window.innerHeight) * 100
		})
	})

	if (win.file.type == "image") {
		return hdom(
			[".window",
				{ style, ref },
				[".bar",
					["button.close", { onclick: () => WindowManager.remove(win.id) }, "x"]
				],
				[".view-area",
					["img", { src: win.file.content }]
				]
			]
		)
	}

	else if (win.file.type == "link") {

	}

}

function location_item(item) {
	let click = () => {
		let content = FS.read(item.location)
		if (!Array.isArray(content)) {
			WindowManager.add(content)
		} else {
			location(item.location)
		}
	}

	let cleaned = item.location.replace(location(), "")

	return hdom([".location", { onclick: click }, ['p', cleaned]])
}

// -----------------------
// COMPONENT: Main
// -----------------------
const Main = () => {
	return hdom([
		[".main",
			hdom(filemanager),
			WindowManager.render
		]
	])
}

render(Main, document.body)


/**
 * @typedef {{
 *	index : string,
 *	start_time: string,
 *	completion_time :string,
 *	email :string,
 *	name :string,
 *	modified_time :string,
 *	preferred_name :string,
 *	pronouns :string,
 *	website :string,
 *	social_media :string,
 *	work_email :string,
 *	project_name :string,
 *	project_description :string,
 *	bio :string, 
 *	comments :string, 
 * }} SubmissionData
 *
 * @typedef {{
 *	name: string,
 *	slug: string,
 *	id: number,
 *	bio: string,
 *	images: Array<ArenaType.Block>,
 * } & SubmissionData} Student
 *
 * @typedef {{
 *	type: "file",
 *	location: string,
 *	content: FileContent
 * }} File
 *
 * @typedef {{type: "dir", location: string}} Directory
 * @typedef {(File | Directory)} Content
 * */
