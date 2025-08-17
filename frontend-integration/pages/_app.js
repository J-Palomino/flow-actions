import '../styles/globals.css'
import '../config/flowConfig' // Initialize Flow configuration

function MyApp({ Component, pageProps }) {
  return (
    <Component {...pageProps} />
  )
}

export default MyApp