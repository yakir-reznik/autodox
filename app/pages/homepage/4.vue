<template>
  <div dir="rtl" lang="he" class="homepage-root font-heebo text-navy bg-warm antialiased overflow-x-hidden">
    <!-- NAVBAR -->
    <nav class="fixed top-0 inset-x-0 z-50 transition-all duration-500" :class="scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/></svg>
          </div>
          <span class="text-xl font-bold tracking-tight">Autodox</span>
        </div>
        <div class="hidden md:flex items-center gap-8 text-sm font-medium text-navy/70">
          <a href="#features" class="hover:text-brand transition-colors">יתרונות</a>
          <a href="#how-it-works" class="hover:text-brand transition-colors">איך זה עובד</a>
          <a href="#elements" class="hover:text-brand transition-colors">אלמנטים</a>
          <a href="#faq" class="hover:text-brand transition-colors">שאלות נפוצות</a>
        </div>
        <div class="flex items-center gap-3">
          <a href="/login" class="hidden sm:block text-sm font-medium text-navy/70 hover:text-brand transition-colors">התחברות</a>
          <a href="/register" class="px-5 py-2 text-sm font-semibold text-white bg-brand rounded-full hover:bg-brand-dark transition-all duration-300 hover:shadow-lg hover:shadow-brand/25">
            התחילו בחינם
          </a>
        </div>
      </div>
    </nav>

    <!-- HERO -->
    <section class="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      <!-- Background decoration -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-brand/5 blur-3xl"></div>
        <div class="absolute top-20 -right-20 w-[400px] h-[400px] rounded-full bg-blue-400/5 blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]" style="background: radial-gradient(circle, rgba(21,93,252,0.03) 0%, transparent 70%);"></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-6">
        <div class="max-w-3xl mx-auto text-center mb-16">
          <!-- Badge -->
          <div ref="heroBadge" class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/5 border border-brand/10 text-brand text-sm font-medium mb-8 opacity-0 translate-y-6">
            <span class="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
            פלטפורמת הטפסים המובילה בישראל
          </div>

          <!-- Headline -->
          <h1 ref="heroTitle" class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6 opacity-0 translate-y-6">
            בנו טפסים דיגיטליים
            <br/>
            <span class="hero-gradient">שפשוט עובדים</span>
          </h1>

          <!-- Subtitle -->
          <p ref="heroSub" class="text-lg md:text-xl text-navy/55 leading-relaxed max-w-xl mx-auto mb-10 opacity-0 translate-y-6">
            ממשק גרירה ושחרור אינטואיטיבי, חתימות דיגיטליות, לוגיקה מותנית וערכות עיצוב מרהיבות — בלי לכתוב שורת קוד אחת.
          </p>

          <!-- CTAs -->
          <div ref="heroCta" class="flex flex-wrap items-center justify-center gap-4 opacity-0 translate-y-6">
            <a href="/register" class="group px-8 py-3.5 text-base font-semibold text-white bg-brand rounded-full hover:bg-brand-dark transition-all duration-300 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5">
              התחילו בחינם
              <span class="inline-block mr-1 transition-transform duration-300 group-hover:-translate-x-1">←</span>
            </a>
            <a href="#how-it-works" class="px-8 py-3.5 text-base font-semibold text-navy/70 bg-white border border-navy/10 rounded-full hover:border-brand/30 hover:text-brand transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              איך זה עובד?
            </a>
          </div>
        </div>

        <!-- Hero Mockup - Form Builder Interface -->
        <div ref="heroMockup" class="relative max-w-5xl mx-auto opacity-0 translate-y-10">
          <div class="absolute inset-0 bg-brand/10 rounded-3xl blur-2xl scale-95"></div>
          <div class="relative bg-white rounded-2xl shadow-2xl shadow-navy/10 border border-navy/5 overflow-hidden">
            <!-- Title bar -->
            <div class="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-navy/5">
              <div class="flex items-center gap-2">
                <div class="flex gap-1.5">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div class="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span class="text-xs text-navy/40 mr-3 font-mono">טופס רישום לקוח חדש</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-navy/40">
                <span class="px-2 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-medium">נשמר אוטומטית</span>
              </div>
            </div>
            <!-- Builder layout -->
            <div class="flex min-h-[380px] md:min-h-[440px]">
              <!-- Sidebar - Elements panel -->
              <div class="hidden md:block w-56 border-l border-navy/5 bg-slate-50/50 p-4">
                <div class="text-xs font-bold text-navy/40 uppercase tracking-wider mb-3">אלמנטים</div>
                <div class="space-y-2">
                  <div v-for="el in sidebarElements" :key="el.label" class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-navy/5 text-sm cursor-grab hover:border-brand/30 hover:shadow-sm transition-all duration-200">
                    <span class="text-brand/70" v-html="el.icon"></span>
                    <span class="text-navy/70 text-xs font-medium">{{ el.label }}</span>
                  </div>
                </div>
              </div>
              <!-- Canvas -->
              <div class="flex-1 p-6 md:p-8">
                <div class="max-w-md mx-auto space-y-5">
                  <!-- Form title -->
                  <div class="mb-6">
                    <div class="text-lg font-bold text-navy mb-1">טופס רישום לקוח חדש</div>
                    <div class="text-xs text-navy/40">מלאו את הפרטים הבאים</div>
                  </div>
                  <!-- Fields -->
                  <div class="mockup-field group">
                    <div class="mockup-drag-handle">⠿</div>
                    <div class="flex-1">
                      <div class="text-xs font-semibold text-navy/60 mb-1.5">שם מלא <span class="text-red-400">*</span></div>
                      <div class="h-9 rounded-lg bg-slate-50 border border-navy/8"></div>
                    </div>
                  </div>
                  <div class="mockup-field group">
                    <div class="mockup-drag-handle">⠿</div>
                    <div class="flex-1">
                      <div class="text-xs font-semibold text-navy/60 mb-1.5">אימייל <span class="text-red-400">*</span></div>
                      <div class="h-9 rounded-lg bg-slate-50 border border-navy/8"></div>
                    </div>
                  </div>
                  <div class="mockup-field-active group">
                    <div class="mockup-drag-handle text-brand">⠿</div>
                    <div class="flex-1">
                      <div class="text-xs font-semibold text-brand mb-1.5">טלפון</div>
                      <div class="h-9 rounded-lg bg-brand/5 border-2 border-brand/30"></div>
                    </div>
                    <div class="hidden sm:flex items-center gap-1 text-[10px] text-brand font-medium bg-brand/5 px-2 py-1 rounded-md">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                      נבחר
                    </div>
                  </div>
                  <div class="mockup-field group">
                    <div class="mockup-drag-handle">⠿</div>
                    <div class="flex-1">
                      <div class="text-xs font-semibold text-navy/60 mb-1.5">סוג שירות</div>
                      <div class="h-9 rounded-lg bg-slate-50 border border-navy/8 flex items-center px-3">
                        <span class="text-[11px] text-navy/30">בחרו מהרשימה...</span>
                      </div>
                    </div>
                  </div>
                  <div class="mockup-field group">
                    <div class="mockup-drag-handle">⠿</div>
                    <div class="flex-1">
                      <div class="text-xs font-semibold text-navy/60 mb-1.5">חתימה</div>
                      <div class="h-20 rounded-lg bg-slate-50 border border-dashed border-navy/15 flex items-center justify-center">
                        <svg class="text-navy/20" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Properties panel -->
              <div class="hidden lg:block w-60 border-r border-navy/5 bg-slate-50/50 p-4">
                <div class="text-xs font-bold text-navy/40 uppercase tracking-wider mb-3">הגדרות שדה</div>
                <div class="space-y-4">
                  <div>
                    <div class="text-[11px] text-navy/50 font-medium mb-1">תווית</div>
                    <div class="h-8 rounded-lg bg-white border border-navy/8 px-2.5 flex items-center text-xs text-navy/70">טלפון</div>
                  </div>
                  <div>
                    <div class="text-[11px] text-navy/50 font-medium mb-1">placeholder</div>
                    <div class="h-8 rounded-lg bg-white border border-navy/8 px-2.5 flex items-center text-xs text-navy/30">הכניסו טלפון...</div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] text-navy/50 font-medium">שדה חובה</span>
                    <div class="w-9 h-5 rounded-full bg-brand flex items-center px-0.5 justify-start">
                      <div class="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] text-navy/50 font-medium">לוגיקה מותנית</span>
                    <div class="w-9 h-5 rounded-full bg-navy/10 flex items-center px-0.5 justify-end">
                      <div class="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TRUST BAR -->
    <section ref="trustBar" class="py-12 border-y border-navy/5 bg-white/50 opacity-0 translate-y-6">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div v-for="stat in trustStats" :key="stat.label" class="text-center">
            <div class="text-2xl md:text-3xl font-extrabold text-navy mb-1">{{ stat.value }}</div>
            <div class="text-sm text-navy/45 font-medium">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- WHY AUTODOX - FEATURE CARDS -->
    <section id="features" class="py-24 md:py-32">
      <div class="max-w-7xl mx-auto px-6">
        <div ref="whyHeader" class="text-center mb-16 opacity-0 translate-y-6">
          <div class="inline-block px-3 py-1 rounded-full bg-brand/5 text-brand text-xs font-semibold mb-4">למה Autodox?</div>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">הכל מתחיל <span class="hero-gradient">בטופס טוב</span></h2>
          <p class="text-navy/50 text-lg max-w-lg mx-auto">שלושה דברים שהופכים את Autodox לפלטפורמה שתרצו לעבוד איתה כל יום.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="(card, i) in featureCards" :key="card.title" :ref="el => featureCardRefs[i] = el" class="group relative p-8 rounded-2xl bg-white border border-navy/5 hover:border-brand/20 transition-all duration-500 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 opacity-0 translate-y-8">
            <div class="w-12 h-12 rounded-xl mb-6 flex items-center justify-center transition-colors duration-300" :class="card.iconBg">
              <span v-html="card.icon"></span>
            </div>
            <h3 class="text-xl font-bold mb-3">{{ card.title }}</h3>
            <p class="text-navy/50 leading-relaxed text-[15px]">{{ card.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURE SHOWCASE A - Smart Form Builder -->
    <section class="py-24 md:py-32 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <!-- Visual -->
          <div ref="showcaseA" class="relative opacity-0 translate-y-8">
            <div class="absolute inset-0 bg-gradient-to-br from-brand/5 to-blue-400/5 rounded-3xl scale-105 blur-xl"></div>
            <div class="relative bg-white rounded-2xl shadow-lg border border-navy/5 p-6">
              <!-- Conditional logic visual -->
              <div class="mb-6">
                <div class="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="m21 3-8.5 8.5"/><path d="M3 3l8.5 8.5"/><path d="M3 21h18"/></svg>
                  לוגיקה מותנית
                </div>
                <div class="bg-slate-50 rounded-xl p-4 border border-navy/5">
                  <div class="flex items-center gap-2 text-xs mb-3">
                    <span class="px-2 py-1 bg-purple-50 text-purple-600 rounded font-medium">אם</span>
                    <span class="px-2 py-1 bg-white border border-navy/10 rounded text-navy/60">סוג שירות</span>
                    <span class="px-2 py-1 bg-white border border-navy/10 rounded text-navy/60">שווה ל</span>
                    <span class="px-2 py-1 bg-brand/5 text-brand border border-brand/20 rounded font-medium">עסקי</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <span class="px-2 py-1 bg-green-50 text-green-600 rounded font-medium">הצג</span>
                    <span class="px-2 py-1 bg-white border border-navy/10 rounded text-navy/60">שם חברה</span>
                    <span class="text-navy/30">+</span>
                    <span class="px-2 py-1 bg-white border border-navy/10 rounded text-navy/60">ח.פ.</span>
                  </div>
                </div>
              </div>
              <!-- Keyboard shortcuts -->
              <div class="flex flex-wrap gap-2">
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-navy/5 text-[11px] text-navy/50">
                  <kbd class="px-1.5 py-0.5 bg-white rounded shadow-sm text-[10px] font-mono border border-navy/10">Ctrl</kbd>
                  <span>+</span>
                  <kbd class="px-1.5 py-0.5 bg-white rounded shadow-sm text-[10px] font-mono border border-navy/10">Z</kbd>
                  <span class="text-navy/40">ביטול</span>
                </div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-navy/5 text-[11px] text-navy/50">
                  <kbd class="px-1.5 py-0.5 bg-white rounded shadow-sm text-[10px] font-mono border border-navy/10">Ctrl</kbd>
                  <span>+</span>
                  <kbd class="px-1.5 py-0.5 bg-white rounded shadow-sm text-[10px] font-mono border border-navy/10">D</kbd>
                  <span class="text-navy/40">שכפול</span>
                </div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-navy/5 text-[11px] text-navy/50">
                  <kbd class="px-1.5 py-0.5 bg-white rounded shadow-sm text-[10px] font-mono border border-navy/10">↑</kbd>
                  <kbd class="px-1.5 py-0.5 bg-white rounded shadow-sm text-[10px] font-mono border border-navy/10">↓</kbd>
                  <span class="text-navy/40">סידור</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Text -->
          <div ref="showcaseAText" class="opacity-0 translate-y-8">
            <div class="inline-block px-3 py-1 rounded-full bg-brand/5 text-brand text-xs font-semibold mb-4">בנאי הטפסים</div>
            <h2 class="text-3xl md:text-4xl font-extrabold mb-5">בנאי טפסים <span class="hero-gradient">חכם</span></h2>
            <p class="text-navy/50 text-base leading-relaxed mb-8">
              ממשק ויזואלי שמאפשר לבנות טפסים מורכבים בדקות. גררו אלמנטים, הגדירו לוגיקה מותנית, והכל נשמר אוטומטית תוך כדי עבודה.
            </p>
            <ul class="space-y-3 mb-8">
              <li v-for="item in builderFeatures" :key="item" class="flex items-center gap-3 text-[15px] text-navy/65">
                <span class="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURE SHOWCASE B - Signatures & Security -->
    <section class="py-24 md:py-32">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <!-- Text -->
          <div ref="showcaseBText" class="order-2 md:order-1 opacity-0 translate-y-8">
            <div class="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold mb-4">אבטחה וחתימות</div>
            <h2 class="text-3xl md:text-4xl font-extrabold mb-5">חתימות דיגיטליות <span class="text-emerald-500">ואבטחה</span></h2>
            <p class="text-navy/50 text-base leading-relaxed mb-8">
              שדה חתימה מובנה שמאפשר ללקוחות לחתום ישירות מהמסך. הגנו על הטפסים שלכם עם סיסמה, קבעו הגשות פרטיות או ציבוריות.
            </p>
            <ul class="space-y-3">
              <li v-for="item in securityFeatures" :key="item" class="flex items-center gap-3 text-[15px] text-navy/65">
                <span class="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
                {{ item }}
              </li>
            </ul>
          </div>
          <!-- Visual -->
          <div ref="showcaseB" class="order-1 md:order-2 relative opacity-0 translate-y-8">
            <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-400/5 rounded-3xl scale-105 blur-xl"></div>
            <div class="relative bg-white rounded-2xl shadow-lg border border-navy/5 p-6">
              <!-- Signature mockup -->
              <div class="mb-5">
                <div class="text-xs font-semibold text-navy/60 mb-2">חתימת הלקוח</div>
                <div class="h-28 rounded-xl bg-slate-50 border-2 border-dashed border-navy/10 relative overflow-hidden">
                  <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 112" fill="none">
                    <path d="M60 75 C80 40, 100 35, 120 50 C140 65, 150 70, 170 45 C190 20, 210 30, 230 55 C250 80, 260 70, 280 45 C300 20, 320 35, 340 60" stroke="#155DFC" stroke-width="2.5" stroke-linecap="round" fill="none" class="signature-path"/>
                  </svg>
                </div>
              </div>
              <!-- Security badges -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span class="text-[11px] font-medium text-emerald-700">מוגן סיסמה</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2.5 bg-blue-50 rounded-xl">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                  <span class="text-[11px] font-medium text-blue-700">הגשה פרטית</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2.5 bg-amber-50 rounded-xl">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
                  <span class="text-[11px] font-medium text-amber-700">קישור עם טוקן</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2.5 bg-purple-50 rounded-xl">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
                  <span class="text-[11px] font-medium text-purple-700">ייצוא PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURE SHOWCASE C - Submissions & Export -->
    <section class="py-24 md:py-32 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <!-- Visual -->
          <div ref="showcaseC" class="relative opacity-0 translate-y-8">
            <div class="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-400/5 rounded-3xl scale-105 blur-xl"></div>
            <div class="relative bg-white rounded-2xl shadow-lg border border-navy/5 p-6">
              <!-- Dashboard mockup -->
              <div class="flex items-center justify-between mb-5">
                <div class="text-sm font-bold text-navy">הגשות אחרונות</div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 bg-brand/5 text-brand text-[10px] font-semibold rounded">היום</span>
                  <span class="px-2 py-1 text-navy/30 text-[10px] font-medium rounded">השבוע</span>
                  <span class="px-2 py-1 text-navy/30 text-[10px] font-medium rounded">החודש</span>
                </div>
              </div>
              <!-- Stats row -->
              <div class="grid grid-cols-3 gap-3 mb-5">
                <div class="bg-slate-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-extrabold text-navy">247</div>
                  <div class="text-[10px] text-navy/40 font-medium">הגשות</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-extrabold text-green-600">96%</div>
                  <div class="text-[10px] text-navy/40 font-medium">השלמה</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-extrabold text-brand">1:42</div>
                  <div class="text-[10px] text-navy/40 font-medium">זמן מילוי ממוצע</div>
                </div>
              </div>
              <!-- Submission rows -->
              <div class="space-y-2">
                <div v-for="(sub, i) in submissions" :key="i" class="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50/70 border border-navy/[0.03]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" :class="sub.color">{{ sub.initials }}</div>
                    <div>
                      <div class="text-xs font-semibold text-navy">{{ sub.name }}</div>
                      <div class="text-[10px] text-navy/35">{{ sub.time }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-medium" :class="sub.statusClass">{{ sub.status }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Text -->
          <div ref="showcaseCText" class="opacity-0 translate-y-8">
            <div class="inline-block px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold mb-4">ניהול הגשות</div>
            <h2 class="text-3xl md:text-4xl font-extrabold mb-5">ניהול הגשות <span class="text-violet-500">וייצוא</span></h2>
            <p class="text-navy/50 text-base leading-relaxed mb-8">
              צפו בכל ההגשות במקום אחד, סננו לפי טופס או תאריך, ייצאו ל-PDF מוכן להדפסה. חברו Webhook לשליחה אוטומטית למערכת חיצונית.
            </p>
            <ul class="space-y-3">
              <li v-for="item in submissionFeatures" :key="item" class="flex items-center gap-3 text-[15px] text-navy/65">
                <span class="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- FORM ELEMENTS SHOWCASE -->
    <section id="elements" class="py-24 md:py-32">
      <div class="max-w-7xl mx-auto px-6">
        <div ref="elementsHeader" class="text-center mb-16 opacity-0 translate-y-6">
          <div class="inline-block px-3 py-1 rounded-full bg-brand/5 text-brand text-xs font-semibold mb-4">ארגז הכלים</div>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">כל האלמנטים <span class="hero-gradient">שאתם צריכים</span></h2>
          <p class="text-navy/50 text-lg max-w-lg mx-auto">מגוון רחב של שדות קלט, אלמנטי בחירה, שדות מיוחדים ואלמנטי עיצוב — הכל בגרירה אחת.</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div
            v-for="(el, i) in formElements"
            :key="el.label"
            :ref="el2 => elementRefs[i] = el2"
            class="group relative p-4 rounded-xl bg-white border border-navy/5 hover:border-brand/25 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-1 cursor-default text-center opacity-0 translate-y-6"
          >
            <div class="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center transition-colors duration-300" :class="el.bg">
              <span v-html="el.icon" class="transition-transform duration-300 group-hover:scale-110"></span>
            </div>
            <div class="text-xs font-semibold text-navy/70">{{ el.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how-it-works" class="py-24 md:py-32 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div ref="howHeader" class="text-center mb-16 opacity-0 translate-y-6">
          <div class="inline-block px-3 py-1 rounded-full bg-brand/5 text-brand text-xs font-semibold mb-4">תהליך העבודה</div>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">שלושה צעדים <span class="hero-gradient">וסיימתם</span></h2>
          <p class="text-navy/50 text-lg max-w-lg mx-auto">מבנייה ועד ניהול — הכל פשוט, מהיר ואינטואיטיבי.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="(step, i) in steps" :key="step.title" :ref="el => stepRefs[i] = el" class="relative text-center opacity-0 translate-y-8">
            <!-- Connector line -->
            <div v-if="i < 2" class="hidden md:block absolute top-12 -left-4 w-8 border-t-2 border-dashed border-navy/10"></div>
            <div class="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow-lg" :class="step.bg">
              {{ step.num }}
            </div>
            <h3 class="text-xl font-bold mb-3">{{ step.title }}</h3>
            <p class="text-navy/50 text-[15px] leading-relaxed max-w-xs mx-auto">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- TESTIMONIALS -->
    <section class="py-24 md:py-32">
      <div class="max-w-7xl mx-auto px-6">
        <div ref="testimonialsHeader" class="text-center mb-16 opacity-0 translate-y-6">
          <div class="inline-block px-3 py-1 rounded-full bg-brand/5 text-brand text-xs font-semibold mb-4">מה אומרים עלינו</div>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">הלקוחות שלנו <span class="hero-gradient">אוהבים את זה</span></h2>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="(t, i) in testimonials" :key="i" :ref="el => testimonialRefs[i] = el" class="p-6 rounded-2xl bg-white border border-navy/5 hover:shadow-lg transition-all duration-500 hover:-translate-y-1 opacity-0 translate-y-8">
            <!-- Stars -->
            <div class="flex gap-0.5 mb-4">
              <svg v-for="s in 5" :key="s" width="16" height="16" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <p class="text-navy/65 text-[15px] leading-relaxed mb-6">{{ t.quote }}</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" :class="t.color">{{ t.initials }}</div>
              <div>
                <div class="text-sm font-bold text-navy">{{ t.name }}</div>
                <div class="text-xs text-navy/40">{{ t.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="py-24 md:py-32 bg-white">
      <div class="max-w-3xl mx-auto px-6">
        <div ref="faqHeader" class="text-center mb-16 opacity-0 translate-y-6">
          <div class="inline-block px-3 py-1 rounded-full bg-brand/5 text-brand text-xs font-semibold mb-4">שאלות נפוצות</div>
          <h2 class="text-3xl md:text-4xl font-extrabold mb-4">יש שאלות? <span class="hero-gradient">יש תשובות</span></h2>
        </div>

        <div class="space-y-3">
          <div v-for="(faq, i) in faqs" :key="i" :ref="el => faqRefs[i] = el" class="rounded-xl border border-navy/5 bg-white overflow-hidden transition-all duration-300 opacity-0 translate-y-6" :class="openFaq === i ? 'shadow-lg shadow-brand/5 border-brand/15' : 'hover:border-navy/10'">
            <button @click="toggleFaq(i)" class="w-full flex items-center justify-between px-6 py-5 text-right">
              <span class="text-[15px] font-semibold text-navy">{{ faq.q }}</span>
              <svg class="w-5 h-5 text-navy/30 transition-transform duration-300 flex-shrink-0 mr-4" :class="openFaq === i ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="overflow-hidden transition-all duration-300" :style="{ maxHeight: openFaq === i ? '200px' : '0', opacity: openFaq === i ? 1 : 0 }">
              <div class="px-6 pb-5 text-navy/50 text-[15px] leading-relaxed">{{ faq.a }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FINAL CTA -->
    <section ref="finalCta" class="py-24 md:py-32 opacity-0 translate-y-8">
      <div class="max-w-7xl mx-auto px-6">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-blue-600 to-indigo-600 px-8 py-16 md:px-16 md:py-20 text-center">
          <!-- Decorative elements -->
          <div class="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div class="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div class="absolute top-1/2 left-1/4 w-2 h-2 bg-white/20 rounded-full"></div>
          <div class="absolute top-1/3 right-1/3 w-3 h-3 bg-white/10 rounded-full"></div>

          <div class="relative">
            <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-5">מוכנים לבנות טפסים מדהימים?</h2>
            <p class="text-blue-100 text-lg max-w-lg mx-auto mb-10">הצטרפו לאלפי משתמשים שכבר בונים טפסים חכמים ומעוצבים עם Autodox. בחינם.</p>
            <a href="/register" class="group inline-flex items-center gap-2 px-10 py-4 text-base font-bold text-brand bg-white rounded-full hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:-translate-y-0.5">
              התחילו עכשיו — בחינם
              <span class="transition-transform duration-300 group-hover:-translate-x-1">←</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="py-16 border-t border-navy/5">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid md:grid-cols-4 gap-10 mb-12">
          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/></svg>
              </div>
              <span class="text-lg font-bold">Autodox</span>
            </div>
            <p class="text-sm text-navy/45 leading-relaxed">פלטפורמה לבניית טפסים דיגיטליים חכמים ומעוצבים. בנו, שלחו, נהלו.</p>
          </div>
          <!-- Links -->
          <div>
            <h4 class="text-sm font-bold text-navy mb-4">מוצר</h4>
            <ul class="space-y-2.5 text-sm text-navy/45">
              <li><a href="#features" class="hover:text-brand transition-colors">יתרונות</a></li>
              <li><a href="#elements" class="hover:text-brand transition-colors">אלמנטים</a></li>
              <li><a href="#how-it-works" class="hover:text-brand transition-colors">איך זה עובד</a></li>
              <li><a href="#faq" class="hover:text-brand transition-colors">שאלות נפוצות</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-bold text-navy mb-4">משאבים</h4>
            <ul class="space-y-2.5 text-sm text-navy/45">
              <li><a href="#" class="hover:text-brand transition-colors">מדריכים</a></li>
              <li><a href="#" class="hover:text-brand transition-colors">API</a></li>
              <li><a href="#" class="hover:text-brand transition-colors">בלוג</a></li>
              <li><a href="#" class="hover:text-brand transition-colors">עדכונים</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-bold text-navy mb-4">יצירת קשר</h4>
            <ul class="space-y-2.5 text-sm text-navy/45">
              <li>support@autodox.co.il</li>
              <li><a href="#" class="hover:text-brand transition-colors">תנאי שימוש</a></li>
              <li><a href="#" class="hover:text-brand transition-colors">מדיניות פרטיות</a></li>
            </ul>
          </div>
        </div>
        <div class="pt-8 border-t border-navy/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="text-xs text-navy/30">&copy; {{ new Date().getFullYear() }} Autodox. כל הזכויות שמורות.</div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const scrolled = ref(false)
const openFaq = ref<number | null>(null)

const featureCardRefs = ref<(HTMLElement | null)[]>([])
const elementRefs = ref<(HTMLElement | null)[]>([])
const stepRefs = ref<(HTMLElement | null)[]>([])
const testimonialRefs = ref<(HTMLElement | null)[]>([])
const faqRefs = ref<(HTMLElement | null)[]>([])

const heroBadge = ref<HTMLElement | null>(null)
const heroTitle = ref<HTMLElement | null>(null)
const heroSub = ref<HTMLElement | null>(null)
const heroCta = ref<HTMLElement | null>(null)
const heroMockup = ref<HTMLElement | null>(null)
const trustBar = ref<HTMLElement | null>(null)
const whyHeader = ref<HTMLElement | null>(null)
const elementsHeader = ref<HTMLElement | null>(null)
const howHeader = ref<HTMLElement | null>(null)
const testimonialsHeader = ref<HTMLElement | null>(null)
const faqHeader = ref<HTMLElement | null>(null)
const finalCta = ref<HTMLElement | null>(null)
const showcaseA = ref<HTMLElement | null>(null)
const showcaseAText = ref<HTMLElement | null>(null)
const showcaseB = ref<HTMLElement | null>(null)
const showcaseBText = ref<HTMLElement | null>(null)
const showcaseC = ref<HTMLElement | null>(null)
const showcaseCText = ref<HTMLElement | null>(null)

const toggleFaq = (i: number) => {
  openFaq.value = openFaq.value === i ? null : i
}

const sidebarElements = [
  { label: 'טקסט', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>' },
  { label: 'אימייל', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>' },
  { label: 'מספר', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 17h16"/><path d="M10 3v18"/><path d="M14 3v18"/><path d="M4 7h16"/></svg>' },
  { label: 'תאריך', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>' },
  { label: 'רשימה נפתחת', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>' },
  { label: 'חתימה', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>' },
]

const trustStats = [
  { value: '10,000+', label: 'טפסים נוצרו' },
  { value: '98%', label: 'שביעות רצון' },
  { value: '50+', label: 'סוגי אלמנטים' },
  { value: '2 דק׳', label: 'זמן בנייה ממוצע' },
]

const featureCards = [
  {
    title: 'בנייה בגרירה ושחרור',
    desc: 'ממשק ויזואלי אינטואיטיבי — גררו אלמנטים, סדרו אותם, ערכו מאפיינים. בלי קוד, בלי סיבוכים.',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="2"><rect x="2" y="6" width="8" height="12" rx="1"/><path d="m14 12 4-4 4 4"/><path d="M18 8v8"/></svg>',
    iconBg: 'bg-brand/5 group-hover:bg-brand/10',
  },
  {
    title: 'מילוי קל ונוח',
    desc: 'הטפסים נראים מעולה בכל מכשיר. חוויית מילוי חלקה ומזמינה — בנייד ובדסקטופ.',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
    iconBg: 'bg-brand/5 group-hover:bg-brand/10',
  },
  {
    title: 'עיצוב מקצועי',
    desc: 'ערכות עיצוב מובנות, מראה מושקע ומקצועי. הטפסים שלכם לא נראו ככה מעולם.',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="2"><circle cx="13.5" cy="6.5" r="2.5"/><path d="M17 2a5 5 0 0 1 0 10"/><circle cx="6" cy="12" r="2.5"/><path d="M3 9.5a5 5 0 0 0 5 5"/><circle cx="13.5" cy="17.5" r="2.5"/><path d="M17 14a5 5 0 0 1 0 10"/></svg>',
    iconBg: 'bg-brand/5 group-hover:bg-brand/10',
  },
]

const builderFeatures = [
  'לוגיקה מותנית — הצגת שדות לפי תשובות',
  'שדות חוזרים (Repeater) — הוסף עוד פריט',
  'קיצורי מקלדת לעבודה מהירה',
  'שמירה אוטומטית תוך כדי עבודה',
  'ייבוא מהיר מ-JSON',
]

const securityFeatures = [
  'חתימה דיגיטלית מובנית',
  'הגנת סיסמה על טפסים',
  'הגשות פרטיות או ציבוריות',
  'קישורי הגשה עם טוקן ייחודי',
]

const submissionFeatures = [
  'לוח בקרה עם כל ההגשות',
  'ייצוא PDF מוכן להדפסה',
  'Webhook — שליחה אוטומטית למערכות חיצוניות',
  'סינון לפי טופס, משתמש או תאריך',
]

const submissions = [
  { name: 'שרה כהן', initials: 'שכ', time: 'לפני 5 דקות', status: 'הושלם', color: 'bg-brand', statusClass: 'bg-green-50 text-green-600' },
  { name: 'דניאל לוי', initials: 'דל', time: 'לפני 12 דקות', status: 'הושלם', color: 'bg-violet-500', statusClass: 'bg-green-50 text-green-600' },
  { name: 'מיכל ברק', initials: 'מב', time: 'לפני 28 דקות', status: 'בתהליך', color: 'bg-amber-500', statusClass: 'bg-amber-50 text-amber-600' },
  { name: 'יוסף אברהם', initials: 'יא', time: 'לפני שעה', status: 'הושלם', color: 'bg-emerald-500', statusClass: 'bg-green-50 text-green-600' },
]

const formElements = [
  { label: 'טקסט', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>', bg: 'bg-brand/5' },
  { label: 'אימייל', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>', bg: 'bg-brand/5' },
  { label: 'מספר', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M4 17h16"/><path d="M10 3v18"/><path d="M14 3v18"/><path d="M4 7h16"/></svg>', bg: 'bg-violet-50' },
  { label: 'אזור טקסט', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="2"><path d="M17 6H3"/><path d="M21 12H3"/><path d="M15.5 18H3"/></svg>', bg: 'bg-brand/5' },
  { label: 'תאריך', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>', bg: 'bg-amber-50' },
  { label: 'שעה', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', bg: 'bg-amber-50' },
  { label: 'רשימה נפתחת', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="m6 9 6 6 6-6"/><rect width="20" height="20" x="2" y="2" rx="2"/></svg>', bg: 'bg-emerald-50' },
  { label: 'בחירה בודדת', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="#10b981"/></svg>', bg: 'bg-emerald-50' },
  { label: 'תיבת סימון', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>', bg: 'bg-emerald-50' },
  { label: 'חתימה', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>', bg: 'bg-pink-50' },
  { label: 'שדה חזרה', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>', bg: 'bg-pink-50' },
  { label: 'כותרת', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M6 12h12"/><path d="M6 4v16"/><path d="M18 4v16"/></svg>', bg: 'bg-indigo-50' },
  { label: 'פסקה', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M17 6H3"/><path d="M21 12H3"/><path d="M15.5 18H3"/></svg>', bg: 'bg-indigo-50' },
  { label: 'תמונה', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>', bg: 'bg-indigo-50' },
  { label: 'מפריד', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M3 12h18"/></svg>', bg: 'bg-slate-50' },
  { label: 'מקטע', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/></svg>', bg: 'bg-slate-50' },
]

const steps = [
  { num: '1', title: 'בנו', desc: 'עצבו את הטופס בממשק גרירה ושחרור. הוסיפו שדות, לוגיקה, חתימות ועיצוב — הכל ויזואלי.', bg: 'bg-brand shadow-brand/30' },
  { num: '2', title: 'שלחו', desc: 'שתפו קישור ייחודי עם הלקוחות. הם ממלאים ישירות בדפדפן, בכל מכשיר.', bg: 'bg-violet-500 shadow-violet-500/30' },
  { num: '3', title: 'נהלו', desc: 'עקבו אחר הגשות, ייצאו PDF, שלחו נתונים אוטומטית דרך Webhook.', bg: 'bg-emerald-500 shadow-emerald-500/30' },
]

const testimonials = [
  { quote: 'עברנו מטפסים נייר ל-Autodox תוך יום. הלקוחות שלנו מתלהבים מהחוויה — הכל נוח, ברור ומקצועי. חסך לנו שעות עבודה כל שבוע.', name: 'רונית שמעוני', role: 'מנהלת מרפאה', initials: 'רש', color: 'bg-brand' },
  { quote: 'הלוגיקה המותנית שינתה לנו את המשחק. במקום 5 טפסים שונים — טופס אחד חכם שמתאים את עצמו. פשוט גאוני.', name: 'אמיר דוד', role: 'יועץ עסקי', initials: 'אד', color: 'bg-violet-500' },
  { quote: 'החתימה הדיגיטלית והייצוא ל-PDF חסכו לנו הדפסות אינסופיות. הכל דיגיטלי, מסודר ומאורגן. ממליצה בחום.', name: 'נועה קליין', role: 'עורכת דין', initials: 'נק', color: 'bg-emerald-500' },
  { quote: 'הממשק הכי אינטואיטיבי שנתקלתי בו. בניתי טופס מורכב עם שדות חוזרים תוך 10 דקות בלי שום הדרכה.', name: 'יוני ברגמן', role: 'מפתח עצמאי', initials: 'יב', color: 'bg-amber-500' },
  { quote: 'ה-Webhook חיבר לנו את הטפסים ישירות ל-CRM. נתוני לקוחות זורמים אוטומטית — אפס עבודה ידנית.', name: 'שירה לוי', role: 'מנהלת שיווק', initials: 'של', color: 'bg-pink-500' },
  { quote: 'ערכות העיצוב הופכות כל טופס למרהיב. הלקוחות שואלים אותנו מי עיצב לנו את הטפסים. זה Autodox.', name: 'גל אביב', role: 'מעצב גרפי', initials: 'גא', color: 'bg-indigo-500' },
]

const faqs = [
  { q: 'האם אני צריך ידע טכני כדי להשתמש ב-Autodox?', a: 'ממש לא. הממשק בנוי על עקרון גרירה ושחרור — פשוט בוחרים אלמנט, גוררים אותו לטופס, ומגדירים את המאפיינים בפאנל צדדי. אפס קוד.' },
  { q: 'האם הטפסים עובדים בנייד?', a: 'בהחלט. כל הטפסים מותאמים אוטומטית למובייל ולדסקטופ. הלקוחות שלכם יכולים למלא מכל מכשיר.' },
  { q: 'איך עובדת החתימה הדיגיטלית?', a: 'מוסיפים שדה חתימה לטופס, והלקוח חותם ישירות מהמסך — במחשב עם העכבר, בנייד עם האצבע. החתימה נשמרת כחלק מההגשה ומיוצאת עם ה-PDF.' },
  { q: 'האם אפשר לחבר את Autodox למערכות אחרות?', a: 'כן. באמצעות Webhook אפשר לשלוח נתוני הגשה אוטומטית לכל מערכת חיצונית — CRM, אוטומציה, גיליון נתונים ועוד. אפשר גם לצרף PDF.' },
  { q: 'מה ההבדל בין הגשה ציבורית לפרטית?', a: 'טופס ציבורי פתוח לכולם דרך קישור. טופס פרטי דורש טוקן ייחודי — רק מי שקיבל את הקישור הספציפי יכול למלא. אפשר גם להוסיף הגנת סיסמה.' },
]

const handleScroll = () => {
  scrolled.value = window.scrollY > 20
}

const createObserver = (threshold = 0.15) => {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-reveal')
        }
      })
    },
    { threshold }
  )
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })

  // Hero staggered animation
  const heroElements = [heroBadge.value, heroTitle.value, heroSub.value, heroCta.value, heroMockup.value]
  heroElements.forEach((el, i) => {
    if (el) {
      setTimeout(() => el.classList.add('animate-reveal'), 100 + i * 120)
    }
  })

  // Scroll-triggered animations
  const observer = createObserver()

  const singleElements = [
    trustBar.value, whyHeader.value, elementsHeader.value,
    howHeader.value, testimonialsHeader.value, faqHeader.value, finalCta.value,
    showcaseA.value, showcaseAText.value, showcaseB.value, showcaseBText.value,
    showcaseC.value, showcaseCText.value,
  ]
  singleElements.forEach(el => { if (el) observer.observe(el) })

  // Staggered groups
  const staggerGroups = [featureCardRefs.value, stepRefs.value, testimonialRefs.value]
  staggerGroups.forEach(group => {
    group.forEach((el, i) => {
      if (el) {
        const staggerObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('animate-reveal'), i * 100)
              }
            })
          },
          { threshold: 0.1 }
        )
        staggerObserver.observe(el)
      }
    })
  })

  // Element grid stagger
  elementRefs.value.forEach((el, i) => {
    if (el) {
      const elObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => entry.target.classList.add('animate-reveal'), i * 40)
            }
          })
        },
        { threshold: 0.05 }
      )
      elObserver.observe(el)
    }
  })

  // FAQ items stagger
  faqRefs.value.forEach((el, i) => {
    if (el) {
      const faqObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => entry.target.classList.add('animate-reveal'), i * 80)
            }
          })
        },
        { threshold: 0.1 }
      )
      faqObserver.observe(el)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');

.homepage-root {
  --brand: #155DFC;
  --brand-dark: #1048CC;
  --navy: #0A1628;
  --warm: #FAFAF8;
}

.font-heebo { font-family: 'Heebo', sans-serif; }
.text-navy { color: var(--navy); }
.bg-warm { background-color: var(--warm); }
.bg-brand { background-color: var(--brand); }
.bg-brand-dark { background-color: var(--brand-dark); }
.text-brand { color: var(--brand); }

.hero-gradient {
  background: linear-gradient(135deg, var(--brand) 0%, #4F8FFF 50%, #818CF8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.animate-reveal {
  opacity: 1 !important;
  transform: translateY(0) !important;
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.mockup-field {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1.5px solid transparent;
  transition: all 0.2s;
}
.mockup-field:hover {
  background-color: rgba(10, 22, 40, 0.02);
  border-color: rgba(10, 22, 40, 0.05);
}
.mockup-field-active {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1.5px solid rgba(21, 93, 252, 0.2);
  background-color: rgba(21, 93, 252, 0.02);
}
.mockup-drag-handle {
  color: rgba(10, 22, 40, 0.15);
  cursor: grab;
  padding-top: 0.25rem;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  user-select: none;
}

.signature-path {
  stroke-dasharray: 500;
  stroke-dashoffset: 500;
  animation: drawSignature 2.5s ease-in-out 1.5s forwards;
}

@keyframes drawSignature {
  to { stroke-dashoffset: 0; }
}
</style>
