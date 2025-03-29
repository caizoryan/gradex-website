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
* @typedef {Object} Channel 
* @property {number} id
* @property {string} title
* @property {Date} created_at
* @property {Date} updated_at
* @property {boolean} published
* @property {boolean} open
* @property {boolean} collaboration
* @property {string} slug
* @property {number} length
* @property {string} kind
* @property {string} status
* @property {number} user_id
* @property {string} class
* @property {string} base_class
* @property {User} user
* @property {number} total_pages
* @property {number} current_page
* @property {number} per
* @property {number} follower_count
* @property {(Block | Channel)[]} contents
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
* @typedef {Object} CreateBlockRequest
* @property {string} content
* @property {string=} source
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
* @typedef {Object} UpdateBlockRequest
* @property {string=} content
* @property {string=} title
* @property {string=} description
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
* @typedef {Object} Block
  @property {number} id
  @property {string | null} title
  @property {Date} updated_at
  @property {Date} created_at
  @property {"Available" | "Failure" | "Procesed" | "Processing"} state
  @property {number} comment_count
  @property {string} generated_title
  @property {"Image" | "Text" | "Link" | "Media" | "Attachment"} class
  @property {"Block"} base_class
  @property {string | null} content
  @property {string | null} content_html
  @property {string | null} description
  @property {string | null} description_html
  @property {null | { title?: string; url: string; provider: { name: string; url: string; } | null; }} source
  @property {null | { content_type: string; display: { url: string }; filename: string; lage: { url: string }, original: { file_size: number; file_size_display: string; url: string; }; square: { url: string }; thumb: { url: string }; updated_at: Date; }} image
*/




























































































