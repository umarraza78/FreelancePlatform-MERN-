const mongoose = require('mongoose');
const crypto = require('crypto');

const messageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true, maxLength: 1000 },
  timestamp: { type: Date, default: Date.now, index: true },
  metadataHash: { type: String, required: false },
  read: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

messageSchema.index({ projectId: 1, timestamp: 1 });
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: 1 });

messageSchema.pre('save', function(next) {
  if (!this.metadataHash) {
    this.metadataHash = crypto.createHash('sha256')
      .update(`${this.senderId}${this.receiverId}${this.timestamp.getTime()}`)
      .digest('hex');
  }
  next();
});

messageSchema.methods.canAccess = function(userId) {
  return userId && 
    (userId.toString() === this.senderId.toString() || 
     userId.toString() === this.receiverId.toString());
};

module.exports = mongoose.model('Message', messageSchema); 