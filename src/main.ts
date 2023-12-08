import './app.css'
import App from './App.svelte'

import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/textfield/filled-text-field.js'
import '@material/web/textfield/outlined-text-field'

import '@material/web/dialog/dialog.js'

const app = new App({
  // @ts-ignore
  target: document.getElementById('app'),
})

export default app
