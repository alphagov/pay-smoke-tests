const puppeteer = require('puppeteer')

exports.getPage = async () => {
  let page
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    defaultViewport: {
      width: 1024,
      height: 768
    }
  })
  const pages = await browser.pages()
  if (pages.length <= 1) {
    page = await browser.newPage()
  }
  return page
}

exports.executeStep = async (step = null, stepFunc) => {
  try {
    await stepFunc()
  } catch (e) {
    console.error(e)
  }
}
