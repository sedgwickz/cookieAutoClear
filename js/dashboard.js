import { paywall } from './paywall.js'
;(async () => {
  const domains = await paywall.getDomainList()
  const domainsText = document.querySelector('#domains')

  for (let domain of domains) {
    domainsText.textContent += domain + '\n'
  }

  const saveButton = document.querySelector('input[name="save"]')
  saveButton.addEventListener('click', async () => {
    const domains = domainsText.value
      .split('\n')
      .filter((item) => item.trim() != '')
    await paywall.addDomains(domains)
    alert('saved successfully')
  })
})()
