
interface AuthResponse {
  success: boolean;
  error?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
}

const GOOGLE_CLIENT_ID = ''; 
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file', 
  'https://www.googleapis.com/auth/drive.appdata', 
  'profile',
  'email'
];

class AuthService {
  private googleAuth: any = null;
  private isInitialized = false;
  private user: any = null;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              clientId: GOOGLE_CLIENT_ID,
              scope: GOOGLE_SCOPES.join(' '),
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            });

            this.googleAuth = window.gapi.auth2.getAuthInstance();
            this.isInitialized = true;

            if (this.googleAuth.isSignedIn.get()) {
              this.handleAuthUser(this.googleAuth.currentUser.get());
            }

            resolve();
          } catch (error) {
            console.error('Google API initialization error:', error);
            reject(error);
          }
        });
      };
      script.onerror = (error) => {
        console.error('Failed to load Google API script:', error);
        reject(new Error('Failed to load Google API script'));
      };
      document.body.appendChild(script);
    });
  }

  private handleAuthUser(googleUser: any): void {
    const profile = googleUser.getBasicProfile();
    const authResponse = googleUser.getAuthResponse();

    this.user = {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      picture: profile.getImageUrl(),
    };

    const token = authResponse.access_token;
    import('./driveService').then(module => {
      const driveService = module.default;
    });
  }

  async signIn(): Promise<AuthResponse> {
    if (!this.isInitialized) {
      try {
        await this.init();
      } catch (error) {
        return {
          success: false,
          error: 'Failed to initialize Google authentication'
        };
      }
    }

    try {
      const googleUser = await this.googleAuth.signIn();
      this.handleAuthUser(googleUser);

      return {
        success: true,
        user: this.user,
        token: googleUser.getAuthResponse().access_token
      };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      return {
        success: false,
        error: error.error || 'Failed to sign in with Google'
      };
    }
  }

  async signOut(): Promise<AuthResponse> {
    if (!this.isInitialized || !this.googleAuth) {
      return {
        success: true 
      };
    }

    try {
      await this.googleAuth.signOut();
      this.user = null;

      import('./driveService').then(module => {
        const driveService = module.default;
      });

      return { success: true };
    } catch (error: any) {
      console.error('Google Sign-Out error:', error);
      return {
        success: false,
        error: 'Failed to sign out'
      };
    }
  }

  isAuthenticated(): boolean {
    return this.isInitialized && this.googleAuth?.isSignedIn.get() === true;
  }

  getUser() {
    return this.user;
  }
}

const authService = new AuthService();
export default authService;

declare global {
  interface Window {
    gapi: any;
  }
}