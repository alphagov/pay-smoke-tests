const puppeteer = require('puppeteer')

module.exports = function init (headless = false) {
  return {
    getPage: async () => {
      let page
      const browser = await puppeteer.launch({
        headless,
        args: [
          '--disable-features=IsolateOrigins,site-per-process'
        ],
        defaultViewport: {
          width: 1024,
          height: 768
        },
        executablePath: '/opt/homebrew/bin/chromium' // needed for M1, install Chromium manually with brew over npm
      })
      const pages = await browser.pages()
      if (pages.length <= 1) {
        page = await browser.newPage()
      }
      return page
    },
    executeStep: async (step = null, stepFunc) => {
      try {
        await stepFunc()
      } catch (e) {
        console.error(e)
      }
    }
  }
}
