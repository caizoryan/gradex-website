import { h } from "../monke.js"
// /**
//  * @typedef {() => any} Hdom
//  * */
//
//
// /**
//  * @template A
//  * @typedef {[(arg1: A) => Hdom, A]} Arg1
//  **/
//
// /**
//  * @template A, B
//  * @typedef {[(arg1: A, arg2: B) => Hdom, A, B]} Arg2
//  **/
//
// /**
//  * @template A, B, C
//  * @typedef {[(arg1: A, arg2: B, arg3: C) => Hdom, A, B, C]} Arg3
//  **/
//
// /**
//  * @typedef {T | CircularArray<T>} Circular
//  * @template T
//  */
// /**
//  * @typedef {Circular<T>[]} CircularArray
//  * @template T
//  */
//
// /**
//  * @typedef {[(string | any[]), ...*]} Hiccup
//  **/
//
// /**
//  * @template A, B, C
//  * @param {(Arg1<A>| Arg2<A, B>| Arg3<A, B, C> | Hiccup | Hiccup[])} arr 
//  * @returns {Hdom}
//  * */
//
export function hdom(arr) {
  if (typeof arr[0] == "function") return arr[0](...arr.slice(1))
  else return h(...arr.map(item => Array.isArray(item) ? hdom(item) : item))
}
