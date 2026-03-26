import { loadSettings } from './storage.js'
import { applyThemeToDocument } from './applyTheme.js'

applyThemeToDocument(loadSettings())
