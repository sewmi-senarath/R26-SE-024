import { Question, SavedDrawing } from "@/src/types/assessment.types";
import React from "react";
import { Text, View } from "react-native";
import { DrawingRenderer } from "./drawingRenderer";
import { ImageMcqRenderer } from "./imageMcqRenderer";
import { InstructionActionRenderer } from "./instructionActionRenderer";
import { MCQRenderer } from "./mcqRenderer";
import { PhraseRepeatRenderer } from "./phraseRepeatRenderer";
import { SerialSubtractionRenderer } from "./serialSubtractionRenderer";
import { TextInputRenderer } from "./textInputRenderer";
import { WordRecallRenderer } from "./wordRecallRenderer";

interface RenderQuestionProps {
  question: Question;
  onAnswer: (answer: any, extras?: { drawing?: SavedDrawing }) => void;
  secondsLeft: number;
  // Review mode: the saved answer (and drawing) to show, controls blocked.
  answer?: unknown;
  drawing?: SavedDrawing;
  readOnly?: boolean;
}

// One place that maps a question type to its renderer - used by the live
// test screen and by the read-only answer review.
export function renderQuestion({
  question,
  onAnswer,
  secondsLeft,
  answer,
  drawing,
  readOnly,
}: RenderQuestionProps) {
  switch (question.type) {
    case "mcq":
      return (
        <MCQRenderer question={question} onAnswer={onAnswer} answer={answer} />
      );
    case "image_mcq":
      return (
        <ImageMcqRenderer
          question={question}
          onAnswer={onAnswer}
          answer={answer}
        />
      );
    case "word_recall_display":
    case "word_recall_input":
      return (
        <WordRecallRenderer
          question={question}
          onAnswer={onAnswer}
          secondsLeft={secondsLeft}
          timeLimit={question.timeLimit ?? null}
          answer={answer}
          readOnly={readOnly}
        />
      );
    case "serial_subtraction":
      return (
        <SerialSubtractionRenderer
          question={question}
          onAnswer={onAnswer}
          answer={answer}
        />
      );
    case "phrase_repeat":
      return (
        <PhraseRepeatRenderer
          question={question}
          onAnswer={onAnswer}
          answer={answer}
        />
      );
    case "text_input":
      return (
        <TextInputRenderer
          question={question}
          onAnswer={onAnswer}
          answer={answer}
          readOnly={readOnly}
        />
      );
    case "instruction_action":
      return (
        <InstructionActionRenderer
          question={question}
          onAnswer={onAnswer}
          answer={answer}
        />
      );
    case "drawing_canvas":
      return (
        <DrawingRenderer
          question={question}
          onAnswer={(passed, saved) => onAnswer(passed, { drawing: saved })}
          answer={answer}
          drawing={drawing}
          readOnly={readOnly}
        />
      );
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
