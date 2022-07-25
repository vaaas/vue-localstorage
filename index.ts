import { reactive } from 'vue'
import { throttle } from 'fpts/timing'
import type {AddPrefix} from 'fpts/data'

function record_map<A, B>(f: (x: A) => B, xs: Record<string, A>): Record<string, B> {
    return Object.fromEntries(
        Object.entries(xs).map(x => [x[0], f(x[1])])
    )
}

function safe_json_parse<T>(x: string): T|undefined {
    try {
        return JSON.parse(x) as T
    } catch(e) {
        return undefined
    }
}

export default function make_storage<T extends Record<string, any>>(t: number =5000): Partial<T> {
    const target = record_map(safe_json_parse, localStorage) as Partial<T>

	const dirty: Set<string> = new Set()

	function update_now(): void {
		for (const x of dirty)
			if (target[x]) localStorage.setItem(x, JSON.stringify(target[x]))
			else localStorage.removeItem(x)
		dirty.clear()
	}

	const update = throttle(update_now, t)

	const handler = {
		get(target: Partial<T>, key: keyof T): any {
			return target[key]
		},

		set<K extends keyof T>(target: Partial<T>, key: K, value: T[K]): boolean {
			dirty.add(key as string)
			target[key] = value
			update(undefined)
			return true
		},

		deleteProperty(target: Partial<T>, key: keyof T): boolean {
			dirty.add(key as string)
			delete target[key]
			update(undefined)
			return true
		},
	}

	return reactive(new Proxy(
        target,
        // @ts-ignore
        handler
    ))
}
