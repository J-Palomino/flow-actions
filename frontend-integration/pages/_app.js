import '../styles/globals.css'
import '../config/flowConfig' // Initialize Flow configuration
import DynamicProvider from '../components/DynamicProvider'

function MyApp({ Component, pageProps }) {
  return (
    <DynamicProvider>
      <Component {...pageProps} />
    </DynamicProvider>
  )
}

export default MyApp