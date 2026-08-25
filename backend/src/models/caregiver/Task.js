const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
    },
    patientInitials: {
      type: String,
      required: true,
    },
    patientColor: {
      type: String,
      default: '#4F8EF7',
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    status: {
      type: String,
      enum: ['todo', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['bathing', 'feeding', 'exercise', 'medication', 'outdoor', 'other'],
      default: 'other',
    },
    assignee: {
      type: String,
      default: 'SJ',
    },
    date: {
      type: String,
      required: true,
    },
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    overdueNotified: {
      type: Boolean,
      default: false, // flips to true once an overdue notification has been raised, so it isn't raised again on every fetch
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);