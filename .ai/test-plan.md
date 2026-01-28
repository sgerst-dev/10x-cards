# Plan testów „10x-cards”

## 1. Cel testowania
- Zapewnienie jakości i stabilności aplikacji przy integracji z Supabase i OpenRouter.
- Wczesne wykrywanie regresji w kluczowych ścieżkach (auth, generowanie fiszek, biblioteka).
- Zbieranie wiarygodnych metryk jakości dla zespołu i interesariuszy.

## 2. Zakres testów
- Frontend Astro + React + Shadcn UI (`src/components/*`, `.astro`, hooki) i responsywność.
- Backend Supabase (RLS, migracje, `src/db`, middleware, schematy walidacji).
- API `/src/pages/api/*`, usługi AI (`src/lib/services/*`) oraz logika zapisu i generacji.
- Ścieżki użytkownika: rejestracja, logowanie, generowanie, CRUD biblioteki.
- Wydajność (renderowanie stron i API), bezpieczeństwo (autoryzacja, RLS, XSS/CSRF).

## 3. Typy testów
- **Jednostkowe**: Vitest + React Testing Library (komponenty, hooki, helpery, walidatory Zod) z MSW.
- **Integracyjne**: komunikacja React ↔ serwisy, API ↔ Supabase, walidacje schematów.
- **E2E**: Playwright (rejestracja, sesje, generowanie, CRUD, dialogi, toast).
- **Wydajnościowe**: Lighthouse, k6 (Lighthouse ≥ 90, P95 API < 300 ms).
- **Użyteczność/accessibility**: Axe-core, Lighthouse (aria-labels, focus).
- **Bezpieczeństwo**: OWASP ZAP, ESLint-plugin-security, testy RLS i ograniczeń.

## 4. Scenariusze kluczowych funkcjonalności
- Rejestracja i logowanie z walidacją haseł oraz obsługą błędów Supabase.
- Generowanie fiszek: prompt → propozycje, dialogi edycyjne (`EditFlashcardProposalDialog`, `UnsavedChangesDialog`), timeouty OpenRouter.
- Zarządzanie biblioteką: `SaveActions`, `FlashcardLibraryCard`, paginacja, potwierdzenia (`DeleteFlashcardAlertDialog`), toast (`ToastProvider`).
- Tryb przeglądania: `FlashcardDetailsDialog`, reveal answer, stan pustej biblioteki (`EmptyState`).
- API: `create`, `update`, `delete`, `get-user`, `generate-proposals` + walidacje.
- Uprawnienia: dostęp tylko dla właścicieli, brak edycji danych innych użytkowników (RLS).

## 5. Środowisko testowe
- Node.js 22.14.0 zgodnie z `.nvmrc`.
- Lokalny Supabase z migracjami (`supabase/migrations`) oraz stub/OpenRouter.
- Plik `.env.test` lub `.env` z kluczami Supabase i OpenRouter.
- Playwright w Chromium, Firefox, WebKit; Lighthouse przez `npx lighthouse http://localhost:4173`.
- GitHub Actions uruchamiają Vitest/Playwright i Lighthouse.

## 6. Narzędzia testowe
- Vitest + React Testing Library + MSW.
- Playwright (E2E, tryby headless/headed).
- Lighthouse i k6 (performance).
- Axe-core + Lighthouse (accessibility).
- OWASP ZAP + ESLint-plugin-security.
- Postman (testy API manualne/automatyczne).

## 7. Harmonogram
| Faza | Zadania | Czas |
|------|---------|------|
| 1 | Testy jednostkowe i integracyjne | Dni 1–2 |
| 2 | Playwright – ścieżki krytyczne | Dni 3–4 |
| 3 | Lighthouse + manualne testy ryzyk | Dzień 5 |
| 4 | Audyt raportowania i dokumentacja | Dzień 6 |
| 5 | Regresje w każdej iteracji | Każda iteracja w CI |

## 8. Kryteria akceptacji
- Pokrycie kluczowych usług (np. `src/lib/services`) ≥ 75%.
- Wszystkie testy w CI przechodzą, brak krytycznych błędów w trackerze.
- API P95 < 300 ms, Lighthouse Performance ≥ 90, WCAG 2.1 AA bez krytycznych issue.
- Brak 500 z Supabase/OpenRouter; statusy 200/201/204.

## 9. Role i odpowiedzialności
- **QA Engineer:** prowadzenie planu i raportów, definiowanie scenariuszy, analiza wyników.
- **Developer:** tworzenie testów jednostkowych/integracyjnych, poprawki i dokumentacja.
- **DevOps:** konfiguracja środowisk, CI/CD, monitorowanie pipeline.
- **Product Owner:** akceptacja kryteriów, priorytetyzacja defektów.
- **Tech Lead:** przegląd jakości kodu i testów, wsparcie techniczne.

## 10. Zgłaszanie błędów
1. GitHub Issues z etykietą `bug`, priorytetem P0–P3.
2. Pola obowiązkowe: tytuł, kroki, oczekiwane/aktualne, logi/screenshoty, priorytet.
3. QA weryfikuje, czy duplikat; przypisuje priorytet.
4. Developer poprawia i dodaje test regresyjny, tworzy PR.
5. QA retestuje i oznacza status `Fixed` lub `Reopen`.

## 11. Raportowanie i monitorowanie
- Automatyzacja Playwright + Lighthouse w CI, logi i screenshoty.
- Codzienny status testów (stand-up) z blokadami.
- Alerty dla krytycznych regresji (OpenRouter/Supabase).
