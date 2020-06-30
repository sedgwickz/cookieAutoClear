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
    console.log(domains)
    await paywall.addDomains(domains)
    alert('saved successfully')
  })

  //   const clearButton = document.querySelector('input[name="clear"]')
  //   clearButton.addEventListener('click', async () => {
  //     await paywall.clearDomains()
  //     listPanel.innerHTML = ''
  //     alert('clear successfully')
  //   })
})()
