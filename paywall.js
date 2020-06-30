const getHostname = () =>
  new Promise((resolve, reject) => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      ([currentTab]) => {
        let url = new URL(currentTab.url)
        resolve(url.hostname)
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
  console.log(data)
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

const clearBrowserCookies = async (hostname) => {
  return new Promise((resolve, reject) => {
    const regexHostname = hostname.replace('.', '\\.')
    const regex = new RegExp(regexHostname, 'g')
    chrome.cookies.getAll({}, function (cookies) {
      for (let cookie of cookies) {
        if (cookie.domain.match(regex)) {
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
      resolve()
    })
  })
}

export const paywall = {
  key: 'paywallRemoverData',
  hostname: '',
  statusButton: null,
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
    await addDomainToStorage(this.key, this.hostname)
  },
  addDomains: async function (domains) {
    await saveDomainFromText(this.key, domains)
  },
  removeDomain: async function () {
    await removeDomaiFromStorage(this.key, this.hostname)
  },
  getDomainList: async function () {
    const data = await getKey(this.key)
    return data.paywallRemoverData && data.paywallRemoverData instanceof Array
      ? data.paywallRemoverData
      : []
  },
  clearDomains: async function () {
    await setKey({ [this.key]: [] })
  },
  clearCookies: async function (hostname) {
    const domains = await getKey(this.key)
    if (
      domains &&
      domains.paywallRemoverData &&
      domains.paywallRemoverData instanceof Array &&
      domains.paywallRemoverData.includes(hostname)
    ) {
      console.log('clear cookies')
      clearBrowserCookies(hostname)
    }
  },
}
