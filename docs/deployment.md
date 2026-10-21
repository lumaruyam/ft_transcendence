# Running the project

One command builds and starts everything: the database, the backend, the frontend and the HTTPS proxy.

## What you need

- Docker with the Compose plugin (or Podman with a `docker` command)
- Bash and OpenSSL
- Free ports 8080 and 8443 (you can change them)

Node.js, PostgreSQL and the dependencies run in the containers.

## Start

```bash
git clone <repository> && cd ft_transcendence
./transcendence start
```

The first time, the script creates `.env` from `.env.example` and asks some questions. Press Enter to keep the default. The answers are saved in `.env`, so you do not have to edit it.

1. Mode: `dev` for local work, `prod` for a real server. In `prod` the backend refuses weak secrets and only accepts requests from your public address.
2. HTTP and HTTPS ports.
3. Public address of the app, for example `https://transcendence.example.com`. Leave it empty on a local machine.
4. TLS certificate and key. Give the paths of your files (for example from Let's Encrypt), or press Enter for a self-signed certificate.
5. Password of the admin page that opens and closes sign-ups (12 characters or more). Press Enter to get a random one. It is printed once and kept in `.env`.
6. GitHub OAuth id and secret. Press Enter to skip.

Then the script creates the secrets that need to be random, copies the certificate, builds the images (only what changed), starts the containers and applies the database migrations.

Open https://localhost:8443/ and accept the warning if the certificate is self-signed. Check that https://localhost:8443/api/health says `"status":"ok"`.

## Commands

| Command | What it does |
|---|---|
| `./transcendence start` | Start everything, building only what changed |
| `./transcendence stop` | Stop the containers (data is kept) |
| `./transcendence restart` | Stop, then start. Also copies your certificate again, so use it after a renewal |
| `./transcendence reload` | Rebuild only the frontend |
| `./transcendence setup` | Answer the setup questions again |
| `./transcendence oauth` | Enter the GitHub credentials again |
| `./transcendence clear` | Delete the containers and all the data (database, uploads) |
| `./transcendence clean` | Delete build leftovers. Running images and the database are kept |
| `--no-cache` (after a command) | Rebuild the images from scratch |

`docker compose up` alone is not enough on a fresh clone: it needs the `.env` and the certificate that the script prepares.

## What runs

| Service | Role | Reachable from the host |
|---|---|---|
| `nginx` | HTTPS, serves the frontend, forwards `/api/` and `/socket.io/` | ports 8443 (https) and 8080 (redirect) |
| `backend` | API and Socket.IO | no, only through nginx |
| `db` | PostgreSQL | no |
| `frontend` | Builds the pages, copies them for nginx, then stops | no |

Volumes: `db_data` (database), `uploads_data` (uploaded files), `frontend_dist` (built pages).

## Sign-ups

Anyone can sign up by default. To close or open sign-ups, go to `https://<your address>/api/admin/signup` and enter the admin password (`SIGNUP_ADMIN_PASSWORD` in `.env`). Existing users can still log in when sign-ups are closed. The page does not exist if no valid password is set.

## Security notes

- Every connection from a browser or a script uses HTTPS. `http://` is redirected to `https://`.
- Pages are sent with security headers and a strict Content-Security-Policy.
- Traffic between containers is not encrypted, but it stays on a private Docker network that is not published on the host.
- Logging out ends all the sessions of the account. Changing the password ends the other sessions.
- `Strict-Transport-Security` (HSTS) is not sent. A browser would remember it for the whole host, which causes trouble with self-signed certificates. Add it in `infra/nginx/default.conf.template` only when you have a real domain and a valid certificate, and start with a short `max-age`.

## GitHub login and Git integration

1. Create an OAuth App on <https://github.com/settings/developers>. Its callback URL must be the value of `GITHUB_OAUTH_REDIRECT_URI` in `.env` (default `https://localhost:8443/api/auth/oauth/github/callback`).
2. Run `./transcendence oauth` and enter the id and secret.
3. Log in with your email, open Settings and click "Link my GitHub account". GitHub login only works for accounts linked this way.
4. For webhooks to be added automatically when a card is linked to a branch, GitHub must be able to reach the app. Set `WEBHOOK_PUBLIC_URL` to the public https address. On a local machine leave it empty.

## Problems

- **Port already used:** change `HTTP_PORT` and `HTTPS_PORT` (run `./transcendence setup`).
- **Certificate warning:** normal with a self-signed certificate. To use your own, run `./transcendence setup`.
- **502 page:** the backend is not ready or crashed. Run `docker compose logs backend`. A missing setting is named in the error.
- **Start from zero:** `./transcendence clear`, then `./transcendence start`.
