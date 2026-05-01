import { ProgressBar } from "@/src/components/patient/cognitive/components/screening-test/progressBar";
import { DrawingRenderer } from "@/src/components/patient/cognitive/components/screening-test/renderers/drawingRenderer";
import { ImageMcqRenderer } from "@/src/components/patient/cognitive/components/screening-test/renderers/imageMcqRenderer";
import { InstructionActionRenderer } from "@/src/components/patient/cognitive/components/screening-test/renderers/instructionActionRenderer";
import { MCQRenderer } from "@/src/components/patient/cognitive/components/screening-test/renderers/mcqRenderer";
import { PhraseRepeatRenderer } from "@/src/components/patient/cognitive/components/screening-test/renderers/phraseRepeatRenderer";
import { SerialSubtractionRenderer } from "@/src/components/patient/cognitive/components/screening-test/renderers/serialSubtractionRenderer";
import { TimerBar } from "@/src/components/patient/cognitive/components/screening-test/renderers/timeBar";
import { WordRecallRenderer } from "@/src/components/patient/cognitive/components/screening-test/renderers/wordRecallRenderer";
import { useAssessmentSession } from "@/src/hooks/useAssessmentSession";
import { useQuestionTimer } from "@/src/hooks/useQuestionTimer";
import { Question } from "@/src/types/assessment.types";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PATIENT_ID = "patient_001";
const CAREGIVER_ID = "caregiver-001";

export default function QuestionScreen() {
  const router = useRouter();
  const {
    session,
    currentQuestion,
    submitAnswer,
    goToNext: handleGoToNext,
    goToPrev: handleGoToPrev,
    markTimeExpired,
    isLoading,
    error,
  } = useAssessmentSession(PATIENT_ID, CAREGIVER_ID);

  // IMPORTANT: use optional chaining so hooks can run even when currentQuestion is null.
  const isRecallQuestion =
    currentQuestion?.type === "word_recall_display" ||
    currentQuestion?.type === "word_recall_input";

  const handleExpire = useCallback(() => {
    if (isRecallQuestion) return;
    markTimeExpired();
  }, [isRecallQuestion, markTimeExpired]);

  const timer = useQuestionTimer({
    limitSeconds: currentQuestion?.timeLimit ?? null,
    onExpire: handleExpire,
  });

  const handleAnswer = useCallback(
    async (answer: any) => {
      if (!currentQuestion) return;
      await submitAnswer(currentQuestion.id, answer);
    },
    [currentQuestion, submitAnswer]
  );

  const handleNext = useCallback(async () => {
    const updated = await handleGoToNext();
    if (updated?.status === "done") {
      router.replace("/patient/cognitive/assessment/results");
    } else {
      const nextIndex =
        updated?.currentQuestionIndex ?? session.currentQuestionIndex + 1;
      router.replace(`/patient/cognitive/assessment/${nextIndex}`);
    }
  }, [handleGoToNext, session.currentQuestionIndex, router]);

  const handleSkip = useCallback(async () => {
    if (!currentQuestion) return;
    await submitAnswer(currentQuestion.id, { skipped: true });
    await handleNext();
  }, [currentQuestion, submitAnswer, handleNext]);

  const handlePrev = useCallback(async () => {
    if (session.currentQuestionIndex > 0) {
      const updated = await handleGoToPrev();
      const prevIndex =
        updated?.currentQuestionIndex ?? session.currentQuestionIndex - 1;
      router.replace(`/patient/cognitive/assessment/${prevIndex}`);
    }
  }, [handleGoToPrev, session.currentQuestionIndex, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Loading questions...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-red-500">{error}</Text>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">No question found.</Text>
      </SafeAreaView>
    );
  }

  const answered = currentQuestion.id in session.answers;
  const canProceed = isRecallQuestion ? answered : answered || session.timeExpired;
  const canSkip = !answered;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
      <ProgressBar
        current={session.currentQuestionIndex + 1}
        total={session.totalQuestions}
        sectionName={currentQuestion.section}
      />

      {currentQuestion.timeLimit && (
        <TimerBar
          secondsLeft={timer.secondsLeft}
          isWarning={timer.isWarning}
          timeLimit={currentQuestion.timeLimit}
        />
      )}

      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="px-6 py-6">
          <Text className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">
            {currentQuestion.section}
          </Text>
          <Text className="text-2xl font-semibold text-gray-900 leading-snug">
            {currentQuestion.prompt}
          </Text>
        </View>

        <View className="mt-2">
          {renderQuestion(currentQuestion, handleAnswer, timer.secondsLeft)}
        </View>
      </ScrollView>

      <View className="px-6 pb-6 pt-3 gap-3 border-t border-gray-100 bg-white">
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed}
          className={`py-4 rounded-2xl items-center ${
            canProceed ? "bg-blue-500" : "bg-gray-200"
          }`}
        >
          <Text
            className={`font-semibold text-base ${
              canProceed ? "text-white" : "text-gray-400"
            }`}
          >
            {session.currentQuestionIndex === session.totalQuestions - 1
              ? "Finish"
              : "Next"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          disabled={!canSkip}
          className={`py-4 rounded-2xl items-center border ${
            canSkip ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-gray-100"
          }`}
        >
          <Text className={`font-semibold ${canSkip ? "text-amber-700" : "text-gray-400"}`}>
            Skip question
          </Text>
        </TouchableOpacity>

        {session.currentQuestionIndex > 0 && (
          <TouchableOpacity onPress={handlePrev} className="items-center py-2">
            <Text className="text-sm text-gray-400">Go back</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function renderQuestion(
  question: Question,
  onAnswer: (a: any) => void,
  secondsLeft: number
) {
  switch (question.type) {
    case "mcq":
      return <MCQRenderer question={question} onAnswer={onAnswer} />;
    case "image_mcq":
      return <ImageMcqRenderer question={question} onAnswer={onAnswer} />;
    case "word_recall_display":
    case "word_recall_input":
      return (
        <WordRecallRenderer
          question={question}
          onAnswer={onAnswer}
          secondsLeft={secondsLeft}
          timeLimit={question.timeLimit ?? null}
        />
      );
    case "serial_subtraction":
      return (
        <SerialSubtractionRenderer question={question} onAnswer={onAnswer} />
      );
    case "phrase_repeat":
      return <PhraseRepeatRenderer question={question} onAnswer={onAnswer} />;
    case "instruction_action":
      return (
        <InstructionActionRenderer question={question} onAnswer={onAnswer} />
      );
    case "drawing_canvas":
      return <DrawingRenderer question={question} onAnswer={onAnswer} />;
    default:
      return (
        <View className="px-6">
          <Text className="text-gray-400 text-sm">
            Renderer for `{question.type}` coming soon
          </Text>
        </View>
      );
  }
}