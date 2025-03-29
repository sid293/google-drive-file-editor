const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

app.get('/auth/google/url', (req, res) => {
  console.log('Generating Google OAuth URL...');
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  });
  res.json({ url });
});

app.post('/files', async (req, res) => {
  console.log("create file request");
  try {
    const { name, content } = req.body;
    
    const fileMetadata = {
      name: name,
      mimeType: 'text/plain'
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: {
        mimeType: 'text/plain',
        body: content
      },
      fields: 'id, name, mimeType, modifiedTime'
    });

    res.json(file.data);
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

app.get('/auth/google/callback', async (req, res) => {
  console.log("callback")
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.redirect(process.env.FRONTEND_URL);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

app.get('/files', async (req, res) => {
  console.log("list files request")
  try {
    const response = await drive.files.list({
      pageSize: 10,
      q: 'trashed = false',
      fields: 'files(id, name, mimeType, modifiedTime)'
    });
    res.json(response.data.files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.get('/files/:fileId/content', async (req, res) => {
  console.log("get file content request")
  try {
    const { fileId } = req.params;
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    });
    res.json({ content: response.data });
  } catch (error) {
    console.error('Error getting file content:', error);
    res.status(500).json({ error: 'Failed to get file content' });
  }
});

const people = google.people({ version: 'v1', auth: oauth2Client });
app.get('/api/auth/status', async (req, res) => {
  try {
    const credentials = oauth2Client.credentials;
    if (credentials && credentials.access_token) {
      const userInfo = await people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses,names'
      });

      const userData = {
        id:userInfo.data.resourceName,
        name:userInfo.data.names[0].displayName,
        email:userInfo.data.emailAddresses[0].value,
      }
      res.json({
        isAuthenticated: true,
        user: userData
      });
    } else {
      res.json({
        isAuthenticated: false,
        user: null
      });
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({
      isAuthenticated: false,
      error: 'Failed to check authentication status'
    });
  }
});

app.put('/files/:fileId/content', async (req, res) => {
  console.log("update file content request")
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

app.delete('/files/:fileId', async (req, res) => {
  console.log("delete file request");
  try {
    const { fileId } = req.params;
    await drive.files.delete({
      fileId
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});