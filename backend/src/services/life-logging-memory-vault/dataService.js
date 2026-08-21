const csv = require('csv-parser');
const fs = require('fs');
const BehaviorLog = require('../../models/life-logging-memory-vault/BehaviorLog');

const processBulkData = async (filePath, originalName, size) => {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          // Simulate AI Processing Logic
          const processedNodes = results.length * 100; // Mock calculation
          const aiConfidence = 85 + Math.random() * 10; // Mock confidence

          const log = new BehaviorLog({
            filename: originalName,
            size: (size / 1024).toFixed(2) + ' KB',
            processedNodes,
            aiConfidence: aiConfidence.toFixed(1),
            status: 'Completed'
          });

          await log.save();
          fs.unlinkSync(filePath); // Delete local temp file
          resolve(log);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => reject(err));
  });
};

module.exports = { processBulkData };
