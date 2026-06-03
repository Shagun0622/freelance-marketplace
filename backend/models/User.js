const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["client", "freelancer", "admin"], default: "client" },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    preferredCurrency: { type: String, enum: ["USD", "INR", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"], default: "USD" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "" },
    skills: [{ type: String }],
    profilePicture: { type: String, default: "" },

    // ✅ Freelancer-specific fields
    title: { type: String, default: "" }, // e.g. "Full Stack Developer"
    hourlyRate: { type: Number, default: 0 },
    experienceLevel: { type: String, enum: ["Entry", "Intermediate", "Expert"], default: "Intermediate" },
    availability: { type: String, enum: ["Full-time", "Part-time", "Not available"], default: "Full-time" },

    // Work Experience
    workExperience: [{
        company: { type: String },
        role: { type: String },
        startYear: { type: Number },
        endYear: { type: Number },
        current: { type: Boolean, default: false },
        description: { type: String }
    }],

    // Certifications
    certifications: [{
        name: { type: String },
        issuer: { type: String },
        year: { type: Number },
        url: { type: String }
    }],

    // Portfolio
    portfolio: [{
        title: { type: String },
        description: { type: String },
        url: { type: String },
        imageUrl: { type: String }
    }],

    // Resume
    resumeUrl: { type: String, default: "" },

    // Auth fields
    googleId: { type: String, sparse: true, unique: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorSecret: String,
    isTwoFactorEnabled: { type: Boolean, default: false },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    // Ratings
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);