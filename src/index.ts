import * as React from 'react'

declare global {
  interface Window {
    gapi?: any
  }
}

/**
 * Loads the Google API and Auth scripts and returns the signIn and signOut functions.
 */
const useGoogleAuth = ({
  clientId,
  cookiePolicy = 'single_host_origin',
  hostedDomains,
  fetchBasicProfile,
  onLoginChange,
  onLoginFailure,
  onLoadFailure,
  onLoginSuccess,
  onLogoutFailure,
  onLogoutSuccess,
  prompt = 'select_account',
  redirectUri,
  scope = [ 'profile' ],
  src =  'https://apis.google.com/js/platform.js',
  stayLoggedIn = false,
  uxMode = 'popup',
}: GoogleLoginProps) => {
  // if the google api script is loaded on the page
  const [gapiLoaded, setGapiLoaded] = React.useState(false)
  const [authLoaded, setAuthLoaded] = React.useState(false)

  /**
   * Initialize the script and loads it in the head of the document.
   */
  React.useEffect(() => {
    if (!document.getElementById('google-script')) {
      const script = document.createElement('script')
  
      script.setAttribute('id', 'google-script')
      script.src = src
      script.async = true
  
      script.addEventListener('load', () => setGapiLoaded(true))
      script.addEventListener('error', onLoadFailure)
  
      document.head.appendChild(script)

      return () => {
        script.removeEventListener('load', () => setGapiLoaded(true))
        script.removeEventListener('error', onLoadFailure)
      }
    }
  }, [])

  /**
   * Checks if the Google Api script is loaded on the page. If the script is,
   * initialize the Google API.
   */
  React.useEffect(() => {
    if (gapiLoaded) {
      const clientConfig: GoogleClientConfig = {
        client_id: clientId,
        cookie_policy: cookiePolicy,
        fetch_basic_profile: fetchBasicProfile,
        hosted_domains: hostedDomains,
        redirect_uri: uxMode === 'redirect' ? redirectUri : '',
        scope: scope.join(' '),
        ux_mode: uxMode,
      }

      if (stayLoggedIn) {
        clientConfig.access_type = 'offline'
      }

      window.gapi.load('auth2', 
        () => {
          // get the google auth object
          const googleAuth = window.gapi.auth2.getAuthInstance()

          setAuthLoaded(true)

          // no valid google auth object
          if (!googleAuth) {
            // initialize the google auth objec t
            window.gapi.auth2.init(clientConfig)
              // successful initialization
              .then((response: any) => {
                  // is the user authenticated?
                  const loggedIn = response.isSignedIn.get()

                  if (onLoginChange) {
                    // register the onLoginChange to the isSignedIn listener
                    response.isSignedIn.listen(onLoginChange)
                  }

                  // if the user is authenticated
                  if (loggedIn) {
                    // handle the successful login
                    handleLoginSuccess(response.currentUser.get())
                  }
                },
                // failed initialization
                (error: any) => {
                  console.error(error)

                  if (onLoadFailure) {
                    onLoadFailure(error)
                  }
                }
              )
              .catch((error: any) => console.error(error))
          }
          // valid google auth object
          else {
            // 
            googleAuth.then(
              () => {
                // if the user should stay authenticated
                if (stayLoggedIn) {
                  handleLoginSuccess(googleAuth.currentUser.get())
                }

                if (onLoginChange) {
                  // register the onLoginChange to the isSignedIn listener
                  googleAuth.isSignedIn.listener(onLoginChange)
                }
              },
              (error: any) => {
                console.error(error)

                handleLoginFailure(error)
              },
            )
          }
        },
        (error: any) => {
          onLoadFailure(error)
        },
      )
    }
  }, [gapiLoaded])

  /**
   * 
   * @param event - 
   */
  const signIn = () => {
    if (authLoaded) {
      const googleAuth = window.gapi.auth2.getAuthInstance()

      // the sign in options for the signIn call
      const signInOptions: GoogleSignInOptions = {
        prompt,
        redirect_uri: redirectUri,
        scope: scope.join(' '),
        ux_mode: uxMode,
      }

      if (googleAuth) {
        // authenticate with google
        googleAuth.signIn(signInOptions)
        .then(
          (response: any) => handleLoginSuccess(response),
          (error: any) => handleLoginFailure(error),
        )
      }
    }
  }

  const signOut = () => {
    if (authLoaded) {
      const googleAuth = window.gapi.auth2.getAuthInstance()

      if (googleAuth) {
        googleAuth.then(
          () => {
            googleAuth.signOut().then(
              () => {
                googleAuth.disconnect()

                if (onLogoutSuccess) {
                  onLogoutSuccess()
                }
              }
            )
          },
          (error: any) => onLogoutFailure(error)
        )
      }
    }
  }

  const handleLoginSuccess = (response: any) => {
    const basicProfile = response.getBasicProfile()
    const authResponse = response.getAuthResponse(true)

    if (onLoginSuccess) {
      onLoginSuccess({
        accessToken: authResponse.access_token,
        profile: {
          googleId: basicProfile.getId(),
          imageUrl: basicProfile.getImageUrl(),
          email: basicProfile.getEmail(),
          name: basicProfile.getName(),
          givenName: basicProfile.getGivenName(),
          familyName: basicProfile.getFamilyName(),
        },
        tokenId: authResponse.id_token,
        tokenObject: authResponse
      })
    }
  }

  const handleLoginFailure = (response: any) => {
    if (onLoginFailure) {
      onLoginFailure(response)
    }
  }

  React.useEffect(() => {
    // if auth2 is loaded and stay logged in
    if (authLoaded && stayLoggedIn) {
      // create a google auth instance
      const googleAuth = window.gapi.auth2.getAuthInstance()

      // if google auth and the user is signed in
      if (googleAuth && googleAuth.isSignedIn.get()) {
        // reload the auth response
        googleAuth.currentUser.get().reloadAuthResponse().then(
          (response: any) => handleLoginSuccess(response),
          (error: any) => handleLoginFailure(error),
        )
      }
    }
  }, [authLoaded])

  return {
    signIn,
    signOut,
  }
}

interface GoogleSuccessObject {}

interface GoogleFailureObject {}

interface GoogleClientConfig {
  /**
   * 
   */
  access_type?: 'offline'
  /**
   * The app's client id from the Google Developer Console.
   */
  client_id: string
  /**
   * The domains to create sign-in cookies for.
   */
  cookie_policy?: 'single_host_origin' | 'none' | string
  /**
   * Adds 'profile', 'email', and 'openid' scopes.
   */
  fetch_basic_profile?: boolean
  /**
   * The G Suite domain to which users must belong to sign in.
   * 
   * The email scope must exist for this to work.
   */
  hosted_domains: string
  /**
   * The uri to redirect to when using uxMode='redirect'.
   */
  redirect_uri?: string
  scope?: string
  /**
   * Determines if the user will be redirected away from the site or
   * if they will be shown a popup to login.
   */
  ux_mode?: 'popup' | 'redirect'
}

interface GoogleSignInOptions {
  /**
   * The specific mode for the consent flow.
   * - consent: 
   * - select_account: 
   * - none: 
   */
  prompt?: 'consent' | 'select_account' | 'none'
  /**
   * The uri to redirect to when using uxMode='redirect'.
   */
  redirect_uri?: string
  scope?: string
  /**
   * Determines if the user will be redirected away from the site or
   * if they will be shown a popup to login.
   */
  ux_mode?: 'popup' | 'redirect'
}

/**
 * Gapi client config docs: https://developers.google.com/identity/sign-in/web/reference#gapiauth2clientconfig
 */
interface GoogleLoginProps {
  /**
   * The app's client id from the Google Developer Console.
   */
  clientId: string
  /**
   * The domains to create sign-in cookies for.
   */
  cookiePolicy?: 'single_host_origin' | 'none' | string
  /**
   * Adds 'profile', 'email', and 'openid' scopes.
   */
  fetchBasicProfile?: boolean
  /**
   * The G Suite domain to which users must belong to sign in.
   * 
   * The email scope must exist for this to work.
   */
  hostedDomains?: string
  onLoadFailure?: (error: any) => void
  onLoginChange?: (loggedIn: boolean) => void
  onLoginFailure?: (error: GoogleFailureObject) => void
  onLoginSuccess?: (response: GoogleSuccessObject) => void
  onLogoutFailure?: (error: GoogleFailureObject) => void
  onLogoutSuccess?: () => void
  prompt?: 'consent' | 'select_account' | 'none'
  /**
   * The uri to redirect to when using uxMode='redirect'.
   */
  redirectUri?: string
  /**
   * Options for rendering the Login with Google Button
   */
  scope?: string[]
  src?: string
  stayLoggedIn?: boolean
  /**
   * Determines if the user will be redirected away from the site or
   * if they will be shown a popup to login.
   */
  uxMode?: 'popup' | 'redirect'
}

export type {
  GoogleFailureObject,
  GoogleLoginProps,
  GoogleSuccessObject,
}

export {
  useGoogleAuth
}

export default useGoogleAuth
