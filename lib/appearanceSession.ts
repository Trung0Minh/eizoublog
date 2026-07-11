export type AppearanceSeason = "spring" | "summer" | "autumn" | "winter"
export type AppearanceTheme = "dark" | "light"

const SESSION_SEASON_COOKIE = "appearanceSeason"
const SESSION_THEME_COOKIE = "appearanceTheme"
const SESSION_COOKIE_OPTIONS = "Path=/; SameSite=Lax"
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000

function getVietnamDate(date: Date) {
  return new Date(date.getTime() + VIETNAM_OFFSET_MS)
}

function isAppearanceSeason(value: string | undefined): value is AppearanceSeason {
  return (
    value === "spring" ||
    value === "summer" ||
    value === "autumn" ||
    value === "winter"
  )
}

export function resolveAppearanceSeason(value: string | undefined, date = new Date()) {
  return isAppearanceSeason(value) ? value : getAutomaticSeason(date)
}

export function resolveAppearanceTheme(value: string | undefined, date = new Date()): AppearanceTheme {
  return value === "dark" || value === "light"
    ? value
    : getVietnamIsDark(date) ? "dark" : "light"
}

export function getVietnamIsDark(date = new Date()) {
  const hour = getVietnamDate(date).getUTCHours()
  return hour < 6 || hour >= 18
}

export function getAutomaticSeason(date = new Date()): AppearanceSeason {
  const month = getVietnamDate(date).getUTCMonth()
  if (month >= 2 && month <= 4) return "spring"
  if (month >= 5 && month <= 7) return "summer"
  if (month >= 8 && month <= 10) return "autumn"
  return "winter"
}

export function getDocumentSeason(): AppearanceSeason {
  const season = document.documentElement.getAttribute("data-season") ?? undefined
  return isAppearanceSeason(season) ? season : getAutomaticSeason()
}

export function setSessionSeason(season: AppearanceSeason) {
  document.cookie = `${SESSION_SEASON_COOKIE}=${season}; ${SESSION_COOKIE_OPTIONS}`
}

export function setSessionTheme(theme: AppearanceTheme) {
  document.cookie = `${SESSION_THEME_COOKIE}=${theme}; ${SESSION_COOKIE_OPTIONS}`
}

export function initializeAppearance(fixedNow?: Date) {
  const cookieEntries = document.cookie.split("; ")
  const readSessionCookie = (name: string) => {
    const prefix = `${name}=`
    return cookieEntries
      .find((entry) => entry.startsWith(prefix))
      ?.slice(prefix.length)
  }
  const themeOverride = readSessionCookie("appearanceTheme")
  const seasonOverride = readSessionCookie("appearanceSeason")

  if (themeOverride === "dark" || themeOverride === "light") {
    localStorage.setItem("theme", themeOverride)
  } else {
    localStorage.removeItem("theme")
  }
  localStorage.removeItem("season")

  const vietnamOffsetMs = 7 * 60 * 60 * 1000
  const getVietnamDate = () =>
    new Date((fixedNow ?? new Date()).getTime() + vietnamOffsetMs)
  const getIsDark = () => {
    const hour = getVietnamDate().getUTCHours()
    return hour < 6 || hour >= 18
  }
  const getSeason = () => {
    const month = getVietnamDate().getUTCMonth()
    if (month >= 2 && month <= 4) return "spring"
    if (month >= 5 && month <= 7) return "summer"
    if (month >= 8 && month <= 10) return "autumn"
    return "winter"
  }

  const originalMatchMedia = window.matchMedia
  let darkThemeListeners: Array<(event: MediaQueryListEvent) => void> = []
  let lastIsDark: boolean | null = null

  window.matchMedia = (query: string) => {
    if (query !== "(prefers-color-scheme: dark)") {
      return originalMatchMedia.call(window, query)
    }

    lastIsDark = getIsDark()
    const mediaQueryList = {
      get matches() {
        return getIsDark()
      },
      media: query,
      onchange: null,
      addListener(listener: (event: MediaQueryListEvent) => void) {
        darkThemeListeners.push(listener)
      },
      removeListener(listener: (event: MediaQueryListEvent) => void) {
        darkThemeListeners = darkThemeListeners.filter(
          (current) => current !== listener,
        )
      },
      addEventListener(
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) {
        darkThemeListeners.push(listener)
      },
      removeEventListener(
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) {
        darkThemeListeners = darkThemeListeners.filter(
          (current) => current !== listener,
        )
      },
      dispatchEvent() {
        return true
      },
    }
    return mediaQueryList as MediaQueryList
  }

  window.setInterval(() => {
    if (lastIsDark === null) return
    const currentIsDark = getIsDark()
    if (currentIsDark === lastIsDark) return

    lastIsDark = currentIsDark
    const event = { matches: currentIsDark } as MediaQueryListEvent
    darkThemeListeners.forEach((listener) => listener(event))
  }, 60_000)

  const season =
    seasonOverride === "spring" ||
    seasonOverride === "summer" ||
    seasonOverride === "autumn" ||
    seasonOverride === "winter"
      ? seasonOverride
      : getSeason()
  document.documentElement.setAttribute("data-season", season)
}

export function getAppearanceInitScript() {
  return `(${initializeAppearance.toString()})()`
}
