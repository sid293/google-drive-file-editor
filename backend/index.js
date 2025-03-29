require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(express.json());

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Generate Google OAuth URL
app.get('/auth/google/url', (req, res) => {
  console.log('/auth/google/url');
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ]
  });
  res.json({ url });
});

// Handle OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.redirect(process.env.REDIRECT_URI);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

// Get file content
app.get('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    });
    res.json({ content: response.data });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Update file content
app.put('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { content } = req.body;
    await drive.files.update({
      fileId,
      media: {
        mimeType: 'text/plain',
        body: content
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// List files
app.get('/api/files', async (req, res) => {
  try {
    const response = await drive.files.list({
      q: "mimeType='text/plain'",
      fields: 'files(id, name, modifiedTime)'
    });
    res.json({ files: response.data.files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
