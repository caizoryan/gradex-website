import { auth } from "./auth.js"
import { Arena } from "./arena.js"

import fs from "fs"

let data = []
let list = []

let api = Arena({ auth })
api.channel("templist")
  .get()
  .then((channel) => {

    channel.contents.forEach((c) => {
      if (c.class == "Channel") {
        list.push(c.slug)
      }
    })

    run()

  })


async function run() {
  for await (let channel of list.map((slug) => api.channel(slug).get())) {
    data.push(channel)
  }

  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2), { encoding: "utf8" })
}
