const OTHER_PREFIX = "__other__:";

export function useOtherOption(
	modelValue: Readonly<Ref<string | string[] | boolean | undefined>>,
	emit: (value: string | string[]) => void,
) {
	const isOtherSelected = computed(() => {
		if (Array.isArray(modelValue.value)) {
			return modelValue.value.some((v) => v.startsWith(OTHER_PREFIX));
		}
		return typeof modelValue.value === "string" && modelValue.value.startsWith(OTHER_PREFIX);
	});

	const otherText = computed(() => {
		if (Array.isArray(modelValue.value)) {
			const entry = modelValue.value.find((v) => v.startsWith(OTHER_PREFIX));
			return entry ? entry.slice(OTHER_PREFIX.length) : "";
		}
		return typeof modelValue.value === "string" && modelValue.value.startsWith(OTHER_PREFIX)
			? modelValue.value.slice(OTHER_PREFIX.length)
			: "";
	});

	function selectOther() {
		if (Array.isArray(modelValue.value)) {
			emit([...modelValue.value.filter((v) => !v.startsWith(OTHER_PREFIX)), OTHER_PREFIX]);
		} else {
			emit(OTHER_PREFIX);
		}
	}

	function updateOtherText(text: string) {
		if (Array.isArray(modelValue.value)) {
			emit([...modelValue.value.filter((v) => !v.startsWith(OTHER_PREFIX)), OTHER_PREFIX + text]);
		} else {
			emit(OTHER_PREFIX + text);
		}
	}

	return { OTHER_PREFIX, isOtherSelected, otherText, selectOther, updateOtherText };
}
