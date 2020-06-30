import { paywall } from './paywall.js'
chrome.webNavigation.onCompleted.addListener(async function (detail) {
  let url = new URL(detail.url)
  await paywall.clearCookies(url.hostname)
})

// ;(async () => {
//   await paywall.clearCookies()
// })()
