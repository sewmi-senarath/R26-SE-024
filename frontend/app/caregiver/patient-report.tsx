import PatientProfileScreen from "../../src/components/patient/common/profile/PatientProfileScreen";
import { useLocalSearchParams } from "expo-router";

// Caregiver entry point into a linked patient's profile (Overview + Reporting
// tabs), reusing the exact same screen the patient sees for themselves.
// Navigated to from reports.tsx ("View Cognitive Report") and from the
// patients list ("View Profile") with { patientId, patientName } params,
// where patientId is the linked registeredPatientId (a real User id), not
// the caregiver-side Patient document id.
export default function CaregiverPatientReportScreen() {
  const params = useLocalSearchParams<{ patientId?: string; patientName?: string }>();
  const patientId = typeof params.patientId === "string" ? params.patientId : undefined;
  const patientName = typeof params.patientName === "string" ? params.patientName : undefined;

  return (
    <PatientProfileScreen
      patientId={patientId}
      patientName={patientName}
      isCaregiverView
    />
  );
}
