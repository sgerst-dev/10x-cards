## Schemat bazy danych 10x-cards

### 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

#### a) Tabela `users`

Zarządzana przez Supabase Auth.

- **id**: UUID, Primary Key
- **email**: VARCHAR(255) NOT NULL UNIQUE
- **encrypted_password**: VARCHAR NOT NULL
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT now()
- **confirmed_at**: TIMESTAMPTZ

#### b) Tabela `flashcards`

- **id**: UUID, Primary Key
- **user_id**: UUID, NOT NULL, Foreign Key → `auth.users(id)`, ON DELETE CASCADE
- **generation_id**: UUID, Nullable, Foreign Key → `generation_sessions(id)`, ON DELETE RESTRICT
- **front**: VARCHAR(250), NOT NULL
- **back**: VARCHAR(500), NOT NULL
- **source**: ENUM('ai_generated', 'ai_edited', 'user_created'), NOT NULL
- **created_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()
- **updated_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now() (aktualizowany przez trigger przy UPDATE)

**Constraint CHECK**:

- `(source = 'user_created' AND generation_id IS NULL) OR (source IN ('ai_generated', 'ai_edited') AND generation_id IS NOT NULL)`

#### c) Tabela `generation_sessions`

- **id**: UUID, Primary Key
- **user_id**: UUID, Nullable, Foreign Key → `auth.users(id)`, ON DELETE SET NULL
- **model**: VARCHAR(100), NOT NULL
- **source_text_hash**: VARCHAR(64), NOT NULL _(SHA-256, wyliczany po stronie aplikacji)_
- **source_text_length**: INTEGER, NOT NULL
- **generated_count**: INTEGER, NOT NULL, CHECK (generated_count >= 0)
- **generated_proposals**: JSONB, NULLABLE _(cache wygenerowanych propozycji fiszek w formacie: `[{front, back, source}]`)_
- **accepted_count**: INTEGER, NULLABLE, CHECK (accepted_count >= 0)
- **accepted_edited_count**: INTEGER, NULLABLE, CHECK (accepted_edited_count >= 0)
- **created_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()

**Constraint CHECK**:

- `accepted_count + accepted_edited_count <= generated_count`

**Uwaga**: Kolumna `generated_proposals` służy jako cache - dla identycznego `source_text_hash` i `user_id` system zwraca zapisane propozycje bez ponownego wywoływania AI.

#### d) Tabela `generation_errors`

- **id**: UUID, Primary Key
- **user_id**: UUID, Nullable, Foreign Key → `auth.users(id)`, ON DELETE SET NULL
- **generation_id**: UUID, Nullable, Foreign Key → `generation_sessions(id)`, ON DELETE SET NULL _(referencja do sesji, która zakończyła się błędem)_
- **model**: VARCHAR(100), NOT NULL
- **source_text_hash**: VARCHAR(64), NOT NULL
- **source_text_length**: INTEGER, NOT NULL
- **error_code**: VARCHAR(100) NOT NULL
- **error_message**: TEXT, NOT NULL
- **created_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()

### 2. Relacje między tabelami

- `auth.users` (1) ←──── (N) `flashcards`
  - Relacja: `flashcards.user_id` odnosi się do `auth.users(id)`, z kaskadowym usuwaniem (ON DELETE CASCADE).

- `generation_sessions` (N) ←──── (1) `auth.users`
  - Relacja: `generation_sessions.user_id` odnosi się do `auth.users(id)`, z ustawieniem NULL przy usunięciu (ON DELETE SET NULL).

- `flashcards` (N) → (1) `generation_sessions`
  - Relacja: `flashcards.generation_id` odnosi się do `generation_sessions(id)`, z ograniczeniem ON DELETE RESTRICT.

- `generation_errors` (N) → (1) `auth.users`
  - Relacja: `generation_errors.user_id` odnosi się do `auth.users(id)`, z ustawieniem NULL przy usunięciu (ON DELETE SET NULL).

- `generation_errors` (N) → (1) `generation_sessions`
  - Relacja: `generation_errors.generation_id` odnosi się do `generation_sessions(id)`, z ustawieniem NULL przy usunięciu (ON DELETE SET NULL).

### 3. Indeksy

- **Tabela `flashcards`**:
  - Złożony indeks na kolumny `(user_id, created_at DESC)` – wspierający paginację posortowaną od najnowszych.

- **Tabela `generation_sessions`**:
  - Złożony indeks na kolumny `(user_id, source_text_hash)` – wspierający szybkie wyszukiwanie cache dla identycznego tekstu źródłowego.

### 4. Zasady PostgreSQL (RLS - Row Level Security)

W tabelach flashcards, generation_sessions oraz generation_errors wdrożyć polityki RLS, które pozwalają użytkownikowi na dostęp tylko do rekordów, gdzie user_id odpowiada identyfikatorowi użytkownika z Supabase Auth (np. auth.uid() = user_id).

### 5. Dodatkowe uwagi i wyjaśnienia

- **Trigger dla `updated_at`**: Należy utworzyć funkcję i trigger w PostgreSQL, który automatycznie aktualizuje pole `updated_at` przy każdej modyfikacji w tabeli `flashcards`.
- **Integracja z Supabase Auth**: Zarządzanie użytkownikami odbywa się przez `auth.users` – dodatkowa tabela profili nie jest wymagana.
- **Cache generowania fiszek**: Kolumna `generated_proposals` w tabeli `generation_sessions` przechowuje wygenerowane propozycje jako JSONB. Dzięki temu dla identycznego tekstu źródłowego (tego samego `source_text_hash`) system zwraca zapisane fiszki bez ponownego wywoływania AI, co redukuje koszty i czas odpowiedzi. Indeks na `(user_id, source_text_hash)` zapewnia szybkie wyszukiwanie cache.
