module.exports = {
  crosshero: {
    baseUrl: 'https://crosshero.com',
    email: '', // Required
    password: '' // Required
  },
  telegram: {
    enabled: false,
    token: '',
    chatId: ''
  },
  options: {
    browser: {
      headless: true
    },
    page: {
      timeout: 10000
    },
    log: {
      timestampFormat: 'YYYY-MM-DD HH:mm:ss'
    }
  }
}