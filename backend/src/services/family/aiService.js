const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

const generateStory = async (data) => {
  const response = await axios.post(
    `${AI_SERVICE_URL}/generate-from-photo`,
    data,
    { timeout: 90000 }
  );
  return response.data;
};

module.exports = { generateStory };