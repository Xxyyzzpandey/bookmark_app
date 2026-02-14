# 🔖 Smart Bookmark Manager

A secure, real-time bookmarking application that allows users to save, organize, and sync web links across devices. Built with a focus on data privacy and instantaneous UI updates.



## 🎯 Project Requirements & Progress

- [x] **Next.js & Tailwind CSS:** Clean, responsive UI with a mobile-first approach.
- [x] **Google Authentication:** Managed via Supabase Auth for secure entry.
- [x] **Data Privacy (RLS):** Row Level Security ensures users only see their own bookmarks.
- [x] **Real-time Sync:** No page refreshes required to see updates across tabs.
- [x] **TypeScript:** Full type safety for database models and components.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 14 (App Router)
* **Styling:** Tailwind CSS
* **Database & Auth:** Supabase (PostgreSQL)
* **Language:** TypeScript
* **Deployment:** Vercel

---

## 🏗️ Database Architecture

The PostgreSQL database uses a strict schema to maintain data integrity and user isolation.

| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, `gen_random_uuid()` |
| `created_at` | `timestamptz` | `now()` |
| `title` | `text` | NOT NULL |
| `url` | `text` | NOT NULL |
| `user_id` | `uuid` | Foreign Key (References `auth.users`) |

---

## 💡 Challenges Overcome (Problem & Solution)

### 1. The Foreign Key Constraint Error
* **Problem:** I encountered a `violates foreign key constraint "bookmarks_id_fkey"` error during the first insert attempt. This happened because the `id` column was mistakenly linked to the User table instead of the `user_id` column.
* **Solution:** I rebuilt the table schema using the Supabase SQL Editor, ensuring the Primary Key (`id`) was independent and the Foreign Key was correctly mapped to `user_id` which references `auth.users(id)`.

### 2. Static UI vs. Real-time Updates
* **Problem:** New bookmarks only appeared after a manual browser refresh, failing the "instant reflection" requirement.
* **Solution:** I enabled **Postgres Replication** in the Supabase dashboard for the `bookmarks` table. Then, I implemented a `supabase.channel()` listener in the frontend that detects `INSERT` and `DELETE` events, updating the React state immediately without a page reload.

### 3. Data Leaks & Security
* **Problem:** Initially, any logged-in user could see bookmarks belonging to other users.
* **Solution:** I implemented **Row Level Security (RLS)**. By creating a policy `USING (auth.uid() = user_id)`, the database now automatically filters data so users can only interact with rows they created.

### 4. 409 Conflict Errors
* **Problem:** The application would crash when trying to add a URL that already existed in the database due to an accidental "Unique" constraint.
* **Solution:** I adjusted the database schema to remove the unique constraint on the `url` column, allowing multiple users to bookmark the same link while still keeping their entries private.

---

## 🔧 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [your-repo-link]
    cd smart-bookmark-manager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```