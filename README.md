*This project has been created as part of the 42 curriculum by esergeev, bfourmy, lulmaruy, xzhen, mpareau.*

# Transcendance

A shared workspace for a team: a Kanban board, a whiteboard, live notes and files in one project. The board follows your Git branches on its own.

## Description

**Goal.** Give a team one place to plan work, draw ideas and write together, instead of three tools that do not talk to each other. Git drives the board, so it stays up to date without effort.

**What you can do**

- Create projects and invite people. Each person has a role: viewer, member or admin.
- Use a Kanban board with lists, cards and tags. Changes appear live on everyone's screen.
- Link a card to a GitHub branch. The card moves when a pull request is opened and when it is merged.
- Draw on a whiteboard and write notes together, at the same time.
- Store files in folders and attach them to cards.
- Get notifications and search cards, notes and files.
- Use a public REST API with API keys.
- Sign up with an email and a password. GitHub can be linked to an account later, to log in with it.

The interface is in French. This README and the code are in English.

## Instructions

### What you need

- Docker with the Compose plugin (or Podman with a `docker` command)
- Bash and OpenSSL
- Free ports 8080 and 8443 (you can change them)

Everything else (Node.js, PostgreSQL, dependencies) runs in the containers.

### Start the project

```bash
git clone <repository-url> && cd ft_transcendence
./transcendence start
```

The first time, the script asks a few questions and writes the answers in `.env`. You never need to edit `.env` by hand. Press Enter to keep the default of each question.

- Mode: `dev` (local work) or `prod` (strict checks, for a real server)
- HTTP and HTTPS ports
- Public address of the app (leave empty on a local machine)
- Your own TLS certificate and key (leave empty for a self-signed one)
- Password of the admin page that opens and closes sign-ups (leave empty to get a random one, shown once)
- GitHub OAuth id and secret (leave empty if you do not need GitHub)

Then open:

- https://localhost:8443/ : the app (accept the browser warning if the certificate is self-signed)
- https://localhost:8443/api/health : should say `"status":"ok"`
- https://localhost:8443/api-docs : documentation of the public API
- https://localhost:8443/api/admin/signup : open or close sign-ups (needs the admin password)

### Other commands

| Command | What it does |
|---|---|
| `./transcendence stop` | Stop the containers (data is kept) |
| `./transcendence restart` | Stop, then start again |
| `./transcendence reload` | Rebuild only the frontend |
| `./transcendence setup` | Answer the setup questions again |
| `./transcendence oauth` | Enter the GitHub credentials again |
| `./transcendence clear` | Delete the containers and all the data |
| `./transcendence clean` | Delete build leftovers |

More details are in [docs/deployment.md](docs/deployment.md).

### GitHub login

Create an OAuth App on <https://github.com/settings/developers>. Its callback URL is shown by `./transcendence start`. Then give the id and secret to `./transcendence oauth`.

GitHub never creates an account. First sign up with an email, then go to Settings and click "Link my GitHub account". After that, "Log in with GitHub" works for this account, even if the GitHub email is different.

### Tests

```bash
cd backend && npm ci && npm test
```

The 13 end-to-end suites run against the real app and a temporary PostgreSQL started in Docker. Your data is not touched.

## Team information

| Member | Role | Responsibilities |
|---|---|---|
| lulmaruy | Technical Lead, Developer | Foundation: accounts, login, GitHub OAuth, projects, members, permissions, public API, database, Docker and nginx |
| bfourmy | Project Manager, Developer | Kanban backend (lists, cards, tags), real-time layer (WebSockets), project documentation |
| esergeev | Developer | Git integration: branches, pull requests, webhooks |
| xzhen | Developer | Whiteboard, notes, search, notifications, file upload |
| mpareau | Product Owner, Developer | Interface: landing page, dashboard, Kanban screens, files page, start script |

## Project management

- The work was split into four tracks: foundation and API, Kanban and real time, Git integration, and whiteboard, notes and files.
- Each feature was built on its own branch and merged with a pull request into `dev`, then into `main`.
- Pull requests were used on GitHub, so changes were read before they were merged.
- End-to-end tests protect the main flows, so a change can be checked quickly.

## Technical stack

| Part | Choice | Why |
|---|---|---|
| Backend | Fastify (Node.js 22, TypeScript) | Fast, typed, with plugins for security headers, rate limits and uploads |
| Real time | Socket.IO | Rooms per project and automatic reconnection |
| Database | PostgreSQL 16 with Prisma | Typed queries, migrations, safe transactions |
| Frontend | Svelte 5 with Vite | Light and reactive, good for live boards |
| Whiteboard | Excalidraw | Ready-made drawing tool |
| Notes | Tiptap and Yjs | Several people can type together without conflicts |
| Git | Octokit and signed webhooks | Official GitHub client |
| Login | Salted password hashes, JWT, GitHub OAuth 2.0 | Standard and well known |
| Hosting | Docker Compose and nginx (HTTPS) | One command starts everything |

All connections from a browser or a script use HTTPS. The containers talk to each other on a private Docker network.

## Features list

| Feature | What it does | Developed by |
|---|---|---|
| Accounts | Sign up, log in, edit profile, delete account | lulmaruy |
| Sign-up switch | Admin page to open or close sign-ups | lulmaruy |
| Projects and members | Create projects, invite people, change roles | lulmaruy |
| Permissions | Viewer, member and admin rights, checked by the API and live connections | lulmaruy |
| Kanban board | Lists, cards, tags, drag and drop | bfourmy, mpareau |
| Live updates | Changes and online users appear instantly | bfourmy |
| Git integration | Link a card to a branch, pull requests move the card | esergeev |
| Whiteboard | Draw together | xzhen, bfourmy |
| Notes | Write together with cursors | xzhen |
| Files | Folders, upload, download, attach to cards | xzhen, mpareau |
| Notifications | Bell with unread count, live delivery | xzhen, lulmaruy |
| Search | One search over cards, notes and files | xzhen, mpareau |
| Public API | API keys, rate limit, documentation | lulmaruy |
| Legal pages | Privacy Policy and Terms of Service | lulmaruy |
| Deployment | One command, HTTPS, database migrations | lulmaruy, mpareau |

## Modules

Target: 18 points (6 major and 6 minor modules).

| # | Module | Type | Points | Team |
|---|---|---|---|---|
| 1 | Framework for frontend and backend (Fastify and Svelte) | Major | 2 | All |
| 2 | Real-time features with WebSockets | Major | 2 | bfourmy |
| 3 | Organization system (projects, members, invites) | Major | 2 | lulmaruy |
| 4 | Advanced permissions system | Major | 2 | lulmaruy |
| 5 | Public API with API keys, rate limit and documentation | Major | 2 | lulmaruy |
| 6 | Custom module: Git and webhook integration | Major | 2 | esergeev |
| 7 | ORM (Prisma) | Minor | 1 | lulmaruy |
| 8 | Remote authentication with OAuth 2.0 (GitHub) | Minor | 1 | lulmaruy |
| 9 | File upload and management | Minor | 1 | xzhen, mpareau |
| 10 | Complete notification system | Minor | 1 | xzhen, lulmaruy |
| 11 | Advanced search | Minor | 1 | xzhen, mpareau |
| 12 | Real-time collaborative features (whiteboard and notes) | Minor | 1 | xzhen, bfourmy |
| | **Total** | | **18** | |

**Custom module: Git and webhook integration.** We chose it because the board shows what the team plans, and Git shows what really happens. When both are linked, nobody has to move cards by hand. It is hard enough to count as a major module:

- The webhook route has no user session. It checks GitHub's signature on the raw request body before it reads anything, and it ignores a delivery it has already processed.
- The app uses the user's own GitHub token (stored encrypted) to list and create branches, and to register the repository webhook.
- A card moves forward only: In progress, then PR pending, then Done. A closed pull request without a merge goes back to In progress. Two webhooks at the same time cannot overwrite each other.
- Every delivery is saved in a log that project admins can read.
- The change is sent live to open boards and to every member as a notification.

It is tested with signed deliveries in `backend/tests/e2e/git-webhooks.e2e.ts`.

## Individual contributions

- **lulmaruy** built the base of the project: the Fastify server, the database and migrations, accounts, login and sessions, GitHub OAuth, projects, members and invitations, the permission system, the public API, the sign-up switch, and the Docker and nginx setup. The main difficulty was keeping permissions correct everywhere, including on open WebSocket connections. This was solved with one rule (the role stored in the project) and a test that calls every route with each role.
- **bfourmy** built the Kanban backend and the real-time layer: lists, cards, tags, the Socket.IO hub, online users and reconnection. The main difficulty was keeping every screen in sync when several people move cards at once. Each change is sent by the service that makes it, and the client reloads the project after a lost connection.
- **esergeev** built the Git integration: branch linking, GitHub calls, webhook checking, card status changes and the webhook log. The main difficulty was trusting incoming webhooks and avoiding wrong card moves. This was solved with signature checks, a one-way status flow and conditional updates.
- **xzhen** built the whiteboard, the collaborative notes, search, notifications and file upload. The main difficulty was merging edits from several people. Notes use Yjs for this, and the whiteboard merges changes on the server.
- **mpareau** built much of the interface: landing page, dashboard, Kanban screens, files page, settings, and the start script. The main difficulty was a clear interface that follows the user's role (a viewer gets a read-only board).

## Resources

- Fastify: <https://fastify.dev/docs/latest/>
- Prisma: <https://www.prisma.io/docs>
- PostgreSQL: <https://www.postgresql.org/docs/16/>
- Socket.IO: <https://socket.io/docs/v4/>
- Svelte: <https://svelte.dev/docs/svelte/overview>
- Vite: <https://vite.dev/guide/>
- Excalidraw: <https://docs.excalidraw.com/>
- Tiptap: <https://tiptap.dev/docs>
- Yjs: <https://docs.yjs.dev/>
- GitHub OAuth apps and webhooks: <https://docs.github.com/en/apps/oauth-apps>, <https://docs.github.com/en/webhooks>
- Octokit: <https://octokit.github.io/rest.js/>
- OAuth 2.0 (RFC 6749): <https://datatracker.ietf.org/doc/html/rfc6749>
- OpenAPI: <https://spec.openapis.org/oas/v3.0.3>
- Security headers and OWASP: <https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP>, <https://cheatsheetseries.owasp.org/>
- Docker Compose: <https://docs.docker.com/compose/>
- nginx: <https://nginx.org/en/docs/>

**How AI was used**

AI assistants (Claude Code) were used as a tool for specific tasks. Everything kept was read, tested and can be explained by the person who submitted it.

- Reviewing the code against the subject to find problems (for example login security and permission checks).
- Writing end-to-end tests against the real app.
- Fixing and cleaning code in the Git, login, permission, real-time and deployment parts.
- Writing and simplifying documentation.
