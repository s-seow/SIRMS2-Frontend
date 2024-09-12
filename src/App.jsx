import './App.css'
import FooterComponent from './components/FooterComponent'
import HeaderComponent from './components/HeaderComponent'
import ListFlightComponent from './components/ListFlightComponent'
import {BrowserRouter, Routes, Route} from 'react-router-dom'

function App() {

  return (
    <>
    <BrowserRouter>
      <HeaderComponent />
        <Routes>
          {/* // http://localhost:3000 */}
          <Route path='/' element = {<ListFlightComponent/>}></Route>
          {/* // http://localhost:3000/flights */}
          <Route path='/flights' element = {<ListFlightComponent/>}></Route>
        </Routes>
      <FooterComponent/>
    </BrowserRouter>
    </>
  )
}

export default App
