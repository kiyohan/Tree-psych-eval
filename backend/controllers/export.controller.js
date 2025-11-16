
const User = require('../models/User.model');
const Case = require('../models/Case.model');
const Drawing = require('../models/Drawing.model');
const Log = require('../models/Log.model');

// Export all system data as JSON
exports.exportSystemData = async (req, res) => {
  try {
    // Exclude sensitive fields like password
    const users = await User.find({}, '-password');
    const cases = await Case.find();
    const drawings = await Drawing.find();
    const logs = await Log.find();

    const exportData = {
      users,
      cases,
      drawings,
      logs,
      exportedAt: new Date()
    };

    res.setHeader('Content-Disposition', 'attachment; filename=system_data.json');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    res.status(500).json({ message: 'Failed to export system data', error: error.message });
  }
};
