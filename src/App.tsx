import { NotesProvider } from './app/NotesProvider'
import { Board } from './components/Board'

function App() {
  return (
    <NotesProvider>
      <Board />
    </NotesProvider>
  )
}

export default App
