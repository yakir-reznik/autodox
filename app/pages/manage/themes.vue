<script setup lang="ts">
import { themeColorKeys, themeColorLabels as labels, type EditableTheme } from "~~/shared/types/themes";

definePageMeta({
  layout: "management-panel",
  heading: "ערכות עיצוב",
  breadcrumbs: [
    { label: "הגדרות מערכת", to: "/manage/settings" },
    { label: "ערכות עיצוב" },
  ],
  middleware: () => {
    const { user } = useUserSession();
    if (!user.value?.roles?.includes("admin"))
      return navigateTo("/manage/unauthorized");
  },
});
useHead({
  title: "ערכות עיצוב - Autodox",
  link: [{ rel: "stylesheet", href: "/assets/css/themes/form-fill-base.css" }],
});
const { data: themes, refresh } =
  await useFetch<EditableTheme[]>("/api/admin/themes");
const editor = ref<EditableTheme | null>(null);
const isNew = ref(false);
const previewMode = ref<"light" | "dark">("light");
const selectedThemeId = computed(() =>
  isNew.value ? "" : (editor.value?.id ?? ""),
);
const themeOptions = computed(() =>
  (themes.value ?? []).map((theme) => ({
    id: theme.id,
    title: theme.title,
    description: theme.description,
    colors: [
      theme.colors.background,
      theme.colors.card,
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.accent,
    ],
  })),
);
function selectTheme(id: string) {
  const theme = themes.value?.find((item) => item.id === id);
  if (theme) edit(theme);
}
const prompt = ref("");
const generating = ref(false);
const saving = ref(false);
const deleting = ref(false);
const confirmDelete = ref(false);
const deleteError = ref("");
const busy = computed(() => generating.value || saving.value || deleting.value);
const error = ref("");
const message = ref("");

function edit(theme: EditableTheme, create = false) {
  editor.value = structuredClone(toRaw(theme));
  isNew.value = create;
  editor.value.darkColors ??= { ...editor.value.colors };
  if (create) {
    editor.value.id = "";
    editor.value.title = "";
    editor.value.description = "";
  }
  previewMode.value = "light";
  error.value = "";
  message.value = "";
  prompt.value = "";
}
function duplicateTheme() {
	if (!editor.value) return;
	const source = structuredClone(toRaw(editor.value));
	edit(source, true);
	if (!editor.value) return;
	editor.value.title = `${source.title.slice(0, 248)} (עותק)`;
	editor.value.description = source.description;
}
async function deleteTheme() {
	if (!editor.value || isNew.value) return;
	deleting.value = true;
	deleteError.value = "";
	try {
		await $fetch(`/api/admin/themes/${encodeURIComponent(editor.value.id)}`, { method: "DELETE" });
		confirmDelete.value = false;
		editor.value = null;
		await refresh();
		useToasts().add({ theme: "success", title: "ערכת העיצוב נמחקה" });
	} catch (err: any) {
		deleteError.value = err?.statusCode === 409
			? "לא ניתן למחוק ערכה שנמצאת בשימוש בטופס או משמשת כברירת מחדל."
			: "מחיקת הערכה נכשלה. נסו שוב.";
	} finally {
		deleting.value = false;
	}
}
async function generate() {
  if (!editor.value || !prompt.value.trim()) return;
  generating.value = true;
  error.value = "";
  message.value = "";
  try {
    const theme = {
      ...editor.value,
      id: editor.value.id || "new-theme",
      title: editor.value.title || "ערכה חדשה",
    };
		const result = await $fetch<{ colors: EditableTheme["colors"]; darkColors: EditableTheme["colors"] }>(
			"/api/admin/themes/generate",
			{ method: "POST", body: { prompt: prompt.value, theme } },
		);
		editor.value.colors = result.colors;
		editor.value.darkColors = result.darkColors;
    message.value = "הצבעים עודכנו. בדקו את התצוגה ושמרו כשאתם מרוצים.";
  } catch {
    error.value = "לא ניתן ליצור צבעים. בדקו את הגדרות ה-AI ונסו שוב.";
  } finally {
    generating.value = false;
  }
}
async function save() {
  if (!editor.value) return;
  saving.value = true;
  error.value = "";
  message.value = "";
  try {
    await $fetch("/api/admin/themes", {
      method: "POST",
      body: { ...editor.value, create: isNew.value },
    });
    await refresh();
    const saved = themes.value?.find((theme) => theme.id === editor.value?.id);
    if (saved) editor.value = structuredClone(toRaw(saved));
    isNew.value = false;
    message.value = "ערכת העיצוב נשמרה.";
  } catch {
    error.value = "השמירה נכשלה. בדקו שהמזהה ייחודי ושהצבעים תקינים.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <p class="mb-4 text-sm text-muted-foreground">
    בחרו ערכה לעריכה או צרו ערכה חדשה ותראו אותה על טופס לדוגמה.
  </p>
  <div class="space-y-6" dir="rtl">
		<div class="flex flex-wrap items-end gap-3">
			<div class="w-full max-w-72 space-y-1 sm:w-72">
				<label class="text-sm font-medium" for="admin-theme-picker">ערכת עיצוב לעריכה</label>
				<ThemesPicker
					id="admin-theme-picker"
					:model-value="selectedThemeId"
					:themes="themeOptions"
					:disabled="busy"
					@update:model-value="selectTheme"
				/>
			</div>

			<UiButton v-if="editor" variant="outline" :disabled="busy" @click="duplicateTheme">
				<Icon name="heroicons:document-duplicate" class="size-4" />
				שכפול ערכה
			</UiButton>
			<UiButton :disabled="busy || !themes?.length" @click="themes?.[0] && edit(themes[0], true)">
				<Icon name="heroicons:plus" class="size-4" />
				יצירת ערכה חדשה
			</UiButton>
			<UiButton v-if="editor && !isNew" variant="destructive" :disabled="busy || ['lightning', 'ocean'].includes(editor.id)" :title="['lightning', 'ocean'].includes(editor.id) ? 'לא ניתן למחוק ערכת ברירת מחדל' : 'מחיקת ערכת העיצוב'" @click="deleteError = ''; confirmDelete = true">
				<Icon name="heroicons:trash" class="size-4" />
				מחיקת ערכה
			</UiButton>
		</div>
    <div v-if="editor" class="space-y-4">
      <div
        class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-white p-4 shadow-md"
      >
        <div>
          <p class="text-sm text-gray-600">
            {{
              isNew
                ? "ערכה חדשה — השינויים יישמרו לאחר לחיצה על שמירה."
                : "שמירה תעדכן את כל הטפסים המשתמשים בערכה זו."
            }}
          </p>
          <p v-if="error" role="alert" class="mt-1 text-sm text-red-700">
            {{ error }}
          </p>
          <p v-if="message" role="status" class="mt-1 text-sm text-green-700">
            {{ message }}
          </p>
        </div>
        <UiButton size="lg" :disabled="busy" @click="save"
          ><Icon
            v-if="saving"
            name="svg-spinners:ring-resize"
            class="size-4"
          /><Icon v-else name="heroicons:check" class="size-4" />{{
            saving ? "שומר..." : "שמירת ערכת העיצוב"
          }}</UiButton
        >
      </div>
      <div class="grid items-start gap-6 xl:grid-cols-2">
        <fieldset
          :disabled="busy"
          class="min-w-0 space-y-5 rounded-xl border border-gray-200 bg-white p-5"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm"
              >שם ערכה <UiInput v-model="editor.title" maxlength="255"
            /></label>
            <label class="space-y-1 text-sm"
              >מזהה באנגלית
              <UiInput
                v-model="editor.id"
                dir="ltr"
                :disabled="!isNew"
                maxlength="50"
                placeholder="my-theme"
            /></label>
          </div>
          <label class="block space-y-1 text-sm"
            >תיאור <UiInput v-model="editor.description" maxlength="1000"
          /></label>
          <div class="rounded-lg bg-blue-50 p-4" :aria-busy="generating">
            <label for="theme-prompt" class="text-sm font-semibold"
              >יצירת צבעים בעזרת AI</label
            >
            <p class="mb-2 mt-1 text-xs text-gray-600">
              תארו את האווירה והצבעים הרצויים. ייווצרו צבעים למצב בהיר ולמצב כהה.
            </p>
            <textarea
              id="theme-prompt"
              v-model="prompt"
              rows="3"
              maxlength="4000"
              :disabled="busy"
              class="w-full rounded-md border border-gray-300 bg-white p-2 text-sm"
              placeholder="למשל: רקע שמנת, כפתורים כחולים וטקסט כהה"
            />
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <UiButton
                type="button"
                variant="outline"
                :disabled="busy || !prompt.trim()"
                @click="generate"
                ><Icon
                  v-if="generating"
                  name="svg-spinners:ring-resize"
                  class="size-4"
                />{{ generating ? "יוצר צבעים..." : "יצירת צבעים" }}</UiButton
              >
            </div>
            <p
              v-if="generating"
              role="status"
              class="mt-3 flex items-center gap-2 text-sm text-blue-800"
            >
              <Icon name="svg-spinners:ring-resize" class="size-4" />יוצרים ערכת
              צבעים. התהליך עשוי להימשך כמה רגעים.
            </p>
          </div>
          <div class="space-y-4">
            <div>
              <h2 class="font-semibold">צבעי הערכה</h2>
              <p class="mt-1 text-xs text-gray-500">
                ערכו צבעים לשני המצבים. ניתן להזין hex או oklch.
              </p>
            </div>
            <div
              v-for="key in themeColorKeys"
              :key="key"
              class="border-t border-gray-100 pt-3"
            >
              <h3 class="mb-2 text-sm font-medium">{{ labels[key] }}</h3>
              <div class="grid gap-3 sm:grid-cols-2">
                <ThemeEditorColorInput
                  v-model="editor.colors[key]"
                  :label="`${labels[key]} — בהיר`"
                />
                <ThemeEditorColorInput
                  v-if="editor.darkColors"
                  v-model="editor.darkColors[key]"
                  :label="`${labels[key]} — כהה`"
                />
              </div>
            </div>
          </div>
        </fieldset>
        <div class="min-w-0">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="font-semibold">תצוגה מקדימה</h2>
            <span class="text-xs text-gray-500">טופס לדוגמה</span>
          </div>
          <ThemeEditorPreview
            v-model:mode="previewMode"
            :colors="editor.colors"
            :dark-colors="editor.darkColors"
          />
        </div>
      </div>
    </div>
    <p
      v-else
      class="rounded-lg border border-dashed p-8 text-center text-gray-500"
    >
      בחרו ערכה כדי להתחיל לערוך.
    </p>
  </div>
	<BaseModal v-model="confirmDelete" title="מחיקת ערכת עיצוב" size="sm">
		<p class="text-sm text-gray-700">למחוק את ערכת העיצוב <strong>{{ editor?.title }}</strong>? לא ניתן למחוק ערכה המשמשת טופס.</p>
		<p v-if="deleteError" role="alert" class="mt-3 text-sm text-red-700">{{ deleteError }}</p>
		<template #footer>
			<UiButton variant="outline" :disabled="deleting" @click="confirmDelete = false">ביטול</UiButton>
			<UiButton variant="destructive" :disabled="deleting" @click="deleteTheme">
				<Icon v-if="deleting" name="svg-spinners:ring-resize" class="size-4" />
				{{ deleting ? "מוחק..." : "מחיקת ערכה" }}
			</UiButton>
		</template>
	</BaseModal>
</template>
