/* eslint-disable guard-for-in */
import { Volume } from 'memfs'

const nestedJson = {
  'yarn.lock': '',
  'package.json': '',
  '.gitignore': '',
  etc: {
    lib: {},
    '.apps': {
      timer: {
        'package.json': '',
        src: {
          components: {
            'main.ts': '',
            'header.ts': '',
            'footer.ts': ''
          },
          styles: {
            'main.css': '',
            'index.css': ''
          }
        }
      },
      devtools: {
        www: {
          'index.html': '',
          'index.css': '',
          'main.js': ''
        },
        var: {
          'debug.log': '',
          'yarn.lock': ''
        },
        'package.json': ''
      }
    }
  },
  usr: {
    apps: {
      zip: '',
      md5sum: '',
      sha256sum: '',
      'package.json': '',
      'lodash.js': '',
      'lodash.min.js': ''
    },
    trash: {
      'logo.png': '',
      lodash: {
        'package.json': '',
        'lodash.js': '',
        'lodash.min.js': ''
      }
    }
  },
  '.trash': {
    third_party: {
      mozilla: {
        firebug: {},
        thimble: {}
      }
    },
    zip: '',
    md5sum: '',
    sha256sum: '',
    'package.json': '',
    'lodash.js': '',
    'lodash.min.js': ''
  }
}

const volume = Volume.fromNestedJSON(nestedJson)

export default volume
