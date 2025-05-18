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
let communal = mut([])

fetch("./newdata.json")
	.then((res) => res.json())
	.then(res => formsdata = res)
	.then(() => {

		fetch("./communal.json")
			.then((res) => res.json())
			.then(res => {
				console.log(res)
				res.contents.forEach((r) => { communal.push(r); console.log(r) }
				)
			})

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
	console.log("channels", channels)
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

setTimeout(() => eff_on(location, () => {
	LOG.add_log("Accessed:", location())
}), 10)

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
	else {
		if (!list()) grid(true)
	}
})

eff_on(list, () => {
	if (list()) {
		grid(false)
		view("list")
	}

	else {
		if (!grid()) list(true)
	}
})


let filemanager = () => {
	let rectangle = mut({
		x: 24.5,
		y: 6,
		w: 60,
		h: 80
	})

	let z = sig(0)
	let animation = sig(false)
	let style = mem(() => CSS.css({
		position: "fixed",
		left: CSS.vw(rectangle.x),
		top: CSS.vh(rectangle.y),
		width: CSS.vw(rectangle.w),
		height: CSS.vh(rectangle.h),
		"z-index": z(),
		transition: animation() ? "all 300ms" : "none",
	}))

	let ref = (e) => ref = e

	chowk.mounted(() => {
		drag(ref, {
			onstart: (e) => {
				zindex++
				z(zindex)
				LOG.add_log("[EVENT] mouse_down", "📁 File Manager")
			},
			set_left: (x) => rectangle.x = (x / window.innerWidth) * 100,
			set_top: (y) => rectangle.y = (y / window.innerHeight) * 100
		})
	})

	const close = () => {
		rectangle.y = Math.random() > .5 ? -100 : 100
		rectangle.x = Math.random() > .5 ? -100 : 100
		setTimeout(() => {
			animation(true)
			rectangle.y = Math.random() * 40
			rectangle.x = Math.random() * 40
			setTimeout(() => { animation(false) }, 300)
		}, 500)
	}

	return hdom([
		".file-manager.main-dawg", { ref, style: style },
		[".bar",
			["button.close", { onclick: close }, "x"],
			["h4.title", "File Manager"],
		],
		[".toolbar",
			// front back
			["button.back.border", { onclick: goback, }, "←"],

			// auto open
			togglebtn(grid, "grid"),
			togglebtn(list, "list"),
			//togglebtn(autoopen, "autopen")
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
				LOG.add_log("[EVENT] mouse_down", "Logo")
			},
			set_left: (x) => rectangle.x = (x / window.innerWidth) * 100,
			set_top: (y) => rectangle.y = (y / window.innerHeight) * 100
		})
	})

	return hdom([
		".file-manager", { ref, style: style },
		[".toolbar", "./assets/gradex_logo.mp4"],
		[".view-area.centered",
			["video.logo", { loop: true, autoplay: true, muted: true, src: "./assets/logo.mp4" }],
		]
	])
}

let communal_gallery = () => {
	let rectangle = mut({
		x: 4.5,
		y: 42,
		w: 22,
		h: 52
	})
	let animation = sig(false)

	let z = sig(2)
	let style = mem(() => CSS.css({
		position: "fixed",
		left: CSS.vw(rectangle.x),
		top: CSS.vh(rectangle.y),
		width: CSS.vw(rectangle.w),
		height: CSS.vh(rectangle.h),
		transition: animation() ? "all 300ms" : "none",
		"z-index": z(),
	}))

	const close = () => {
		rectangle.y = Math.random() > .5 ? -100 : 100
		rectangle.x = Math.random() > .5 ? -100 : 100
		setTimeout(() => {
			animation(true)
			rectangle.y = Math.random() * 40
			rectangle.x = Math.random() * 40
			setTimeout(() => { animation(false) }, 300)
		}, 500)
	}

	let ref = (e) => ref = e

	chowk.mounted(() => {
		drag(ref, {
			onstart: (e) => {
				zindex++
				z(zindex)
				LOG.add_log("[EVENT] mouse_down", "<3 Communal Gallery")
			},
			set_left: (x) => rectangle.x = (x / window.innerWidth) * 100,
			set_top: (y) => rectangle.y = (y / window.innerHeight) * 100
		})
	})

	const communalimages = mem(() => communal
		.reduce((acc, block) => {
			if (block.class == "Image") acc.push(block)
			return acc
		}, [])
	)

	return hdom([
		".file-manager.behind", { ref, style: style },
		[".bar",
			["button.close", { onclick: close }, "x"],
			["h4.title", "./communal_gallery"]],
		[".feed-area.scroll",
			each(communalimages, (b) => hdom(
				[".view-box",
					["img", {
						onclick: () => {
							WindowManager.add({
								type: "image",
								content: b.image.display.url
							}, b.title)

						},
						src: b.image.display.url
					}]
				]
			))
		]
	])
}

let LOG = (function() {
	let logs = mut([])

	return {
		add_log: (type, subtitle) => {
			logs.push({ type, subtitle, time: new Date() })
			setTimeout(() => {
				document.querySelector(".logger-area")?.scrollTo(0, 99999);
			}, 10)
		},
		logs,
	}
})()

let activitylog = () => {
	let rectangle = mut({
		x: 80.5,
		y: 72,
		w: 28,
		h: 24
	})

	let z = sig(0)
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
				LOG.add_log("[EVENT] mouse_down", "LOG")
			},
			set_left: (x) => rectangle.x = (x / window.innerWidth) * 100,
			set_top: (y) => rectangle.y = (y / window.innerHeight) * 100
		})
	})

	return hdom([
		".file-manager", { ref, style: style },
		[".toolbar", "LOG"],
		[".logger-area.scroll",
			each(() => LOG.logs,
				(el) => hdom(["p", ["span.type", el.type], ["span.subtitle", " > ", el.subtitle]]))
		]
	])
}

let toolbox = () => {
	let rectangle = mut({
		x: 5.5,
		y: 90,
		w: 40,
		h: 5
	})

	let animation = sig(true)
	let style = mem(() => CSS.css({
		position: "fixed",
		left: CSS.vw(rectangle.x),
		top: CSS.vh(rectangle.y),
		// width: CSS.vw(rectangle.w),
		// height: CSS.vh(rectangle.h),
		transition: animation() ? "all 300ms" : "none",
	}))

	eff_on(WindowManager.open, () => {
		console.log("running")
		if (WindowManager.open()) {
			rectangle.y = 90
		}
		else {
			rectangle.y = 150
		}
	})

	let ref = (e) => ref = e

	chowk.mounted(() => {
		drag(ref, {
			onstart: () => {
				animation(false)
			}, onend: () => { animation(true) },

			set_left: (x) => rectangle.x = (x / window.innerWidth) * 100,
			set_top: (y) => rectangle.y = (y / window.innerHeight) * 100
		})
	})

	return hdom(
		[".window-toolbox", { style: style, ref },
			["button", { onclick: WindowManager.horizontal }, "organize"],
			["button", { onclick: WindowManager.shuffle }, "shuffle"],
			["button", { onclick: WindowManager.close_all }, "close all"],
			["button", { onclick: () => WindowManager.shiftx(window.innerWidth / 3) }, "←"],
			["button", { onclick: () => WindowManager.shiftx(-window.innerWidth / 3) }, "→"],
		]
	)
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
	let open = mem(() => {
		let count = 0;
		windows.forEach((e) => {
			count++
		})

		if (count == 0) return false
		return true

	})

	const shuffle = () => {
		LOG.add_log("[CMD] Organize", "Shuffle")
		windows.forEach((w) => {
			w.rectangle.x = Math.random() * (window.innerWidth - w.rectangle.w)
			w.rectangle.y = Math.random() * (window.innerHeight - w.rectangle.h)
		})
	}

	const horizontal = () => {
		LOG.add_log("[CMD] Organize", "Horizontally")
		let xpos = 100
		windows.forEach((w) => {
			w.rectangle.x = xpos
			w.rectangle.y = Math.random() * ((window.innerHeight - w.rectangle.h) / 2) + 150
			xpos += w.rectangle.w + 25
		})
	}

	const shiftx = (num) => {
		LOG.add_log("[CMD] Shift", "by :: " + num)
		windows.forEach((w) => w.animation = true)
		setTimeout(() => windows.forEach((w) => w.animation = false), 550)
		setTimeout(() => windows.forEach((w) => {
			// if webseit ignore
			//if (w.file.type == "link") return
			w.rectangle.x += num
		}), 50)
	}

	const close_all = () => {
		LOG.add_log("[CMD] Close", "All Windows")
		let link = windows.find((e) => e.file.type == "link")
		if (link) WindowManager.remove(link.id)
		windows
			.forEach((window, i) => {
				setTimeout(() => WindowManager.remove(window.id), 75 * i + 1)
			})
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

			rectangle.x = Math.random() * (window.innerWidth - rectangle.w)
			rectangle.y = Math.random() * (window.innerHeight - rectangle.h)

			LOG.add_log("[CMD] Open", "Window :: " + title)
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
			LOG.add_log("[CMD] Close", " Window :: " + windows[index].title)
			if (index != -1)
				windows.splice(index, 1)
		},
		shuffle, horizontal, shiftx, close_all, open,

		render: () => each(() => windows, windowdom)
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
			if (!found) setTimeout(() => WindowManager.remove(window.id), 105 * i + 1)
		})

	contents().forEach((item, i) => {
		if (item.type == "file") {
			setTimeout(() =>
				WindowManager.add(item.content, item.location.replace(location(), "")),
				105 * i + 1)
		}
	})
})

/**@param {Window} win */
function windowdom(win) {
	let z = sig(++zindex)
	let animation = sig(true)
	let old = {
		x: win.rectangle.x,
		y: win.rectangle.y,
		w: win.rectangle.w,
		h: win.rectangle.h
	}
	let full = sig(false)

	eff_on(full, () => {
		if (full()) {
			old = {
				x: win.rectangle.x,
				y: win.rectangle.y,
				w: win.rectangle.w,
				h: win.rectangle.h
			}

			win.rectangle.x = 10
			win.rectangle.y = 10
			win.rectangle.w = window.innerWidth - 30
			win.rectangle.h = window.innerHeight - 30
		}

		else {
			win.rectangle.x = old.x
			win.rectangle.y = old.y
			win.rectangle.w = old.w
			win.rectangle.h = old.h
		}
	})

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
				LOG.add_log("[Event] mouse_down", win.title)
			},
			onend: (e) => {
				animation(true)
				LOG.add_log("[Event] mouse_up", win.title)
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
				["button.maximize", { onclick: () => full(!full()) }, mem(() => full() ? "⇲" : "⇔")],
				["h4.title", win.title],
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
		[".main", activitylog, filemanager, WindowManager.render, logo, communal_gallery, toolbox, ,
			[".constraint", "Hey! Sorry this website was not built for this screen size, if possible try to view it on a bigger screen."]
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
