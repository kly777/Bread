import { Component } from 'solid-js'
import ApplyWebsites from './ApplyWebsites'
import FeatureSwitch from './FeatureSwitch'
import HighlightKeywords from './HighlightKeywords'
import './style.css'

const App: Component = () => {
  return (
    <div class="popup">
      <ApplyWebsites />
      <HighlightKeywords />
      <FeatureSwitch
        featureName="highlight"
        settings={{ color: 'string', size: 'number' }}
      />
      <FeatureSwitch featureName="stripe" />
      <FeatureSwitch featureName="bionic" />
      <FeatureSwitch featureName="translate" />
    </div>
  )
}

export default App