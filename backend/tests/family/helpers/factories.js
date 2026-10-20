const Patient = require('../../../src/models/caregiver/Patient');
const { createUser } = require('../../caregiver/helpers/factories');

let counter = 0;
const uniq = () => `${Date.now()}-${++counter}`;

// a real caregiver-owned Patient doc + a family User linked to it —
// mirrors how linking really works (User.linkedPatientId -> Patient._id),
// just set directly instead of going through the registration flow
const createLinkedFamily = async (patientOverrides = {}) => {
  const { user: caregiver } = await createUser('caregiver');
  const patient = await Patient.create({
    name: 'Test Patient',
    initials: 'TP',
    age: 70,
    condition: 'Moderate',
    stage: 'Early-Mid Stage',
    caregiverId: caregiver._id,
    ...patientOverrides,
  });
  const { user: family, token } = await createUser('family', { linkedPatientId: patient._id });
  return { patient, family, token };
};

module.exports = { createLinkedFamily, uniq };
