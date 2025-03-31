import { h } from "../monke.js"

/**@param {any[]} arr */
export function hdom(arr) {
  let first = arr[0]
  if (typeof first == "function") return arr[0](...arr.slice(1))
  else return h(...arr.map(item => Array.isArray(item) ? hdom(item) : item))
}
