"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reactivity_1 = require("@vue/reactivity");
const timing_1 = require("fpts/timing");
function record_map(f, xs) {
    return Object.fromEntries(Object.entries(xs).map(x => [x[0], f(x[1])]));
}
function safe_json_parse(x) {
    try {
        return JSON.parse(x);
    }
    catch (e) {
        return undefined;
    }
}
function make_storage(t = 5000) {
    const target = record_map(safe_json_parse, localStorage);
    const dirty = new Set();
    function update_now() {
        for (const x of dirty)
            if (target.hasOwnProperty(x))
                localStorage.setItem(x, JSON.stringify(target[x]));
            else
                localStorage.removeItem(x);
        dirty.clear();
    }
    const update = (0, timing_1.throttle)(update_now, t);
    const handler = {
        get(target, key) {
            return target[key];
        },
        set(target, key, value) {
            dirty.add(key);
            target[key] = value;
            update(undefined);
            return true;
        },
        deleteProperty(target, key) {
            dirty.add(key);
            delete target[key];
            update(undefined);
            return true;
        },
    };
    return (0, reactivity_1.reactive)(new Proxy(target, 
    // @ts-ignore
    handler));
}
exports.default = make_storage;
