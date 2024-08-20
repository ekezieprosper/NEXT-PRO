// const time = new Date().toLocaleString('en-NG', { 
//     timeZone: 'Africa/Lagos', 
//     hour: '2-digit', 
//     minute: '2-digit', 
//     hourCycle: 'h12' 
//   })
  
//   const [hour, minute, period] = time.split(/[:\s]/)
//   const createdOn = `${hour}:${minute} ${period}`
  

const mongoose = require("mongoose");
const cloudinary = require("../media/cloudinary");

const time = () => {
  const localTime = new Date().toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h12'
  });
  const [hour, minute, period] = localTime.split(/[:\s]/);
  return `${hour}:${minute} ${period}`;
};

const storySchema = new mongoose.Schema({
  text: {
    type: String,
    required: false,
  },
  story: [{
    type: String,
    required: false,
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
  }],
  views: [{
    type: mongoose.Schema.Types.ObjectId,
  }],
  date: {
    type: Date,
    default: Date.now,
    expires: '1d'
  },
  time: {
    type: String,
    default: time,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "player",
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "agent",
  },
});

storySchema.post('remove', async function(doc) {
  // Delete media from Cloudinary if it exists
  if (doc.story && doc.story.length > 0) {
    await Promise.all(doc.story.map(async (storyUrl) => {
      const publicId = storyUrl.split("/").pop().split(".")[0];
      const resourceType = storyUrl.match(/\.(mp4|mov|avi)$/) ? 'video' : 'image';
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    }));
  }
});

const Story = mongoose.model("stories", storySchema);

module.exports = Story;
