interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

interface DriveFileContent {
  id: string;
  name: string;
  content: string;
}

class DriveService {
  private apiBaseUrl = 'http://localhost:5000'; // Your backend URL

  async listFiles(): Promise<DriveFile[]> {
    const response = await fetch(`${this.apiBaseUrl}/files`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to list files');
    return response.json();
  }

  async getFileContent(fileId: string): Promise<DriveFileContent> {
    const response = await fetch(`${this.apiBaseUrl}/files/${fileId}/content`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to get file content');
    return response.json();
  }

  async createTextFile(name: string, content: string = ''): Promise<DriveFile> {
    const response = await fetch(`${this.apiBaseUrl}/files`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, content })
    });
    if (!response.ok) throw new Error('Failed to create file');
    return response.json();
  }

  async updateFileContent(fileId: string, content: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/files/${fileId}/content`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to update file');
  }
}

const driveService = new DriveService();
export default driveService;