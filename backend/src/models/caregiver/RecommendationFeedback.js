const mongoose = require('mongoose');

const recommendationFeedbackSchema = new mongoose.Schema(
  {
    caregiverId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Caregiver',
      required: true,
    },

    // Recommendation details
    recommendationId:  { type: String, required: true }, // e.g. 'sleep-deficit'
    category:          { type: String, required: true }, // e.g. 'Sleep Management'
    title:             { type: String, required: true },

    // Feedback
    feedback: {
      type: String,
      enum: ['helpful', 'not_helpful'],
      required: true,
    },

    // Context when feedback was given
    stressLevel:  { type: String, enum: ['Low','Moderate','High'] },
    stressScore:  { type: Number },

  },
  { timestamps: true }
);

module.exports = mongoose.model('RecommendationFeedback', recommendationFeedbackSchema);