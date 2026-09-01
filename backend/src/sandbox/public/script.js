const TEST_PROJECT_ID = "22222222-2222-2222-2222-222222222222";

document.getElementById("board-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("board-title").value;
    const status = document.getElementById("board-status");
    const result = document.getElementById("board-result");

    try {
      const response = await fetch("/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: TEST_PROJECT_ID, title }),
      });

      const board = await response.json();
      result.textContent = JSON.stringify(board, null, 2);

      if (response.ok) {
        status.textContent = "✅ Board created";
        status.style.color = "green";
      } else {
        status.textContent = "❌ Error " + response.status;
        status.style.color = "red";
      }
    } catch (err) {
      status.textContent = "❌ Network error : " + err.message;
      status.style.color = "red";
    }
  });

  
document.getElementById("list-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const boardId = document.getElementById("board-id").value;
    const title = document.getElementById("list-title").value;
    const position = Number(document.getElementById("list-position").value);
    const status = document.getElementById("list-status");
    const result = document.getElementById("list-result");

    try {
      const response = await fetch("/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: boardId, title: title, position: position }),
      });

      const list = await response.json();
      result.textContent = JSON.stringify(list, null, 2);

      if (response.ok) {
        status.textContent = "✅ List Created";
        status.style.color = "green";
      } else {
        status.textContent = "❌ Error " + response.status;
        status.style.color = "red";
      }
    } catch (err) {
      status.textContent = "❌ Network error : " + err.message;
      status.style.color = "red";
    }
  });

  document.getElementById("card-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const listId = document.getElementById("list-id").value;
    const title = document.getElementById("card-title").value;
    const description = document.getElementById("card-description").value;
    const position = Number(document.getElementById("card-position").value);
    const status = document.getElementById("card-status");
    const result = document.getElementById("card-result");

    try {
      const response = await fetch("/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: listId, title: title, description: description, position: position }),
      });

      const list = await response.json();
      result.textContent = JSON.stringify(list, null, 2);

      if (response.ok) {
        status.textContent = "✅ Card Created";
        status.style.color = "green";
      } else {
        status.textContent = "❌ Error " + response.status;
        status.style.color = "red";
      }
    } catch (err) {
      status.textContent = "❌ Network error : " + err.message;
      status.style.color = "red";
    }
  });