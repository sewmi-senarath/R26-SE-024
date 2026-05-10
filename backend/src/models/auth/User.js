const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Core fields (all roles) ────────────────────────────────────────────
    fullName: {
      type:     String,
      required: [true, 'Full name is required'],
      trim:     true,
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: 6,
      select:    false,
    },
    role: {
      type:     String,
      enum:     ['patient', 'caregiver', 'family'],
      required: [true, 'Role is required'],
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    refreshToken: {
      type:   String,
      select: false,
    },

    // ── Patient Step 1 fields ─────────────────────────────────────────────
    age:               { type: Number },
    gender:            { type: String },
    preferredLanguage: { type: String },
    cognitiveLevel:    { type: String },
    hometown:          { type: String },
    hobbies:           { type: String },
    interests:         { type: String },

    // ── Patient Step 2 fields ─────────────────────────────────────────────
    familyMembers:  { type: String },
    lifeEvents:     { type: String },
    countriesLived: { type: String },
    occupations:    { type: String },

    // ── Patient Step 3 fields ─────────────────────────────────────────────
    favoritePlaces:      { type: String },
    favoritePlacesText:  { type: String },
    festivalsCelebrated: { type: String },
    foodsPreferred:      { type: String },
    preferredSports:     { type: String },
    preferredSportsText: { type: String },
    languagesPreferred:  { type: String },
    assignedCaregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Caregiver extra fields ────────────────────────────────────────────
    avatarColor:      { type: String, default: '#2563EB' },
    isOnline:         { type: Boolean, default: true },
    shiftsCompleted:  { type: Number,  default: 0 },
    patientsAssigned: { type: Number,  default: 0 },
    hoursThisWeek:    { type: Number,  default: 0 },
    profileImage:     { type: String },
  },
  { timestamps: true }
);

// ── Hash password on save ─────────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Compare passwords ─────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
