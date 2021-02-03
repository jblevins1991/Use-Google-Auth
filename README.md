# Use-Google-Auth

![Pipeline](https://github.com/jblevins1991/Use-Google-Auth/workflows/Pipeline/badge.svg)

A single React Hook that loads the google api script in the head of your application and provides login and logout with Google functionality.

## Installation

```shell
npm install @nightowl-developers/use-google-auth
```

or

```shell
yarn add @nightowl-developers/use-google-auth
```

## Usage

Usage is pretty straight-forward. The hook returns two functions that can be attached to a button element.

```javascript
import * as React from 'react'

import useGoogleAuth from '@nightowl-developers/use-google-auth'

const MyComponent = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  
  const {
    signIn,
    signOut,
  } = useGoogleAuth({
    clientId: 'your-google-client-id',
    onLoginChange: (loggedIn) => {
      setIsLoggedIn(loggedIn)
    },
    onLoginSuccess: (response) => {
      setIsLoggedIn(true)
      console.log('logged in success', response)
    },
    onLoginFailure: (error) => {
      setIsLoggedIn(false)
      console.log('logged in failure', error)
    },
  })
  
  return <>
    {isLoggedIn && <button onClick={signIn}>Sign In</button>}
    
    {!isLoggedIn && <button onClick={signOut}>Sign Out</button>}
  </>
}
```

### Hook API

The `useGoogleAuth` hook takes an object with the following properties.

| Property | Default Value | Values | Description |
|----------|---------------|--------|-------------|
| clientId          ||| The Google Client Id from your Google Developer Console. |
| cookiePolicy      | 'single_host_origin'| 'single_host_origin', 'none', string | |
| hostedDomains     ||| The G Suite domain in which users must belong to sign in. |
| fetchBasicProfile ||| Adds 'profile email and openid' to scopes. |
| onLoginChange     ||| Callback function when auth changes without interaction. |
| onLoginSuccess    ||| Callback function when a user authenticates successfully. |
| onLoginFailure    ||| Callback function when a user fails to authenticate. |
| onLogoutFailure   ||| Callback function when a user logs out successfully. |
| onLogoutSuccess   ||| Callback function when a user fails to log out. |
| prompt            | 'select_account'| 'consent', 'select_account', 'none'  | The consent flow mode (consent, select_account, or none). |
| redirectUrl       ||| The uri to redirect to when uxMode is 'redirect'. |
| scope             | ['profile']|| An arry of permission scopes. |
| src               | 'https://apis.google.com/js/platform.js || The URL to the Google API javascript script. |
| stayLoggedIn      | false | true, false | When true, the user will stay logged in between visites to your site. |
| uxMode            | 'popup'| 'popup', 'redirect'| Determines if the user will be redirected away from the site or if a prompt will be displayed. |

**important:** The only required property is `clientId`.

### Callback Signatures

Below are all of the Typescript callback signature definitions.

#### onLoadFailure

```javscript
  onLoadFailure: (error: any) => void
```

#### onLoginChange

```javscript
(loggedIn: boolean) => void
```

#### onLoginFailure

```javscript
(error: GoogleFailureObject) => void
```

#### onLoginSuccess

```javscript
(response: GoogleSuccessObject) => void
```

#### onLogoutFailure

```javscript
(error: GoogleFailureObject) => void
```

### onLogoutSuccess

```javascript
() => void
```

### Google Object Definitions

#### GoogleSuccessObject

```javascript
GoogleSuccessObject {

}
```

#### GoogleFailureObject

```javascript
GoogleFailureObject {

}
```

### Credit to Original Author

This package is a moderately refactored version of [React Google Login](https://github.com/anthonyjgrove/react-google-login). Below are the changes that have been made to fit my own needs.

- code simplified to a single React Hook
- improved Hook prop names to better describe their use-case
- appens the google api script to the <head> element
- added onLoginChange callback prop to listen to revoked permissions or expired tokens
- added onLogoutSuccess callback prop to execute code when a user successfully logs out
