import { MMSESession } from "@/src/types/assessment.types";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import {
  AIPredictionCard,
  AIPredictionCardHandle,
} from "../../../cognitive/components/screening-test/AIPredictionCard";
import { SectionHeader } from "../components/SectionHeader";
import { FaqFormModal } from "./FaqFormModal";

interface SeverityCheckSectionProps {
  patientId: string;
  latestSession: MMSESession | null;
  // False for a caregiver viewing another patient's profile - that flow has
  // no route to hand off to for taking the assessment on the patient's
  // behalf, so the CTA is hidden rather than pointing somewhere that won't work.
  showTakeAssessmentCta?: boolean;
}

// The one place a "run/re-run" AI triage check lives - used identically by a
// patient viewing their own profile and by a caregiver viewing a linked
// patient's profile (both render this same component through
// PatientProfileScreen). See docs/plan for why this replaced the earlier,
// separate caregiver-inline-card design.
export function SeverityCheckSection({
  patientId,
  latestSession,
  showTakeAssessmentCta = true,
}: SeverityCheckSectionProps) {
  const router = useRouter();
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const cardRef = useRef<AIPredictionCardHandle>(null);

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#E2E8F0",
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 20,
        padding: 20,
      }}
    >
      <SectionHeader title="AI Triage Check" icon="pulse-outline" />

      {!latestSession ? (
        <View>
          <Text style={{ color: "#64748B", fontSize: 14, fontWeight: "700", marginBottom: showTakeAssessmentCta ? 12 : 0 }}>
            No completed assessment yet - the triage check needs one first.
          </Text>
          {showTakeAssessmentCta && (
            <TouchableOpacity
              onPress={() => router.push("/patient/cognitive/assessment")}
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#3B82F6",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
                Take the assessment
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <AIPredictionCard
            ref={cardRef}
            patientId={patientId}
            autoRun={false}
            onFaqRequired={() => setFaqModalOpen(true)}
          />

          {/* Re-open the questionnaire any time, not just on the first run.
              Submitting again re-runs the triage, which picks up the latest
              MMSE score and the new answers. */}
          <TouchableOpacity
            onPress={() => setFaqModalOpen(true)}
            style={{
              alignSelf: "flex-start",
              borderColor: "#CBD5E1",
              borderRadius: 12,
              borderWidth: 1,
              marginTop: 4,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#475569", fontSize: 13, fontWeight: "700" }}>
              Retake questionnaire
            </Text>
          </TouchableOpacity>

          <FaqFormModal
            visible={faqModalOpen}
            patientId={patientId}
            onClose={() => setFaqModalOpen(false)}
            onSubmitted={() => {
              setFaqModalOpen(false);
              cardRef.current?.run();
            }}
          />
        </>
      )}
    </View>
  );
}
