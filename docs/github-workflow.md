# Git Workflow Guide

This is the team's Git workflow for ft_transcendence: nobody pushes directly to `main` or `dev`, every change goes through a branch and a pull request. This also directly supports the project's evaluation requirements — the subject checks that the Git history shows real contributions from all members and proper work distribution, which a clean branch/PR history demonstrates far better than a history of direct commits to `main`.

There are three branch tiers:

- **`main`** — always in a demo-ready state. This is what gets evaluated, so nothing lands here until it's been confirmed working. Updated infrequently and deliberately.
- **`dev`** — the integration branch. Feature branches merge here first. This is where multiple people's work gets combined and tested together before being trusted enough for `main`.
- **feature branches** — one per task, branched off `dev`, where all actual day-to-day work happens.

There are two parts below: setup steps for whoever administers the repo, and the day-to-day workflow everyone follows.

---

## Part 1 — Repo admin setup (do this once, before anyone starts building)

This part is for whoever has admin access to the GitHub repo (likely the Tech Lead).

### 1. Protect the `main` branch

GitHub repo → **Settings → Branches → Add branch protection rule**, target branch `main`:

- Enable **"Require a pull request before merging"**
- Enable **"Require approvals"**, set to at least 1 — this enforces the code review practice the subject recommends, not just the no-direct-push rule
- Enable **"Require conversation resolution before merging"** — prevents merging while there's an unresolved review comment
- Enable **"Do not allow bypassing the above settings"** — without this, repo admins can still push directly, which defeats the point
- Leave **"Require status checks to pass"** off for now unless the team sets up CI; enable it later if you add automated tests/linting

With this in place, GitHub will physically reject a direct push to `main` from anyone, including admins — the only way changes land on `main` is through an approved, merged pull request.

### 2. Protect the `dev` branch too, with lighter rules

Same **Settings → Branches → Add branch protection rule**, target branch `dev`:

- Enable **"Require a pull request before merging"**
- Approvals can be optional here (or required — team's call), since the point of `dev` is to move fast and catch integration problems early, not to gate every merge behind review. Keep the hard gate (review + no direct pushes) on `main`, and let `dev` be the faster, looser tier.
- No need for "Require conversation resolution" here unless the team wants it — that level of rigor matters more right before something reaches `main`.

### 3. Set `dev` as the repository's default branch

**Settings → General → Default branch** → set to `dev`. This means anyone who clones the repo or opens a new PR defaults into `dev` context, which matches how the team will actually work day to day — `main` should feel like a deliberate, occasional destination, not the default target.

### 4. Promoting `dev` to `main`

Periodically (end of each week is a reasonable cadence, per the plan's timeline) — once `dev` has been integration-tested and a full `docker compose up` from `dev` actually works cleanly — open a PR from `dev` into `main`. This PR should get review from the Tech Lead specifically, since its job is different from a feature PR's: it's confirming "everything currently in `dev` is safe to call the new baseline," not reviewing individual lines of code that were already reviewed when they landed on `dev`.

### 5. Set the default branch behavior

**Settings → General → Pull Requests**:
- Enable **"Automatically delete head branches"** — keeps the branch list clean after merges, since a merged feature branch has no further use
- Choose one merge strategy and stick to it (see "Merge strategy" below) under **"Allow merge commits / squash merging / rebase merging"** — disable the ones you're not using so nobody picks the wrong one by accident

### 6. Share the branch naming convention

Post this in your team channel and in `README.md`'s Project Management section — see the naming scheme below.

### 7. Set up the directory-to-owner mapping as a reference

You already have this in `plan.md` section 8 (GitHub management plan) and `TODO.md`. Pin one of these in your team channel so reviewers know who should be reviewing what.

---

## Part 2 — Day-to-day workflow (for everyone, including the admin)

### Branch naming

Format: `<track-area>/<short-description>`, matching the areas from `TODO.md`:

- `foundation/jwt-auth`
- `kanban/drag-and-drop`
- `kanban/websocket-hub`
- `git/webhook-receiver`
- `whiteboard/excalidraw-embed`
- `notes/autosave`

This makes it obvious from the branch list alone who's likely working on what, even before opening a PR.

### The actual workflow, step by step

1. **Start from an up-to-date `dev`:**
   ```
   git checkout dev
   git pull origin dev
   ```

2. **Create your branch:**
   ```
   git checkout -b kanban/drag-and-drop
   ```

3. **Work and commit normally, with meaningful messages.** Since commit history is checked during evaluation, avoid messages like `fix`, `wip`, or `update` as your only commits — describe what changed:
   ```
   git commit -m "Add drag-and-drop reordering for cards within a list"
   ```
   Committing in small, logical chunks (rather than one giant commit at the end) also makes review easier and gives a clearer record of who did what.

4. **Push your branch:**
   ```
   git push origin kanban/drag-and-drop
   ```

5. **Open a pull request into `dev`** on GitHub. In the PR description, briefly note:
   - What this PR does
   - Which module(s) or plan section it relates to (e.g. "part of Real-time features module, plan.md section 3")
   - Anything the reviewer should specifically check

6. **Request a review from the relevant owner**, per the directory ownership table in `plan.md` section 8. If your change touches another track's files (e.g. Public API wrapping someone else's endpoint), tag both.

7. **Address review comments**, push follow-up commits to the same branch (they'll show up on the same PR automatically).

8. **Once approved (if required) and merged into `dev`**, the branch's job is done. `main` gets updated separately, in batches, via the periodic `dev` → `main` promotion described in the admin setup above — individual feature branches never target `main` directly.

9. **Delete the branch after merge** (automatic, per the admin setup above) and pull the updated `dev` locally before starting your next branch.

### Keeping your branch current

If `dev` moves while you're still working (e.g. Track 1 merges foundational auth changes your branch needs), update your branch before it goes stale:

```
git checkout kanban/drag-and-drop
git fetch origin
git merge origin/dev
```

Do this periodically rather than only right before opening a PR — a branch that's diverged from `dev` for two weeks is far more painful to reconcile than one updated every few days.

### Merge strategy

Recommend **squash merging**: each PR becomes one clean commit on `main`, even if your branch had 15 small WIP commits. This keeps `main`'s history readable (one line per feature) while your branch's messier in-progress commits still exist in the PR's history if anyone needs to dig into them later. Set this as the only allowed strategy in the admin settings above so the team doesn't have to think about which to pick each time.

### What this looks like for cross-track dependencies

Some work genuinely depends on another track's branch landing first (e.g. Track 2's Kanban work depends on Track 1's auth/permissions being merged to `dev`). In that case:
- Don't build directly on top of someone else's *unmerged* branch if you can avoid it — wait for their PR to merge into `dev`, then branch from the updated `dev`
- If you truly can't wait (e.g. tight week-1 timeline), it's fine to branch off their branch instead of `dev`, but say so explicitly in your own PR description ("built on top of `foundation/jwt-auth`, rebase onto `dev` after that merges") so nobody's confused later about why your branch has extra commits that aren't yours

---

## Quick reference for the team

- Three tiers: `main` (evaluation-ready, rarely updated) ← `dev` (integration branch, default target) ← feature branches (day-to-day work)
- Never push to `main` or `dev` directly — GitHub will block it anyway once branch protection is set up
- Branch off `dev`, not `main`
- One branch per task, named `<area>/<description>`
- Small, meaningful commits, not one giant commit per feature
- PRs target `dev`; `main` only gets updated via a periodic, Tech-Lead-reviewed `dev` → `main` promotion once things are confirmed working end to end
- Squash merge, branch auto-deletes after
- Update your branch from `dev` periodically if your work spans more than a few days
