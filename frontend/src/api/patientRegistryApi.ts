import axios from "axios";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://172.20.10.3:5000";
const API = `${BASE_URL}/api/admin/patients`;

/**
 * Full patient registration record (PatientRegistry document).
 * Mirrors backend/src/models/Patient.js
 */
export interface PatientRegistry {
  _id: string;
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  customerCode?: string;
  registrationNumber?: string;
  gender?: string;
  nic?: string;
  dob?: string;
  joiningDate?: string;
  mobile?: string;
  homePhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  patientImage?: string;
  guardian?: {
    name?: string;
    nic?: string;
    relationship?: string;
    image?: string;
  };
}

/** Fields a patient may edit from the mobile profile screen. */
export type PatientRegistryUpdate = Partial<
  Pick<
    PatientRegistry,
    | "title"
    | "firstName"
    | "middleName"
    | "lastName"
    | "gender"
    | "nic"
    | "dob"
    | "mobile"
    | "homePhone"
    | "addressLine1"
    | "addressLine2"
    | "addressLine3"
  >
> & {
  guardian?: PatientRegistry["guardian"];
};

// GET /api/admin/patients/:id
export const getPatientRegistry = async (
  id: string,
): Promise<PatientRegistry> => {
  const res = await axios.get(`${API}/${id}`, { timeout: 10000 });
  if (!res.data?.success) {
    throw new Error(res.data?.message || "Could not load your details.");
  }
  return res.data.data as PatientRegistry;
};

// PUT /api/admin/patients/:id
export const updatePatientRegistry = async (
  id: string,
  update: PatientRegistryUpdate,
): Promise<PatientRegistry> => {
  const res = await axios.put(`${API}/${id}`, update, { timeout: 10000 });
  if (!res.data?.success) {
    throw new Error(res.data?.message || "Could not save your details.");
  }
  return res.data.data as PatientRegistry;
};
