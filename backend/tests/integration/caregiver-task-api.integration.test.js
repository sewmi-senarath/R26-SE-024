const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

process.env.NODE_ENV = "test";

// Exercise the caregiver routes without requiring a signed token.
const auth = require("../../src/middleware/auth");
auth.protect = (req, _res, next) => {
  req.user = { userId: "caregiver-1", role: "caregiver" };
  next();
};
auth.authorize = () => (_req, _res, next) => next();

const Task = require("../../src/models/caregiver/Task");
const taskRoutes = require("../../src/routes/caregiver/taskRoutes");
const { errorHandler } = require("../../src/middleware/errorHandler");

const originals = {
  find: Task.find,
  create: Task.create,
  findOne: Task.findOne,
};

let server;
let baseUrl;

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await response.json();
  return { response, body };
}

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/caregiver/tasks", taskRoutes);
  app.use(errorHandler);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  Object.assign(Task, originals);
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /tasks returns caregiver-scoped tasks and status counts", async () => {
  let receivedFilter;
  const tasks = [
    { _id: "task-1", status: "todo", overdueNotified: true },
    { _id: "task-2", status: "done", overdueNotified: false },
  ];
  Task.find = (filter) => {
    receivedFilter = filter;
    return { sort: async () => tasks };
  };

  const { response, body } = await request("/api/caregiver/tasks?date=2026-08-31");

  assert.equal(response.status, 200);
  assert.deepEqual(receivedFilter, {
    caregiverId: "caregiver-1",
    date: "2026-08-31",
  });
  assert.deepEqual(body.counts, { all: 2, todo: 1, done: 1 });
  assert.equal(body.tasks.length, 2);
});

test("POST /tasks creates a task owned by the authenticated caregiver", async () => {
  let createdPayload;
  Task.create = async (payload) => {
    createdPayload = payload;
    return { _id: "task-1", status: "todo", ...payload };
  };
  const payload = {
    title: "Morning walk",
    patientName: "Jane Doe",
    patientInitials: "JD",
    time: "8:00 AM",
    date: "2026-08-31",
  };

  const { response, body } = await request("/api/caregiver/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.task._id, "task-1");
  assert.equal(createdPayload.caregiverId, "caregiver-1");
  assert.equal(createdPayload.patientColor, "#4F8EF7");
  assert.equal(createdPayload.assignee, "SJ");
});

test("POST /tasks returns 400 when required fields are missing", async () => {
  let createCalled = false;
  Task.create = async () => {
    createCalled = true;
  };

  const { response, body } = await request("/api/caregiver/tasks", {
    method: "POST",
    body: JSON.stringify({ title: "Incomplete task" }),
  });

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /are required/);
  assert.equal(createCalled, false);
});

test("GET /tasks/:id returns 404 for a task outside the caregiver scope", async () => {
  let receivedFilter;
  Task.findOne = async (filter) => {
    receivedFilter = filter;
    return null;
  };

  const { response, body } = await request("/api/caregiver/tasks/task-404");

  assert.equal(response.status, 404);
  assert.deepEqual(receivedFilter, {
    _id: "task-404",
    caregiverId: "caregiver-1",
  });
  assert.equal(body.message, "Task not found");
});

test("PATCH /tasks/:id/toggle changes a caregiver task from todo to done", async () => {
  let receivedFilter;
  let saved = false;
  const task = {
    _id: "task-1",
    status: "todo",
    async save() {
      saved = true;
    },
  };
  Task.findOne = async (filter) => {
    receivedFilter = filter;
    return task;
  };

  const { response, body } = await request("/api/caregiver/tasks/task-1/toggle", {
    method: "PATCH",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(receivedFilter, { _id: "task-1", caregiverId: "caregiver-1" });
  assert.equal(body.task.status, "done");
  assert.equal(saved, true);
});
