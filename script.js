import { render, mut, sig, mem, eff_on, each, if_then } from "./solid/monke.js"
import { drag } from "./drag.js"
import { hdom } from "./solid/hdom/index.js"
import CSS from "./css/css.js"

import * as ArenaType from "./arena.js"
import * as chowk from "./solid/monke.js"

let canvas_dom
let timeout = undefined
let zindex = 2

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

const view = sig("grid")
const scroll = sig(0)
const autoopen = sig(true)
const mouse_x = sig(0)
const mouse_y = sig(0)


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

		student.videos.forEach(e => {
			let filename = e.generated_title
			FS.add(File("~/students/" + student.preferred_name + "/" + filename, {
				type: "video", content: e.attachment.url
			}))
		})

		FS.add(File("~/students/" + student.preferred_name + "/bio.txt", { type: "text", content: student.bio }))
		FS.add(File("~/students/" + student.preferred_name + "/work_description.txt", { type: "text", content: student.project_description }))
		if (student.website !== "") FS.add(File("~/students/" + student.preferred_name + "/website.webloc", { type: "link", content: student.website }))
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
 * @typedef {("image" | "link" | "text" | "video")} FileType
 * @typedef {{type: FileType, content: any}} FileContent
 * @typedef {{
 *	id: number,
 *	rectangle: {x: number, y: number, w: number, h: number},
 *	animation: boolean,
 *	title: string,
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

let togglebtn = (signal, name) => ["button", { onclick: () => signal(!signal()), style: mem(() => signal() ? "" : "opacity: .2;") }, name]
let grid = sig(true)
let list = sig(false)

eff_on(grid, () => {
	if (grid()) {
		list(false)
		view("grid")
	}
})

eff_on(list, () => {
	if (list()) {
		grid(false)
		view("list")
	}
})


let filemanager = () => {
	let rectangle = mut({
		x: 24.5,
		y: 6,
		w: 60,
		h: 80
	})

	let style = mem(() => CSS.css({
		position: "fixed",
		left: CSS.vw(rectangle.x),
		top: CSS.vh(rectangle.y),
		width: CSS.vw(rectangle.w),
		height: CSS.vh(rectangle.h),
	}))

	let ref = (e) => ref = e

	chowk.mounted(() => {
		drag(ref, {
			set_left: (x) => rectangle.x = (x / window.innerWidth) * 100,
			set_top: (y) => rectangle.y = (y / window.innerHeight) * 100
		})
	})

	return hdom([
		".file-manager", { ref, style: style },
		[".toolbar",
			// front back
			["button.back", { onclick: goback, }, "<"],
			["button.back", { onclick: goback, }, ">"],

			// auto open
			togglebtn(grid, "grid"),
			togglebtn(list, "list"),
			togglebtn(autoopen, "autopen")
		],

		[".pane", { view: view }, each(contents, location_item)]
	])
}

let logo = () => {
	let rectangle = mut({
		x: 4.5,
		y: 6,
		w: 18,
		h: 32
	})


	let z = sig(2)
	let style = mem(() => CSS.css({
		position: "fixed",
		left: CSS.vw(rectangle.x),
		top: CSS.vh(rectangle.y),
		width: CSS.vw(rectangle.w),
		height: CSS.vh(rectangle.h),
		"z-index": z(),
	}))

	let ref = (e) => ref = e

	chowk.mounted(() => {
		drag(ref, {
			onstart: (e) => {
				zindex++
				z(zindex)
			},
			set_left: (x) => rectangle.x = (x / window.innerWidth) * 100,
			set_top: (y) => rectangle.y = (y / window.innerHeight) * 100
		})
	})

	return hdom([
		".file-manager", { ref, style: style },
		[".toolbar", "./assets/gradex_logo.mp4"],
		[".view-area.centered",
			["video.logo", { autoplay: true, muted: true, src: "./assets/logo.mp4" }],
		]
	])
}

let communal_gallery = () => {
	let rectangle = mut({
		x: 4.5,
		y: 42,
		w: 18,
		h: 44
	})

	let z = sig(2)
	let style = mem(() => CSS.css({
		position: "fixed",
		left: CSS.vw(rectangle.x),
		top: CSS.vh(rectangle.y),
		width: CSS.vw(rectangle.w),
		height: CSS.vh(rectangle.h),
		"z-index": z(),
	}))

	let ref = (e) => ref = e

	chowk.mounted(() => {
		drag(ref, {
			onstart: (e) => {
				zindex++
				z(zindex)
			},
			set_left: (x) => rectangle.x = (x / window.innerWidth) * 100,
			set_top: (y) => rectangle.y = (y / window.innerHeight) * 100
		})
	})

	return hdom([
		".file-manager.behind", { ref, style: style },
		[".toolbar", "./communal_gallery"],
		[".view-area"]
	])
}


//togglebtn(autoopen, "Auto Open"),

const random_pos = (i) => {
	return {
		x: window.innerWidth * (.3 + i / 100),
		y: window.innerHeight * (.20 + i / 100),
		w: window.innerWidth * .40,
		h: window.innerHeight * .60
	}
}

const WindowManager = (function() {
	/**@type {Window[]}*/
	let windows = mut([])

	const shuffle = () => {
		windows.forEach((w) => {
			w.rectangle.x = Math.random() * (window.innerWidth - w.rectangle.w)
			w.rectangle.y = Math.random() * (window.innerHeight - w.rectangle.h)
		})
	}

	const horizontal = () => {
		let xpos = 100
		windows.forEach((w) => {
			w.rectangle.x = xpos
			w.rectangle.y = Math.random() * ((window.innerHeight - w.rectangle.h) / 2) + 150
			xpos += w.rectangle.w + 25
		})
	}

	const shiftx = (num) => {
		windows.forEach((w) => w.animation = true)
		setTimeout(() => windows.forEach((w) => w.animation = false), 550)
		setTimeout(() => windows.forEach((w) => {
			// if webseit ignore
			//if (w.file.type == "link") return
			w.rectangle.x += num
		}), 50)
	}


	return {
		/**
		 * @param {FileContent} file
		 * @param {string} title
		 * */
		add: (file, title) => {
			let found = windows.find(f => (f.file.type == file.type && f.file.content == file.content))
			if (found) return

			let rectangle = random_pos(Math.random() * 20)
			if (file.type == "text") rectangle.w = window.innerWidth * .30
			if (file.type == "link") rectangle.w = window.innerWidth * .50
			if (file.type == "image" && title.includes("headshot")) {
				rectangle.w = window.innerWidth * .20
				rectangle.h = window.innerHeight * .40
			}

			windows.push({
				id: Math.random() * 99999,
				rectangle,
				animation: false,
				title,
				file
			})
		},

		windows: () => windows,

		isopen: (file) => {
			let found = windows.find(f => (f.file.type == file.type && f.file.content == file.content))
			if (found) return true
			else return false
		},
		remove: (id) => {
			let index = windows.findIndex(e => e.id == id)
			if (index != -1)
				windows.splice(index, 1)
		},

		render: () => {
			return hdom([
				[".window-toolbox",
					["button", { onclick: shuffle }, "shuffle"],
					["button", { onclick: horizontal }, "horizontal"],
					["button", { onclick: () => shiftx(window.innerWidth / 3) }, "<"],
					["button", { onclick: () => shiftx(-window.innerWidth / 3) }, ">"],
				],
				// a btn thatll arrange them
				each(() => windows, windowdom)
			])
		}
	}
})()

eff_on(contents, () => {
	if (!autoopen()) return
	let fileeq = (file1, file2) => (file2.type == file1.type && file2.content == file1.content)

	// remove website first
	let website = WindowManager.windows().find(e => e.file.type == "link")
	if (website) {
		let found = contents().find(e => fileeq(e, website.file))
		if (!found) WindowManager.remove(website.id)
	}

	// remove rest
	WindowManager
		.windows()
		.forEach((window, i) => {
			let found = contents().find((file) => fileeq(file, window.file))
			if (!found) setTimeout(() => WindowManager.remove(window.id), 10 * i + 1)
		})

	contents().forEach((item, i) => {
		if (item.type == "file") {
			setTimeout(() =>
				WindowManager.add(item.content, item.location.replace(location(), "")),
				15 * i + 1)
		}
	})
})

/**@param {Window} win */
function windowdom(win) {
	let z = sig(3)
	let animation = sig(true)

	let style = mem(() => CSS.css({
		position: "fixed",
		left: win.rectangle.x + "px",
		top: win.rectangle.y + "px",
		width: win.rectangle.w + "px",
		height: win.rectangle.h + "px",
		transition: animation() ? "all 300ms" : "none",
		"z-index": z()
	}))

	let ref = (e) => ref = e

	chowk.mounted(() => {
		drag(ref, {
			onstart: (e) => {
				zindex++
				z(zindex)
				animation(false)
			},
			onend: (e) => {
				animation(true)
			},
			set_left: (x) => win.rectangle.x = x,
			set_top: (y) => win.rectangle.y = y
		})
	})

	let viewer = file => {
		switch (file.type) {
			case "image":
				return [".view-area.centered", ["img", { src: file.content }]]

			case "text":
				return [".view-area.scroll",
					file.content.split(`\n`).map(e => ["p", e])
				]

			case "video":
				return [".view-area.centered", ["video", { controls: true, src: file.content }]]

			case "link":
				return ["iframe", {
					src: file.content,
					width: "100%",
					height: "100%"
				}]
			default:
				return ["p", "unkown filetype"]
		}
	}

	return hdom(
		[".window",
			{ style, ref },
			[".bar",
				["button.close", { onclick: () => WindowManager.remove(win.id) }, "x"],
				["h4.title", win.title]
			],

			viewer(win.file)

		]
	)

}

/**@param {Content} item */
function location_item(item) {
	let click = () => {
		let content = FS.read(item.location)
		if (!Array.isArray(content)) {
			WindowManager.add(content, item.location.replace(location(), ""))
		} else {
			location(item.location)
		}
	}

	let cleaned = item.location.replace(location(), "").replace("/", "")

	let icon = () => {
		if (item.type == "file") {
			if (item.content.type == "image") return ["img.icon", { src: item.content.content }]
			return ["img.icon", { src: "./assets/file.png" }]
		}
		else return ["img.icon", { src: "./assets/folder.png" }]
	}

	return hdom([
		".location",
		{ onclick: click },
		icon(),
		['p', cleaned]
	])
}

// -----------------------
// COMPONENT: Main
// -----------------------
const Main = () => {
	return hdom([
		[".main", filemanager, WindowManager.render, logo, communal_gallery]
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
