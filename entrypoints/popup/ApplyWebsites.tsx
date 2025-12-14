import { Component, createSignal, onMount } from 'solid-js'

const ApplyWebsites: Component = () => {
  const [currentUrl, setCurrentUrl] = createSignal('加载中...')

  onMount(() => {
    browser.runtime.sendMessage({ action: 'getDomain' }, (response: { domain?: string }) => {
      setCurrentUrl(response.domain || '无法获取域名')
    })
  })

  return (
    <div class="current-domain">
      {currentUrl()}
    </div>
  )
}

export default ApplyWebsites