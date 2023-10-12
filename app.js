const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const startDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at port 3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
startDbAndServer();

const scene1 = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority === undefined
  );
};

const scene2 = (requestQuery) => {
  return (
    requestQuery.status === undefined && requestQuery.priority !== undefined
  );
};
const scene3 = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
app.get("/todos/", async (request, response) => {
  let queryTodo = "";
  let dbResponse = null;
  const requestQuery = request.query;
  const { search_q = "", priority, status } = requestQuery;

  switch (true) {
    case scene1(requestQuery):
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status='${status}';`;
      break;

    case scene2(requestQuery):
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority='${priority}';`;
      break;

    case scene3(requestQuery):
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority='${priority}' AND status='${status}';`;

      break;
    default:
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;

      break;
  }

  dbResponse = await db.all(queryTodo);
  response.send(dbResponse);
});

app.get("/todos/:todoId/", async (request, response) => {
  const todoIdObject = request.params;

  const { todoId } = todoIdObject;

  const todoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const dbResponse = await db.get(todoQuery);

  const { id, todo, priority, status } = dbResponse;
  const dbResponseResult = {
    id: id,
    todo: todo,
    priority: priority,
    status: status,
  };
  response.send(dbResponseResult);
});

app.post("/todos/", async (request, response) => {
  const requestBody = request.body;

  const { id, todo, priority, status } = requestBody;
  const todoQuery = `
  INSERT INTO todo(id, todo, priority, status )
  VALUES(${id},'${todo}','${priority}','${status}');
  `;
  await db.run(todoQuery);
  response.send("Todo Successfully Added");
});

const statusScene1 = (requestBody) => {
  return requestBody.hasOwnProperty("status");
};
const priorityScene2 = (requestBody) => {
  return requestBody.hasOwnProperty("priority");
};
app.put("/todos/:todoId/", async (request, response) => {
  let dbResponse = null;
  let sendingText = "";
  let todoQuery = "";
  const todoIdObject = request.params;
  const { todoId } = todoIdObject;
  const requestBody = request.body;
  const { status, priority, todo } = requestBody;
  switch (true) {
    case statusScene1(requestBody):
      sendingText = "Status Updated";
      todoQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
      break;
    case priorityScene2(requestBody):
      sendingText = "Priority Updated";
      todoQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
      break;
    default:
      sendingText = "Todo Updated";
      todoQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
      break;
  }
  dbResponse = await db.run(todoQuery);
  response.send(sendingText);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const todoIdObject = request.params;

  const { todoId } = todoIdObject;
  const todoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(todoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
