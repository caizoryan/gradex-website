// ------------
// UTILITIES
// ------------

/**
@template T
@param {string} auth 
@param {string} url 
@param {string | Object} body 
@returns {Promise<T>}
*/
function POST(url, body, auth) {
  let b = typeof body == "object" ? JSON.stringify(body) :
    typeof body == "string" ? body : console.error("body unexpected")
  if (!b) throw Error("no body")

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth}`,
      "Content-Type": "application/json",
      cache: "no-store",
      "Cache-Control": "max-age=0, no-cache",
      referrerPolicy: "no-referrer",
    },
    body: b
  }).then((res) => {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return res.json()
    } else {
      return res.ok
    }
  })
}

/**
@template T
@param {string} auth 
@param {string} url 
@returns {Promise<T>}
*/
async function GET(url, auth) {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${auth}`,
      cache: "no-store",
      "Cache-Control": "max-age=0, no-cache",
      referrerPolicy: "no-referrer",
    }
  }).then((res) => {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return res.json()
    } else {
      return res
    }
  })
}

/**
@template T
@param {string} auth 
@param {string} url 
@param {string | Object} body 
@returns {Promise<T>}
*/
function PUT(url, body, auth) {
  let b = typeof body == "object" ? JSON.stringify(body) :
    typeof body == "string" ? body : console.error("body unexpected")
  if (!b) throw Error("no body")

  console.log("body", b)
  console.log("url", url)

  return fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth}`,
      "Content-Type": "application/json",
      cache: "no-store",
      "Cache-Control": "max-age=0, no-cache",
      referrerPolicy: "no-referrer",
    },
    body: b
  })
    .then((res) => {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return res.json()
      } else {
        return res.ok
      }
    })
}

function DELETE(url, auth) {
  return fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    method: "DELETE",
  })
}


/**
* @typedef {Object} Options
* @property {string} auth
* @property {string} host

* @typedef {Object} MaybeOptions
* @property {string=} auth
* @property {string=} host

* @param {MaybeOptions=} opts 
*/
function Arena(opts) {
  let auth = opts?.auth ? opts.auth : ""
  let host = opts?.host ? opts.host : "https://api.are.na/v2/"

  return {
    me: async () => {
      if (!auth) {
        console.warn("No Auth")
        return
      }

      return await GET(host + "me", auth)
    },
    channel: (slug) => ({
      get: () => get_channel(slug, { auth, host }),
      create_block: (body) => create_block(slug, body, { auth, host }),
      disconnect_block: (id) => disconnect_block(slug, id, { auth, host }),
      hack_refresh: () => hack_refresh(slug, { auth, host })
    }),

    block: (slug) => ({
      get: () => get_block(slug, { auth, host }),
      update: (body) => update_block(slug, body, { auth, host }),
    })
  }
}

export { Arena }


/**
* @param {String} slug 
* @param {Options} opts 
* @returns {Promise<Channel>}
*/
async function get_channel(slug, opts) {
  return await GET(opts.host
    + "channels/"
    + slug
    + "?per=100"
    , opts.auth
  )
}

async function hack_refresh(slug, opts) {
  return create_block(slug, { content: "TBR" }, opts)
    .then((res) => disconnect_block(slug, res.id, opts))
}

/**
* @typedef {("Image" | "Link" | "Text" | "Media" | "Attachment")} Class
* @typedef {{
* id: number,
* title: string,
* created_at: Date,
* updated_at: Date
* published: boolean,
* open: boolean,
* collaboration: boolean,
* slug: string,
* length: number,
* kind: string,
* status: string,
* user_id: number,
* class: Class ,
* base_class: string,
* user: User,
* total_pages: number,
* current_page: number,
* per: number,
* follower_count: number,
* contents: (Block | Channel)[],
* metadata: {description: string}
* }} Channel 
* 
*/



/**
* @param {(string | number)} slug 
* @param {Options} opts 
* @returns {Promise<Block>}
*/
async function get_block(slug, opts) {
  return await
    GET(opts.host
      + "blocks/"
      + slug, opts.auth)
}


/**
* @typedef {{
*   content: string,
*   source?: string,
* }} CreateBlockRequest
* @param {(string | number)} channel_slug 
* @param {CreateBlockRequest} request_data 
* @param {Options} opts 
* @returns {Promise<Block>}
*/
async function create_block(channel_slug, request_data, opts) {
  return await POST(opts.host
    + "channels/"
    + channel_slug
    + "/blocks"
    , request_data
    , opts.auth
  )
}

/**
* @typedef {{
   content?: string,
   title?: string,
   description?: string,
}} UpdateBlockRequest
* @param {number} id 
* @param {UpdateBlockRequest} request_data 
* @param {Options} opts 
* @returns {Promise<Block>}
*/
async function update_block(id, request_data, opts) {
  return await PUT(opts.host
    + "blocks/"
    + id
    , request_data
    , opts.auth
  )
}

/**
* @param {number} id 
* @param {Options} opts 
*/
async function disconnect_block(channel_slug, id, opts) {
  console.log("disconnecting from", channel_slug, "block", id)
  return DELETE(opts.host
    + "channels/"
    + channel_slug
    + "/blocks/"
    + id
    , opts.auth
  )
}

/**
* @typedef {{
  id: number,
  title: string | null,
  updated_at: Date,
  created_at: Date,
  state: "Available" | "Failure" | "Procesed" | "Processing",
  comment_count: number,
  generated_title: string,
  class: "Image" | "Text" | "Link" | "Media" | "Attachment",
  base_class: "Block",
  content: string | null,
  content_html: string | null,
  description: string | null,
  description_html: string | null,
  source: null | { title?: string; url: string; provider: { name: string; url: string; } | null; },
  image: null | { content_type: string; display: { url: string }; filename: string; lage: { url: string }, original: { file_size: number; file_size_display: string; url: string; }; square: { url: string }; thumb: { url: string }; updated_at: Date; },
}} Block
*/




























































































