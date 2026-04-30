import { describe, it, expect } from "vitest"
import {
	findDuplicateNameGroups,
	type ElementForValidation,
} from "../shared/utils/fieldNameValidation"

function el(
	id: string,
	name: string | null,
	parentId: string | null = null,
	type = "text",
): ElementForValidation {
	return { id, name, parentId, type }
}

describe("findDuplicateNameGroups", () => {
	it("returns no groups when all names are unique", () => {
		const groups = findDuplicateNameGroups([
			el("a", "first"),
			el("b", "second"),
			el("c", "third"),
		])
		expect(groups).toEqual([])
	})

	it("ignores elements with no name", () => {
		const groups = findDuplicateNameGroups([
			el("a", null, null, "section"),
			el("b", null, null, "section"),
		])
		expect(groups).toEqual([])
	})

	it("detects duplicate names at the top level", () => {
		const groups = findDuplicateNameGroups([
			el("a", "phone"),
			el("b", "phone"),
			el("c", "email"),
		])
		expect(groups).toHaveLength(1)
		expect(groups[0]!.name).toBe("phone")
		expect(groups[0]!.scopeKey).toBeNull()
		expect(groups[0]!.ids.sort()).toEqual(["a", "b"])
	})

	it("detects duplicate names inside the same repeater", () => {
		const groups = findDuplicateNameGroups([
			el("rep", "people", null, "repeater"),
			el("a", "aaa", "rep"),
			el("b", "aaa", "rep"),
		])
		expect(groups).toHaveLength(1)
		expect(groups[0]!.name).toBe("aaa")
		expect(groups[0]!.scopeKey).toBe("rep")
		expect(groups[0]!.ids.sort()).toEqual(["a", "b"])
	})

	it("treats top-level scope and repeater scope as separate", () => {
		// Same name at root and inside a repeater is fine — they live in different submission scopes.
		const groups = findDuplicateNameGroups([
			el("rep", "people", null, "repeater"),
			el("rootA", "shared"),
			el("childA", "shared", "rep"),
		])
		expect(groups).toEqual([])
	})

	it("treats sections as transparent — sibling fields under root collide with section children of the same name", () => {
		// Section children flatten into the root submission scope.
		const groups = findDuplicateNameGroups([
			el("sec", null, null, "section"),
			el("rootA", "x"),
			el("inSection", "x", "sec"),
		])
		expect(groups).toHaveLength(1)
		expect(groups[0]!.name).toBe("x")
		expect(groups[0]!.scopeKey).toBeNull()
		expect(groups[0]!.ids.sort()).toEqual(["inSection", "rootA"])
	})

	it("treats grids as transparent — same as sections", () => {
		const groups = findDuplicateNameGroups([
			el("grid", null, null, "grid"),
			el("rootA", "y"),
			el("inGrid", "y", "grid"),
		])
		expect(groups).toHaveLength(1)
		expect(groups[0]!.name).toBe("y")
		expect(groups[0]!.scopeKey).toBeNull()
	})

	it("treats nested sections/grids inside a repeater as part of the repeater's scope", () => {
		// Repeater is the only scope boundary; section/grid inside it do not create a sub-scope.
		const groups = findDuplicateNameGroups([
			el("rep", "items", null, "repeater"),
			el("sec", null, "rep", "section"),
			el("grid", null, "rep", "grid"),
			el("a", "dup", "rep"),
			el("b", "dup", "sec"),
			el("c", "dup", "grid"),
		])
		expect(groups).toHaveLength(1)
		expect(groups[0]!.name).toBe("dup")
		expect(groups[0]!.scopeKey).toBe("rep")
		expect(groups[0]!.ids.sort()).toEqual(["a", "b", "c"])
	})

	it("does not collide between two different repeaters using the same child name", () => {
		const groups = findDuplicateNameGroups([
			el("rep1", "list1", null, "repeater"),
			el("rep2", "list2", null, "repeater"),
			el("a", "name", "rep1"),
			el("b", "name", "rep2"),
		])
		expect(groups).toEqual([])
	})

	it("detects multiple independent duplicate groups in one pass", () => {
		const groups = findDuplicateNameGroups([
			el("rep", "items", null, "repeater"),
			el("a", "phone"),
			el("b", "phone"),
			el("c", "email"),
			el("d", "email"),
			el("e", "inner", "rep"),
			el("f", "inner", "rep"),
		])
		expect(groups).toHaveLength(3)
		const byName = Object.fromEntries(groups.map((g) => [g.name, g]))
		expect(byName.phone!.scopeKey).toBeNull()
		expect(byName.email!.scopeKey).toBeNull()
		expect(byName.inner!.scopeKey).toBe("rep")
	})

	it("counts a repeater itself as a field in its parent's scope", () => {
		// A repeater has a name and lives in the parent scope alongside other fields,
		// so it can collide with a sibling field at root.
		const groups = findDuplicateNameGroups([
			el("rep", "phone", null, "repeater"),
			el("a", "phone"),
		])
		expect(groups).toHaveLength(1)
		expect(groups[0]!.scopeKey).toBeNull()
		expect(groups[0]!.ids.sort()).toEqual(["a", "rep"])
	})
})
