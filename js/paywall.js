const readDefault = (key) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.onInstalled.addListener(function () {
      const domainsURL = chrome.runtime.getURL('./blocklist.txt')
      fetch(domainsURL)
        .then((res) => res.text())
        .then((data) => {
          const domains = data.split('\n').filter((item) => item.trim() !== '')
          setKey({ [key]: domains })
          resolve()
        })
    })
  })
}

const getHostname = () =>
  new Promise((resolve, reject) => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      ([currentTab]) => {
        if (currentTab.url.match(/(http|https).*/)) {
          chrome.browserAction.setIcon({ path: 'images/icon-default32.png' })
          let url = new URL(currentTab.url)
          resolve(url.hostname)
        } else {
          chrome.browserAction.setIcon({
            path: 'images/icon-default-invalid.png',
          })
        }
        resolve('')
      },
    )
  })

const getKey = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([key], (data) => {
      resolve(data)
    })
  })
}

const setKey = (data) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      resolve()
    })
  })
}

const addDomainToStorage = async (key, domain) => {
  const domainsCache = await getKey(key)
  let newDomains = []
  if (
    domainsCache.paywallRemoverData &&
    domainsCache.paywallRemoverData instanceof Array
  ) {
    newDomains = [...new Set([...domainsCache.paywallRemoverData, domain])]
  } else {
    newDomains = [...domains]
  }
  await setKey({ [key]: newDomains })
}

const removeDomaiFromStorage = async (key, domain) => {
  const domains = await getKey(key)
  let newDomains = []
  if (
    domains.paywallRemoverData &&
    domains.paywallRemoverData instanceof Array
  ) {
    newDomains = domains.paywallRemoverData.filter((d) => d !== domain)
  }
  await setKey({ [key]: newDomains })
}

const saveDomainFromText = async (key, domains) => {
  await setKey({ [key]: domains })
}

const clearBrowserCookies = (hostname) => {
  const regexHostname = hostname.replace('.', '\\.')
  const regex = new RegExp(regexHostname, 'g')
  chrome.cookies.getAll({}, async function (cookies) {
    let count = 0
    for (let cookie of cookies) {
      if (cookie.domain.match(regex)) {
        count++
        if (count > 0) {
          const text = count > 99 ? '99+' : `${count}`
          chrome.browserAction.setBadgeText({ text: text })
        }
        var url =
          'http' +
          (cookie.secure ? 's' : '') +
          '://' +
          cookie.domain +
          cookie.path
        chrome.cookies.remove({ name: cookie.name, url: url }, (obj) => {
          if (obj) {
            console.log(`${obj.url} has been removed`)
          }
        })
      }
    }
  })
}

export const paywall = {
  key: 'paywallRemoverData',
  hostname: '',
  statusButton: null,
  backgoundInit: async function () {
    await readDefault(this.key)
    chrome.webNavigation.onCompleted.addListener(async (detail) => {
      let url = new URL(detail.url)
      this.clearCookies(url.hostname)
    })
    chrome.tabs.onActivated.addListener(async (detail) => {
      const hostname = await getHostname()
      this.clearCookies(hostname)
    })
  },
  initialize: async function () {
    this.hostname = await getHostname()
    this.statusButton = document.querySelector('#status')
    this.statusButton.addEventListener('click', (e) => {
      if (e.target.checked) {
        this.addDomain()
      } else {
        this.removeDomain()
      }
    })
    this.statusButton.checked = await this.checkDomainExists()
  },
  checkDomainExists: async function () {
    const data = await getKey(this.key)
    return (
      data.paywallRemoverData &&
      data.paywallRemoverData instanceof Array &&
      data.paywallRemoverData.includes(this.hostname)
    )
  },
  addDomain: async function () {
    addDomainToStorage(this.key, this.hostname)
  },
  addDomains: async function (domains) {
    saveDomainFromText(this.key, domains)
  },
  removeDomain: async function () {
    removeDomaiFromStorage(this.key, this.hostname)
  },
  getDomainList: async function () {
    const data = await getKey(this.key)
    return data.paywallRemoverData && data.paywallRemoverData instanceof Array
      ? data.paywallRemoverData
      : []
  },
  clearDomains: async function () {
    setKey({ [this.key]: [] })
  },
  clearCookies: async function (hostname) {
    const domains = await getKey(this.key)
    if (
      domains &&
      domains.paywallRemoverData &&
      domains.paywallRemoverData instanceof Array &&
      domains.paywallRemoverData.includes(hostname)
    ) {
      clearBrowserCookies(hostname)
    } else {
      chrome.browserAction.setBadgeText({ text: '' })
    }
  },
}
