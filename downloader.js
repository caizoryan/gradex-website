import { auth } from "./auth.js"
import { Arena } from "./arena.js"

import fs from "fs"

let data = []
let list = []

let api = Arena({ auth })
// api.channel("x-students")
//   .get()
//   .then((channel) => {
//     channel.contents.forEach((c) => {
//       if (c.class == "Channel") { list.push(c.slug) }
//     })
//
//     run()
//   })

let communalslug = "x-communal-gallery-s1dov7xi7ns"
api.channel(communalslug)
  .get()
  .then((channel) => {
    fs.writeFileSync("./communal.json", JSON.stringify(channel, null, 2), { encoding: "utf8" })
  })

async function run() {
  for await (let channel of list.map((slug) => api.channel(slug).get())) {
    console.log("channel", channel.title)
    data.push(channel)
  }

  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2), { encoding: "utf8" })
}
