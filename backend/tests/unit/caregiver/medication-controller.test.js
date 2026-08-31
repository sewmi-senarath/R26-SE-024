const { after, test } = require("node:test");
const assert = require("node:assert/strict");

const Medication = require("../../../src/models/caregiver/Medication");
const {
  getMedications,
  createMedication,
  toggleMedicationStatus,
  deleteMedication,
} = require("../../../src/controllers/caregiver/medicationController");

const originals = {
  find: Medication.find,
  create: Medication.create,
  findOne: Medication.findOne,
  findOneAndDelete: Medication.findOneAndDelete,
};

function mockResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function request(overrides = {}) {
  return {
    user: { userId: "caregiver-1", role: "caregiver" },
    params: {},
    body: {},
    ...overrides,
  };
}

after(() => {
  Object.assign(Medication, originals);
});

test("getMedications scopes the query to the logged-in caregiver", async () => {
  let filter;
  const medications = [{ _id: "med-1", status: "taken" }];
  Medication.find = (receivedFilter) => {
    filter = receivedFilter;
    return { sort: async () => medications };
  };
  const res = mockResponse();

  await getMedications(request(), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.medications, medications);
  assert.deepEqual(filter, { caregiverId: "caregiver-1" });
});

test("createMedication rejects an incomplete payload", async () => {
  let createCalled = false;
  Medication.create = async () => {
    createCalled = true;
  };
  const res = mockResponse();

  await createMedication(request({ body: { name: "Donepezil" } }), res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /are required/);
  assert.equal(createCalled, false);
});

test("createMedication applies defaults and caregiver ownership", async () => {
  let createdPayload;
  Medication.create = async (payload) => {
    createdPayload = payload;
    return { _id: "med-1", ...payload };
  };
  const res = mockResponse();
  const body = {
    name: "Donepezil",
    dose: "5 mg",
    time: "8:00 AM",
    patientId: "patient-1",
    patientName: "Jane Doe",
  };

  await createMedication(request({ body }), res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.deepEqual(createdPayload, {
    ...body,
    form: "Tablet",
    notes: "",
    timeSlot: "morning",
    patientInitials: "JA",
    patientColor: "#4F8EF7",
    caregiverId: "caregiver-1",
    status: "pending",
    streak: 0,
  });
});

test("toggleMedicationStatus marks a pending medication as taken", async () => {
  let receivedFilter;
  let saved = false;
  const medication = {
    status: "pending",
    streak: 2,
    async save() {
      saved = true;
    },
  };
  Medication.findOne = async (filter) => {
    receivedFilter = filter;
    return medication;
  };
  const res = mockResponse();

  await toggleMedicationStatus(request({ params: { id: "med-1" } }), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(receivedFilter, { _id: "med-1", caregiverId: "caregiver-1" });
  assert.equal(medication.status, "taken");
  assert.equal(medication.streak, 3);
  assert.equal(saved, true);
});

test("deleteMedication returns 404 when the caregiver does not own the medication", async () => {
  let receivedFilter;
  Medication.findOneAndDelete = async (filter) => {
    receivedFilter = filter;
    return null;
  };
  const res = mockResponse();

  await deleteMedication(request({ params: { id: "med-1" } }), res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(receivedFilter, { _id: "med-1", caregiverId: "caregiver-1" });
  assert.equal(res.body.message, "Medication not found");
});
