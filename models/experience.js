const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
    company: String,
    role: String,
    location: String,
    startDate: String,
    endDate: String,
    description: String,
});

const Experience = mongoose.model('Experience', experienceSchema);

module.exports = Experience;
