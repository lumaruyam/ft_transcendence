// TEMPORARY dev-only seed, remove once signup and project creation work end to end
// creates a test user, two test projects, and one board with a list and a card
// safe to run on every boot, skips anything that already exists
import { prisma } from "../db/prisma/client.js";
import { getOrCreateBoardForProject } from "../modules/kanban/board.service.js";
import { createList } from "../modules/kanban/list.service.js";
import { createCard } from "../modules/kanban/card.service.js";

const TEST_USER_ID = "11111111-1111-1111-1111-111111111111";

const TEST_PROJECTS = [
  { id: "22222222-2222-2222-2222-222222222222", name: "Test Project" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Test Project 2" },
];

export async function seedDevData(): Promise<void> {
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: {
      id: TEST_USER_ID,
      email: "test@test.com",
      passwordHash: "x",
      passwordSalt: "x",
      name: "Test User",
    },
  });

  for (const project of TEST_PROJECTS) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {},
      create: { id: project.id, name: project.name, ownerId: TEST_USER_ID },
    });
  }

  const board = await getOrCreateBoardForProject(TEST_PROJECTS[0].id);
  if (board && board.lists.length === 0) {
    const list = await createList({ boardId: board.id, title: "To Do", position: 0 });
    await createCard({ listId: list.id, title: "Example card", position: 0 });
  }
}
